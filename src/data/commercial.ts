import type { AppNotification, Customer, Dispatch, EnergyDay, Expense, ExpenseCategory, OrderStatus, PurchaseOrder, Roll, SalesOrder } from '@/types'
import { IS_POLY, TERMS } from './dataset'
import { INSPECTORS } from './factory'
import { FABRICS, SUPPLIERS, packSize, unitKg } from './inventory'
import { LOOMS } from './production'
import { createRng, daysAgo, isoDate, roundTo } from './seed'

const rng = createRng(7731)

// ---------------------------------------------------------------- Customers
const WEAVING_CUSTOMERS: [string, string, string][] = [
  ['Ahmed Textile', 'Faisalabad', 'Muhammad Ali'],
  ['Rehman Fabrics', 'Lahore', 'Abdul Rehman Butt'],
  ['Al-Hamd Processing Mills', 'Faisalabad', 'Haji Mukhtar'],
  ['Indus Home Textiles', 'Karachi', 'Faraz Qureshi'],
  ['Multan Dyeing House', 'Multan', 'Ghulam Farid'],
  ['Zeenat Lawn Collection', 'Lahore', 'Sadia Zeenat'],
  ['Shahbaz Garments', 'Sialkot', 'Shahbaz Cheema'],
  ['Noor Bedding Exports', 'Karachi', 'Kamran Noor'],
  ['Chiniot Weavers & Traders', 'Chiniot', 'Iqbal Sheikh'],
  ['Bismillah Cloth House', 'Faisalabad', 'Haji Rasheed'],
  ['Lahore Uniform Company', 'Lahore', 'Col. (R) Javed'],
  ['Prime Denim Works', 'Karachi', 'Owais Memon'],
  ['Hafeez Printing Mills', 'Faisalabad', 'Hafeez Ahmad'],
  ['Kohinoor Linen House', 'Gujranwala', 'Aslam Kohinoor'],
  ['Saeed Brothers Textile', 'Faisalabad', 'Saeed Anwar'],
  ['Al-Madina Fabrics', 'Multan', 'Qari Abdul Majeed'],
  ['Sapna Home Collection', 'Lahore', 'Nadia Khurram'],
  ['Punjab Workwear Ltd.', 'Sheikhupura', 'Tahir Sultan'],
  ['Hyderabad Cloth Market', 'Hyderabad', 'Ramesh Kumar'],
  ['Sarhad Textile Traders', 'Peshawar', 'Gul Khan Afridi'],
]

const POLY_CUSTOMERS: [string, string, string][] = [
  ['Sunrise Flour Mills', 'Lahore', 'Haji Aslam'],
  ['Fauji Fertilizer Dealers', 'Rawalpindi', 'Maj. (R) Tariq'],
  ['Al-Hamd Sugar Mills', 'Faisalabad', 'Ch. Riaz'],
  ['Bestway Cement Depot', 'Lahore', 'Kamran Butt'],
  ['Matco Rice Exporters', 'Karachi', 'Faraz Memon'],
  ['Punjab Seed Corporation', 'Sahiwal', 'Ghulam Rasool'],
  ['Hi-Tech Feeds', 'Okara', 'Naveed Anjum'],
  ['Shan Atta Chakki', 'Gujranwala', 'Shan Mehmood'],
  ['Engro Fertilizer Stockist', 'Multan', 'Rana Imtiaz'],
  ['Sapphire Chemicals', 'Lahore', 'Hassan Raza'],
  ['National Foods Packaging', 'Karachi', 'Sana Kapadia'],
  ['Kissan Onion Traders', 'Sukkur', 'Abdul Sattar'],
  ['Pak Potato Cold Storage', 'Okara', 'Malik Shafi'],
  ['Lucky Cement Distributor', 'Sheikhupura', 'Zahid Iqbal'],
  ['Rehman Rice Mills', 'Gujranwala', 'Abdul Rehman'],
  ['Ittefaq Grain Traders', 'Lahore', 'Mian Shahbaz'],
  ['Quetta Wool House', 'Quetta', 'Sardar Khan'],
  ['Al-Kareem Flour Mills', 'Sargodha', 'Haji Kareem'],
  ['Hyderabad Sugar Agency', 'Hyderabad', 'Ramesh Kumar'],
  ['Sarhad Construction Supplies', 'Peshawar', 'Gul Khan Afridi'],
]

