import { useMemo, useState } from 'react'
import { Copy, Lock, PencilLine, Plus, Power, RotateCcw, ShieldCheck, Trash2 } from 'lucide-react'
import { Badge, Button, Card, DataTable, Field, Input, Modal, PageHeader, Select, StatusBadge, Textarea, useToast, type Column } from '@/components/ui'
import { PermissionPanel, countTicks, permSummary } from '@/components/roles/PermissionPanel'
import { useAccount } from '@/context/Account'
import { ALERT_OPTIONS, modulesFor, resetRole, uid, type Role } from '@/data/account'
import { cn } from '@/utils/format'

type Row = Role & { users: number }

const KIND_TONE = { Fixed: 'violet', Starting: 'blue', Custom: 'teal' } as const

function Toggle({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean }) {
  return (
    <label className={cn('flex items-start justify-between gap-4 rounded-xl border border-line px-3 py-2.5', disabled && 'opacity-60')}>
      <span>
        <span className="block text-[13px] font-medium text-slate-800">{label}</span>
        {description && <span className="block text-xs text-slate-500">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn('relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors', checked ? 'bg-brand-600' : 'bg-slate-300')}
      >
        <span className={cn('absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform', checked && 'translate-x-4')} />
      </button>
    </label>
  )
}

