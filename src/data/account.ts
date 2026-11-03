/**
 * Accounts, businesses and roles for the demo (PRD 2.1–2.4, 3.3, 3.6, 3.7).
 * There is no back end: everything lives in this browser's localStorage, so a
 * business signed up here can be approved from /admin in the same browser.
 */

export type BusinessType = 'weaving' | 'polybag' | 'other'
export type BusinessStatus = 'Pending approval' | 'Active' | 'Rejected' | 'Suspended'
export type RawUnit = 'Bags' | 'Kg' | 'Tons'
export type ProductUnit = 'Meters' | 'Kg' | 'Tons' | 'Bags'
export type RoleKind = 'Fixed' | 'Starting' | 'Custom'
export type UserStatus = 'Active' | 'Invited' | 'Disabled'

export interface Perm {
  view: boolean
  add: boolean
  edit: boolean
}
export type PermSet = Partial<Record<ModuleKey, Perm>>

export interface Factory {
  id: string
  name: string
  city: string
}

export interface AuditEntry {
  at: string
  by: string
  action: string
  reason?: string
}

export interface Business {
  id: string
  name: string
  type: BusinessType
  otherTypeName?: string
  rawUnit: RawUnit
  productUnit: ProductUnit
  /** The business's own words, pre-filled by type at onboarding and editable any time (2.2). */
  names?: BusinessNames
  status: BusinessStatus
  statusReason?: string
  ownerId: string
  factories: Factory[]
  /** Business type and units lock once the first stock or production record exists (2.2, 11.1). */
  hasRecords: boolean
  ntn?: string
  strn?: string
  createdAt: string
  audit: AuditEntry[]
}

export interface BusinessNames {
  rawMaterial: string
  finishedGoods: string
  machines: string
}

export interface Role {
  id: string
  businessId: string
  name: string
  description: string
  kind: RoleKind
  /** Fixed for starting roles, so built-in behaviour follows the role, not its name (3.7). */
  systemKey?: string
  canSignIn: boolean
  homePage?: ModuleKey
  oneFactoryOnly: boolean
  alerts: string[]
  seeMoney: boolean
  perms: PermSet
  reports: string[]
  status: 'Active' | 'Inactive'
}

export interface OnboardingDraft {
  step: 1 | 2 | 3
  businessName: string
  type?: BusinessType
  otherTypeName: string
  rawUnit?: RawUnit
  productUnit?: ProductUnit
  rawMaterialName?: string
  finishedGoodsName?: string
  machineName?: string
  factoryName: string
  city: string
}

export interface Account {
  id: string
  businessId?: string
  firstName: string
  lastName: string
  email: string
  /** Stored as +923… (PRD 2.1). Empty for users added with only an email. */
  phone: string
  passwordHash: string
  phoneVerified: boolean
  emailVerified: boolean
  roleId?: string
  factoryIds: 'all' | string[]
  canSignIn: boolean
  status: UserStatus
  /** Supervisor only: ticks set person by person (3.6). */
  supervisorPerms?: PermSet
  supervisorSeeMoney?: boolean
  language: 'English' | 'Urdu'
  lastActive: string
  onboarding?: OnboardingDraft
  createdAt: string
}

export interface Admin {
  id: string
  name: string
  email: string
  phone: string
  passwordHash: string
}

export interface Db {
  version: 1
  businesses: Business[]
  accounts: Account[]
  roles: Role[]
  admins: Admin[]
  signups: { phone: string; at: number }[]
  failedLogins: Record<string, { count: number; until?: number }>
}

/* ------------------------------------------------------------------ */
/* Business types (2.3)                                                */
/* ------------------------------------------------------------------ */

export interface TypeProfile {
  label: string
  short: string
  defaultRaw?: RawUnit
  defaultProduct?: ProductUnit
  machine: string
  machines: string
  rawMaterial: string
  finishedGoods: string
  hasSizing: boolean
}

