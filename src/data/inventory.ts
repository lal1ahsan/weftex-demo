import type { Fabric, Supplier, YarnIssue, YarnItem, YarnPurchase } from '@/types'
import { costPerMeter } from './costing'
import { IS_POLY } from './dataset'
import { createRng, daysAgo, isoDate, roundTo } from './seed'

const rng = createRng(4021)

// ---------------------------------------------------------------- Suppliers
/** The supplier category that holds raw material: yarn mills, or granule importers. */
export const RAW_CATEGORY = IS_POLY ? 'Granules' : 'Yarn'

const WEAVING_SUPPLIERS: [string, string, string, string][] = [
  ['ABC Textiles', 'Faisalabad', 'Rana Shahid', 'Yarn'],
  ['Chenab Spinning Mills', 'Faisalabad', 'Malik Ashraf', 'Yarn'],
  ['Ravi Yarn Traders', 'Lahore', 'Sheikh Naveed', 'Yarn'],
  ['Indus Fibre Mills', 'Multan', 'Chaudhry Aslam', 'Yarn'],
  ['Lyallpur Yarn House', 'Faisalabad', 'Haji Bashir', 'Yarn'],
  ['Punjab Cotton Spinners', 'Okara', 'Mian Javed', 'Yarn'],
  ['Mehran Synthetic Fibres', 'Karachi', 'Asad Siddiqui', 'Yarn'],
  ['Al-Noor Yarns', 'Faisalabad', 'Hafiz Imran', 'Yarn'],
  ['Sargodha Spinning Co.', 'Sargodha', 'Rao Khalid', 'Yarn'],
  ['Jhang Spinning Mills', 'Jhang', 'Syed Murtaza', 'Yarn'],
  ['Pak Sizing Works', 'Faisalabad', 'Abdul Ghafoor', 'Sizing'],
  ['Hamza Loom Spares', 'Faisalabad', 'Hamza Rafiq', 'Spare Parts'],
  ['Star Packaging Industries', 'Lahore', 'Imran Butt', 'Packaging'],
  ['Madina Lubricants', 'Faisalabad', 'Qari Saleem', 'Consumables'],
  ['Crescent Electric Services', 'Faisalabad', 'Engr. Waseem', 'Electrical'],
]

const POLY_SUPPLIERS: [string, string, string, string][] = [
  ['Lotte Chemical Pakistan', 'Karachi', 'Faisal Siddiqui', 'Granules'],
  ['Sabic Polymers (Distributor)', 'Lahore', 'Kashif Rana', 'Granules'],
  ['Engro Polymer Traders', 'Karachi', 'Asif Memon', 'Granules'],
  ['Shah Polymers', 'Lahore', 'Shah Nawaz', 'Granules'],
  ['Pak Petrochem Traders', 'Karachi', 'Zubair Patel', 'Granules'],
  ['Punjab Filler Industries', 'Faisalabad', 'Ch. Mukhtar', 'Masterbatch'],
  ['Colour Tech Masterbatch', 'Lahore', 'Hassan Javed', 'Masterbatch'],
  ['Green Recycled Plastics', 'Lahore', 'Rafiq Butt', 'Granules'],
  ['Packages Film Division', 'Lahore', 'Omer Saeed', 'Film'],
  ['Siegwerk Inks Pakistan', 'Lahore', 'Adeel Mirza', 'Ink'],
  ['Al-Fatah Threads', 'Faisalabad', 'Haji Fateh', 'Thread'],
  ['Lohia Spares Pakistan', 'Lahore', 'Rahul Kumar', 'Spare Parts'],
  ['Star Packaging Industries', 'Lahore', 'Imran Butt', 'Packaging'],
  ['Madina Lubricants', 'Lahore', 'Qari Saleem', 'Consumables'],
  ['Crescent Electric Services', 'Lahore', 'Engr. Waseem', 'Electrical'],
]