/** PRD 3.7 — Owner only. Owner and Supervisor are fixed; every other role is the business's own. */
export default function RolesPage() {
  const { db, business, profile, saveRole, deleteRole } = useAccount()
  const toast = useToast()
  const [editing, setEditing] = useState<Role | null>(null)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [confirm, setConfirm] = useState<{ kind: 'reset' | 'delete'; role: Row } | null>(null)

  const rows: Row[] = useMemo(
    () => (db?.roles ?? []).filter((r) => r.businessId === business?.id).map((r) => ({ ...r, users: db!.accounts.filter((a) => a.roleId === r.id).length })),
    [db, business?.id],
  )
  if (!business) return null

  const modules = modulesFor(business.type)
  const readOnly = editing?.kind === 'Fixed'

  const open = (r?: Role) => {
    setErrors({})
    setEditing(
      r
        ? structuredClone(r)
        : { id: uid('role'), businessId: business.id, name: '', description: '', kind: 'Custom', canSignIn: true, oneFactoryOnly: false, alerts: [], seeMoney: false, perms: {}, reports: [], status: 'Active' },
    )
  }

  const duplicate = (r: Role) => {
    let name = `${r.name} (copy)`.slice(0, 40)
    while (rows.some((x) => x.name.toLowerCase() === name.toLowerCase())) name = `${name.slice(0, 36)} ${Math.floor(Math.random() * 90 + 10)}`
    saveRole({ ...structuredClone(r), id: uid('role'), name, kind: 'Custom', systemKey: undefined, status: 'Active' })
    toast.success('Role duplicated.', name)
  }

  const save = () => {
    if (!editing) return
    const e: Record<string, string> = {}
    const name = editing.name.trim()
    if (!name) e.name = 'Role name is required'
    else if (name.length > 40) e.name = 'Use at most 40 characters'
    else if (rows.some((r) => r.id !== editing.id && r.name.toLowerCase() === name.toLowerCase())) e.name = 'A role with this name already exists.'
    if (editing.description.length > 150) e.description = 'Use at most 150 characters'
    if (editing.canSignIn && countTicks(editing.perms) === 0) e.perms = 'Give this role at least one permission.'
    setErrors(e)
    if (Object.keys(e).length) return
    const viewable = modules.filter((m) => editing.perms[m.key]?.view)
    const homePage = editing.homePage && editing.perms[editing.homePage]?.view ? editing.homePage : viewable[0]?.key
    saveRole({ ...editing, name, description: editing.description.trim(), homePage: editing.canSignIn ? homePage : undefined })
    toast.success('Role saved.', 'Applies to everyone in this role at their next page load.')
    setEditing(null)
  }

  const columns: Column<Row>[] = [
    {
      key: 'name',
      header: 'Role',
      sort: (r) => r.name,
      cell: (r) => (
        <span>
          <span className="flex items-center gap-1.5 font-semibold text-slate-900">
            {r.kind === 'Fixed' && <Lock className="size-3.5 text-slate-400" />}
            {r.name}
          </span>
          <span className="block max-w-[340px] truncate text-xs text-slate-500">{r.description}</span>
        </span>
      ),
    },
    { key: 'kind', header: 'Kind', sort: (r) => r.kind, cell: (r) => <Badge tone={KIND_TONE[r.kind]}>{r.kind}</Badge> },
    { key: 'users', header: 'Users', align: 'right', sort: (r) => r.users, cell: (r) => <span className="num">{r.users}</span> },
    {
      key: 'perms',
      header: 'Permissions',
      hideBelow: 'lg',
      cell: (r) => (
        <span className="text-xs text-slate-600">
          {r.systemKey === 'owner' ? 'Everything' : r.systemKey === 'supervisor' ? 'Set person by person (Users)' : !r.canSignIn ? 'Cannot sign in · name only' : permSummary(r.perms, profile)}
        </span>
      ),
    },
    { key: 'status', header: 'Status', sort: (r) => r.status, cell: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (r) =>
        r.kind === 'Fixed' ? null : (
          <span className="inline-flex gap-0.5" onClick={(e) => e.stopPropagation()}>
            <Button size="icon-sm" variant="ghost" aria-label={`Edit ${r.name}`} title="Edit" onClick={() => open(r)}>
              <PencilLine className="size-4" />
            </Button>
            <Button size="icon-sm" variant="ghost" aria-label={`Duplicate ${r.name}`} title="Duplicate" onClick={() => duplicate(r)}>
              <Copy className="size-4" />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label={r.status === 'Active' ? `Deactivate ${r.name}` : `Activate ${r.name}`}
              title={r.status === 'Active' ? 'Deactivate' : 'Activate'}
              onClick={() => {
                saveRole({ ...r, status: r.status === 'Active' ? 'Inactive' : 'Active' })
                toast.success(r.status === 'Active' ? 'Role deactivated.' : 'Role activated.', r.status === 'Active' ? 'It no longer appears in Add User; people in it keep their access until moved.' : undefined)
              }}
            >
              <Power className="size-4" />
            </Button>
            <Button size="icon-sm" variant="ghost" aria-label={`Delete ${r.name}`} title="Delete" className="hover:text-rose-600" onClick={() => setConfirm({ kind: 'delete', role: r })}>
              <Trash2 className="size-4" />
            </Button>
          </span>
        ),
    },
  ]

  const viewable = editing ? modules.filter((m) => editing.perms[m.key]?.view) : []

  return (
    <div>
      <PageHeader
        title="Roles"
        description="Who can do what in your business."
        breadcrumbs={[{ label: 'Factory', to: '/factory' }, { label: 'Roles' }]}
        actions={
          <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => open()}>
            New role
          </Button>
        }
      />

      <Card>
        <DataTable data={rows} columns={columns} rowKey={(r) => r.id} onRowClick={(r) => open(r)} searchText={(r) => `${r.name} ${r.description} ${r.kind}`} searchPlaceholder="Search roles…" filters={[{ label: 'Kind', options: ['Fixed', 'Starting', 'Custom'], value: (r) => r.kind }, { label: 'Status', options: ['Active', 'Inactive'], value: (r) => r.status }]} />
      </Card>

      <p className="mt-3 text-xs text-slate-500">
        Starting roles come from your business type ({profile.machines.toLowerCase()}, {profile.rawMaterial.toLowerCase()}, {profile.finishedGoods.toLowerCase()}). Renaming a starting role keeps what it does; for example, a renamed {business.type === 'weaving' ? 'Weaver' : 'Machine Operator'} still can't sign in.
      </p>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        size="lg"
        icon={<ShieldCheck />}
        title={readOnly ? editing?.name : editing && rows.some((r) => r.id === editing.id) ? `Edit ${rows.find((r) => r.id === editing.id)?.name}` : 'New role'}
        description={readOnly ? (editing?.systemKey === 'owner' ? 'The Owner has full access. This role is fixed.' : "Supervisor access is ticked person by person in Users. This role is fixed.") : 'Name the role and tick what people in it may view, add or edit.'}
        footer={
          readOnly ? (
            <Button onClick={() => setEditing(null)}>Close</Button>
          ) : (
            <>
              {editing?.kind === 'Starting' && (
                <Button variant="ghost" className="mr-auto" icon={<RotateCcw className="size-4" />} onClick={() => setConfirm({ kind: 'reset', role: { ...editing, users: 0 } })}>
                  Reset to starting version
                </Button>
              )}
              <Button onClick={() => setEditing(null)}>Cancel</Button>
              <Button variant="primary" onClick={save}>
                Save role
              </Button>
            </>
          )
        }
      >
        {editing && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Role name" required error={errors.name}>
                <Input
                  maxLength={40}
                  disabled={readOnly}
                  placeholder="e.g. Printing Operator"
                  value={editing.name}
                  onChange={(e) => {
                    setEditing({ ...editing, name: e.target.value })
                    setErrors((x) => ({ ...x, name: undefined }))
                  }}
                  error={!!errors.name}
                />
              </Field>
              <Field label="Home page" hint="Where they land after sign-in">
                <Select
                  disabled={readOnly || !editing.canSignIn || !viewable.length}
                  value={editing.homePage && editing.perms[editing.homePage]?.view ? editing.homePage : (viewable[0]?.key ?? '')}
                  onChange={(e) => setEditing({ ...editing, homePage: e.target.value as Role['homePage'] })}
                  options={viewable.length ? viewable.map((m) => ({ value: m.key, label: m.label(profile) })) : [{ value: '', label: editing.systemKey === 'owner' ? 'Dashboard' : '—' }]}
                />
              </Field>
            </div>
            <Field label="Description" error={errors.description} hint="Shown when choosing a role in Add User">
              <Textarea maxLength={150} disabled={readOnly} className="min-h-[60px]" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            </Field>
            {!readOnly && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Toggle
                  label="Can sign in"
                  description="Off makes a name-only role, like Weaver"
                  checked={editing.canSignIn}
                  disabled={editing.systemKey === 'weaver' || editing.systemKey === 'machine-operator'}
                  onChange={(v) => {
                    setEditing({ ...editing, canSignIn: v })
                    setErrors((x) => ({ ...x, perms: undefined }))
                  }}
                />
                <Toggle label="One factory only" description="People in this role get a single factory" checked={editing.oneFactoryOnly} onChange={(v) => setEditing({ ...editing, oneFactoryOnly: v })} />
              </div>
            )}
            {editing.canSignIn && editing.systemKey !== 'supervisor' && (
              <>
                <p className="pt-1 text-[13px] font-semibold text-slate-800">Permissions</p>
                <PermissionPanel
                  modules={modules}
                  profile={profile}
                  value={editing.perms}
                  onChange={(perms) => {
                    setEditing({ ...editing, perms })
                    setErrors((x) => ({ ...x, perms: undefined }))
                  }}
                  seeMoney={editing.seeMoney}
                  onSeeMoney={(v) => setEditing({ ...editing, seeMoney: v })}
                  reports={editing.reports}
                  onReports={(reports) => setEditing({ ...editing, reports })}
                  readOnly={readOnly}
                  error={errors.perms}
                />
                <div className="rounded-xl border border-line px-3 py-2.5">
                  <p className="text-[13px] font-medium text-slate-800">Alerts</p>
                  <p className="text-xs text-slate-500">Notifications people in this role receive</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {ALERT_OPTIONS.filter((a) => profile.hasSizing || !a.startsWith('Loom')).map((a) => {
                      const on = editing.alerts.includes(a)
                      return (
                        <button
                          key={a}
                          type="button"
                          disabled={readOnly}
                          onClick={() => setEditing({ ...editing, alerts: on ? editing.alerts.filter((x) => x !== a) : [...editing.alerts, a] })}
                          className={cn('rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset', on ? 'bg-brand-50 text-brand-700 ring-brand-200' : 'text-slate-500 ring-line-strong hover:bg-slate-50')}
                        >
                          {a}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <p className="text-xs text-slate-500">Factories, users and roles, settings, record history and approving late edits always stay with the Owner.</p>
              </>
            )}
            {!editing.canSignIn && <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-[13px] text-slate-600">People in this role can't sign in. They are kept as names that machines and production entries point to.</p>}
          </div>
        )}
      </Modal>

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        size="sm"
        title={confirm?.kind === 'reset' ? `Reset ${confirm.role.name}?` : `Delete ${confirm?.role.name}?`}
        description={
          confirm?.kind === 'reset'
            ? 'Restores its original name and permissions.'
            : confirm && confirm.role.users > 0
              ? `Move the ${confirm.role.users} ${confirm.role.users === 1 ? 'person' : 'people'} in this role to another role first.`
              : 'This role will be removed. This cannot be undone.'
        }
        footer={
          <>
            <Button onClick={() => setConfirm(null)}>{confirm?.kind === 'delete' && confirm.role.users > 0 ? 'OK' : 'Cancel'}</Button>
            {confirm && !(confirm.kind === 'delete' && confirm.role.users > 0) && (
              <Button
                variant={confirm.kind === 'delete' ? 'danger' : 'primary'}
                onClick={() => {
                  if (confirm.kind === 'reset' && editing) {
                    setEditing(resetRole(editing, business.type))
                    toast.info('Starting version restored.', 'Press Save role to keep it.')
                  } else if (confirm.kind === 'delete') {
                    deleteRole(confirm.role.id)
                    toast.success('Role deleted.')
                  }
                  setConfirm(null)
                }}
              >
                {confirm.kind === 'reset' ? 'Reset' : 'Delete'}
              </Button>
            )}
          </>
        }
      >
        <p className="text-[13px] text-slate-600">{confirm?.kind === 'delete' && confirm.role.users > 0 ? 'Change their role in Users, then delete this one.' : 'You can change it again at any time.'}</p>
      </Modal>
    </div>
  )
}
