import type { LucideIcon } from 'lucide-react'
import { moduleForPath, type BusinessType, type ModuleKey, type TypeProfile } from '@/data/account'
import {
  BarChart3,
  Building2,
  Calculator,
  ClipboardCheck,
  Factory,
  FileBarChart2,
  LayoutDashboard,
  Receipt,
  Settings,
  ShoppingCart,
  Spool,
  Timer,
  Truck,
  Zap,
  Layers,
} from 'lucide-react'

export interface NavLeaf {
  label: string
  to: string
}

export interface NavItem {
  label: string
  icon: LucideIcon
  to?: string
  children?: NavLeaf[]
}

export const NAV: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/' },
  {
    label: 'Factory',
    icon: Building2,
    children: [
      { label: 'Factory Overview', to: '/factory' },
      { label: 'Users', to: '/factory/users' },
      { label: 'Roles', to: '/factory/roles' },
      { label: 'Shifts', to: '/factory/shifts' },
    ],
  },
  {
    label: 'Looms',
    icon: Factory,
    children: [
      { label: 'Loom Dashboard', to: '/looms' },
      { label: 'Looms', to: '/looms/list' },
      { label: 'Loom Status', to: '/looms/status' },
    ],
  },
  {
    label: 'Yarn',
    icon: Spool,
    children: [
      { label: 'Yarn Inventory', to: '/yarn' },
      { label: 'Yarn Purchases', to: '/yarn/purchases' },
      { label: 'Yarn Issues', to: '/yarn/issues' },
    ],
  },
  {
    label: 'Production',
    icon: BarChart3,
    children: [
      { label: 'Production Dashboard', to: '/production' },
      { label: 'Daily Production', to: '/production/daily' },
      { label: 'Production Plans', to: '/production/plans' },
      { label: 'Wastage', to: '/production/wastage' },
    ],
  },
  {
    label: 'Downtime',
    icon: Timer,
    children: [
      { label: 'Downtime Dashboard', to: '/downtime' },
      { label: 'Downtime Records', to: '/downtime/records' },
    ],
  },
  {
    label: 'Fabric',
    icon: Layers,
    children: [
      { label: 'Fabric Inventory', to: '/fabric' },
      { label: 'Rolls', to: '/fabric/rolls' },
    ],
  },
  { label: 'Quality', icon: ClipboardCheck, children: [{ label: 'Quality Inspection', to: '/quality' }] },
  {
    label: 'Sales',
    icon: Truck,
    children: [
      { label: 'Customers', to: '/sales/customers' },
      { label: 'Sales Orders', to: '/sales/orders' },
      { label: 'Dispatch', to: '/sales/dispatch' },
    ],
  },
  {
    label: 'Purchases',
    icon: ShoppingCart,
    children: [
      { label: 'Suppliers', to: '/purchases/suppliers' },
      { label: 'Purchase Orders', to: '/purchases/orders' },
    ],
  },
  { label: 'Expenses', icon: Receipt, to: '/expenses' },
  {
    label: 'Costing',
    icon: Calculator,
    children: [
      { label: 'Production Cost', to: '/costing' },
      { label: 'Cost per Meter', to: '/costing/per-meter' },
    ],
  },
  {
    label: 'Electricity',
    icon: Zap,
    children: [
      { label: 'Grid', to: '/electricity/grid' },
      { label: 'Solar', to: '/electricity/solar' },
    ],
  },
  { label: 'Reports', icon: FileBarChart2, to: '/reports' },
  { label: 'Settings', icon: Settings, to: '/settings' },
]

/**
 * The sidebar for one business and one user (2.3, 3.6): the business type renames
 * menus, and anyone but the Owner only sees the pages their role lets them view.
 */
export function navFor(type: BusinessType, p: TypeProfile, canView: (m: ModuleKey) => boolean, isOwner: boolean): NavItem[] {
  const fg = type === 'weaving' ? 'Rolls' : type === 'polybag' ? 'Bundles' : 'Lots'
  // The business's own names (2.2) rename menus for every type; Weaving's defaults are the menu names themselves.
  const rename: Record<string, string> = {
    Looms: p.machines,
    'Loom Dashboard': `${p.machine} Dashboard`,
    'Loom Status': `${p.machine} Status`,
    Yarn: p.rawMaterial,
    'Yarn Inventory': `${p.rawMaterial} Inventory`,
    'Yarn Purchases': `${p.rawMaterial} Purchases`,
    'Yarn Issues': `${p.rawMaterial} Issues`,
    Fabric: p.finishedGoods,
    'Fabric Inventory': `${p.finishedGoods} Inventory`,
    Rolls: fg,
    'Cost per Meter': type === 'polybag' ? 'Cost per Bag' : 'Cost per Meter',
  }
  const label = (l: string) => rename[l] ?? l
  const allowed = (to: string) => {
    if (isOwner) return true
    const m = moduleForPath(to)
    return !!m && canView(m)
  }
  return NAV.flatMap((item) => {
    if (item.children) {
      const children = item.children.filter((c) => allowed(c.to)).map((c) => ({ ...c, label: label(c.label) }))
      return children.length ? [{ ...item, label: label(item.label), children }] : []
    }
    return allowed(item.to!) ? [{ ...item, label: label(item.label) }] : []
  })
}

/** Is `path` inside the section rooted at `to`? Dashboard ('/') only matches exactly. */
export function isActivePath(path: string, to: string, exact = false) {
  if (to === '/' || exact) return path === to
  return path === to || path.startsWith(to + '/')
}

/** Find the most specific nav leaf for a path — used for active state. */
export function activeLeaf(path: string): string | undefined {
  const leaves = NAV.flatMap((n) => (n.children ? n.children.map((c) => c.to) : n.to ? [n.to] : []))
  return leaves.filter((to) => isActivePath(path, to)).sort((a, b) => b.length - a.length)[0]
}
