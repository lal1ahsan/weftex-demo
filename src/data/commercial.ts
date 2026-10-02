import type { AppNotification, Customer, Dispatch, EnergyDay, Expense, ExpenseCategory, OrderStatus, PurchaseOrder, Roll, SalesOrder } from '@/types'
import { INSPECTORS } from './factory'
import { FABRICS, SUPPLIERS } from './inventory'
import { LOOMS } from './production'
import { createRng, daysAgo, isoDate, roundTo } from './seed'

const rng = createRng(7731)

// ---------------------------------------------------------------- Customers
const CUSTOMER_SEEDS: [string, string, string][] = [
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
// Calibrate receivables to PKR 18.5M (keeping Ahmed Textile at 2.4M)
const otherOutstanding = custBase.slice(1).reduce((s, c) => s + c.outstanding, 0)
const recScale = (18_500_000 - 2_400_000) / otherOutstanding
export const CUSTOMERS: Customer[] = custBase.map((c, i) => (i === 0 ? c : { ...c, outstanding: roundTo(c.outstanding * recScale, 1000) }))
const recResidual = 18_500_000 - CUSTOMERS.reduce((s, c) => s + c.outstanding, 0)
CUSTOMERS[1].outstanding += recResidual

export const customerById = (id: string) => CUSTOMERS.find((c) => c.id === id)

// ---------------------------------------------------------------- Sales orders
const ORDER_STATUS: OrderStatus[] = ['Completed', 'Completed', 'Completed', 'Confirmed', 'Partially Fulfilled', 'Confirmed', 'Draft', 'Completed', 'Cancelled', 'Partially Fulfilled']

export const SALES_ORDERS: SalesOrder[] = Array.from({ length: 30 }, (_, i) => {
  const num = 1031 - i
  const id = `SO-${num}`
  const fabric = rng.pick(FABRICS)
  const quantity = roundTo(rng.int(6, 60) * 1000, 500)
  let status = ORDER_STATUS[i % ORDER_STATUS.length]
  if (num >= 1029) status = num === 1031 ? 'Draft' : 'Confirmed'
  const delivered = status === 'Completed' ? quantity : status === 'Partially Fulfilled' ? roundTo(quantity * rng.float(0.3, 0.8), 500) : 0
  return {
    id,
    date: isoDate(daysAgo(Math.floor(i * 2.3) + 1)),
    customerId: CUSTOMERS[i % 7 === 0 ? 0 : rng.int(0, 19)].id,
    fabricCode: fabric.code,
    quantity,
    delivered,
    rate: fabric.ratePerMeter + rng.int(-10, 25),
    deliveryDate: isoDate(daysAgo(Math.floor(i * 2.3) - rng.int(10, 24))),
    status,
    paymentTerms: rng.pick(['30 days credit', '45 days credit', '60 days credit', 'Advance 30%, balance on delivery']),
  }
})
// The story order: SO-1024 for Ahmed Textile, due tomorrow
const so1024 = SALES_ORDERS.find((o) => o.id === 'SO-1024')!
Object.assign(so1024, {
  customerId: 'CUS-001',
  fabricCode: 'FAB-101',
  quantity: 48000,
  delivered: 30000,
  rate: FABRICS[0].ratePerMeter + 4,
  date: isoDate(daysAgo(12)),
  deliveryDate: isoDate(daysAgo(-1)),
  status: 'Partially Fulfilled',
  paymentTerms: '45 days credit',
})

export const orderById = (id: string) => SALES_ORDERS.find((o) => o.id === id)

// ---------------------------------------------------------------- Rolls
const DEFECTS = ['Broken pick', 'Float', 'Thick place', 'Oil stain', 'Reed mark', 'Starting mark', 'Missing end', 'Slub', 'Weft bar']

export const ROLLS: Roll[] = Array.from({ length: 124 }, (_, i) => {
  const id = `R-${10320 - i}`
  const loom = rng.pick(LOOMS)
  const fabric = FABRICS.find((f) => f.code === loom.fabricCode)!
  const meters = rng.int(110, 132)
  const q = rng.weighted([['Passed', 84], ['Hold', 9], ['Rejected', 7]] as const)
  const defects = q === 'Passed' ? rng.int(0, 3) : q === 'Hold' ? rng.int(4, 7) : rng.int(8, 14)
  return {
    id,
    fabricCode: fabric.code,
    loomId: loom.id,
    date: isoDate(daysAgo(Math.floor(i / 12))),
    meters,
    weightKg: Math.round(meters * fabric.widthInches * 0.0254 * (fabric.gsm / 1000)),
    grade: q === 'Passed' ? (defects <= 1 ? 'A' : 'B') : q === 'Hold' ? 'B' : 'C',
    quality: q,
    location: q === 'Rejected' ? 'Rejection Bay' : i % 3 === 0 ? 'Warehouse B' : 'Warehouse A',
    status: i > 90 ? 'Dispatched' : i % 6 === 0 ? 'Reserved' : 'In Stock',
    inspector: rng.pick(INSPECTORS),
    defects,
    defectTypes: Array.from({ length: Math.min(3, Math.ceil(defects / 3)) }, () => rng.pick(DEFECTS)).filter((v, k, a) => a.indexOf(v) === k),
  }
})
// The story roll
Object.assign(ROLLS.find((r) => r.id === 'R-10251')!, {
  fabricCode: 'FAB-101', loomId: 'L-12', meters: 125, weightKg: 42, grade: 'A', quality: 'Passed',
  location: 'Warehouse A', status: 'Reserved', defects: 1, defectTypes: ['Broken pick'], inspector: 'Rabia Anwar',
})

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
    rolls: Math.round(Math.min(o.delivered, 15000) / 122),
    meters: Math.min(o.delivered, roundTo(rng.int(6, 15) * 1000, 250)),
    vehicle: `${rng.pick(['FDA', 'LES', 'LEA', 'KHI', 'MNA'])}-${rng.int(1000, 9999)}`,
    driver: rng.pick(['Muhammad Akram', 'Sher Khan', 'Allah Ditta', 'Gulzar Ahmed', 'Nawaz Ali']),
    status: i === 0 ? 'Loading' : i < 3 ? 'In Transit' : 'Delivered',
  }))

