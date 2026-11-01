import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, Lock, Mail, ShieldCheck } from 'lucide-react'
import { AuthShell, DemoSms } from '@/components/auth/AuthShell'
import { Button, Field, Input } from '@/components/ui'
import { useAccount } from '@/context/Account'
import { DEMO_ADMIN, displayPhone, type Admin } from '@/data/account'

/** PRD 2.7 — Weftex staff only; password plus a 6-digit SMS code every time. */
export default function AdminLoginPage() {
  const { ready, admin, adminCheckPassword, otp, sendOtp, checkOtp } = useAccount()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [pending, setPending] = useState<Admin | null>(null)
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)

  if (ready && admin) return <Navigate to="/admin/businesses" replace />

  const submitPassword = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) return setError('Enter your email and password')
    setLoading(true)
    const a = await adminCheckPassword(email, password)
    setLoading(false)
    if (!a) return setError('Email or password is incorrect.')
    setError(undefined)
    setPending(a)
    sendOtp('admin', a.id)
  }

  const submitCode = (e: FormEvent) => {
    e.preventDefault()
    const res = checkOtp(code)
    if (!res.ok) return setError(res.error)
    navigate('/admin/businesses', { replace: true })
  }

  return (
    <AuthShell aside={<span className="rounded-full bg-ink-900 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white uppercase">Weftex admin</span>}>
      <span className="grid size-12 place-items-center rounded-2xl bg-ink-900 text-white">
        <ShieldCheck className="size-6" />
      </span>
      <h1 className="mt-4 text-[24px] font-semibold text-slate-900">Weftex admin sign in</h1>
      <p className="mt-1 text-[14px] text-slate-500">For Weftex staff who approve new businesses. Business users sign in on the main page.</p>

      {!pending ? (
        <form onSubmit={submitPassword} className="mt-6 space-y-4" noValidate>
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2.5 text-[13px] text-rose-700 ring-1 ring-rose-600/15">{error}</p>}
          <Field label="Email" htmlFor="aemail">
            <Input id="aemail" type="email" autoComplete="username" icon={<Mail />} value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Password" htmlFor="apass">
            <Input id="apass" type="password" autoComplete="current-password" icon={<Lock />} value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
            Continue <ArrowRight className="size-4" />
          </Button>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-brand-200 bg-brand-50/50 p-3.5 text-[13px]">
            <span className="text-slate-600">
              <b className="text-brand-800">Demo admin</b>
              <span className="block font-mono text-slate-800">{DEMO_ADMIN.email}</span>
              <span className="block font-mono text-slate-800">{DEMO_ADMIN.password}</span>
            </span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setEmail(DEMO_ADMIN.email)
                setPassword(DEMO_ADMIN.password)
                setError(undefined)
              }}
            >
              Use demo
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={submitCode} className="mt-6 space-y-4" noValidate>
          <p className="text-[13.5px] text-slate-600">Enter the 6-digit code sent to {displayPhone(pending.phone)}.</p>
          <Input
            autoFocus
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, ''))
              setError(undefined)
            }}
            error={!!error}
            className="h-12 text-center font-mono text-xl tracking-[0.5em]"
            aria-label="6-digit code"
          />
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <Button type="submit" variant="primary" size="lg" className="w-full">
            Sign in
          </Button>
          {otp?.purpose === 'admin' && <DemoSms to={displayPhone(pending.phone)} code={otp.code} />}
        </form>
      )}

      <p className="mt-6 text-center text-[13px] text-slate-500">
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Back to business sign in
        </Link>
      </p>
    </AuthShell>
  )
}
