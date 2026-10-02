export type ShiftName = 'Morning' | 'Evening' | 'Night'
export type LoomStatus = 'Running' | 'Idle' | 'Stopped' | 'Maintenance'
export type LoomType = 'Air Jet' | 'Rapier' | 'Water Jet' | 'Projectile'

export interface Loom {
  id: string // L-01
  type: LoomType
  manufacturer: string
  model: string
  widthInches: number
  rpm: number
  installed: string // ISO date
  hall: string
  status: LoomStatus
  fabricCode: string
  operator: string
  shift: ShiftName
  todayProduction: number // meters
  target: number // meters/day
  efficiency: number // %
  downtimeMinutes: number // today
  stoppedSince?: string // HH:mm
  stopReason?: string
}

export interface Operator {
  id: string
  name: string
  shift: ShiftName
}

export interface YarnItem {
  code: string
  name: string
  count: string
  type: string
  material: string
  supplier: string
  lot: string
  stockKg: number
  minStockKg: number
  costPerKg: number
  warehouse: string
  incomingKg: number
  issuedKgMonth: number
}

export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock'

export interface YarnPurchase {
  id: string
  date: string
  supplier: string
  yarnCode: string
  yarnName: string
  quantityKg: number
  rate: number
  status: 'Received' | 'In Transit' | 'Pending' | 'Partially Received'
}

export interface YarnIssue {
  id: string
  date: string
  yarnCode: string
  yarnName: string
  quantityKg: number
  issuedTo: string
  purpose: 'Warp' | 'Weft'
  issuedBy: string
}

export interface Fabric {
  code: string
  name: string
  construction: string // yarn counts, e.g. 40×40
  density: string // reed × pick, e.g. 133×72
  widthInches: number
  gsm: number
  weave: string
  rolls: number
  meters: number
  weightKg: number
  location: string
  status: 'Available' | 'Reserved' | 'On Hold'
  ratePerMeter: number
}

export interface ProductionRecord {
  id: string
  date: string
  shift: ShiftName
  loomId: string
  operator: string
  fabricCode: string
  target: number
  actual: number
  wastageKg: number
  efficiency: number
  remarks: string
}

export type DowntimeCategory =
  | 'Mechanical'
  | 'Electrical'
  | 'Yarn Issue'
  | 'Beam Issue'
  | 'Operator'
  | 'Maintenance'
  | 'Material Shortage'

export interface DowntimeRecord {
  id: string
  loomId: string
  date: string
  shift: ShiftName
  start: string
  end: string
  minutes: number
  category: DowntimeCategory
  reason: string
  department: string
  remarks: string
}

export type QualityGrade = 'A' | 'B' | 'C'
export type QualityStatus = 'Passed' | 'Rejected' | 'Hold'

export interface Roll {
  id: string // R-10251
  fabricCode: string
  loomId: string
  date: string
  meters: number
  weightKg: number
  grade: QualityGrade
  quality: QualityStatus
  location: string
  status: 'In Stock' | 'Reserved' | 'Dispatched'
  inspector: string
  defects: number
  defectTypes: string[]
}

export interface Customer {
  id: string
  name: string
  city: string
  contact: string
  phone: string
  orders: number
  outstanding: number
  creditLimit: number
  status: 'Active' | 'On Hold' | 'Inactive'
  ntn: string
}

export type OrderStatus = 'Draft' | 'Confirmed' | 'Partially Fulfilled' | 'Completed' | 'Cancelled'

export interface SalesOrder {
  id: string // SO-1024
  date: string
  customerId: string
  fabricCode: string
  quantity: number
  delivered: number
  rate: number
  deliveryDate: string
  status: OrderStatus
  paymentTerms: string
}

export interface Dispatch {
  id: string
  date: string
  orderId: string
  customerId: string
  fabricCode: string
  rolls: number
  meters: number
  vehicle: string
  driver: string
  status: 'Delivered' | 'In Transit' | 'Loading'
}

export interface Supplier {
  id: string
  name: string
  city: string
  contact: string
  phone: string
  category: string
  payable: number
  rating: number
  status: 'Active' | 'Inactive'
}

export interface PurchaseOrder {
  id: string
  date: string
  supplierId: string
  item: string
  quantity: number
  unit: string
  rate: number
  status: 'Draft' | 'Approved' | 'Received' | 'Partially Received' | 'Cancelled'
  expected: string
}

export type ExpenseCategory = 'Electricity' | 'Labour' | 'Repair' | 'Transport' | 'Rent' | 'Miscellaneous'

export interface Expense {
  id: string
  date: string
  category: ExpenseCategory
  description: string
  amount: number
  paidTo: string
  method: 'Bank' | 'Cash' | 'Cheque'
}

export interface EnergyDay {
  date: string
  gridKwh: number
  solarGenKwh: number
  solarUsedKwh: number
  exportKwh: number
  gridCost: number
  solarSavings: number
  peakKwh: number
}

export interface User {
  id: string
  name: string
  email: string
  role: string
  phone: string
  lastActive: string
  status: 'Active' | 'Invited' | 'Disabled'
}

export interface ProductionPlan {
  id: string
  fabricCode: string
  orderId: string
  looms: string[]
  plannedMeters: number
  producedMeters: number
  start: string
  end: string
  status: 'Planned' | 'In Progress' | 'Completed' | 'Delayed'
}

export interface AppNotification {
  id: string
  title: string
  body: string
  time: string
  tone: 'danger' | 'warning' | 'info' | 'success'
  to: string
  read: boolean
}