export const SUPPLIERS: Supplier[] = (IS_POLY ? POLY_SUPPLIERS : WEAVING_SUPPLIERS).map(([name, city, contact, category], i) => ({
  id: `SUP-${String(i + 1).padStart(3, '0')}`,
  name,
  city,
  contact,
  phone: `03${rng.int(0, 4)}${rng.int(0, 9)} ${rng.int(1000, 9999)} ${rng.int(100, 999)}`,
  category,
  payable: category === RAW_CATEGORY ? roundTo(rng.int(400, 4200) * 1000, 5000) : roundTo(rng.int(20, 380) * 1000, 500),
  rating: Math.round(rng.float(3.4, 4.9) * 10) / 10,
  status: i === 9 ? 'Inactive' : 'Active',
}))

// ---------------------------------------------------------------- Yarn
type YarnSeed = [name: string, count: string, type: string, material: string, supplierIdx: number, cost: number, kg: number, min: number]

const WEAVING_YARN_SEEDS: YarnSeed[] = [
  ['Cotton Yarn', '40s', 'Combed', 'Cotton', 0, 620, 12500, 4000],
  ['Cotton Yarn', '52s', 'Combed', 'Cotton', 1, 690, 6400, 2500],
  ['Cotton Yarn', '80s', 'Compact Combed', 'Cotton', 1, 980, 2900, 1200],
  ['Cotton Yarn', '40s', 'Carded', 'Cotton', 4, 565, 1650, 3000],
  ['Cotton Yarn', '30s', 'Carded', 'Cotton', 2, 520, 8800, 3000],
  ['Cotton Yarn', '20s', 'Carded', 'Cotton', 5, 470, 9600, 3500],
  ['Cotton Yarn', '16s', 'Open End', 'Cotton', 5, 395, 7400, 3000],
  ['Cotton Yarn', '10s', 'Open End', 'Cotton', 8, 350, 5200, 2000],
  ['Cotton Yarn', '60s', 'Combed', 'Cotton', 3, 790, 3600, 1500],
  ['Cotton Yarn', '100s', 'Compact Combed', 'Cotton', 1, 1240, 900, 600],
  ['PC Yarn 65/35', '45s', 'Ring Spun', 'Poly/Cotton', 6, 540, 5100, 2000],
  ['PC Yarn 52/48', '30s', 'Ring Spun', 'Poly/Cotton', 6, 505, 4300, 2000],
  ['PV Yarn 80/20', '45s', 'Ring Spun', 'Poly/Viscose', 6, 575, 2200, 1500],
  ['Polyester Filament', '75D', 'Textured', 'Polyester', 6, 455, 3800, 1500],
  ['Polyester Filament', '150D', 'Textured', 'Polyester', 6, 430, 0, 1200],
  ['Viscose Yarn', '30s', 'Vortex', 'Viscose', 3, 610, 2600, 1000],
  ['Cotton Slub Yarn', '20s', 'Slub', 'Cotton', 7, 530, 1900, 800],
  ['Cotton Yarn', '7s', 'Open End', 'Cotton', 8, 330, 6100, 2500],
  ['Linen Blend Yarn', '40s', 'Ring Spun', 'Linen/Cotton', 2, 1120, 650, 800],
  ['Cotton Yarn', '24s', 'Carded', 'Cotton', 9, 495, 4700, 2000],
  ['Cotton Yarn', '50s', 'Combed', 'Cotton', 0, 665, 5300, 2000],
  ['Cotton Yarn', '40/2', 'Doubled Combed', 'Cotton', 0, 735, 2400, 1000],
  ['Cotton Yarn', '32s', 'Combed', 'Cotton', 7, 590, 3900, 1500],
  ['Spandex Covered Yarn', '40D', 'Core Spun', 'Cotton/Lycra', 3, 1380, 420, 300],
  ['Cotton Yarn', '12s', 'Open End', 'Cotton', 5, 375, 3300, 1500],
  ['Cotton Yarn', '60/2', 'Doubled Combed', 'Cotton', 1, 880, 1100, 500],
  ['Bamboo Blend Yarn', '30s', 'Ring Spun', 'Bamboo/Cotton', 4, 720, 1300, 500],
  ['Recycled Cotton Yarn', '10s', 'Open End', 'Recycled', 8, 285, 2800, 1000],
  ['Melange Yarn', '30s', 'Ring Spun', 'Cotton/Poly', 9, 640, 980, 600],
  ['Cotton Yarn', '45s', 'Combed', 'Cotton', 7, 645, 3500, 1500],
]