// ---------------------------------------------------------------- Purchase orders
const PO_ITEMS: Record<string, [string, string, number][]> = {
  Yarn: [['Cotton Yarn 40s Combed', 'kg', 620], ['Cotton Yarn 30s Carded', 'kg', 520], ['PC Yarn 45s', 'kg', 540], ['Cotton Yarn 20s Carded', 'kg', 470]],
  Sizing: [['Warp sizing — 40s (per beam)', 'beam', 18500], ['Warp sizing — 52s (per beam)', 'beam', 21000]],
  'Spare Parts': [['Air jet main nozzles', 'pcs', 4200], ['Heald wires 330mm', 'pcs', 38], ['Reed 72 dents', 'pcs', 46000], ['Rapier gripper set', 'set', 65000]],
  Packaging: [['HDPE roll bags', 'pcs', 55], ['Paper tubes 63"', 'pcs', 180]],
  Consumables: [['Loom oil ISO VG 68', 'litre', 980], ['Grease EP2', 'kg', 1450]],
  Electrical: [['Contactor 40A', 'pcs', 7800], ['Weft detector sensor', 'pcs', 16500]],
}
const PO_STATUS: PurchaseOrder['status'][] = ['Received', 'Received', 'Approved', 'Partially Received', 'Received', 'Draft', 'Received', 'Cancelled']

export const PURCHASE_ORDERS: PurchaseOrder[] = Array.from({ length: 24 }, (_, i) => {
  const sup = SUPPLIERS[i % SUPPLIERS.length]
  const [item, unit, rate] = rng.pick(PO_ITEMS[sup.category] ?? PO_ITEMS.Yarn)
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
const EXPENSE_SEEDS: [ExpenseCategory, string, string, [number, number]][] = [
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

export const EXPENSES: Expense[] = []
{
  let seq = 9120
  for (let week = 0; week < 4; week++) {
    EXPENSE_SEEDS.forEach(([category, description, paidTo, [lo, hi]], k) => {
      const monthly = category === 'Rent' || description.startsWith('FESCO') || description.startsWith('Security')
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
  name: 'FESCO B-3 (Industrial, 11 kV)',
  peakRate: 37.9,
  offPeakRate: 26.5,
  peakHours: '17:00 – 21:00',
  fixedCharges: 'PKR 460 / kW / month',
  fpa: '+ PKR 1.23 / kWh (Sep FCA)',
}

// ---------------------------------------------------------------- Notifications
export const NOTIFICATIONS: AppNotification[] = [
  { id: 'n1', title: 'Loom L-12 stopped', body: 'Loom L-12 has been stopped for 65 minutes. Reason: warp beam tension fault.', time: '2 min ago', tone: 'danger', to: '/looms/L-12', read: false },
  { id: 'n2', title: 'Production below target', body: "Today's production is 8% below target in Hall B.", time: '18 min ago', tone: 'warning', to: '/production', read: false },
  { id: 'n3', title: 'Low yarn stock', body: 'Yarn 40s Cotton (Carded) is below minimum stock — 1,650 kg left.', time: '42 min ago', tone: 'warning', to: '/yarn?q=YRN-004', read: false },
  { id: 'n4', title: 'Order due tomorrow', body: 'Sales Order SO-1024 for Ahmed Textile is due tomorrow. 18,000 m pending.', time: '1 hour ago', tone: 'info', to: '/sales/orders/SO-1024', read: false },
  { id: 'n5', title: 'Shift target achieved', body: 'Production target achieved for Shift A (Morning) yesterday — 101.3%.', time: '3 hours ago', tone: 'success', to: '/production/daily', read: true },
  { id: 'n6', title: 'Roll rejected', body: 'Roll R-10298 rejected in inspection — 11 defects (weft bar).', time: '5 hours ago', tone: 'danger', to: '/quality', read: true },
  { id: 'n7', title: 'Solar generation record', body: 'Solar plant generated 3,150 kWh yesterday — highest this month.', time: 'Yesterday', tone: 'success', to: '/electricity/solar', read: true },
]
