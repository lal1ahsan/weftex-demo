import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, BarChart3, Eye, EyeOff, Factory, Lock, Mail, ShieldCheck, Timer, Zap } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { Button, Field, Input, useToast } from '@/components/ui'
import { useApp } from '@/context/AppState'

const DEMO_EMAIL = 'demo@ghweaving.com'
const DEMO_PASSWORD = 'demo123'

export default function LoginPage() {
  const { isAuthed, signIn } = useApp()
  const navigate = useNavigate()
  const toast = useToast()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  if (isAuthed) return <Navigate to="/" replace />

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!email.trim()) next.email = 'Enter your email address'
    else if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'Enter a valid email address'
    if (!password) next.password = 'Enter your password'
    setErrors(next)
    if (Object.keys(next).length) return
    setLoading(true)
    setTimeout(() => {
      signIn()
      const from = (location.state as { from?: string } | null)?.from
      navigate(from && from !== '/login' ? from : '/', { replace: true })
    }, 650)
  }

  const fillDemo = () => {
    setEmail(DEMO_EMAIL)
    setPassword(DEMO_PASSWORD)
    setErrors({})
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Brand panel */}
      <div className="weave-pattern relative hidden w-[46%] max-w-[720px] flex-col justify-between overflow-hidden bg-ink-900 p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -top-40 -right-40 size-[520px] rounded-full bg-brand-600/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-48 -left-32 size-[420px] rounded-full bg-teal-500/10 blur-3xl" />

        <Logo dark className="relative" />

        <div className="relative">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-brand-200">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            Built for weaving factories in Pakistan
          </p>
          <h1 className="max-w-md text-[40px] leading-[1.1] font-semibold tracking-tight">
            Know what every loom produced, consumed and earned.
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-slate-300">
            Loom production, downtime, yarn and fabric stock, costing and energy, all on one screen for the factory owner.
          </p>

          {/* Live preview card */}
          <div className="mt-10 max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Today · Hall A, B, C</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-300">
                <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" /> Live
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-4">
              {[
                { label: 'Production', value: '245,500 m' },
                { label: 'Efficiency', value: '94.4%' },
                { label: 'Looms running', value: '72 / 80' },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-[11px] text-slate-400">{s.label}</p>
                  <p className="mt-1 font-display text-lg font-semibold num">{s.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex h-1.5 overflow-hidden rounded-full bg-white/10">
              <span className="bg-emerald-400" style={{ width: '90%' }} />
              <span className="bg-rose-400" style={{ width: '7.5%' }} />
              <span className="bg-sky-400" style={{ width: '2.5%' }} />
            </div>
          </div>
        </div>

        <div className="relative grid grid-cols-2 gap-x-6 gap-y-3 text-[13px] text-slate-300">
          {[
            { icon: Factory, label: 'Loom-level production' },
            { icon: Timer, label: 'Downtime & breakdowns' },
            { icon: BarChart3, label: 'Cost per meter' },
            { icon: Zap, label: 'Grid & solar energy' },
          ].map((f) => (
            <span key={f.label} className="flex items-center gap-2">
              <f.icon className="size-4 text-brand-300" />
              {f.label}
            </span>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-[400px]">
            <Logo className="mb-10 lg:hidden" />
            <h2 className="text-[28px] font-semibold text-slate-900">Welcome back</h2>
            <p className="mt-1.5 text-[15px] text-slate-500">Sign in to the GH Weaving factory management system.</p>

            <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
              <Field label="Email" htmlFor="email" error={errors.email}>
                <Input id="email" type="email" autoComplete="email" icon={<Mail />} placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} error={!!errors.email} className="h-11" />
              </Field>
              <Field label="Password" htmlFor="password" error={errors.password}>
                <div className="relative">
                  <Input
                    id="password"
                    type={show ? 'text' : 'password'}
                    autoComplete="current-password"
                    icon={<Lock />}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={!!errors.password}
                    className="h-11 pr-11"
                  />
                  <button type="button" onClick={() => setShow((s) => !s)} className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-slate-600" aria-label={show ? 'Hide password' : 'Show password'}>
                    {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </Field>
              <div className="flex items-center justify-between text-[13px]">
                <label className="flex items-center gap-2 text-slate-600">
                  <input type="checkbox" defaultChecked className="size-4 rounded border-slate-300 accent-brand-600" />
                  Keep me signed in
                </label>
                <button type="button" onClick={() => toast.demo('Password reset is available in the production version.')} className="font-medium text-brand-600 hover:text-brand-700">
                  Forgot password?
                </button>
              </div>
              <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
                {loading ? 'Signing in…' : 'Sign In'}
                {!loading && <ArrowRight className="size-4" />}
              </Button>
            </form>

            <div className="mt-8 rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] font-semibold text-brand-800">Demo Account</p>
                  <dl className="mt-2 space-y-1 text-[13px] text-slate-600">
                    <div className="flex gap-2">
                      <dt className="w-16 text-slate-500">Email</dt>
                      <dd className="font-mono font-medium text-slate-800">{DEMO_EMAIL}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-16 text-slate-500">Password</dt>
                      <dd className="font-mono font-medium text-slate-800">{DEMO_PASSWORD}</dd>
                    </div>
                  </dl>
                </div>
                <Button size="sm" variant="secondary" onClick={fillDemo}>
                  Use demo
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 px-6 pb-6 text-xs text-slate-400 sm:px-10">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5" /> Interactive product demo · sample data only
          </span>
          <span>© 2026 GH Weaving</span>
        </div>
      </div>
    </div>
  )
}