export const TYPE_PROFILES: Record<BusinessType, TypeProfile> = {
  weaving: {
    label: 'Weaving',
    short: 'Looms, yarn, sizing and fabric rolls',
    defaultRaw: 'Bags',
    defaultProduct: 'Meters',
    machine: 'Loom',
    machines: 'Looms',
    rawMaterial: 'Yarn',
    finishedGoods: 'Fabric',
    hasSizing: true,
  },
  polybag: {
    label: 'Poly bag manufacturing',
    short: 'Extruders, circular looms, printing, cutting & sealing, bags in bundles',
    defaultRaw: 'Kg',
    defaultProduct: 'Bags',
    machine: 'Machine',
    machines: 'Machines',
    rawMaterial: 'Granules',
    finishedGoods: 'Bags',
    hasSizing: false,
  },
  other: {
    label: 'Other',
    short: 'Your own machines, raw materials and products',
    machine: 'Machine',
    machines: 'Machines',
    rawMaterial: '',
    finishedGoods: '',
    hasSizing: false,
  },
}

/** "Looms" → "Loom", "Machines" → "Machine"; anything else is used as typed. */
export function singular(word: string) {
  return /[^s]s$/i.test(word) ? word.slice(0, -1) : word
}

/** The type's profile in the business's own words (2.2, 2.3). */
export function profileFor(b?: Pick<Business, 'type' | 'names'>): TypeProfile {
  const base = TYPE_PROFILES[b?.type ?? 'weaving']
  const n = b?.names
  if (!n) return { ...base, rawMaterial: base.rawMaterial || 'Raw Material', finishedGoods: base.finishedGoods || 'Finished Goods' }
  return { ...base, rawMaterial: n.rawMaterial, finishedGoods: n.finishedGoods, machines: n.machines, machine: singular(n.machines) }
}

export const NAME_MAX = 30

export const RAW_UNITS: RawUnit[] = ['Bags', 'Kg', 'Tons']
export const PRODUCT_UNITS: ProductUnit[] = ['Meters', 'Kg', 'Tons', 'Bags']

export function businessTypeLabel(b: Pick<Business, 'type' | 'otherTypeName'>) {
  return b.type === 'other' && b.otherTypeName ? `Other — ${b.otherTypeName}` : TYPE_PROFILES[b.type].label
}

/* ------------------------------------------------------------------ */
/* Permission modules (3.6)                                            */
/* ------------------------------------------------------------------ */

export type ModuleKey =
  | 'dashboard'
  | 'looms'
  | 'shifts'
  | 'production'
  | 'downtime'
  | 'yarnInventory'
  | 'yarnPurchases'
  | 'yarnIssues'
  | 'sizing'
  | 'sizingBills'
  | 'fabric'
  | 'customers'
  | 'salesOrders'
  | 'dispatch'
  | 'suppliers'
  | 'gate'
  | 'reports'

export interface ModuleDef {
  key: ModuleKey
  /** Label per business type; the panel uses the business's own words (2.3). */
  label: (p: TypeProfile) => string
  /** Route of the module's first page in the demo, if it has one. */
  to?: string
  weavingOnly?: boolean
  noAdd?: boolean
  noEdit?: boolean
}

export const MODULES: ModuleDef[] = [
  { key: 'dashboard', label: () => 'Dashboard', to: '/', noAdd: true, noEdit: true },
  { key: 'looms', label: (p) => p.machines, to: '/looms' },
  { key: 'shifts', label: (p) => (p.hasSizing ? 'Shifts and weavers' : 'Shifts and operators'), to: '/factory/shifts', noAdd: true },
  { key: 'production', label: () => 'Production entry', to: '/production' },
  { key: 'downtime', label: () => 'Downtime', to: '/downtime' },
  { key: 'yarnInventory', label: (p) => `${p.rawMaterial} inventory`, to: '/yarn' },
  { key: 'yarnPurchases', label: (p) => `${p.rawMaterial} purchases`, to: '/yarn/purchases' },
  { key: 'yarnIssues', label: (p) => `${p.rawMaterial} issues and returns`, to: '/yarn/issues' },
  { key: 'sizing', label: () => 'Sizing and beams', weavingOnly: true },
  { key: 'sizingBills', label: () => 'Sizing bills', weavingOnly: true },
  { key: 'fabric', label: (p) => (p.hasSizing ? 'Fabric and rolls' : 'Finished goods'), to: '/fabric' },
  { key: 'customers', label: () => 'Customers', to: '/sales/customers' },
  { key: 'salesOrders', label: () => 'Sales orders', to: '/sales/orders' },
  { key: 'dispatch', label: () => 'Dispatch', to: '/sales/dispatch' },
  { key: 'suppliers', label: () => 'Suppliers', to: '/purchases/suppliers' },
  { key: 'gate', label: () => 'Gate Register', noEdit: true },
  { key: 'reports', label: () => 'Reports', to: '/reports', noAdd: true, noEdit: true },
]

