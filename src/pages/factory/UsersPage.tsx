import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, Send, ShieldCheck, UserMinus, UserPlus } from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader, DataTable, Field, Input, Modal, PageHeader, Select, StatusBadge, useToast, type Column } from '@/components/ui'
import { PermissionPanel, countTicks, permSummary } from '@/components/roles/PermissionPanel'
import { useAccount } from '@/context/Account'
import { EMAIL_RE, displayPhone, modulesFor, normalizePhone, uid, type Account, type PermSet, type Role } from '@/data/account'
import { cn } from '@/utils/format'

type Row = Account & { role?: Role; name: string }

interface Draft {
  id?: string
  name: string
  roleId: string
  factoryIds: 'all' | string[]
  canSignIn: boolean
  phone: string
  email: string
  language: 'English' | 'Urdu'
  perms: PermSet
  seeMoney: boolean
}

/** Table rows carry the role and full name for display; strip them before saving. */
function toAccount(row: Row): Account {
  const acc: Partial<Row> = { ...row }
  delete acc.role
  delete acc.name
  return acc as Account
}

const EMPTY: Draft = { name: '', roleId: '', factoryIds: 'all', canSignIn: true, phone: '', email: '', language: 'English', perms: {}, seeMoney: false }

/** PRD 3.3 — Owner only. Users belong to the business and are given one or more factories. */
export default function UsersPage() {
  const { db, business, me, profile, saveUser, previewAs } = useAccount()
  const toast = useToast()
  const navigate = useNavigate()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})

  const roles = useMemo(() => (db?.roles ?? []).filter((r) => r.businessId === business?.id), [db, business?.id])
  const rows: Row[] = useMemo(
    () =>
      (db?.accounts ?? [])
        .filter((a) => a.businessId === business?.id)
        .map((a) => ({ ...a, role: roles.find((r) => r.id === a.roleId), name: `${a.firstName} ${a.lastName}`.trim() })),
    [db, business?.id, roles],
  )
  if (!business) return null

  const factories = business.factories
  const factoryNames = (ids: Account['factoryIds']) => (ids === 'all' ? 'All factories' : factories.filter((f) => ids.includes(f.id)).map((f) => f.name).join(', ') || '—')
  const role = roles.find((r) => r.id === draft?.roleId)
  const isSupervisor = role?.systemKey === 'supervisor'
  const supervisors = rows.filter((r) => r.role?.systemKey === 'supervisor' && r.id !== draft?.id)
  const editingRow = rows.find((r) => r.id === draft?.id)

  const change = (patch: Partial<Draft>) => {
    setDraft((d) => (d ? { ...d, ...patch } : d))
    setErrors((e) => ({ ...e, ...Object.fromEntries(Object.keys(patch).map((k) => [k, undefined])) }))
  }

  const pickRole = (roleId: string) => {
    const r = roles.find((x) => x.id === roleId)
    const patch: Partial<Draft> = { roleId }
    if (r && !r.canSignIn) patch.canSignIn = false
    else if (r) patch.canSignIn = true
    if (r?.systemKey === 'owner') patch.factoryIds = 'all'
    if (r?.oneFactoryOnly && draft?.factoryIds === 'all') patch.factoryIds = [factories[0].id]
    change(patch)
  }

  const openRow = (a?: Row) => {
    setErrors({})
    setDraft(
      a
        ? {
            id: a.id,
            name: a.name,
            roleId: a.roleId ?? '',
            factoryIds: a.factoryIds,
            canSignIn: a.canSignIn,
            phone: a.phone ? displayPhone(a.phone).replace(' ', '') : '',
            email: a.email,
            language: a.language,
            perms: a.supervisorPerms ?? {},
            seeMoney: !!a.supervisorSeeMoney,
          }
        : { ...EMPTY },
    )
  }

  const save = () => {
    if (!draft) return
    const e: Record<string, string> = {}
    const name = draft.name.trim()
    const phone = draft.phone.trim() ? normalizePhone(draft.phone) : ''
    const email = draft.email.trim().toLowerCase()
    const ownerRole = role?.systemKey === 'owner'
    if (!name) e.name = 'Full name is required'
    else if (name.length > 60) e.name = 'Use at most 60 characters'
    if (!draft.roleId) e.roleId = 'Role is required'
    if (draft.factoryIds !== 'all' && !draft.factoryIds.length) e.factoryIds = 'Choose at least one factory'
    if (draft.phone.trim() && !phone) e.phone = 'Enter 11 digits starting with 03'
    else if (phone && db?.accounts.some((a) => a.id !== draft.id && a.phone === phone)) e.phone = 'This mobile number is already registered.'
    if (email && !EMAIL_RE.test(email)) e.email = 'Enter a valid email address'
    else if (email && db?.accounts.some((a) => a.id !== draft.id && a.email.toLowerCase() === email)) e.email = 'This email is already registered.'
    if (ownerRole) {
      if (!phone && !e.phone) e.phone = 'Mobile is required for an Owner'
      if (!email && !e.email) e.email = 'Email is required for an Owner'
    } else if (draft.canSignIn && !phone && !email && !e.phone) e.phone = 'Enter a mobile number or an email'
    if (isSupervisor && countTicks(draft.perms) === 0) e.perms = 'Give this Supervisor at least one permission.'
    setErrors(e)
    if (Object.keys(e).length) return

    const [firstName, ...rest] = name.split(/\s+/)
    const prevRow = rows.find((a) => a.id === draft.id)
    const prev = prevRow && toAccount(prevRow)
    const account: Account = {
      ...(prev ?? {
        id: uid('U'),
        businessId: business.id,
        passwordHash: '',
        phoneVerified: false,
        emailVerified: false,
        status: draft.canSignIn ? 'Invited' : 'Active',
        lastActive: '—',
        createdAt: new Date().toISOString(),
      }),
      firstName,
      lastName: rest.join(' '),
      phone: phone || '',
      email,
      roleId: draft.roleId,
      factoryIds: ownerRole ? 'all' : draft.factoryIds,
      canSignIn: draft.canSignIn,
      language: draft.language,
      supervisorPerms: isSupervisor ? draft.perms : undefined,
      supervisorSeeMoney: isSupervisor ? draft.seeMoney : undefined,
    }
    saveUser(account)
    if (prev) toast.success(isSupervisor ? `Permissions saved for ${name}.` : 'User saved.')
    else toast.success(draft.canSignIn ? 'Invitation sent.' : 'User added.', draft.canSignIn ? `By ${[phone && 'SMS', email && 'email'].filter(Boolean).join(' and ')}; the link expires after 7 days.` : undefined)
    setDraft(null)
  }

  const setStatus = (a: Row, status: Account['status']) => {
    const owners = rows.filter((r) => r.role?.systemKey === 'owner' && r.status === 'Active')
    if (status === 'Disabled' && a.role?.systemKey === 'owner' && owners.length <= 1) return toast.error("The last active Owner can't be disabled.")
    saveUser({ ...toAccount(a), status })
    toast.success(status === 'Disabled' ? 'User disabled.' : 'User enabled.')
    setDraft(null)
  }

  const preview = (a: Row) => {
    previewAs(a.id)
    toast.info(`Viewing as ${a.name}`, 'Use "Back to Owner view" at the top to return.')
    navigate('/')
  }

  const columns: Column<Row>[] = [
    {
      key: 'name',
      header: 'User',
      sort: (u) => u.name,
      cell: (u) => (
        <span className="flex items-center gap-3">
          <span className="grid size-8 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">{`${u.firstName[0] ?? ''}${u.lastName[0] ?? ''}`.toUpperCase()}</span>
          <span>
            <span className="block font-semibold text-slate-900">{u.name}</span>
            <span className="block text-xs text-slate-500">{u.email || displayPhone(u.phone)}</span>
          </span>
        </span>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sort: (u) => u.role?.name ?? '',
      cell: (u) => (
        <span className="inline-flex items-center gap-1.5">
          <Badge tone={u.role?.systemKey === 'owner' ? 'violet' : 'slate'}>{u.role?.name ?? '—'}</Badge>
          {u.role?.systemKey === 'supervisor' && (
            <span title={permSummary(u.supervisorPerms, profile, 20)}>
              <Badge tone="teal">Custom</Badge>
            </span>
          )}
        </span>
      ),
    },
    { key: 'factories', header: 'Factories', hideBelow: 'lg', cell: (u) => <span className="text-[13px]">{factoryNames(u.factoryIds)}</span> },
    { key: 'phone', header: 'Mobile', cell: (u) => displayPhone(u.phone), hideBelow: 'md' },
    { key: 'signin', header: 'Sign-in', cell: (u) => (u.canSignIn ? 'Yes' : 'No'), sort: (u) => (u.canSignIn ? 1 : 0) },
    { key: 'last', header: 'Last Active', cell: (u) => u.lastActive, hideBelow: 'lg' },
    { key: 'status', header: 'Status', cell: (u) => <StatusBadge status={u.status} />, sort: (u) => u.status },
    {
      key: 'preview',
      header: '',
      align: 'right',
      cell: (u) =>
        u.id !== me?.id && u.canSignIn && u.status !== 'Disabled' && u.role?.systemKey !== 'owner' ? (
          <span onClick={(e) => e.stopPropagation()}>
            <Button size="sm" variant="ghost" icon={<Eye className="size-4" />} onClick={() => preview(u)} title="See exactly what this person sees">
              Preview as
            </Button>
          </span>
        ) : null,
    },
  ]

  const activeRoles = roles.filter((r) => r.status === 'Active' || r.id === editingRow?.roleId)

  return (
    <div>
      <PageHeader
        title="Users"
        description="People who can sign in, and what each role can see."
        breadcrumbs={[{ label: 'Factory', to: '/factory' }, { label: 'Users' }]}
        actions={
          <Button variant="primary" icon={<UserPlus className="size-4" />} onClick={() => openRow()}>
            Add User
          </Button>
        }
      />
      <DataTable
        data={rows}
        columns={columns}
        rowKey={(u) => u.id}
        onRowClick={(u) => openRow(u)}
        searchText={(u) => `${u.name} ${u.email} ${u.phone} ${displayPhone(u.phone)} ${u.role?.name}`}
        searchPlaceholder="Search users…"
        filters={[
          { label: 'Role', options: roles.map((r) => r.name), value: (u) => u.role?.name ?? '' },
          { label: 'Factory', options: factories.map((f) => f.name), value: (u) => (u.factoryIds === 'all' ? factories.map((f) => f.name).join('|') : factoryNames(u.factoryIds)) },
          { label: 'Status', options: ['Active', 'Invited', 'Disabled'], value: (u) => u.status },
        ]}
      />

      <Card className="mt-4">
        <CardHeader title="Roles and permissions" subtitle="Each role only sees the modules it needs" actions={<ShieldCheck className="size-5 text-slate-400" />} />
        <CardBody className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-slate-600">
          <span>
            {roles.filter((r) => r.status === 'Active').length} active roles. Owner and Supervisor are fixed; rename, change or add the others in Roles.
          </span>
          <Link to="/factory/roles">
            <Button variant="subtle">Manage roles</Button>
          </Link>
        </CardBody>
      </Card>

      <Modal
        open={!!draft}
        onClose={() => setDraft(null)}
        size={isSupervisor ? 'lg' : 'md'}
        icon={<UserPlus />}
        title={editingRow ? `Edit ${editingRow.name}` : 'Add User'}
        description="Add a person and choose what they can do."
        footer={
          <>
            {editingRow && editingRow.id !== me?.id && (
              <span className="mr-auto flex gap-1">
                {editingRow.status === 'Invited' && (
                  <Button variant="ghost" icon={<Send className="size-4" />} onClick={() => toast.success('Invitation sent again.')}>
                    Resend invite
                  </Button>
                )}
                <Button variant="ghost" className={editingRow.status === 'Disabled' ? '' : 'text-rose-600 hover:bg-rose-50 hover:text-rose-700'} icon={<UserMinus className="size-4" />} onClick={() => setStatus(editingRow, editingRow.status === 'Disabled' ? 'Active' : 'Disabled')}>
                  {editingRow.status === 'Disabled' ? 'Enable user' : 'Disable user'}
                </Button>
              </span>
            )}
            <Button onClick={() => setDraft(null)}>Cancel</Button>
            <Button variant="primary" onClick={save}>
              {editingRow ? 'Save' : draft?.canSignIn ? 'Send Invite' : 'Add User'}
            </Button>
          </>
        }
      >
        {draft && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" required error={errors.name}>
                <Input autoFocus maxLength={60} value={draft.name} onChange={(e) => change({ name: e.target.value })} error={!!errors.name} />
              </Field>
              <Field label="Role" required error={errors.roleId} hint={role?.description}>
                <Select placeholder="Choose a role" value={draft.roleId} onChange={(e) => pickRole(e.target.value)} error={!!errors.roleId} options={activeRoles.map((r) => ({ value: r.id, label: r.name }))} disabled={editingRow?.id === me?.id} />
              </Field>
            </div>

            <Field label="Factories" required error={errors.factoryIds} hint={role?.oneFactoryOnly ? 'This role can be given one factory only' : undefined}>
              <div className="flex flex-wrap gap-2">
                {!role?.oneFactoryOnly && (
                  <FactoryChip on={draft.factoryIds === 'all'} label="All factories" onClick={() => change({ factoryIds: draft.factoryIds === 'all' ? [] : 'all' })} />
                )}
                {factories.map((f) => {
                  const on = draft.factoryIds !== 'all' && draft.factoryIds.includes(f.id)
                  return (
                    <FactoryChip
                      key={f.id}
                      on={on}
                      disabled={role?.systemKey === 'owner'}
                      label={f.name}
                      onClick={() => {
                        const cur = draft.factoryIds === 'all' ? [] : draft.factoryIds
                        change({ factoryIds: role?.oneFactoryOnly ? [f.id] : on ? cur.filter((x) => x !== f.id) : [...cur, f.id] })
                      }}
                    />
                  )
                })}
              </div>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Mobile" required={role?.systemKey === 'owner'} error={errors.phone}>
                <Input type="tel" inputMode="numeric" placeholder="03xx xxxxxxx" value={draft.phone} onChange={(e) => change({ phone: e.target.value })} error={!!errors.phone} />
              </Field>
              <Field label="Email" required={role?.systemKey === 'owner'} error={errors.email}>
                <Input type="email" placeholder="name@company.com" value={draft.email} onChange={(e) => change({ email: e.target.value })} error={!!errors.email} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Language">
                <Select value={draft.language} onChange={(e) => change({ language: e.target.value as Draft['language'] })} options={[{ value: 'English', label: 'English' }, { value: 'Urdu', label: 'اردو (Urdu)' }]} />
              </Field>
              <label className={cn('flex items-center justify-between gap-3 self-end rounded-lg border border-line px-3 py-2.5 text-[13px]', role && !role.canSignIn && 'opacity-60')}>
                <span>
                  <span className="font-medium text-slate-800">Can sign in</span>
                  {role && !role.canSignIn && <span className="block text-xs text-slate-500">{role.name} can't sign in</span>}
                </span>
                <input type="checkbox" className="size-4 accent-brand-600" checked={draft.canSignIn} disabled={!!role && !role.canSignIn} onChange={(e) => change({ canSignIn: e.target.checked })} />
              </label>
            </div>

            {isSupervisor && (
              <div className="space-y-3 border-t border-line pt-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-semibold text-slate-800">Permissions</p>
                    <p className="text-xs text-slate-500">Tick exactly what this Supervisor may view, add or edit.</p>
                  </div>
                  {supervisors.length > 0 && (
                    <Select
                      className="h-9 w-56 text-[13px]"
                      aria-label="Copy permissions from"
                      placeholder="Copy permissions from…"
                      value=""
                      onChange={(e) => {
                        const src = supervisors.find((s) => s.id === e.target.value)
                        if (src) change({ perms: structuredClone(src.supervisorPerms ?? {}), seeMoney: !!src.supervisorSeeMoney })
                      }}
                      options={supervisors.map((s) => ({ value: s.id, label: s.name }))}
                    />
                  )}
                </div>
                <PermissionPanel modules={modulesFor(business.type)} profile={profile} value={draft.perms} onChange={(perms) => change({ perms })} seeMoney={draft.seeMoney} onSeeMoney={(v) => change({ seeMoney: v })} error={errors.perms} />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

function FactoryChip({ on, label, onClick, disabled }: { on: boolean; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={on}
      className={cn('rounded-full px-3 py-1.5 text-[13px] font-medium ring-1 ring-inset disabled:opacity-60', on ? 'bg-brand-50 text-brand-700 ring-brand-300' : 'text-slate-600 ring-line-strong hover:bg-slate-50')}
    >
      {label}
    </button>
  )
}