const CUSTOMER_SEEDS = IS_POLY ? POLY_CUSTOMERS : WEAVING_CUSTOMERS

const custBase = CUSTOMER_SEEDS.map(([name, city, contact], i) => ({
  id: `CUS-${String(i + 1).padStart(3, '0')}`,
  name,
  city,
  contact,
  phone: `03${rng.int(0, 4)}${rng.int(0, 9)} ${rng.int(1000, 9999)} ${rng.int(100, 999)}`,
  orders: i === 0 ? 12 : rng.int(2, 18),
  outstanding: i === 0 ? 2_400_000 : i === 18 ? 0 : rng.int(150, 1900) * 1000,
  creditLimit: i === 0 ? 5_000_000 : roundTo(rng.int(15, 80) * 100_000, 500_000),
  status: (i === 11 ? 'On Hold' : i === 19 ? 'Inactive' : 'Active') as Customer['status'],
  ntn: `${rng.int(1000000, 9999999)}-${rng.int(0, 9)}`,
}))
// Calibrate receivables to PKR 18.5M (keeping Ahmed Textile at 2.4M); poly bags PKR 9.6M (Sunrise Flour Mills 2.4M)
export const RECEIVABLES = IS_POLY ? 9_600_000 : 18_500_000
const otherOutstanding = custBase.slice(1).reduce((s, c) => s + c.outstanding, 0)
const recScale = (RECEIVABLES - 2_400_000) / otherOutstanding
export const CUSTOMERS: Customer[] = custBase.map((c, i) => (i === 0 ? c : { ...c, outstanding: roundTo(c.outstanding * recScale, 1000) }))
const recResidual = RECEIVABLES - CUSTOMERS.reduce((s, c) => s + c.outstanding, 0)
CUSTOMERS[1].outstanding += recResidual

export const customerById = (id: string) => CUSTOMERS.find((c) => c.id === id)

// ---------------------------------------------------------------- Sales orders
const ORDER_STATUS: OrderStatus[] = ['Completed', 'Completed', 'Completed', 'Confirmed', 'Partially Fulfilled', 'Confirmed', 'Draft', 'Completed', 'Cancelled', 'Partially Fulfilled']

export const SALES_ORDERS: SalesOrder[] = Array.from({ length: 30 }, (_, i) => {
  const num = 1031 - i
  const id = `SO-${num}`
  const fabric = rng.pick(FABRICS)
  // Bags are ordered in whole bundles
  const lot = IS_POLY ? packSize(fabric) * (fabric.widthInches >= 36 ? 5 : 10) : 500
  const quantity = IS_POLY ? roundTo(rng.int(10, 160) * 1000, lot) || lot : roundTo(rng.int(6, 60) * 1000, 500)
  let status = ORDER_STATUS[i % ORDER_STATUS.length]
  if (num >= 1029) status = num === 1031 ? 'Draft' : 'Confirmed'
  const delivered = status === 'Completed' ? quantity : status === 'Partially Fulfilled' ? roundTo(quantity * rng.float(0.3, 0.8), lot) : 0
  return {
    id,
    date: isoDate(daysAgo(Math.floor(i * 2.3) + 1)),
    customerId: CUSTOMERS[i % 7 === 0 ? 0 : rng.int(0, 19)].id,
    fabricCode: fabric.code,
    quantity,
    delivered,
    rate: IS_POLY ? fabric.ratePerMeter + rng.int(-3, 6) : fabric.ratePerMeter + rng.int(-10, 25),
    deliveryDate: isoDate(daysAgo(Math.floor(i * 2.3) - rng.int(10, 24))),
    status,
    paymentTerms: rng.pick(['30 days credit', '45 days credit', '60 days credit', 'Advance 30%, balance on delivery']),
  }
})
// The story order: SO-1024 for the first customer, due tomorrow
const so1024 = SALES_ORDERS.find((o) => o.id === 'SO-1024')!
Object.assign(so1024, {
  customerId: 'CUS-001',
  fabricCode: FABRICS[0].code,
  quantity: IS_POLY ? 120000 : 48000,
  delivered: IS_POLY ? 75000 : 30000,
  rate: FABRICS[0].ratePerMeter + (IS_POLY ? 1 : 4),
  date: isoDate(daysAgo(12)),
  deliveryDate: isoDate(daysAgo(-1)),
  status: 'Partially Fulfilled',
  paymentTerms: '45 days credit',
})

