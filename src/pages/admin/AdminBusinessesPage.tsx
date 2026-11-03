import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { BadgeCheck, Ban, Building2, CheckCircle2, LogOut, RotateCcw, XCircle } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { Button, Card, DataTable, DetailItem, Field, Modal, StatusBadge, Tabs, Textarea, useToast, type Column } from '@/components/ui'
import { useAccount } from '@/context/Account'
import { businessTypeLabel, displayPhone, type Account, type Business, type BusinessStatus } from '@/data/account'
import { date } from '@/utils/format'

/** Stored times are UTC; show the local (PKT) day. */
const formatDate = (iso: string) => {
  const d = new Date(iso)
  return date(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
}

type Row = Business & { owner?: Account }
type Action = { kind: 'Reject' | 'Suspend' | 'Reactivate'; business: Row }

const TABS: BusinessStatus[] = ['Pending approval', 'Active', 'Rejected', 'Suspended']

function Verified({ ok }: { ok?: boolean }) {
  return ok ? <BadgeCheck className="inline size-3.5 text-emerald-600" aria-label="verified" /> : <span className="text-[11px] text-slate-400">(not verified)</span>
}

/** PRD 2.4 — Businesses list for Weftex admins; never shows a business's factory data. */
export default function AdminBusinessesPage() {
  const { ready, db, admin, adminSignOut, setBusinessStatus } = useAccount()
  const navigate = useNavigate()
  const toast = useToast()
  const [tab, setTab] = useState<BusinessStatus>('Pending approval')
  const [open, setOpen] = useState<string | null>(null)
  const [action, setAction] = useState<Action | null>(null)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState<string>()

  const rows: Row[] = useMemo(
    () => (db?.businesses ?? []).map((b) => ({ ...b, owner: db?.accounts.find((a) => a.id === b.ownerId) })).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [db],
  )

  if (!ready) return null
  if (!admin) return <Navigate to="/admin/login" replace />

  const selected = rows.find((r) => r.id === open)
  const notify = (b: Row, msg: string) => toast.success(msg, `SMS and email sent to ${b.owner?.firstName ?? 'the owner'} (demo).`)

  const approve = (b: Row) => {
    setBusinessStatus(b.id, 'Active', 'Approved')
    notify(b, `${b.name} is approved.`)
    setOpen(null)
  }

  const confirmAction = () => {
    if (!action) return
    const r = reason.trim()
    if (action.kind !== 'Reactivate' && !r) return setReasonError('A reason is required')
    if (r.length > 300) return setReasonError('Use at most 300 characters')
    const b = action.business
    if (action.kind === 'Reject') {
      setBusinessStatus(b.id, 'Rejected', 'Rejected', r)
      notify(b, `${b.name} was rejected.`)
    } else if (action.kind === 'Suspend') {
      setBusinessStatus(b.id, 'Suspended', 'Suspended', r)
      notify(b, `${b.name} is suspended. All its users were signed out.`)
    } else {
      setBusinessStatus(b.id, 'Active', 'Reactivated', r || undefined)
      notify(b, `${b.name} is active again.`)
    }
    setAction(null)
    setOpen(null)
  }

  const startAction = (kind: Action['kind'], business: Row) => {
    setReason('')
    setReasonError(undefined)
    setAction({ kind, business })
  }

  const columns: Column<Row>[] = [
    {
      key: 'name',
      header: 'Business',
      sort: (b) => b.name,
      cell: (b) => (
        <span className="flex items-center gap-3">
          <span className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-500">
            <Building2 className="size-4" />
          </span>
          <span className="font-semibold text-slate-900">{b.name}</span>
        </span>
      ),
    },
    { key: 'type', header: 'Business type', cell: (b) => businessTypeLabel(b), sort: (b) => b.type },
    { key: 'units', header: 'Units', cell: (b) => `${b.rawUnit} → ${b.productUnit}`, hideBelow: 'lg' },
    { key: 'owner', header: 'Owner', cell: (b) => (b.owner ? `${b.owner.firstName} ${b.owner.lastName}` : '—'), sort: (b) => b.owner?.firstName ?? '' },
    {
      key: 'phone',
      header: 'Phone',
      hideBelow: 'md',
      cell: (b) => (
        <span className="inline-flex items-center gap-1 whitespace-nowrap">
          {displayPhone(b.owner?.phone ?? '')} <Verified ok={b.owner?.phoneVerified} />
        </span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      hideBelow: 'xl',
      cell: (b) => (
        <span className="inline-flex items-center gap-1">
          {b.owner?.email} <Verified ok={b.owner?.emailVerified} />
        </span>
      ),
    },
    { key: 'factory', header: 'First factory', hideBelow: 'lg', cell: (b) => `${b.factories[0]?.name}, ${b.factories[0]?.city}` },
    { key: 'signed', header: 'Signed up', sort: (b) => b.createdAt, cell: (b) => formatDate(b.createdAt) },
  ]

  return (
    <div className="min-h-screen bg-canvas">
      <header className="flex h-16 items-center justify-between bg-ink-900 px-4 sm:px-8">
        <span className="flex items-center gap-3">
          <Logo dark />
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white uppercase">Admin</span>
        </span>
        <span className="flex items-center gap-3 text-[13px] text-slate-300">
          <span className="hidden sm:inline">{admin.name}</span>
          <Button
            size="sm"
            variant="ghost"
            className="text-slate-300 hover:bg-white/10 hover:text-white"
            icon={<LogOut className="size-4" />}
            onClick={() => {
              adminSignOut()
              navigate('/admin/login')
            }}
          >
            Sign out
          </Button>
        </span>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-8 lg:py-8">
        <h1 className="text-2xl font-semibold text-slate-900">Businesses</h1>
        <p className="mt-1 text-sm text-slate-500">Approve new businesses before anyone can use them. Oldest pending first.</p>

        <Tabs variant="underline" className="mt-6" value={tab} onChange={setTab} tabs={TABS.map((t) => ({ value: t, label: t, count: rows.filter((r) => r.status === t).length }))} />

        <Card className="mt-4">
          <DataTable
            key={tab}
            data={rows.filter((r) => r.status === tab)}
            columns={columns}
            rowKey={(b) => b.id}
            onRowClick={(b) => setOpen(b.id)}
            searchText={(b) => `${b.name} ${b.owner?.firstName} ${b.owner?.lastName} ${b.owner?.email} ${b.factories[0]?.city}`}
            searchPlaceholder="Search business, owner or city…"
            emptyMessage={tab === 'Pending approval' ? 'No businesses are waiting. New sign-ups appear here.' : 'Nothing here yet.'}
          />
        </Card>
      </main>

      <Modal
        open={!!selected && !action}
        onClose={() => setOpen(null)}
        size="lg"
        icon={<Building2 />}
        title={selected?.name}
        description={selected && <StatusBadge status={selected.status} />}
        footer={
          selected && (
            <>
              {selected.status === 'Pending approval' && (
                <>
                  <Button variant="secondary" icon={<XCircle className="size-4" />} onClick={() => startAction('Reject', selected)}>
                    Reject
                  </Button>
                  <Button variant="primary" icon={<CheckCircle2 className="size-4" />} onClick={() => approve(selected)}>
                    Approve
                  </Button>
                </>
              )}
              {selected.status === 'Active' && (
                <Button variant="danger" icon={<Ban className="size-4" />} onClick={() => startAction('Suspend', selected)}>
                  Suspend
                </Button>
              )}
              {selected.status === 'Suspended' && (
                <Button variant="primary" icon={<RotateCcw className="size-4" />} onClick={() => startAction('Reactivate', selected)}>
                  Reactivate
                </Button>
              )}
            </>
          )
        }
      >
        {selected && (
          <div className="space-y-6">
            <section>
              <p className="mb-3 text-xs font-semibold tracking-wide text-slate-400 uppercase">Sign up</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem label="Owner" value={`${selected.owner?.firstName} ${selected.owner?.lastName}`} />
                <DetailItem label="Email" value={<span className="inline-flex items-center gap-1">{selected.owner?.email} <Verified ok={selected.owner?.emailVerified} /></span>} />
                <DetailItem label="Phone" value={<span className="inline-flex items-center gap-1">{displayPhone(selected.owner?.phone ?? '')} <Verified ok={selected.owner?.phoneVerified} /></span>} />
                <DetailItem label="Signed up" value={formatDate(selected.createdAt)} />
              </div>
            </section>
            <section>
              <p className="mb-3 text-xs font-semibold tracking-wide text-slate-400 uppercase">Onboarding</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem label="Business name" value={selected.name} />
                <DetailItem label="Business type" value={businessTypeLabel(selected)} />
                <DetailItem label="Raw material input unit" value={selected.rawUnit} />
                <DetailItem label="Final product unit" value={selected.productUnit} />
                <DetailItem label="First factory" value={selected.factories[0]?.name} />
                <DetailItem label="City" value={selected.factories[0]?.city} />
              </div>
            </section>
            <section>
              <p className="mb-3 text-xs font-semibold tracking-wide text-slate-400 uppercase">History</p>
              <ul className="space-y-2 text-[13px]">
                {[...selected.audit].reverse().map((a, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="w-28 shrink-0 text-slate-400">{formatDate(a.at)}</span>
                    <span className="text-slate-700">
                      <b>{a.action}</b> by {a.by}
                      {a.reason && <span className="block text-slate-500">“{a.reason}”</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </Modal>

      <Modal
        open={!!action}
        onClose={() => setAction(null)}
        size="sm"
        title={action && `${action.kind} ${action.business.name}`}
        description={
          action?.kind === 'Reject'
            ? 'The reason is sent to the owner by SMS and email and shown on their waiting page.'
            : action?.kind === 'Suspend'
              ? 'All its users are signed out and see "This business is suspended."'
              : 'Restores access for everyone in this business.'
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setAction(null)}>
              Cancel
            </Button>
            <Button variant={action?.kind === 'Reactivate' ? 'primary' : 'danger'} onClick={confirmAction}>
              {action?.kind}
            </Button>
          </>
        }
      >
        <Field label="Reason" required={action?.kind !== 'Reactivate'} error={reasonError} hint={`${reason.length}/300`}>
          <Textarea
            autoFocus
            maxLength={300}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value)
              setReasonError(undefined)
            }}
            error={!!reasonError}
            placeholder={action?.kind === 'Reject' ? 'e.g. The business name and phone number could not be confirmed.' : ''}
          />
        </Field>
      </Modal>
    </div>
  )
}
