import type { Fabric, Supplier, YarnIssue, YarnItem, YarnPurchase } from '@/types'
import { costPerMeter } from './costing'
import { createRng, daysAgo, isoDate, roundTo } from './seed'

const rng = createRng(4021)

// ---------------------------------------------------------------- Suppliers
export const SUPPLIERS: Supplier[] = [
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
].map(([name, city, contact, category], i) => ({
  id: `SUP-${String(i + 1).padStart(3, '0')}`,
  name,
  city,
  contact,
  phone: `03${rng.int(0, 4)}${rng.int(0, 9)} ${rng.int(1000, 9999)} ${rng.int(100, 999)}`,
  category,
  payable: category === 'Yarn' ? roundTo(rng.int(400, 4200) * 1000, 5000) : roundTo(rng.int(20, 380) * 1000, 500),
  rating: Math.round(rng.float(3.4, 4.9) * 10) / 10,
  status: i === 9 ? 'Inactive' : 'Active',
}))

// ---------------------------------------------------------------- Yarn
type YarnSeed = [name: string, count: string, type: string, material: string, supplierIdx: number, cost: number, kg: number, min: number]

const YARN_SEEDS: YarnSeed[] = [
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

// Calibrate stock value to the dashboard figure (≈ PKR 25.4M); YRN-001 and YRN-004 are story items and stay fixed.
const FIXED_YARN = [0, 3]
const fixedYarnValue = FIXED_YARN.reduce((s, i) => s + YARN_SEEDS[i][5] * YARN_SEEDS[i][6], 0)
const otherYarnValue = YARN_SEEDS.reduce((s, y, i) => (FIXED_YARN.includes(i) ? s : s + y[5] * y[6]), 0)
const yarnScale = (25_400_000 - fixedYarnValue) / otherYarnValue

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
    warehouse: i % 3 === 0 ? 'Yarn Store 2' : 'Yarn Store 1',
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

const FABRIC_SEEDS: FabricSeed[] = [
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

/** Blended yarn rate per fabric (PKR/kg) — used by costing. */
export const FABRIC_YARN_RATE: Record<string, number> = Object.fromEntries(FABRIC_SEEDS.map((f, i) => [`FAB-${101 + i}`, f[6]]))

const fabricBase: Fabric[] = FABRIC_SEEDS.map(([name, construction, density, width, gsm, weave, yarnRate], i) => {
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

// Calibrate stock value to the dashboard figure (≈ PKR 31.2M).
const rawFabricValue = fabricBase.reduce((s, f) => s + f.meters * f.ratePerMeter, 0)
const fabricScale = 31_200_000 / rawFabricValue
export const FABRICS: Fabric[] = fabricBase.map((f) => {
  const meters = roundTo(f.meters * fabricScale, 5)
  const rolls = Math.max(1, Math.round(meters / 122))
  return { ...f, meters, rolls, weightKg: Math.round(meters * f.widthInches * 0.0254 * (f.gsm / 1000)) }
})

export const fabricByCode = (code: string) => FABRICS.find((f) => f.code === code)
export const yarnByCode = (code: string) => YARNS.find((y) => y.code === code)
export const supplierById = (id: string) => SUPPLIERS.find((s) => s.id === id)
