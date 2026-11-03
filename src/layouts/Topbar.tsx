import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Building2, Check, ChevronDown, CircleHelp, LogOut, Menu, Search, Settings, User, AlertTriangle, CheckCircle2, Info, OctagonAlert, BookOpen, MessageCircle, PlayCircle } from 'lucide-react'
import { useApp } from '@/context/AppState'
import { useToast } from '@/components/ui'
import { useAccount } from '@/context/Account'
import { useClickOutside } from '@/hooks/useClickOutside'
import { cn } from '@/utils/format'
import { GlobalSearch } from './GlobalSearch'
import type { AppNotification } from '@/types'
import { TERMS } from '@/data/dataset'

function Dropdown({ open, onClose, children, className }: { open: boolean; onClose: () => void; children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, onClose, open)
  if (!open) return null
  return (
    <div ref={ref} className={cn('absolute top-full right-0 z-40 mt-2 animate-pop-in rounded-2xl border border-line bg-white shadow-pop', className)}>
      {children}
    </div>
  )
}

const TONE_ICON: Record<AppNotification['tone'], React.ReactNode> = {
  danger: <OctagonAlert className="size-4 text-rose-600" />,
  warning: <AlertTriangle className="size-4 text-amber-600" />,
  info: <Info className="size-4 text-sky-600" />,
  success: <CheckCircle2 className="size-4 text-emerald-600" />,
}
const TONE_BG: Record<AppNotification['tone'], string> = {
  danger: 'bg-rose-50',
  warning: 'bg-amber-50',
  info: 'bg-sky-50',
  success: 'bg-emerald-50',
}

