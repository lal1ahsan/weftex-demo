import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronDown, ChevronsLeft, ChevronsRight, LifeBuoy, X } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { activeLeaf, navFor, type NavItem } from '@/routes/nav'
import { useAccount } from '@/context/Account'
import { cn } from '@/utils/format'

interface SidebarProps {
  collapsed: boolean
  onToggleCollapsed: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function Sidebar({ collapsed, onToggleCollapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  const { pathname } = useLocation()
  const active = activeLeaf(pathname)

  useEffect(() => onCloseMobile(), [pathname, onCloseMobile])

  return (
    <>
      {/* Desktop */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden flex-col bg-ink-900 transition-[width] duration-200 lg:flex',
          collapsed ? 'w-[76px]' : 'w-[264px]',
        )}
      >
        <SidebarContent collapsed={collapsed} active={active} />
        <div className="border-t border-white/5 p-3">
          <button
            onClick={onToggleCollapsed}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-400 hover:bg-white/5 hover:text-white"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronsRight className="mx-auto size-[18px]" /> : <ChevronsLeft className="size-[18px]" />}
            {!collapsed && 'Collapse'}
          </button>
        </div>
      </aside>

      {/* Mobile / tablet drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-ink-950/50" onClick={onCloseMobile} />
          <aside className="relative flex h-full w-[280px] max-w-[85vw] animate-slide-in flex-col bg-ink-900 shadow-2xl">
            <button onClick={onCloseMobile} className="absolute top-5 right-3 z-10 rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white" aria-label="Close menu">
              <X className="size-5" />
            </button>
            <SidebarContent collapsed={false} active={active} />
          </aside>
        </div>
      )}
    </>
  )
}

function SidebarContent({ collapsed, active }: { collapsed: boolean; active?: string }) {
  const { business, profile, can, isOwner } = useAccount()
  const NAV = navFor(business?.type ?? 'weaving', profile, (m) => can(m), isOwner)
  const groupOf = (to?: string) => NAV.find((n) => n.children?.some((c) => c.to === to))?.label
  const [open, setOpen] = useState<string | undefined>(() => groupOf(active))

  useEffect(() => {
    const g = groupOf(active)
    if (g) setOpen(g)
  }, [active])

  return (
    <>
      <div className={cn('flex h-16 shrink-0 items-center', collapsed ? 'justify-center' : 'px-5')}>
        <Link to="/" aria-label="Weftex — Dashboard">
          <Logo dark compact={collapsed} />
        </Link>
      </div>
      <nav className="sidebar-scroll flex-1 overflow-y-auto px-3 pt-2 pb-4">
        <ul className="space-y-0.5">
          {NAV.map((item) => (
            <NavRow
              key={item.label}
              item={item}
              collapsed={collapsed}
              active={active}
              open={open === item.label}
              onToggle={() => setOpen((o) => (o === item.label ? undefined : item.label))}
            />
          ))}
        </ul>
      </nav>
      {!collapsed && (
        <div className="mx-3 mb-3 hidden rounded-xl border border-white/5 bg-white/[0.03] p-3.5 [@media(min-height:1000px)]:block">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-white">
            <LifeBuoy className="size-4 text-brand-300" />
            Support · 9am – 7pm
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">Urdu & English support for your factory team.</p>
        </div>
      )}
    </>
  )
}

function NavRow({ item, collapsed, active, open, onToggle }: { item: NavItem; collapsed: boolean; active?: string; open: boolean; onToggle: () => void }) {
  const Icon = item.icon
  const isActive = item.to ? active === item.to : !!item.children?.some((c) => c.to === active)

  const rowClass = cn(
    'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors',
    collapsed && 'justify-center px-0',
    isActive ? 'text-white' : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100',
    isActive && (collapsed || item.to) && 'bg-white/[0.07]',
  )
  const indicator = isActive && (collapsed || item.to) && <span className="absolute top-1.5 bottom-1.5 left-0 w-[3px] rounded-r bg-brand-400" />
  const tip = collapsed && (
    <span className="pointer-events-none absolute left-full z-50 ml-3 rounded-md bg-ink-700 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
      {item.label}
    </span>
  )

  if (item.to || collapsed) {
    return (
      <li>
        <Link to={item.to ?? item.children![0].to} className={rowClass}>
          {indicator}
          <Icon className={cn('size-[18px] shrink-0', isActive ? 'text-brand-300' : 'text-slate-500 group-hover:text-slate-300')} />
          {!collapsed && item.label}
          {tip}
        </Link>
      </li>
    )
  }

  return (
    <li>
      <button onClick={onToggle} className={rowClass} aria-expanded={open}>
        <Icon className={cn('size-[18px] shrink-0', isActive ? 'text-brand-300' : 'text-slate-500 group-hover:text-slate-300')} />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown className={cn('size-4 text-slate-500 transition-transform', open && 'rotate-180')} />
      </button>
      <div className={cn('grid transition-[grid-template-rows] duration-200', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
        <div className="overflow-hidden">
          <ul className="relative mt-0.5 mb-1 ml-[21px] space-y-0.5 border-l border-white/[0.08] pl-3">
            {item.children!.map((c) => (
              <li key={c.to}>
                <Link
                  to={c.to}
                  className={cn(
                    'block rounded-md px-3 py-1.5 text-[13px] transition-colors',
                    active === c.to ? 'bg-white/[0.07] font-medium text-white' : 'text-slate-400 hover:text-slate-100',
                  )}
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </li>
  )
}