export function modulesFor(type: BusinessType) {
  return MODULES.filter((m) => !m.weavingOnly || type === 'weaving')
}

export const REPORT_OPTIONS = ['Production', 'Downtime', 'Beams', 'Yarn', 'Sizing', 'Fabric stock', 'Purchases', 'Sales', 'Sizing bills']

export const ALERT_OPTIONS = [
  'Loom stopped for more than 15 minutes',
  'Production below target',
  'Yarn below minimum stock',
  'Missing production entries',
  'Sales order due',
  'Late edit waiting for approval',
]

/** Pages only the Owner can open, whatever the role (3.6 "Never in the list", 3.7). */
export const OWNER_ONLY_PATHS = ['/factory/users', '/factory/roles', '/factory/factories', '/settings']

/** Which permission module a path belongs to; undefined = Owner only. */
export function moduleForPath(path: string): ModuleKey | undefined {
  if (path === '/') return 'dashboard'
  if (OWNER_ONLY_PATHS.some((p) => path === p || path.startsWith(p + '/'))) return undefined
  const map: [string, ModuleKey][] = [
    ['/looms', 'looms'],
    ['/factory/shifts', 'shifts'],
    ['/production', 'production'],
    ['/downtime', 'downtime'],
    ['/yarn/purchases', 'yarnPurchases'],
    ['/yarn/issues', 'yarnIssues'],
    ['/yarn', 'yarnInventory'],
    ['/fabric', 'fabric'],
    ['/sales/customers', 'customers'],
    ['/sales/orders', 'salesOrders'],
    ['/sales/dispatch', 'dispatch'],
    ['/purchases/suppliers', 'suppliers'],
    ['/reports', 'reports'],
  ]
  return map.find(([p]) => path === p || path.startsWith(p + '/'))?.[1]
}

/* ------------------------------------------------------------------ */
/* Starting roles (3.3 permissions table, 2.3)                         */
/* ------------------------------------------------------------------ */

const V: Perm = { view: true, add: false, edit: false }
const VA: Perm = { view: true, add: true, edit: false }
const VE: Perm = { view: true, add: false, edit: true }
const VAE: Perm = { view: true, add: true, edit: true }

interface RoleTemplate {
  key: string
  name: string
  description: string
  canSignIn?: boolean
  homePage?: ModuleKey
  oneFactoryOnly?: boolean
  seeMoney?: boolean
  perms: PermSet
  reports?: string[]
  alerts?: string[]
}