export function Topbar({ onOpenMobile }: { onOpenMobile: () => void }) {
  const navigate = useNavigate()
  const toast = useToast()
  const { notifications, markRead, markAllRead } = useApp()
  const { me, role, business, signOut } = useAccount()
  const factories = (business?.factories ?? []).filter((f) => me?.factoryIds === 'all' || me?.factoryIds.includes(f.id))
  const user = {
    name: `${me?.firstName ?? ''} ${me?.lastName ?? ''}`.trim(),
    firstName: me?.firstName ?? '',
    initials: `${me?.firstName?.[0] ?? ''}${me?.lastName?.[0] ?? ''}`.toUpperCase(),
    role: role?.name ?? '',
    email: me?.email || me?.phone || '',
  }
  const [menu, setMenu] = useState<'factory' | 'notifications' | 'help' | 'user' | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const close = useCallback(() => setMenu(null), [])
  const unread = notifications.filter((n) => !n.read).length
  const toggle = (m: NonNullable<typeof menu>) => setMenu((x) => (x === m ? null : m))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      } else if (e.key === '/' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement)) {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/85 backdrop-blur-md" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button onClick={onOpenMobile} className="-ml-1 rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open menu">
          <Menu className="size-5" />
        </button>

        {/* Factory selector */}
        <div className="relative">
          <button onClick={() => toggle('factory')} className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-left hover:bg-slate-100">
            <span className="hidden size-9 place-items-center rounded-lg bg-slate-100 text-slate-600 sm:grid">
              <Building2 className="size-[18px]" />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold whitespace-nowrap text-slate-900">{factories[0]?.name}</span>
              <span className="block text-xs text-slate-500">{business?.name} · {factories[0]?.city}</span>
            </span>
            <ChevronDown className="size-4 text-slate-400" />
          </button>
          <Dropdown open={menu === 'factory'} onClose={close} className="right-auto left-0 w-72 p-2">
            <p className="px-3 pt-2 pb-1.5 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Your factories</p>
            {factories.map((f, i) => (
              <button
                key={f.id}
                onClick={() => {
                  close()
                  if (i > 0) toast.demo(`Switching to ${f.name} is available in the production version (multi-factory).`)
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-slate-50"
              >
                <span className={cn('grid size-9 place-items-center rounded-lg', i === 0 ? 'bg-brand-50 text-brand-600' : 'bg-slate-100 text-slate-500')}>
                  <Building2 className="size-[18px]" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium text-slate-900">{f.name}</span>
                  <span className="block text-xs text-slate-500">
                    {f.city}
                  </span>
                </span>
                {i === 0 && <Check className="size-4 text-brand-600" />}
              </button>
            ))}
          </Dropdown>
        </div>

        {/* Search */}
        <button
          onClick={() => setSearchOpen(true)}
          className="ml-auto flex h-10 items-center gap-2.5 rounded-xl border border-line bg-slate-50/80 px-3 text-sm text-slate-400 transition-colors hover:border-line-strong hover:bg-white md:ml-6 md:w-64 lg:w-80 xl:w-96"
          aria-label="Search"
        >
          <Search className="size-4" />
          <span className="hidden truncate md:inline">Search {TERMS.machines.toLowerCase()}, {TERMS.raw.toLowerCase()}, orders…</span>
          <kbd className="ml-auto hidden rounded-md border border-line bg-white px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap text-slate-400 lg:inline">Ctrl K</kbd>
        </button>

        <div className="flex items-center gap-1 md:ml-auto">
          <span className="mr-2 hidden items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-amber-700 xl:inline-flex">
            <span className="size-1.5 animate-pulse rounded-full bg-amber-500" />
            DEMO MODE
          </span>

          {/* Help */}
          <div className="relative hidden sm:block">
            <button onClick={() => toggle('help')} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700" aria-label="Help">
              <CircleHelp className="size-5" />
            </button>
            <Dropdown open={menu === 'help'} onClose={close} className="w-64 p-2">
              {[
                { icon: PlayCircle, label: 'Product walkthrough', body: 'Guided tour of the demo' },
                { icon: BookOpen, label: 'Help centre', body: 'Guides in Urdu & English' },
                { icon: MessageCircle, label: 'WhatsApp support', body: '+92 300 0000 000' },
              ].map((h) => (
                <button
                  key={h.label}
                  onClick={() => {
                    close()
                    toast.demo()
                  }}
                  className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-slate-50"
                >
                  <h.icon className="mt-0.5 size-[18px] text-slate-500" />
                  <span>
                    <span className="block text-sm font-medium text-slate-900">{h.label}</span>
                    <span className="block text-xs text-slate-500">{h.body}</span>
                  </span>
                </button>
              ))}
            </Dropdown>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button onClick={() => toggle('notifications')} className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700" aria-label={`Notifications (${unread} unread)`}>
              <Bell className="size-5" />
              {unread > 0 && <span className="absolute top-1 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">{unread}</span>}
            </button>
            <Dropdown open={menu === 'notifications'} onClose={close} className="w-[min(400px,calc(100vw-2rem))] -mr-12 sm:mr-0">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">Notifications</p>
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-[13px] font-medium text-brand-600 hover:text-brand-700">
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="scrollbar-thin max-h-[60vh] overflow-y-auto p-2">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      markRead(n.id)
                      close()
                      navigate(n.to)
                    }}
                    className="flex w-full gap-3 rounded-xl px-3 py-3 text-left hover:bg-slate-50"
                  >
                    <span className={cn('grid size-8 shrink-0 place-items-center rounded-lg', TONE_BG[n.tone])}>{TONE_ICON[n.tone]}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className={cn('text-sm text-slate-900', !n.read && 'font-semibold')}>{n.title}</span>
                        {!n.read && <span className="size-1.5 rounded-full bg-brand-500" />}
                      </span>
                      <span className="mt-0.5 block text-[13px] leading-5 text-slate-600">{n.body}</span>
                      <span className="mt-1 block text-xs text-slate-400">{n.time}</span>
                    </span>
                  </button>
                ))}
              </div>
            </Dropdown>
          </div>

          {/* User */}
          <div className="relative ml-1">
            <button onClick={() => toggle('user')} className="flex items-center gap-2 rounded-xl py-1 pr-2 pl-1 hover:bg-slate-100">
              <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-semibold text-white">{user.initials}</span>
              <span className="hidden text-left leading-tight md:block">
                <span className="block text-sm font-semibold text-slate-900">{user.firstName}</span>
                <span className="block text-xs text-slate-500">{user.role}</span>
              </span>
              <ChevronDown className="hidden size-4 text-slate-400 md:block" />
            </button>
            <Dropdown open={menu === 'user'} onClose={close} className="w-60 p-2">
              <div className="border-b border-line px-3 pt-2 pb-3">
                <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              <div className="pt-1">
                {[
                  { icon: User, label: 'My profile', onClick: () => toast.demo() },
                  { icon: Settings, label: 'Settings', onClick: () => navigate('/settings') },
                ].map((i) => (
                  <button
                    key={i.label}
                    onClick={() => {
                      close()
                      i.onClick()
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <i.icon className="size-4 text-slate-500" />
                    {i.label}
                  </button>
                ))}
                <button
                  onClick={() => {
                    close()
                    signOut()
                    navigate('/login')
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="size-4" />
                  Sign out
                </button>
              </div>
            </Dropdown>
          </div>
        </div>
      </div>
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  )
}
