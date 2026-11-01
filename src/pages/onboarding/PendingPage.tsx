import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Ban, Clock3, LifeBuoy, PencilLine, RotateCcw, XCircle } from 'lucide-react'
import { AuthShell } from '@/components/auth/AuthShell'
import { Badge, Button, DetailItem, useToast } from '@/components/ui'
import { useAccount } from '@/context/Account'
import { businessTypeLabel, displayPhone } from '@/data/account'

/** PRD 2.7 — replaces every page after sign-in until the business is Active. */
export default function PendingPage() {
  const { ready, me, business, signOut, resubmit, landingFor } = useAccount()
  const navigate = useNavigate()
  const toast = useToast()

  if (!ready) return null
  if (!me) return <Navigate to="/login" replace />
  const landing = landingFor(me)
  if (landing !== '/pending') return <Navigate to={landing} replace />
  if (!business) return null

  const isOwner = business.ownerId === me.id
  const status = business.status
  const support = () => toast.info('Weftex support', 'Call or WhatsApp 0300 0000000, 9am – 7pm. (Demo contact)')

  return (
    <AuthShell
      width="max-w-[560px]"
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
      {status === 'Pending approval' && (
        <>
          <span className="grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-600">
            <Clock3 className="size-6" />
          </span>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <h1 className="text-[24px] font-semibold text-slate-900">Waiting for approval</h1>
            <Badge tone="amber" dot>
              Pending approval
            </Badge>
          </div>
          <p className="mt-2 text-[14.5px] leading-relaxed text-slate-600">
            Thanks for signing up. Weftex is reviewing <b>{business.name}</b>. This usually takes one working day; we'll send you an SMS and an email when it's approved.
          </p>
        </>
      )}

      {status === 'Rejected' && (
        <>
          <span className="grid size-12 place-items-center rounded-2xl bg-rose-50 text-rose-600">
            <XCircle className="size-6" />
          </span>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <h1 className="text-[24px] font-semibold text-slate-900">We couldn't approve {business.name}</h1>
            <Badge tone="red" dot>
              Rejected
            </Badge>
          </div>
          <div className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-[13.5px] text-rose-800 ring-1 ring-rose-600/15">
            <p className="font-semibold">Reason from Weftex</p>
            <p className="mt-0.5">{business.statusReason || '—'}</p>
          </div>
          <p className="mt-3 text-[13.5px] text-slate-600">Correct your details and submit again, or contact Weftex support.</p>
        </>
      )}

      {status === 'Suspended' && (
        <>
          <span className="grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-600">
            <Ban className="size-6" />
          </span>
          <h1 className="mt-4 text-[24px] font-semibold text-slate-900">This business is suspended.</h1>
          <p className="mt-2 text-[14.5px] text-slate-600">Contact Weftex support.</p>
          {business.statusReason && <p className="mt-2 text-[13px] text-slate-500">Reason: {business.statusReason}</p>}
        </>
      )}

      <div className="mt-6 grid gap-4 rounded-xl border border-line bg-slate-50/60 p-4 sm:grid-cols-2">
        <DetailItem label="Business" value={business.name} />
        <DetailItem label="Business type" value={businessTypeLabel(business)} />
        <DetailItem label="Units" value={`${business.rawUnit} → ${business.productUnit}`} />
        <DetailItem label="First factory" value={`${business.factories[0]?.name}, ${business.factories[0]?.city}`} />
        <DetailItem label="Owner" value={`${me.firstName} ${me.lastName}`} />
        <DetailItem label="Phone" value={displayPhone(me.phone)} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {isOwner && status !== 'Suspended' && (
          <Button variant={status === 'Rejected' ? 'secondary' : 'primary'} icon={<PencilLine className="size-4" />} onClick={() => navigate('/onboarding')}>
            Edit details
          </Button>
        )}
        {isOwner && status === 'Rejected' && (
          <Button
            variant="primary"
            icon={<RotateCcw className="size-4" />}
            onClick={() => {
              resubmit()
              toast.success('Submitted again.', 'Weftex will review your business.')
            }}
          >
            Submit again
          </Button>
        )}
        {status !== 'Pending approval' && (
          <Button variant="secondary" icon={<LifeBuoy className="size-4" />} onClick={support}>
            Contact Weftex support
          </Button>
        )}
      </div>

      {status === 'Pending approval' && (
        <p className="mt-6 rounded-xl border border-dashed border-brand-200 bg-brand-50/50 px-4 py-3 text-[13px] text-slate-600">
          <b className="text-brand-800">Trying the demo?</b> Approve this business yourself: open the{' '}
          <Link to="/admin/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Weftex admin area
          </Link>{' '}
          (demo admin details are shown there), approve it, then come back and sign in again.
        </p>
      )}
    </AuthShell>
  )
}