export const orderById = (id: string) => SALES_ORDERS.find((o) => o.id === id)

// ---------------------------------------------------------------- Rolls
const DEFECTS = TERMS.defects
// Bundles of bags come off the cutting & sealing machines.
const PACKERS = IS_POLY ? LOOMS.filter((l) => l.type === 'Cutting & Sealing') : LOOMS

export const ROLLS: Roll[] = Array.from({ length: 124 }, (_, i) => {
  const id = IS_POLY ? `BN-${10320 - i}` : `R-${10320 - i}`
  const loom = rng.pick(PACKERS)
  const fabric = FABRICS.find((f) => f.code === loom.fabricCode)!
  const meters = IS_POLY ? packSize(fabric) : rng.int(110, 132)
  const q = rng.weighted([['Passed', 84], ['Hold', 9], ['Rejected', 7]] as const)
  const defects = q === 'Passed' ? rng.int(0, 3) : q === 'Hold' ? rng.int(4, 7) : rng.int(8, 14)
  return {
    id,
    fabricCode: fabric.code,
    loomId: loom.id,
    date: isoDate(daysAgo(Math.floor(i / 12))),
    meters,
    weightKg: Math.round(meters * unitKg(fabric)),
    grade: q === 'Passed' ? (defects <= 1 ? 'A' : 'B') : q === 'Hold' ? 'B' : 'C',
    quality: q,
    location: q === 'Rejected' ? 'Rejection Bay' : IS_POLY ? (i % 3 === 0 ? 'Bundle Store' : 'Finished Goods Store') : i % 3 === 0 ? 'Warehouse B' : 'Warehouse A',
    status: i > 90 ? 'Dispatched' : i % 6 === 0 ? 'Reserved' : 'In Stock',
    inspector: rng.pick(INSPECTORS),
    defects,
    defectTypes: Array.from({ length: Math.min(3, Math.ceil(defects / 3)) }, () => rng.pick(DEFECTS)).filter((v, k, a) => a.indexOf(v) === k),
  }
})
// The story roll (poly bags: the story bundle)
if (IS_POLY) {
  Object.assign(ROLLS.find((r) => r.id === 'BN-10251')!, {
    fabricCode: 'BAG-101', loomId: 'M-47', meters: 500, weightKg: Math.round(500 * unitKg(FABRICS[0])), grade: 'A', quality: 'Passed',
    location: 'Finished Goods Store', status: 'Reserved', defects: 1, defectTypes: ['Weak seal'], inspector: 'Nadeem Abbas',
  })
} else {
  Object.assign(ROLLS.find((r) => r.id === 'R-10251')!, {
    fabricCode: 'FAB-101', loomId: 'L-12', meters: 125, weightKg: 42, grade: 'A', quality: 'Passed',
    location: 'Warehouse A', status: 'Reserved', defects: 1, defectTypes: ['Broken pick'], inspector: 'Rabia Anwar',
  })
}

export const rollById = (id: string) => ROLLS.find((r) => r.id === id)