/** Poly bag raw materials: name, grade, form, material, supplier, PKR/kg, kg in stock, minimum kg. */
const POLY_YARN_SEEDS: YarnSeed[] = [
  ['PP Homopolymer', 'H030SG', 'Virgin', 'PP', 0, 395, 18500, 6000],
  ['PP Homopolymer', 'HP522H', 'Virgin', 'PP', 1, 410, 9200, 4000],
  ['PP Raffia', 'Y130', 'Virgin', 'PP', 2, 388, 7400, 3000],
  ['PP Recycled', 'Grade A', 'Recycled', 'PP', 7, 245, 2100, 3000],
  ['LDPE', 'LD 2420H', 'Virgin', 'LDPE', 3, 455, 3600, 1500],
  ['LLDPE', '218W', 'Virgin', 'LLDPE', 3, 440, 2400, 1000],
  ['HDPE', 'F00952', 'Virgin', 'HDPE', 4, 430, 1800, 800],
  ['Calcium Filler Masterbatch', 'CaCO3 75%', 'Masterbatch', 'Filler', 5, 120, 6500, 2500],
  ['White Masterbatch', 'TiO2 60%', 'Masterbatch', 'Colour', 6, 620, 950, 400],
  ['Green Masterbatch', 'G-204', 'Masterbatch', 'Colour', 6, 580, 380, 200],
  ['Blue Masterbatch', 'B-118', 'Masterbatch', 'Colour', 6, 590, 0, 150],
  ['UV Stabiliser Masterbatch', 'UV-8', 'Masterbatch', 'Additive', 6, 980, 260, 120],
  ['Anti-slip Masterbatch', 'AS-2', 'Masterbatch', 'Additive', 6, 760, 140, 100],
  ['Lamination LDPE', 'LD 7011', 'Virgin', 'LDPE', 3, 470, 2200, 900],
  ['BOPP Film', '20 micron', 'Film', 'BOPP', 8, 520, 1600, 700],
  ['Printing Ink — Blue', 'Flexo', 'Ink', 'Ink', 9, 1150, 180, 80],
  ['Printing Ink — Red', 'Flexo', 'Ink', 'Ink', 9, 1150, 120, 80],
  ['Printing Ink — Green', 'Flexo', 'Ink', 'Ink', 9, 1180, 95, 60],
  ['Printing Ink — Black', 'Flexo', 'Ink', 'Ink', 9, 1090, 210, 80],
  ['Solvent (Toluene)', 'Industrial', 'Liquid', 'Solvent', 9, 340, 450, 200],
  ['Sewing Thread', 'Polyester 20/6', 'Cone', 'Thread', 10, 900, 320, 150],
  ['LDPE Liner Film', '40 micron', 'Film', 'LDPE', 3, 480, 1300, 600],
]

const YARN_SEEDS = IS_POLY ? POLY_YARN_SEEDS : WEAVING_YARN_SEEDS

// Calibrate stock value to the dashboard figure (≈ PKR 25.4M weaving, 14.8M poly bags); items 001 and 004 are story items and stay fixed.
const FIXED_YARN = [0, 3]
const fixedYarnValue = FIXED_YARN.reduce((s, i) => s + YARN_SEEDS[i][5] * YARN_SEEDS[i][6], 0)
const otherYarnValue = YARN_SEEDS.reduce((s, y, i) => (FIXED_YARN.includes(i) ? s : s + y[5] * y[6]), 0)
export const RAW_STOCK_VALUE = IS_POLY ? 14_800_000 : 25_400_000
const yarnScale = (RAW_STOCK_VALUE - fixedYarnValue) / otherYarnValue

