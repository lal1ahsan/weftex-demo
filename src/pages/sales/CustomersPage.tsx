import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, UserPlus, Users, Wallet, AlertTriangle, ShoppingBag } from 'lucide-react'
import type { Customer } from '@/types'
import { Button, DataTable, KpiCard, PageHeader, ProgressBar, StatusBadge, type Column } from '@/components/ui'
import { QuickFormModal } from '@/components/forms/QuickFormModal'
import { TableActions } from '@/components/common/TableActions'
import { CUSTOMERS } from '@/data/commercial'
import { useQueryParam } from '@/hooks/useQueryParam'
import { num, pkrCompact, sum } from '@/utils/format'

export default function CustomersPage() {
  const navigate = useNavigate()
  const q = useQueryParam('q')
  const [adding, setAdding] = useState(false)
  const nearLimit = CUSTOMERS.filter((c) => c.outstanding / c.creditLimit > 0.8)

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      header: 'Customer',
      sort: (c) => c.name,
      cell: (c) => (
        <span className="flex items-center gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-xs font-semibold text-brand-700">
            {c.name
              .split(' ')
              .slice(0, 2)
              .map((w) => w[0])
              .join('')}
          </span>
          <span className="font-semibold text-slate-900">{c.name}</span>
        </span>
      ),
    },
    { key: 'city', header: 'City', cell: (c) => c.city, sort: (c) => c.city },
    { key: 'contact', header: 'Contact', cell: (c) => <span>{c.contact}<span className="block text-xs text-slate-400">{c.phone}</span></span>, hideBelow: 'lg' },
    { key: 'orders', header: 'Orders', align: 'right', cell: (c) => num(c.orders), sort: (c) => c.orders },
    { key: 'out', header: 'Outstanding', align: 'right', cell: (c) => <b className="font-semibold text-slate-900">{pkrCompact(c.outstanding)}</b>, sort: (c) => c.outstanding },
    {
      key: 'limit',
      header: 'Credit Limit',
      align: 'right',
      sort: (c) => c.creditLimit,
      hideBelow: 'md',
      cell: (c) => (
        <div className="ml-auto w-28">
          <span>{pkrCompact(c.creditLimit)}</span>
          <ProgressBar value={c.outstanding} max={c.creditLimit} tone={c.outstanding / c.creditLimit > 0.8 ? 'red' : c.outstanding / c.creditLimit > 0.5 ? 'amber' : 'green'} className="mt-1" height="h-1" />
        </div>
      ),
    },
    { key: 'status', header: 'Status', cell: (c) => <StatusBadge status={c.status} />, sort: (c) => c.status },
  ]

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Buyers of your fabric, their orders and what they owe."
        breadcrumbs={[{ label: 'Sales' }, { label: 'Customers' }]}
        actions={
          <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>
            Add Customer
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Customers" value={CUSTOMERS.length} icon={<Users />} sub={<span>{CUSTOMERS.filter((c) => c.status === 'Active').length} active</span>} />
        <KpiCard label="Total Receivables" value={pkrCompact(sum(CUSTOMERS, (c) => c.outstanding))} icon={<Wallet />} accent="violet" sub={<span>PKR 4.1M over 60 days</span>} />
        <KpiCard label="Near Credit Limit" value={nearLimit.length} icon={<AlertTriangle />} accent="amber" sub={<span>Above 80% utilisation</span>} />
        <KpiCard label="Orders (YTD)" value={num(sum(CUSTOMERS, (c) => c.orders))} icon={<ShoppingBag />} accent="teal" />
      </div>
      <div className="mt-4">
        <DataTable
          data={CUSTOMERS}
          columns={columns}
          rowKey={(c) => c.id}
          initialQuery={q}
          searchText={(c) => `${c.name} ${c.city} ${c.contact} ${c.phone}`}
          searchPlaceholder="Search customer, city, contact…"
          filters={[
            { label: 'City', options: [...new Set(CUSTOMERS.map((c) => c.city))].sort(), value: (c) => c.city },
            { label: 'Status', options: ['Active', 'On Hold', 'Inactive'], value: (c) => c.status },
          ]}
          actions={<TableActions importable />}
          onRowClick={(c) => navigate(`/sales/customers/${c.id}`)}
          defaultSort={{ key: 'out', dir: 'desc' }}
        />
      </div>
      <QuickFormModal
        open={adding}
        onClose={() => setAdding(false)}
        icon={<UserPlus />}
        title="Add Customer"
        submitLabel="Save Customer"
        successMessage="Customer added successfully."
        fields={[
          { name: 'name', label: 'Company name', required: true, full: true },
          { name: 'contact', label: 'Contact person', required: true },
          { name: 'phone', label: 'Mobile', type: 'tel', placeholder: '03xx xxxxxxx', required: true },
          { name: 'city', label: 'City', type: 'select', options: ['Faisalabad', 'Lahore', 'Karachi', 'Multan', 'Sialkot', 'Gujranwala', 'Sheikhupura', 'Peshawar', 'Hyderabad'], required: true },
          { name: 'email', label: 'Email', type: 'email' },
          { name: 'ntn', label: 'NTN', placeholder: '1234567-8' },
          { name: 'strn', label: 'STRN' },
          { name: 'limit', label: 'Credit limit', type: 'number', suffix: 'PKR' },
          { name: 'terms', label: 'Payment terms', type: 'select', options: ['Advance', '30 days credit', '45 days credit', '60 days credit'] },
        ]}
      />
    </div>
  )
}