// ---------------------------------------------------------------- Dispatch
export const DISPATCHES: Dispatch[] = SALES_ORDERS.filter((o) => o.delivered > 0)
  .slice(0, 18)
  .map((o, i) => ({
    id: `DN-${7740 - i}`,
    date: isoDate(daysAgo(Math.floor(i * 1.4))),
    orderId: o.id,
    customerId: o.customerId,
    fabricCode: o.fabricCode,
    ...(IS_POLY
      ? (() => {
          const f = FABRICS.find((x) => x.code === o.fabricCode)!
          const bags = Math.min(o.delivered, roundTo(rng.int(10, 40) * 1000, packSize(f)) || packSize(f))
          return { rolls: Math.round(bags / packSize(f)), meters: bags }
        })()
      : { rolls: Math.round(Math.min(o.delivered, 15000) / 122), meters: Math.min(o.delivered, roundTo(rng.int(6, 15) * 1000, 250)) }),
    vehicle: `${rng.pick(IS_POLY ? ['LES', 'LEA', 'LEB', 'KHI', 'MNA'] : ['FDA', 'LES', 'LEA', 'KHI', 'MNA'])}-${rng.int(1000, 9999)}`,
    driver: rng.pick(['Muhammad Akram', 'Sher Khan', 'Allah Ditta', 'Gulzar Ahmed', 'Nawaz Ali']),
    status: i === 0 ? 'Loading' : i < 3 ? 'In Transit' : 'Delivered',
  }))

// ---------------------------------------------------------------- Purchase orders
const POLY_PO_ITEMS: Record<string, [string, string, number][]> = {
  Granules: [['PP Homopolymer H030SG', 'kg', 395], ['PP Raffia Y130', 'kg', 388], ['LDPE LD 2420H', 'kg', 455], ['PP Recycled Grade A', 'kg', 245]],
  Masterbatch: [['Calcium filler masterbatch', 'kg', 120], ['White masterbatch TiO2', 'kg', 620], ['UV stabiliser masterbatch', 'kg', 980]],
  Film: [['BOPP film 20 micron', 'kg', 520], ['LDPE liner film 40 micron', 'kg', 480]],
  Ink: [['Flexo ink — blue', 'kg', 1150], ['Flexo ink — red', 'kg', 1150], ['Toluene solvent', 'litre', 340]],
  Thread: [['Polyester sewing thread 20/6', 'kg', 900]],
  'Spare Parts': [['Circular loom shuttle', 'pcs', 6500], ['Extruder screen mesh', 'pcs', 450], ['Cutting blade', 'pcs', 3800], ['Godet roller bearing', 'pcs', 5200]],
  Packaging: [['Bundle strapping roll', 'roll', 2400], ['Bale wrap film', 'kg', 480]],
  Consumables: [['Gear oil ISO VG 220', 'litre', 1150], ['Grease EP2', 'kg', 1450]],
  Electrical: [['Contactor 40A', 'pcs', 7800], ['Heater band 1.5 kW', 'pcs', 4600]],
}

const WEAVING_PO_ITEMS: Record<string, [string, string, number][]> = {
  Yarn: [['Cotton Yarn 40s Combed', 'kg', 620], ['Cotton Yarn 30s Carded', 'kg', 520], ['PC Yarn 45s', 'kg', 540], ['Cotton Yarn 20s Carded', 'kg', 470]],
  Sizing: [['Warp sizing — 40s (per beam)', 'beam', 18500], ['Warp sizing — 52s (per beam)', 'beam', 21000]],
  'Spare Parts': [['Air jet main nozzles', 'pcs', 4200], ['Heald wires 330mm', 'pcs', 38], ['Reed 72 dents', 'pcs', 46000], ['Rapier gripper set', 'set', 65000]],
  Packaging: [['HDPE roll bags', 'pcs', 55], ['Paper tubes 63"', 'pcs', 180]],
  Consumables: [['Loom oil ISO VG 68', 'litre', 980], ['Grease EP2', 'kg', 1450]],
  Electrical: [['Contactor 40A', 'pcs', 7800], ['Weft detector sensor', 'pcs', 16500]],
}
const PO_ITEMS = IS_POLY ? POLY_PO_ITEMS : WEAVING_PO_ITEMS
const RAW_PO = IS_POLY ? POLY_PO_ITEMS.Granules : WEAVING_PO_ITEMS.Yarn
const PO_STATUS: PurchaseOrder['status'][] = ['Received', 'Received', 'Approved', 'Partially Received', 'Received', 'Draft', 'Received', 'Cancelled']

