import { useCallback, useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Eye, Lock, MailWarning } from 'lucide-react'
import { useAccount } from '@/context/Account'
import { moduleForPath } from '@/data/account'
import { Button, EmptyState, useToast } from '@/components/ui'
import { PageLoader } from '@/components/ui/PageLoader'
import { cn } from '@/utils/format'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

const COLLAPSE_KEY = 'ghw-sidebar-collapsed'

export function AppLayout() {
  const { ready, me, business, role, isOwner, can, landingFor, previewedBy, previewAs, verifyEmail } = useAccount()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const toast = useToast()
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

  // Braces matter: newer Chrome returns a Promise from scrollTo, which React would try to call as a cleanup.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  if (!ready) return <PageLoader />
  if (!me) return <Navigate to="/login" replace state={{ from: pathname }} />
  const landing = landingFor(me)
  if (['/signup/verify', '/onboarding', '/pending'].includes(landing)) return <Navigate to={landing} replace />

  // Every page checks the role, as the server will on every request (3.6, 3.7).
  const module = moduleForPath(pathname)
  const allowed = isOwner || (!!module && can(module))

  return (
    <div className="min-h-screen">
      <Sidebar collapsed={collapsed} onToggleCollapsed={() => setCollapsed((c) => !c)} mobileOpen={mobileOpen} onCloseMobile={closeMobile} />
      <div className={cn('flex min-h-screen flex-col transition-[padding] duration-200', collapsed ? 'lg:pl-[76px]' : 'lg:pl-[264px]')}>
        <Topbar onOpenMobile={() => setMobileOpen(true)} />
        {previewedBy && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-violet-200 bg-violet-50 px-4 py-2.5 text-[13px] text-violet-900 sm:px-6 lg:px-8">
            <span className="inline-flex items-center gap-2">
              <Eye className="size-4" />
              You are seeing Weftex as <b>{me.firstName} {me.lastName}</b> ({role?.name}). Only the menus and pages this role allows are shown.
            </span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                previewAs(null)
                navigate('/factory/users')
              }}
            >
              Back to Owner view
            </Button>
          </div>
        )}
        {!previewedBy && !me.emailVerified && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-[13px] text-amber-900 sm:px-6 lg:px-8">
            <span className="inline-flex items-center gap-2">
              <MailWarning className="size-4" />
              Please verify your email. We sent a link to <b>{me.email}</b>.
            </span>
            <span className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => toast.success('Verification link sent again.', me.email)}>
                Resend link
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  verifyEmail()
                  toast.success('Email verified.')
                }}
              >
                Open link (demo)
              </Button>
            </span>
          </div>
        )}
        <main key={pathname} className="mx-auto w-full max-w-[1600px] flex-1 animate-fade-in px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {allowed ? (
            <Outlet />
          ) : (
            <EmptyState
              icon={<Lock />}
              title="You don't have permission for this."
              body={module ? 'Your role does not include this page. Ask the business owner if you need it.' : 'Only the business owner can open this page.'}
              action={
                landing !== '/no-access' && (
                <Button variant="primary" onClick={() => navigate(landing)}>
                  Go to my home page
                </Button>
                )
              }
            />
          )}
        </main>
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-4 text-xs text-slate-400 sm:px-6 lg:px-8">
          <span>
            © 2026 Weftex · {business?.name}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-amber-500" />
            Demo mode · screens show sample data
          </span>
        </footer>
      </div>
    </div>
  )
}
