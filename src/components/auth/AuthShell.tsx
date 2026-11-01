import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { cn } from '@/utils/format'

/** Centered card used by sign-up, phone check, onboarding and the waiting page. */
export function AuthShell({ children, width = 'max-w-[460px]', aside }: { children: ReactNode; width?: string; aside?: ReactNode }) {
  return (
    <div className="weave-pattern-light flex min-h-screen flex-col bg-canvas">
      <header className="flex h-16 items-center justify-between px-4 sm:px-8">
        <Link to="/login" aria-label="Weftex — Sign in">
          <Logo />
        </Link>
        {aside}
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-6 sm:items-center sm:py-10">
        <div className={cn('w-full animate-pop-in rounded-2xl border border-line bg-white p-6 shadow-pop sm:p-8', width)}>{children}</div>
      </main>
      <footer className="flex flex-wrap items-center justify-between gap-2 px-4 pb-6 text-xs text-slate-400 sm:px-8">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="size-3.5" /> Interactive product demo · accounts are stored in this browser only
        </span>
        <span>© 2026 Weftex</span>
      </footer>
    </div>
  )
}

/** Demo-only box standing in for an SMS that a real back end would send. */
export function DemoSms({ to, code }: { to: string; code: string }) {
  return (
    <div className="mt-5 rounded-xl border border-dashed border-brand-200 bg-brand-50/60 p-3.5 text-[13px] text-slate-600">
      <p className="font-semibold text-brand-800">Demo SMS to {to}</p>
      <p className="mt-1">
        Your Weftex code is <span className="font-mono text-[15px] font-semibold tracking-widest text-slate-900">{code}</span>. It expires in 10 minutes.
      </p>
    </div>
  )
}