export const PURCHASE_ORDERS: PurchaseOrder[] = Array.from({ length: 24 }, (_, i) => {
  const sup = SUPPLIERS[i % SUPPLIERS.length]
  const [item, unit, rate] = rng.pick(PO_ITEMS[sup.category] ?? RAW_PO)
  const quantity = unit === 'kg' ? roundTo(rng.int(1500, 9000), 100) : unit === 'beam' ? rng.int(6, 24) : unit === 'pcs' && rate < 100 ? roundTo(rng.int(2000, 12000), 500) : rng.int(4, 60)
  return {
    id: `PO-${3180 - i}`,
    date: isoDate(daysAgo(Math.floor(i * 1.7))),
    supplierId: sup.id,
    item,
    quantity,
    unit,
    rate,
    status: i < 2 ? 'Approved' : PO_STATUS[i % PO_STATUS.length],
    expected: isoDate(daysAgo(Math.floor(i * 1.7) - rng.int(3, 12))),
  }
})

// ---------------------------------------------------------------- Expenses
const WEAVING_EXPENSES: [ExpenseCategory, string, string, [number, number]][] = [
  ['Electricity', 'FESCO bill — main connection', 'FESCO', [3_100_000, 3_400_000]],
  ['Electricity', 'Generator diesel', 'Madina Lubricants', [180_000, 320_000]],
  ['Labour', 'Weekly wages — Hall A', 'Payroll', [690_000, 760_000]],
  ['Labour', 'Weekly wages — Hall B', 'Payroll', [540_000, 610_000]],
  ['Labour', 'Weekly wages — Hall C', 'Payroll', [480_000, 540_000]],
  ['Labour', 'Overtime — night shift', 'Payroll', [60_000, 140_000]],
  ['Repair', 'Loom spare parts', 'Hamza Loom Spares', [40_000, 260_000]],
  ['Repair', 'Compressor service', 'Atlas Air Services', [85_000, 150_000]],
  ['Repair', 'Electrical panel repair', 'Crescent Electric Services', [25_000, 90_000]],
  ['Transport', 'Fabric delivery — Lahore', 'Bilal Goods Transport', [28_000, 55_000]],
  ['Transport', 'Fabric delivery — Karachi', 'Daewoo Cargo', [75_000, 140_000]],
  ['Transport', 'Yarn freight inward', 'Local carriage', [12_000, 35_000]],
  ['Rent', 'Warehouse B rent', 'Sheikh Properties', [450_000, 450_000]],
  ['Miscellaneous', 'Canteen & tea', 'Petty cash', [35_000, 60_000]],
  ['Miscellaneous', 'Security services', 'Shield Security', [180_000, 180_000]],
  ['Miscellaneous', 'Office stationery', 'Petty cash', [6_000, 18_000]],
]