const WEAVING_ROLES: RoleTemplate[] = [
  {
    key: 'tm',
    name: 'TM',
    description: 'Technical Master who runs the floor and checks production',
    homePage: 'looms',
    perms: { dashboard: V, looms: VAE, shifts: VE, production: VE, downtime: VAE, yarnInventory: V, yarnPurchases: V, yarnIssues: V, sizing: V, fabric: V, reports: V },
    reports: ['Production', 'Downtime', 'Beams'],
    alerts: ['Loom stopped for more than 15 minutes', 'Production below target', 'Missing production entries'],
  },
  {
    key: 'mechanics',
    name: 'Mechanics',
    description: 'Loom mechanics who repair stopped looms',
    homePage: 'downtime',
    oneFactoryOnly: true,
    perms: { looms: VE, downtime: VAE, reports: V },
    reports: ['Downtime'],
    alerts: ['Loom stopped for more than 15 minutes'],
  },
  {
    key: 'yarn-manager',
    name: 'Yarn Manager',
    description: 'Runs the yarn store: purchases, receipts, issues, sending yarn and beams to sizing',
    homePage: 'yarnInventory',
    perms: { yarnInventory: VAE, yarnPurchases: VAE, yarnIssues: VAE, sizing: VAE, suppliers: VAE, gate: V, reports: V },
    reports: ['Yarn', 'Sizing'],
    alerts: ['Yarn below minimum stock'],
  },
  {
    key: 'fabric-manager',
    name: 'Fabric Manager',
    description: "Enters each loom's production for the weavers, and runs the fabric warehouse",
    homePage: 'fabric',
    perms: { production: VAE, fabric: VAE, dispatch: VA, gate: V, reports: V },
    reports: ['Fabric stock'],
    alerts: ['Missing production entries'],
  },
  {
    key: 'accountant',
    name: 'Accountant',
    description: 'Sales orders and rates, purchase and sizing bills',
    homePage: 'salesOrders',
    seeMoney: true,
    perms: { dashboard: V, yarnInventory: V, yarnPurchases: V, yarnIssues: V, sizingBills: VAE, fabric: V, customers: VAE, salesOrders: VAE, dispatch: VAE, suppliers: VAE, reports: V },
    reports: ['Purchases', 'Sales', 'Sizing bills'],
    alerts: ['Sales order due'],
  },
  {
    key: 'beam-gater',
    name: 'Beam Gater',
    description: 'Fits sized beams on looms and manages weaver duties',
    homePage: 'sizing',
    oneFactoryOnly: true,
    perms: { looms: VE, shifts: VE, downtime: VA, sizing: VE },
  },
  {
    key: 'weaver',
    name: 'Weaver',
    description: 'Runs a set of looms in one shift. No access to Weftex; kept as a name only',
    canSignIn: false,
    oneFactoryOnly: true,
    perms: {},
  },
  {
    key: 'security-guard',
    name: 'Security Guard',
    description: 'Checks vehicles and goods in and out at the gate',
    homePage: 'gate',
    oneFactoryOnly: true,
    perms: { gate: VA },
  },
  {
    key: 'rewinder',
    name: 'Rewinder',
    description: 'Rewinds yarn onto cones for the looms',
    homePage: 'yarnIssues',
    perms: { yarnIssues: VA },
  },
]

/** Poly bag manufacturing and Other start from the 2.3 list; each business can change them. */
const POLYBAG_ROLES: RoleTemplate[] = [
  { ...WEAVING_ROLES[0], description: 'Technical Master who runs the floor and checks production', perms: { dashboard: V, looms: VAE, shifts: VE, production: VE, downtime: VAE, yarnInventory: V, yarnIssues: V, fabric: V, reports: V }, reports: ['Production', 'Downtime'] },
  { ...WEAVING_ROLES[1], description: 'Machine mechanics who repair stopped machines' },
  {
    key: 'store-manager',
    name: 'Store Manager',
    description: 'Runs the raw material store: purchases, receipts and issues to machines',
    homePage: 'yarnInventory',
    perms: { yarnInventory: VAE, yarnPurchases: VAE, yarnIssues: VAE, suppliers: VAE, gate: V, reports: V },
    reports: ['Yarn'],
    alerts: ['Yarn below minimum stock'],
  },
  {
    key: 'finished-goods-manager',
    name: 'Finished Goods Manager',
    description: 'Enters machine production and runs the finished goods store and dispatches',
    homePage: 'fabric',
    perms: { production: VAE, fabric: VAE, dispatch: VA, gate: V, reports: V },
    reports: ['Fabric stock'],
    alerts: ['Missing production entries'],
  },
  { ...WEAVING_ROLES[4], perms: { dashboard: V, yarnInventory: V, yarnPurchases: V, yarnIssues: V, fabric: V, customers: VAE, salesOrders: VAE, dispatch: VAE, suppliers: VAE, reports: V }, reports: ['Purchases', 'Sales'] },
  {
    key: 'machine-operator',
    name: 'Machine Operator',
    description: 'Runs machines in one shift. Kept as a name that production entries point to',
    canSignIn: false,
    oneFactoryOnly: true,
    perms: {},
  },
  WEAVING_ROLES[7],
]