export const YARNS: YarnItem[] = YARN_SEEDS.map(([name, count, type, material, s, cost, rawKg, rawMin], i) => {
  const fixed = FIXED_YARN.includes(i)
  const kg = fixed ? rawKg : roundTo(rawKg * yarnScale, 50)
  const min = fixed ? rawMin : roundTo(rawMin * yarnScale, 50)
  return {
    code: `YRN-${String(i + 1).padStart(3, '0')}`,
    name,
    count,
    type,
    material,
    supplier: SUPPLIERS[s].name,
    lot: `LT-${26}${String(rng.int(100, 999))}`,
    stockKg: kg,
    minStockKg: min,
    costPerKg: cost,
    warehouse: IS_POLY ? (i % 3 === 0 ? 'Granules Store 2' : 'Granules Store 1') : i % 3 === 0 ? 'Yarn Store 2' : 'Yarn Store 1',
    incomingKg: rng.next() > 0.6 ? roundTo(rng.int(800, 6000), 100) : 0,
    issuedKgMonth: roundTo(rng.int(600, 9000), 50),
  }
})

export function yarnStatus(y: YarnItem) {
  if (y.stockKg <= 0) return 'Out of Stock' as const
  if (y.stockKg < y.minStockKg) return 'Low Stock' as const
  return 'In Stock' as const
}

export const YARN_PURCHASES: YarnPurchase[] = Array.from({ length: 28 }, (_, i) => {
  const y = rng.pick(YARNS.slice(0, 24))
  const status = i < 3 ? 'Pending' : i < 6 ? 'In Transit' : i === 7 ? 'Partially Received' : 'Received'
  return {
    id: `YP-${2410 - i}`,
    date: isoDate(daysAgo(Math.floor(i * 1.6))),
    supplier: y.supplier,
    yarnCode: y.code,
    yarnName: `${y.name} ${y.count} ${y.type}`,
    quantityKg: roundTo(rng.int(1000, 8000), 100),
    rate: y.costPerKg + rng.int(-15, 15),
    status,
  }
})

const ISSUERS = ['Naeem Akhtar', 'Shabbir Hussain']
export const YARN_ISSUES: YarnIssue[] = Array.from({ length: 36 }, (_, i) => {
  const y = rng.pick(YARNS.slice(0, 22))
  if (IS_POLY) {
    const stage = y.material === 'Ink' || y.material === 'Solvent' ? 'Printing' : y.material === 'Thread' ? 'Stitching' : y.name.startsWith('Lamination') || y.material === 'BOPP' ? 'Lamination' : 'Extrusion'
    const machine = stage === 'Extrusion' ? rng.int(1, 6) : stage === 'Printing' ? rng.int(43, 46) : rng.int(47, 52)
    return {
      id: `YI-${5880 - i}`,
      date: isoDate(daysAgo(Math.floor(i / 3))),
      yarnCode: y.code,
      yarnName: `${y.name} ${y.count}`,
      quantityKg: roundTo(stage === 'Extrusion' ? rng.int(400, 2400) : rng.int(20, 180), 10),
      issuedTo: `${stage} — M-${String(machine).padStart(2, '0')}`,
      purpose: stage,
      issuedBy: rng.pick(['Arif Hussain', 'Zafar Iqbal']),
    }
  }
  return {
    id: `YI-${5880 - i}`,
    date: isoDate(daysAgo(Math.floor(i / 3))),
    yarnCode: y.code,
    yarnName: `${y.name} ${y.count} ${y.type}`,
    quantityKg: roundTo(rng.int(150, 1400), 10),
    issuedTo: rng.next() > 0.5 ? `Sizing — Beam B-${rng.int(210, 290)}` : `Hall ${rng.pick(['A', 'B', 'C'])} — L-${String(rng.int(1, 80)).padStart(2, '0')}`,
    purpose: rng.next() > 0.45 ? 'Warp' : 'Weft',
    issuedBy: rng.pick(ISSUERS),
  }
})

// ---------------------------------------------------------------- Fabric
type FabricSeed = [name: string, construction: string, density: string, width: number, gsm: number, weave: string, yarnRate: number]