const POLY_EXPENSES: [ExpenseCategory, string, string, [number, number]][] = [
  ['Electricity', 'LESCO bill — main connection', 'LESCO', [2_300_000, 2_600_000]],
  ['Electricity', 'Generator diesel', 'Madina Lubricants', [140_000, 260_000]],
  ['Labour', 'Weekly wages — Extrusion', 'Payroll', [260_000, 300_000]],
  ['Labour', 'Weekly wages — Weaving', 'Payroll', [420_000, 480_000]],
  ['Labour', 'Weekly wages — Printing & Conversion', 'Payroll', [310_000, 360_000]],
  ['Labour', 'Overtime — night shift', 'Payroll', [50_000, 120_000]],
  ['Repair', 'Circular loom spare parts', 'Lohia Spares Pakistan', [35_000, 220_000]],
  ['Repair', 'Extruder screw & barrel service', 'Lohia Spares Pakistan', [90_000, 160_000]],
  ['Repair', 'Electrical panel repair', 'Crescent Electric Services', [25_000, 90_000]],
  ['Transport', 'Bag delivery — Lahore', 'Bilal Goods Transport', [22_000, 48_000]],
  ['Transport', 'Bag delivery — Karachi', 'Daewoo Cargo', [70_000, 130_000]],
  ['Transport', 'Granules freight inward', 'Local carriage', [15_000, 40_000]],
  ['Rent', 'Bundle store rent', 'Sundar Estate Properties', [320_000, 320_000]],
  ['Miscellaneous', 'Canteen & tea', 'Petty cash', [30_000, 55_000]],
  ['Miscellaneous', 'Security services', 'Shield Security', [150_000, 150_000]],
  ['Miscellaneous', 'Office stationery', 'Petty cash', [6_000, 18_000]],
]

const EXPENSE_SEEDS = IS_POLY ? POLY_EXPENSES : WEAVING_EXPENSES

export const EXPENSES: Expense[] = []
{
  let seq = 9120
  for (let week = 0; week < 4; week++) {
    EXPENSE_SEEDS.forEach(([category, description, paidTo, [lo, hi]], k) => {
      const monthly = category === 'Rent' || description.startsWith('FESCO') || description.startsWith('LESCO') || description.startsWith('Security')
      if (monthly && week !== 1) return
      if (!monthly && !description.startsWith('Weekly') && rng.next() < 0.35) return
      EXPENSES.push({
        id: `EX-${seq--}`,
        date: isoDate(daysAgo(week * 7 + (k % 6))),
        category,
        description,
        amount: roundTo(rng.int(lo, hi), 500),
        paidTo,
        method: category === 'Labour' ? 'Cash' : rng.pick(['Bank', 'Bank', 'Cheque', 'Cash'] as const),
      })
    })
  }
  EXPENSES.sort((a, b) => b.date.localeCompare(a.date))
}

// ---------------------------------------------------------------- Energy
export const ENERGY: EnergyDay[] = Array.from({ length: 30 }, (_, i) => {
  const d = 29 - i
  if (d === 0) {
    return { date: isoDate(daysAgo(0)), gridKwh: 4250, solarGenKwh: 2850, solarUsedKwh: 2400, exportKwh: 450, gridCost: 125_000, solarSavings: 72_000, peakKwh: 1180 }
  }
  const cloudy = rng.next() < 0.18
  const solarGen = roundTo(cloudy ? rng.int(1100, 1900) : rng.int(2500, 3150), 10)
  const solarUsed = roundTo(solarGen * rng.float(0.8, 0.9), 10)
  const grid = roundTo(6650 - solarUsed + rng.int(-250, 250), 10)
  const peak = roundTo(grid * rng.float(0.25, 0.3), 10)
  return {
    date: isoDate(daysAgo(d)),
    gridKwh: grid,
    solarGenKwh: solarGen,
    solarUsedKwh: solarUsed,
    exportKwh: solarGen - solarUsed,
    gridCost: roundTo(grid * 26.5 + peak * 11.2, 100),
    solarSavings: solarUsed * 30,
    peakKwh: peak,
  }
})

export const MONTHLY_ENERGY = [
  { month: 'Apr', grid: 3_920_000, solar: 1_640_000 },
  { month: 'May', grid: 4_310_000, solar: 1_910_000 },
  { month: 'Jun', grid: 4_680_000, solar: 2_020_000 },
  { month: 'Jul', grid: 4_520_000, solar: 1_780_000 },
  { month: 'Aug', grid: 4_090_000, solar: 1_850_000 },
  { month: 'Sep', grid: 3_760_000, solar: 2_060_000 },
]