export function startingRoleTemplates(type: BusinessType) {
  return type === 'weaving' ? WEAVING_ROLES : POLYBAG_ROLES
}

export const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`

function roleFromTemplate(businessId: string, t: RoleTemplate): Role {
  return {
    id: uid('role'),
    businessId,
    name: t.name,
    description: t.description,
    kind: 'Starting',
    systemKey: t.key,
    canSignIn: t.canSignIn ?? true,
    homePage: t.homePage,
    oneFactoryOnly: t.oneFactoryOnly ?? false,
    alerts: t.alerts ?? [],
    seeMoney: t.seeMoney ?? false,
    perms: structuredClone(t.perms),
    reports: t.reports ?? [],
    status: 'Active',
  }
}

/** The original version of a starting role, for "Reset to starting version". */
export function startingVersion(type: BusinessType, systemKey: string) {
  return startingRoleTemplates(type).find((t) => t.key === systemKey)
}

export function resetRole(role: Role, type: BusinessType): Role {
  const t = role.systemKey ? startingVersion(type, role.systemKey) : undefined
  if (!t) return role
  const fresh = roleFromTemplate(role.businessId, t)
  return { ...fresh, id: role.id, status: role.status }
}

/** Owner and Supervisor are fixed in every business; the rest come from the type (3.7). */
export function seedRoles(businessId: string, type: BusinessType): Role[] {
  const fixed: Role[] = [
    {
      id: uid('role'),
      businessId,
      name: 'Owner',
      description: 'Owns the business; sees and controls everything',
      kind: 'Fixed',
      systemKey: 'owner',
      canSignIn: true,
      homePage: 'dashboard',
      oneFactoryOnly: false,
      alerts: ALERT_OPTIONS,
      seeMoney: true,
      perms: Object.fromEntries(modulesFor(type).map((m) => [m.key, VAE])),
      reports: REPORT_OPTIONS,
      status: 'Active',
    },
    {
      id: uid('role'),
      businessId,
      name: 'Supervisor',
      description: 'Access is ticked person by person by the Owner',
      kind: 'Fixed',
      systemKey: 'supervisor',
      canSignIn: true,
      oneFactoryOnly: false,
      alerts: [],
      seeMoney: false,
      perms: {},
      reports: [],
      status: 'Active',
    },
  ]
  return [...fixed, ...startingRoleTemplates(type).map((t) => roleFromTemplate(businessId, t))]
}

/* ------------------------------------------------------------------ */
/* Phone, email and password helpers (1.1, 2.1)                        */
/* ------------------------------------------------------------------ */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** 03xx xxxxxxx or +923… → +923xxxxxxxxx, or null if it isn't a valid Pakistani mobile. */
export function normalizePhone(raw: string): string | null {
  const d = raw.replace(/[\s-]/g, '')
  if (/^03\d{9}$/.test(d)) return '+92' + d.slice(1)
  if (/^\+923\d{9}$/.test(d)) return d
  if (/^923\d{9}$/.test(d)) return '+' + d
  return null
}

export function displayPhone(p: string) {
  if (!p) return '—'
  const local = '0' + p.slice(3)
  return `${local.slice(0, 4)} ${local.slice(4)}`
}

/** Demo only: a real back end hashes with a slow, salted algorithm on the server. */
export async function hashPassword(password: string) {
  const bytes = new TextEncoder().encode('weftex-demo:' + password)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

/* ------------------------------------------------------------------ */
/* Seed: the GH Weaving demo business and one Weftex admin             */
/* ------------------------------------------------------------------ */

/** Demo sign-in details, shown in the demo boxes on the login pages. */
export const DEMO_OWNER = { email: 'demo@ghweaving.com', password: 'demo123' }
export const DEMO_POLY_OWNER = { email: 'demo@alnoorpolypack.com', password: 'demo123' }
export const DEMO_ADMIN = { email: 'admin@weftex.pk', password: 'admin123' }

export async function seedDb(): Promise<Db> {
  const businessId = 'biz-ghw'
  const roles = seedRoles(businessId, 'weaving')
  const roleId = (key: string) => roles.find((r) => r.systemKey === key)!.id
  const ownerHash = await hashPassword(DEMO_OWNER.password)
  const now = new Date().toISOString()

  const person = (
    id: string,
    first: string,
    last: string,
    role: string,
    phone: string,
    lastActive: string,
    extra: Partial<Account> = {},
  ): Account => ({
    id,
    businessId,
    firstName: first,
    lastName: last,
    email: `${first.toLowerCase()}@ghweaving.com`,
    phone: normalizePhone(phone) ?? '',
    passwordHash: '',
    phoneVerified: true,
    emailVerified: true,
    roleId: roleId(role),
    factoryIds: ['ghw-fsd'],
    canSignIn: true,
    status: 'Active',
    language: 'English',
    lastActive,
    createdAt: now,
    ...extra,
  })

  const accounts: Account[] = [
    person('U-01', 'Ahmed', 'Hassan', 'owner', '0300 8654221', 'Just now', { email: DEMO_OWNER.email, passwordHash: ownerHash, factoryIds: 'all' }),
    person('U-02', 'Kamran', 'Saeed', 'tm', '0333 7781452', '4 min ago', { factoryIds: 'all' }),
    person('U-03', 'Muhammad', 'Tariq', 'mechanics', '0345 2230119', '1 min ago'),
    person('U-04', 'Naeem', 'Akhtar', 'yarn-manager', '0300 1123567', '25 min ago', { factoryIds: 'all' }),
    person('U-05', 'Zahid', 'Mehmood', 'fabric-manager', '0301 4456870', 'Yesterday'),
    person('U-06', 'Sana', 'Iqbal', 'accountant', '0322 5543210', '40 min ago', { factoryIds: 'all' }),
    person('U-07', 'Abdul', 'Rehman', 'beam-gater', '0312 9087334', '6 hours ago'),
    person('U-08', 'Hamid', 'Raza', 'supervisor', '0321 6612908', '12 min ago', {
      supervisorPerms: { yarnInventory: VA, production: VA },
      supervisorSeeMoney: false,
    }),
    person('U-09', 'Farhan', 'Ali', 'supervisor', '0333 6678901', '2 hours ago', {
      supervisorPerms: { yarnInventory: V, salesOrders: V },
      supervisorSeeMoney: true,
    }),
    person('U-10', 'Riaz', 'Ahmed', 'security-guard', '0315 3349778', '—', { status: 'Invited' }),
    person('U-11', 'Ghulam', 'Abbas', 'rewinder', '0302 7712004', '3 hours ago'),
    person('U-12', 'Muhammad', 'Imran', 'weaver', '', '—', { email: '', canSignIn: false }),
    person('U-13', 'Ali', 'Raza', 'weaver', '', '—', { email: '', canSignIn: false }),
  ]

  const business: Business = {
    id: businessId,
    name: 'GH Weaving Mills',
    type: 'weaving',
    rawUnit: 'Bags',
    productUnit: 'Meters',
    names: { rawMaterial: 'Yarn', finishedGoods: 'Fabric', machines: 'Looms' },
    status: 'Active',
    ownerId: 'U-01',
    factories: [
      { id: 'ghw-fsd', name: 'GH Weaving Factory', city: 'Faisalabad' },
      { id: 'ghw-krw', name: 'GH Weaving Unit 2', city: 'Khurrianwala' },
    ],
    hasRecords: true,
    ntn: '4217893-6',
    strn: '32-77-8761-492-14',
    createdAt: '2026-09-01T09:00:00.000Z',
    audit: [{ at: '2026-09-01T11:30:00.000Z', by: 'Weftex admin', action: 'Approved' }],
  }

  const poly = await seedPolyBusiness()

  return {
    version: 1,
    businesses: [business, poly.business],
    accounts: [...accounts, ...poly.accounts],
    roles: [...roles, ...poly.roles],
    admins: [{ id: 'A-01', name: 'Weftex Admin', email: DEMO_ADMIN.email, phone: '+923001234567', passwordHash: await hashPassword(DEMO_ADMIN.password) }],
    signups: [],
    failedLogins: {},
  }
}

/** The Poly bag manufacturing demo business: extruders, circular looms, printing and cutting & sealing (2.3). */
export async function seedPolyBusiness(): Promise<{ business: Business; accounts: Account[]; roles: Role[] }> {
  const businessId = 'biz-poly'
  const roles = seedRoles(businessId, 'polybag')
  const roleId = (key: string) => roles.find((r) => r.systemKey === key)!.id
  const ownerHash = await hashPassword(DEMO_POLY_OWNER.password)
  const now = new Date().toISOString()

  const person = (id: string, first: string, last: string, role: string, phone: string, lastActive: string, extra: Partial<Account> = {}): Account => ({
    id,
    businessId,
    firstName: first,
    lastName: last,
    email: `${first.toLowerCase()}@alnoorpolypack.com`,
    phone: normalizePhone(phone) ?? '',
    passwordHash: '',
    phoneVerified: true,
    emailVerified: true,
    roleId: roleId(role),
    factoryIds: ['anp-lhr'],
    canSignIn: true,
    status: 'Active',
    language: 'English',
    lastActive,
    createdAt: now,
    ...extra,
  })

  const accounts: Account[] = [
    person('P-01', 'Bilal', 'Ahmed', 'owner', '0300 4412873', 'Just now', { email: DEMO_POLY_OWNER.email, passwordHash: ownerHash, factoryIds: 'all' }),
    person('P-02', 'Shahid', 'Mehmood', 'tm', '0333 4127790', '6 min ago'),
    person('P-03', 'Javed', 'Iqbal', 'mechanics', '0345 8810234', '20 min ago'),
    person('P-04', 'Arif', 'Hussain', 'store-manager', '0301 7765123', '15 min ago'),
    person('P-05', 'Nadeem', 'Abbas', 'finished-goods-manager', '0321 9934410', '1 hour ago'),
    person('P-06', 'Ayesha', 'Khan', 'accountant', '0322 4419087', '35 min ago'),
    person('P-07', 'Usman', 'Ghani', 'supervisor', '0312 5501276', '2 hours ago', { supervisorPerms: { production: VA, downtime: VA }, supervisorSeeMoney: false }),
    person('P-08', 'Sher', 'Khan', 'security-guard', '0315 2298441', '—', { status: 'Invited' }),
    person('P-09', 'Imran', 'Ali', 'machine-operator', '', '—', { email: '', canSignIn: false }),
    person('P-10', 'Waqar', 'Younis', 'machine-operator', '', '—', { email: '', canSignIn: false }),
  ]

  const business: Business = {
    id: businessId,
    name: 'Al-Noor Poly Pack',
    type: 'polybag',
    rawUnit: 'Kg',
    productUnit: 'Bags',
    names: { rawMaterial: 'Granules', finishedGoods: 'Bags', machines: 'Machines' },
    status: 'Active',
    ownerId: 'P-01',
    factories: [{ id: 'anp-lhr', name: 'Al-Noor Poly Pack', city: 'Lahore' }],
    hasRecords: true,
    ntn: '7781204-3',
    strn: '03-11-9876-221-55',
    createdAt: '2026-09-05T09:00:00.000Z',
    audit: [{ at: '2026-09-06T10:15:00.000Z', by: 'Weftex admin', action: 'Approved' }],
  }

  return { business, accounts, roles }
}