const WEAVING_FABRIC_SEEDS: FabricSeed[] = [
  ['Cotton Sheeting', '40×40', '133×72', 63, 118, 'Plain', 600],
  ['Fine Poplin', '52×52', '144×88', 58, 98, 'Plain', 690],
  ['Premium Lawn', '80×80', '92×88', 52, 72, 'Plain', 980],
  ['Cambric', '60×60', '92×88', 58, 86, 'Plain', 790],
  ['Cotton Twill', '20×16', '108×56', 63, 230, '2/1 Twill', 440],
  ['Cotton Drill', '16×12', '108×56', 63, 280, '3/1 Twill', 400],
  ['Canvas', '10×10', '72×46', 72, 340, 'Plain', 350],
  ['Cotton Voile', '100×100', '88×80', 58, 60, 'Plain', 1240],
  ['Sateen', '60×60', '173×124', 98, 120, '5-End Satin', 800],
  ['Percale', '40×40', '124×100', 98, 128, 'Plain', 630],
  ['Wide Grey Sheeting', '30×30', '76×68', 98, 140, 'Plain', 520],
  ['PC Sheeting 65/35', '45×45', '110×76', 63, 105, 'Plain', 540],
  ['Dobby Stripe', '40×40', '124×64', 58, 115, 'Dobby', 620],
  ['Oxford', '40/2×24', '110×50', 58, 145, 'Oxford', 600],
  ['Denim Grey', '7×7', '68×40', 63, 400, '3/1 Twill', 330],
  ['Cotton Muslin', '30×30', '60×60', 63, 92, 'Plain', 510],
  ['Khaddar', '20×20', '60×56', 58, 165, 'Plain', 470],
  ['Wash & Wear PV', '45×45', '110×80', 58, 120, 'Plain', 575],
  ['Jacquard Damask', '60×60', '160×100', 98, 180, 'Jacquard', 800],
  ['Linen Blend', '40×40', '76×68', 58, 150, 'Plain', 1000],
]

/** Poly bag products: name, size (width × length), mesh, width, GSM, finish, PKR/kg of granules. */
const POLY_FABRIC_SEEDS: FabricSeed[] = [
  ['PP Woven Sack 50 kg — Flour', '22×36"', '10×10', 22, 72, 'Plain · 2-colour print', 400],
  ['PP Woven Sack 25 kg — Rice', '18×28"', '10×10', 18, 65, 'Plain · 3-colour print', 400],
  ['PP Woven Sack 50 kg — Sugar', '22×38"', '10×10', 22, 78, 'Liner · 1-colour print', 405],
  ['Cement Bag 50 kg', '20×30"', '12×12', 20, 80, 'Laminated · 2-colour print', 420],
  ['Fertiliser Bag 50 kg', '23×40"', '10×10', 23, 90, 'Liner · UV · 2-colour print', 415],
  ['BOPP Bag 10 kg — Rice', '14×22"', '12×12', 14, 70, 'BOPP · 8-colour print', 520],
  ['BOPP Bag 25 kg — Atta', '18×30"', '12×12', 18, 75, 'BOPP · 8-colour print', 520],
  ['PP Woven Sack 40 kg — Feed', '21×35"', '10×10', 21, 70, 'Plain · 1-colour print', 395],
  ['Leno Mesh Bag — Onion', '20×32"', 'Leno', 20, 40, 'Leno · drawstring', 410],
  ['Leno Mesh Bag — Potato', '22×36"', 'Leno', 22, 45, 'Leno · drawstring', 410],
  ['Jumbo Bag 1 ton (FIBC)', '36×42"', '14×14', 36, 180, 'Coated · 4 loops', 430],
  ['Grain Storage Sack 100 kg', '28×44"', '10×10', 28, 95, 'Plain · UV', 400],
  ['Seed Bag 20 kg', '16×26"', '12×12', 16, 68, 'Laminated · 4-colour print', 425],
  ['Chemical Bag 25 kg', '18×30"', '12×12', 18, 85, 'Liner · laminated', 430],
  ['Sand & Gravel Sack', '18×30"', '8×8', 18, 60, 'Plain · unprinted', 330],
  ['Wool Pack Bag', '40×60"', '10×10', 40, 110, 'Plain · UV', 400],
]

const FABRIC_SEEDS = IS_POLY ? POLY_FABRIC_SEEDS : WEAVING_FABRIC_SEEDS

/** One bag's weight in kg: both faces of a width × length tube at the fabric's GSM. */
export function bagKg(f: Pick<Fabric, 'construction' | 'widthInches' | 'gsm'>) {
  const length = Number(f.construction.replace('"', '').split('×')[1]) || f.widthInches * 1.6
  return (f.widthInches * 0.0254) * (length * 0.0254) * 2 * (f.gsm / 1000)
}

