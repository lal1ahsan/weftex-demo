import { useState } from 'react'
import { ShieldCheck, UserPlus } from 'lucide-react'
import type { User } from '@/types'
import { Badge, Button, Card, CardBody, CardHeader, DataTable, PageHeader, StatusBadge, type Column } from '@/components/ui'
import { QuickFormModal } from '@/components/forms/QuickFormModal'
import { ROLES, USERS } from '@/data/factory'
import { cn } from '@/utils/format'

const PERMISSIONS: { module: string; roles: string[] }[] = [
  { module: 'Owner dashboard & costing', roles: ['Owner', 'Admin'] },
  { module: 'Production & downtime entry', roles: ['Owner', 'Admin', 'Production Manager', 'Supervisor'] },
  { module: 'Yarn & fabric inventory', roles: ['Owner', 'Admin', 'Production Manager', 'Store Manager'] },
  { module: 'Quality inspection', roles: ['Owner', 'Admin', 'Production Manager', 'Quality Inspector'] },
  { module: 'Sales & receivables', roles: ['Owner', 'Admin', 'Accountant', 'Sales'] },
  { module: 'Purchases & expenses', roles: ['Owner', 'Admin', 'Accountant', 'Store Manager'] },
]
const MATRIX_ROLES = ['Owner', 'Admin', 'Production Manager', 'Supervisor', 'Store Manager', 'Accountant', 'Sales', 'Quality Inspector']

export default function UsersPage() {
  const [adding, setAdding] = useState(false)

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'User',
      sort: (u) => u.name,
      cell: (u) => (
        <span className="flex items-center gap-3">
          <span className="grid size-8 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
            {u.name
              .split(' ')
              .map((p) => p[0])
              .join('')}
          </span>
          <span>
            <span className="block font-semibold text-slate-900">{u.name}</span>
            <span className="block text-xs text-slate-500">{u.email}</span>
          </span>
        </span>
      ),
    },
    { key: 'role', header: 'Role', cell: (u) => <Badge tone={u.role === 'Owner' ? 'violet' : 'slate'}>{u.role}</Badge>, sort: (u) => u.role },
    { key: 'phone', header: 'Mobile', cell: (u) => u.phone, hideBelow: 'md' },
    { key: 'last', header: 'Last Active', cell: (u) => u.lastActive, hideBelow: 'lg' },
    { key: 'status', header: 'Status', cell: (u) => <StatusBadge status={u.status} />, sort: (u) => u.status },
  ]

  return (
    <div>
      <PageHeader
        title="Users"
        description="People who can sign in, and what each role can see."
        breadcrumbs={[{ label: 'Factory', to: '/factory' }, { label: 'Users' }]}
        actions={
          <Button variant="primary" icon={<UserPlus className="size-4" />} onClick={() => setAdding(true)}>
            Invite User
          </Button>
        }
      />
      <DataTable data={USERS} columns={columns} rowKey={(u) => u.id} searchText={(u) => `${u.name} ${u.email} ${u.role}`} searchPlaceholder="Search users…" filters={[{ label: 'Role', options: ROLES, value: (u) => u.role }]} />

      <Card className="mt-4">
        <CardHeader title="Role Permissions" subtitle="Each role only sees the modules it needs" actions={<ShieldCheck className="size-5 text-slate-400" />} />
        <CardBody className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-[13px]">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="py-2 pr-4 font-medium">Module</th>
                {MATRIX_ROLES.map((r) => (
                  <th key={r} className="px-2 py-2 text-center font-medium">
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {PERMISSIONS.map((p) => (
                <tr key={p.module}>
                  <td className="py-2.5 pr-4 font-medium text-slate-800">{p.module}</td>
                  {MATRIX_ROLES.map((r) => (
                    <td key={r} className="px-2 py-2.5 text-center">
                      <span className={cn('inline-block size-2.5 rounded-full', p.roles.includes(r) ? 'bg-emerald-500' : 'bg-slate-200')} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <QuickFormModal
        open={adding}
        onClose={() => setAdding(false)}
        icon={<UserPlus />}
        title="Invite User"
        description="They will receive an SMS and email to set a password."
        submitLabel="Send Invite"
        successMessage="Invitation sent."
        fields={[
          { name: 'name', label: 'Full name', required: true },
          { name: 'role', label: 'Role', type: 'select', options: ROLES, required: true },
          { name: 'email', label: 'Email', type: 'email', required: true },
          { name: 'phone', label: 'Mobile', type: 'tel', placeholder: '03xx xxxxxxx' },
          { name: 'lang', label: 'Language', type: 'select', options: ['English', 'اردو (Urdu)'], defaultValue: 'English' },
        ]}
      />
    </div>
  )
}
