import { useCallback, useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useApp } from '@/context/AppState'
import { cn } from '@/utils/format'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

const COLLAPSE_KEY = 'ghw-sidebar-collapsed'

export function AppLayout() {
  const { isAuthed } = useApp()
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1'
    } catch {
      return false
    }
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const closeMobile = useCallback(() => setMobileOpen(false), [])

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [collapsed])

  useEffect(() => window.scrollTo(0, 0), [pathname])

  if (!isAuthed) return <Navigate to="/login" replace state={{ from: pathname }} />

  return (
    <div className="min-h-screen">
      <Sidebar collapsed={collapsed} onToggleCollapsed={() => setCollapsed((c) => !c)} mobileOpen={mobileOpen} onCloseMobile={closeMobile} />
      <div className={cn('flex min-h-screen flex-col transition-[padding] duration-200', collapsed ? 'lg:pl-[76px]' : 'lg:pl-[264px]')}>
        <Topbar onOpenMobile={() => setMobileOpen(true)} />
        <main key={pathname} className="mx-auto w-full max-w-[1600px] flex-1 animate-fade-in px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-4 text-xs text-slate-400 sm:px-6 lg:px-8">
          <span>© 2026 GH Weaving · Weaving Factory Management System</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-amber-500" />
            Demo mode · sample data for a Faisalabad weaving unit
          </span>
        </footer>
      </div>
    </div>
  )
}
