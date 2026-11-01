import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Lock, Mail, Smartphone, User } from 'lucide-react'
import { AuthShell } from '@/components/auth/AuthShell'
import { Button, Field, Input } from '@/components/ui'
import { useAccount, type SignUpInput } from '@/context/Account'
import { EMAIL_RE, normalizePhone } from '@/data/account'

type Errors = Partial<Record<keyof SignUpInput | 'confirm' | 'terms' | 'form', string>>

/** PRD 2.4 — the person who signs up becomes the Owner of a new business. */
export default function SignUpPage() {
  const { ready, me, signUp, landingFor } = useAccount()
  const navigate = useNavigate()
  const [f, setF] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirm: '' })
  const [terms, setTerms] = useState(false)
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Errors>({})

  if (ready && me && !loading) return <Navigate to={landingFor(me)} replace />

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setF((x) => ({ ...x, [k]: e.target.value }))
    setErrors((x) => ({ ...x, [k]: undefined, form: undefined }))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next: Errors = {}
    if (!f.firstName.trim()) next.firstName = 'First name is required'
    else if (f.firstName.trim().length > 50) next.firstName = 'Use at most 50 characters'
    if (!f.lastName.trim()) next.lastName = 'Last name is required'
    else if (f.lastName.trim().length > 50) next.lastName = 'Use at most 50 characters'
    if (!f.email.trim()) next.email = 'Email is required'
    else if (!EMAIL_RE.test(f.email.trim())) next.email = 'Enter a valid email address'
    if (!f.phone.trim()) next.phone = 'Phone number is required'
    else if (!normalizePhone(f.phone)) next.phone = 'Enter 11 digits starting with 03'
    if (!f.password) next.password = 'Password is required'
    else if (f.password.length < 8 || !/[a-z]/i.test(f.password) || !/\d/.test(f.password)) next.password = 'Use at least 8 characters, with letters and numbers.'
    if (!f.confirm) next.confirm = 'Confirm your password'
    else if (f.confirm !== f.password) next.confirm = "Passwords don't match."
    if (!terms) next.terms = 'Please agree to the Terms of Service and Privacy Policy'
    setErrors(next)
    if (Object.keys(next).length) return

    setLoading(true)
    const res = await signUp(f)
    if (!res.ok) {
      setLoading(false)
      setErrors(res.errors)
      return
    }
    navigate('/signup/verify', { replace: true })
  }

  return (
    <AuthShell
      width="max-w-[520px]"
      aside={
        <span className="text-[13px] text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </span>
      }
    >
      <h1 className="text-[26px] font-semibold text-slate-900">Create your Weftex account</h1>
      <p className="mt-1 text-[14.5px] text-slate-500">You'll be the Owner of your business. Next, we'll check your phone and set up your business.</p>

      <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
        {errors.form && (
          <p className="rounded-lg bg-rose-50 px-3 py-2.5 text-[13px] text-rose-700 ring-1 ring-rose-600/15" role="alert">
            {errors.form}
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" htmlFor="first" required error={errors.firstName}>
            <Input id="first" autoComplete="given-name" icon={<User />} maxLength={50} value={f.firstName} onChange={set('firstName')} error={!!errors.firstName} />
          </Field>
          <Field label="Last name" htmlFor="last" required error={errors.lastName}>
            <Input id="last" autoComplete="family-name" maxLength={50} value={f.lastName} onChange={set('lastName')} error={!!errors.lastName} />
          </Field>
        </div>
        <Field label="Email" htmlFor="email" required error={errors.email} hint="Personal or business email">
          <Input id="email" type="email" autoComplete="email" icon={<Mail />} placeholder="you@company.com" value={f.email} onChange={set('email')} error={!!errors.email} />
        </Field>
        {errors.email?.includes('already registered') && (
          <p className="-mt-2 text-xs">
            <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
              Go to Sign in
            </Link>
          </p>
        )}
        <Field label="Phone number" htmlFor="phone" required error={errors.phone} hint="We'll send a 6-digit code to this number">
          <Input id="phone" type="tel" inputMode="numeric" autoComplete="tel" icon={<Smartphone />} placeholder="03xx xxxxxxx" value={f.phone} onChange={set('phone')} error={!!errors.phone} />
        </Field>
        <Field label="Password" htmlFor="password" required error={errors.password} hint="At least 8 characters, with letters and numbers">
          <div className="relative">
            <Input id="password" type={show ? 'text' : 'password'} autoComplete="new-password" icon={<Lock />} value={f.password} onChange={set('password')} error={!!errors.password} className="pr-11" />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-slate-600" aria-label={show ? 'Hide password' : 'Show password'}>
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
        <Field label="Confirm password" htmlFor="confirm" required error={errors.confirm}>
          <Input id="confirm" type={show ? 'text' : 'password'} autoComplete="new-password" icon={<Lock />} value={f.confirm} onChange={set('confirm')} error={!!errors.confirm} />
        </Field>
        <div>
          <label className="flex items-start gap-2.5 text-[13px] text-slate-600">
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => {
                setTerms(e.target.checked)
                setErrors((x) => ({ ...x, terms: undefined }))
              }}
              className="mt-0.5 size-4 rounded border-slate-300 accent-brand-600"
            />
            <span>
              I agree to the{' '}
              <a href="#terms" target="_blank" rel="noreferrer" className="font-medium text-brand-600 hover:text-brand-700">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#privacy" target="_blank" rel="noreferrer" className="font-medium text-brand-600 hover:text-brand-700">
                Privacy Policy
              </a>
            </span>
          </label>
          {errors.terms && <p className="mt-1 text-xs text-rose-600">{errors.terms}</p>}
        </div>
        <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
          {loading ? 'Creating account…' : 'Create account'}
          {!loading && <ArrowRight className="size-4" />}
        </Button>
      </form>
    </AuthShell>
  )
}
