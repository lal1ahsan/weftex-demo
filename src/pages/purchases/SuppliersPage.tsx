import { useState } from 'react'
import { Plus, Star, Truck } from 'lucide-react'
import type { Supplier } from '@/types'
import { Button, DataTable, KpiCard, PageHeader, StatusBadge, type Column } from '@/components/ui'
import { QuickFormModal } from '@/components/forms/QuickFormModal'
import { TableActions } from '@/components/common/TableActions'
import { SUPPLIERS } from '@/data/inventory'
import { useQueryParam } from '@/hooks/useQueryParam'
import { pkrCompact, sum } from '@/utils/format'

export default function SuppliersPage() {
  const q = useQueryParam('q')
  const [adding, setAdding] = useState(false)

  const columns: Column<Supplier>[] = [
    { key: 'name', header: 'Supplier', cell: (s) => <span className="font-semibold text-slate-900">{s.name}</span>, sort: (s) => s.name },
    { key: 'cat', header: 'Category', cell: (s) => s.category, sort: (s) => s.category },
    { key: 'city', header: 'City', cell: (s) => s.city, sort: (s) => s.city, hideBelow: 'md' },
    { key: 'contact', header: 'Contact', cell: (s) => <span>{s.contact}<span className="block text-xs text-slate-400">{s.phone}</span></span>, hideBelow: 'lg' },
    { key: 'payable', header: 'Payable', align: 'right', cell: (s) => <b className="font-semibold text-slate-900">{pkrCompact(s.payable)}</b>, sort: (s) => s.payable },
    {
      key: 'rating',
      header: 'Rating',
      align: 'right',
      sort: (s) => s.rating,
      hideBelow: 'md',
      cell: (s) => (
        <span className="inline-flex items-center gap-1">
          <Star className="size-3.5 fill-amber-400 text-amber-400" />
          {s.rating.toFixed(1)}
        </span>
      ),
    },
    { key: 'status', header: 'Status', cell: (s) => <StatusBadge status={s.status} /> },
  ]

  return (
    <div>
      <PageHeader
        title="Suppliers"
        description="Yarn mills, sizing units and spare-part vendors."
        breadcrumbs={[{ label: 'Purchases' }, { label: 'Suppliers' }]}
        actions={
          <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>
            Add Supplier
          </Button>
        }
      />
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <KpiCard label="Suppliers" value={SUPPLIERS.length} icon={<Truck />} sub={<span>{SUPPLIERS.filter((s) => s.category === 'Yarn').length} yarn suppliers</span>} />
        <KpiCard label="Total Payables" value={pkrCompact(sum(SUPPLIERS, (s) => s.payable))} accent="violet" sub={<span>Who we owe</span>} />
        <KpiCard label="Due This Week" value={pkrCompact(sum(SUPPLIERS.slice(0, 4), (s) => s.payable) * 0.35)} accent="amber" sub={<span>4 payments scheduled</span>} />
      </div>
      <DataTable
        data={SUPPLIERS}
        columns={columns}
        rowKey={(s) => s.id}
        initialQuery={q}
        searchText={(s) => `${s.name} ${s.city} ${s.contact} ${s.category}`}
        searchPlaceholder="Search supplier…"
        filters={[{ label: 'Category', options: [...new Set(SUPPLIERS.map((s) => s.category))], value: (s) => s.category }]}
        actions={<TableActions importable />}
        defaultSort={{ key: 'payable', dir: 'desc' }}
      />
      <QuickFormModal
        open={adding}
        onClose={() => setAdding(false)}
        icon={<Truck />}
        title="Add Supplier"
        submitLabel="Save Supplier"
        successMessage="Supplier added successfully."
        fields={[
          { name: 'name', label: 'Company name', required: true, full: true },
          { name: 'category', label: 'Category', type: 'select', options: ['Yarn', 'Sizing', 'Spare Parts', 'Packaging', 'Consumables', 'Electrical'], required: true },
          { name: 'city', label: 'City', required: true },
          { name: 'contact', label: 'Contact person', required: true },
          { name: 'phone', label: 'Mobile', type: 'tel', required: true },
          { name: 'ntn', label: 'NTN' },
          { name: 'terms', label: 'Payment terms', type: 'select', options: ['Advance', '15 days', '30 days', '45 days'] },
        ]}
      />
    </div>
  )
}