export const TARIFF = {
  name: IS_POLY ? 'LESCO B-3 (Industrial, 11 kV)' : 'FESCO B-3 (Industrial, 11 kV)',
  peakRate: 37.9,
  offPeakRate: 26.5,
  peakHours: '17:00 – 21:00',
  fixedCharges: 'PKR 460 / kW / month',
  fpa: '+ PKR 1.23 / kWh (Sep FCA)',
}

// ---------------------------------------------------------------- Notifications
const POLY_NOTIFICATIONS: AppNotification[] = [
  { id: 'n1', title: 'Machine M-03 stopped', body: 'Extruder M-03 has been stopped for 60 minutes. Reason: screen pack choked.', time: '2 min ago', tone: 'danger', to: '/looms/M-03', read: false },
  { id: 'n2', title: 'Production below target', body: "Today's production is 6% below target in the Weaving section.", time: '18 min ago', tone: 'warning', to: '/production', read: false },
  { id: 'n3', title: 'Low granules stock', body: 'PP Recycled Grade A is below minimum stock — 2,100 kg left.', time: '42 min ago', tone: 'warning', to: '/yarn?q=YRN-004', read: false },
  { id: 'n4', title: 'Order due tomorrow', body: 'Sales Order SO-1024 for Sunrise Flour Mills is due tomorrow. 45,000 bags pending.', time: '1 hour ago', tone: 'info', to: '/sales/orders/SO-1024', read: false },
  { id: 'n5', title: 'Shift target achieved', body: 'Production target achieved for Shift A (Morning) yesterday — 101.8%.', time: '3 hours ago', tone: 'success', to: '/production/daily', read: true },
  { id: 'n6', title: 'Bundle rejected', body: 'Bundle BN-10298 rejected in inspection — weak seals on 11 bags.', time: '5 hours ago', tone: 'danger', to: '/quality', read: true },
  { id: 'n7', title: 'Solar generation record', body: 'Solar plant generated 2,100 kWh yesterday — highest this month.', time: 'Yesterday', tone: 'success', to: '/electricity/solar', read: true },
]

export const NOTIFICATIONS: AppNotification[] = IS_POLY ? POLY_NOTIFICATIONS : [
  { id: 'n1', title: 'Loom L-12 stopped', body: 'Loom L-12 has been stopped for 65 minutes. Reason: warp beam tension fault.', time: '2 min ago', tone: 'danger', to: '/looms/L-12', read: false },
  { id: 'n2', title: 'Production below target', body: "Today's production is 8% below target in Hall B.", time: '18 min ago', tone: 'warning', to: '/production', read: false },
  { id: 'n3', title: 'Low yarn stock', body: 'Yarn 40s Cotton (Carded) is below minimum stock — 1,650 kg left.', time: '42 min ago', tone: 'warning', to: '/yarn?q=YRN-004', read: false },
  { id: 'n4', title: 'Order due tomorrow', body: 'Sales Order SO-1024 for Ahmed Textile is due tomorrow. 18,000 m pending.', time: '1 hour ago', tone: 'info', to: '/sales/orders/SO-1024', read: false },
  { id: 'n5', title: 'Shift target achieved', body: 'Production target achieved for Shift A (Morning) yesterday — 101.3%.', time: '3 hours ago', tone: 'success', to: '/production/daily', read: true },
  { id: 'n6', title: 'Roll rejected', body: 'Roll R-10298 rejected in inspection — 11 defects (weft bar).', time: '5 hours ago', tone: 'danger', to: '/quality', read: true },
  { id: 'n7', title: 'Solar generation record', body: 'Solar plant generated 3,150 kWh yesterday — highest this month.', time: 'Yesterday', tone: 'success', to: '/electricity/solar', read: true },
]