/** Weight of one unit of finished stock: a meter of fabric, or one bag. */
export function unitKg(f: Pick<Fabric, 'construction' | 'widthInches' | 'gsm'>) {
  return IS_POLY ? bagKg(f) : f.widthInches * 0.0254 * (f.gsm / 1000)
}

/** Bags per bundle; jumbo bags are packed 20 to a bundle. */
const bundleSize = (f: Pick<Fabric, 'widthInches'>) => (f.widthInches >= 36 ? 20 : 500)
/** Units in one pack: ~122 m in a roll of fabric, or the bags in one bundle. */
export const packSize = (f: Pick<Fabric, 'widthInches'>) => (IS_POLY ? bundleSize(f) : 122)

/** Blended yarn rate per fabric (PKR/kg) — used by costing. */
export const FABRIC_YARN_RATE: Record<string, number> = Object.fromEntries(FABRIC_SEEDS.map((f, i) => [`${IS_POLY ? 'BAG' : 'FAB'}-${101 + i}`, f[6]]))

const fabricBase: Fabric[] = FABRIC_SEEDS.map(([name, construction, density, width, gsm, weave, yarnRate], i) => {
  if (IS_POLY) {
    // Selling rate per bag = granules in the bag plus extrusion, weaving, printing and conversion, plus margin
    const kg = bagKg({ construction, widthInches: width, gsm })
    const rate = Math.round(kg * yarnRate * rng.float(1.42, 1.62) + (weave.includes('BOPP') ? 9 : weave.includes('print') ? 4 : 2))
    const bundles = rng.int(8, 60)
    const bags = bundles * bundleSize({ widthInches: width })
    return {
      code: `BAG-${101 + i}`,
      name,
      construction,
      density,
      widthInches: width,
      gsm,
      weave,
      rolls: bundles,
      meters: bags,
      weightKg: Math.round(bags * kg),
      location: i % 3 === 2 ? 'Bundle Store' : 'Finished Goods Store',
      status: i === 8 || i === 14 ? 'On Hold' : i % 4 === 1 ? 'Reserved' : 'Available',
      ratePerMeter: rate,
    }
  }
  // Selling rate = cost per meter plus a 9–17% margin
  const rate = Math.round(costPerMeter({ widthInches: width, gsm, density, yarnRate }).total * rng.float(1.09, 1.17))
  const rolls = rng.int(6, 70)
  const meters = rolls * rng.int(112, 130)
  return {
    code: `FAB-${101 + i}`,
    name,
    construction,
    density,
    widthInches: width,
    gsm,
    weave,
    rolls,
    meters,
    weightKg: Math.round(meters * width * 0.0254 * (gsm / 1000)),
    location: i % 3 === 2 ? 'Warehouse B' : 'Warehouse A',
    status: i === 6 || i === 14 ? 'On Hold' : i % 4 === 1 ? 'Reserved' : 'Available',
    ratePerMeter: rate,
  }
})

// Calibrate stock value to the dashboard figure (≈ PKR 31.2M weaving, 12.6M poly bags).
export const FINISHED_STOCK_VALUE = IS_POLY ? 12_600_000 : 31_200_000
const rawFabricValue = fabricBase.reduce((s, f) => s + f.meters * f.ratePerMeter, 0)
const fabricScale = FINISHED_STOCK_VALUE / rawFabricValue
export const FABRICS: Fabric[] = fabricBase.map((f) => {
  const size = packSize(f)
  const meters = IS_POLY ? Math.max(1, Math.round((f.meters * fabricScale) / size)) * size : roundTo(f.meters * fabricScale, 5)
  const rolls = Math.max(1, Math.round(meters / size))
  return { ...f, meters, rolls, weightKg: Math.round(meters * unitKg(f)) }
})

export const fabricByCode = (code: string) => FABRICS.find((f) => f.code === code)
export const yarnByCode = (code: string) => YARNS.find((y) => y.code === code)
export const supplierById = (id: string) => SUPPLIERS.find((s) => s.id === id)
