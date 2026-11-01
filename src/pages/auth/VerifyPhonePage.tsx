import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { MessageSquareText } from 'lucide-react'
import { AuthShell, DemoSms } from '@/components/auth/AuthShell'
import { Button, Input, useToast } from '@/components/ui'
import { useAccount } from '@/context/Account'
import { displayPhone } from '@/data/account'

/** PRD 2.4 — "Verify phone": 6 digits, 10 minutes, 5 tries, Resend after 60 seconds. */
export default function VerifyPhonePage() {
  const { ready, me, otp, sendOtp, checkOtp, signOut, landingFor } = useAccount()
  const navigate = useNavigate()
  const toast = useToast()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string>()
  const [now, setNow] = useState(Date.now())

  const needsCode = !!me && !me.phoneVerified && (!otp || otp.purpose !== 'phone' || otp.targetId !== me.id)
  useEffect(() => {
    if (needsCode) sendOtp('phone', me!.id)
  }, [needsCode, sendOtp, me])

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  if (!ready) return null
  if (!me) return <Navigate to="/signup" replace />
  if (me.phoneVerified) return <Navigate to={landingFor(me)} replace />

  const wait = otp ? Math.max(0, 60 - Math.floor((now - otp.sentAt) / 1000)) : 0

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!/^\d{6}$/.test(code)) return setError('Enter the 6-digit code')
    const res = checkOtp(code)
    if (!res.ok) return setError(res.error)
    toast.success('Phone number verified.')
    navigate('/onboarding', { replace: true })
  }

  return (
    <AuthShell
      aside={
        <button
          onClick={() => {
            signOut()
            navigate('/login')
          }}
          className="text-[13px] font-medium text-slate-500 hover:text-slate-800"
        >
          Sign out
        </button>
      }
    >
      <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
        <MessageSquareText className="size-6" />
      </span>
      <h1 className="mt-4 text-[24px] font-semibold text-slate-900">Check your phone</h1>
      <p className="mt-1 text-[14.5px] text-slate-500">Enter the 6-digit code sent to {displayPhone(me.phone)}</p>

      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <div>
          <Input
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="••••••"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, ''))
              setError(undefined)
            }}
            error={!!error}
            className="h-12 text-center font-mono text-xl tracking-[0.5em]"
            aria-label="6-digit code"
          />
          {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
        </div>
        <Button type="submit" variant="primary" size="lg" className="w-full">
          Verify
        </Button>
        <p className="text-center text-[13px] text-slate-500">
          Didn't get it?{' '}
          {wait > 0 ? (
            <span>Resend code in {wait}s</span>
          ) : (
            <button
              type="button"
              onClick={() => {
                sendOtp('phone', me.id)
                setCode('')
                setError(undefined)
                toast.info('A new code was sent.')
              }}
              className="font-semibold text-brand-600 hover:text-brand-700"
            >
              Resend code
            </button>
          )}
        </p>
      </form>

      {otp && otp.purpose === 'phone' && <DemoSms to={displayPhone(me.phone)} code={otp.code} />}
    </AuthShell>
  )
}
