import { useState } from 'react'
import { Plus, ShoppingCart } from 'lucide-react'
import type { YarnPurchase } from '@/types'
import { Button, DataTable, PageHeader, StatusBadge, type Column } from '@/components/ui'
import { QuickFormModal } from '@/components/forms/QuickFormModal'
import { TableActions } from '@/components/common/TableActions'
import { SUPPLIERS, YARN_PURCHASES, YARNS } from '@/data/inventory'
import { date, kg, num, pkr, pkrCompact, sum } from '@/utils/format'

export default function YarnPurchasesPage() {
  const [adding, setAdding] = useState(false)

  const columns: Column<YarnPurchase>[] = [
    { key: 'id', header: 'Purchase #', cell: (p) => <span className="font-semibold text-slate-900">{p.id}</span>, sort: (p) => p.id },
    { key: 'date', header: 'Date', cell: (p) => date(p.date), sort: (p) => p.date },
    { key: 'supplier', header: 'Supplier', cell: (p) => p.supplier, sort: (p) => p.supplier },
    { key: 'yarn', header: 'Yarn', cell: (p) => <span><span className="text-slate-500">{p.yarnCode}</span> · {p.yarnName}</span>, hideBelow: 'md' },
    { key: 'qty', header: 'Quantity', align: 'right', cell: (p) => kg(p.quantityKg), sort: (p) => p.quantityKg },
    { key: 'rate', header: 'Rate/kg', align: 'right', cell: (p) => pkr(p.rate), hideBelow: 'lg' },
    { key: 'amount', header: 'Amount', align: 'right', cell: (p) => <b className="font-semibold text-slate-900">{pkr(p.quantityKg * p.rate)}</b>, sort: (p) => p.quantityKg * p.rate },
    { key: 'status', header: 'Status', cell: (p) => <StatusBadge status={p.status} />, sort: (p) => p.status },
  ]

  const total = sum(YARN_PURCHASES, (p) => p.quantityKg * p.rate)

  return (
    <div>
      <PageHeader
        title="Yarn Purchases"
        description={`${YARN_PURCHASES.length} purchases this month · ${pkrCompact(total)} · ${num(sum(YARN_PURCHASES, (p) => p.quantityKg))} kg`}
        breadcrumbs={[{ label: 'Yarn', to: '/yarn' }, { label: 'Yarn Purchases' }]}
        actions={
          <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>
            New Purchase
          </Button>
        }
      />
      <DataTable
        data={YARN_PURCHASES}
        columns={columns}
        rowKey={(p) => p.id}
        searchText={(p) => `${p.id} ${p.supplier} ${p.yarnCode} ${p.yarnName}`}
        searchPlaceholder="Search purchase, supplier, yarn…"
        filters={[
          { label: 'Status', options: ['Received', 'Partially Received', 'In Transit', 'Pending'], value: (p) => p.status },
          { label: 'Supplier', options: [...new Set(YARN_PURCHASES.map((p) => p.supplier))].sort(), value: (p) => p.supplier },
        ]}
        actions={<TableActions printable />}
        pageSize={12}
      />
      <QuickFormModal
        open={adding}
        onClose={() => setAdding(false)}
        icon={<ShoppingCart />}
        title="New Yarn Purchase"
        description="Record yarn bought from a supplier. Stock updates when the lot is received."
        submitLabel="Save Purchase"
        successMessage="Yarn purchase recorded."
        fields={[
          { name: 'supplier', label: 'Supplier', type: 'select', options: SUPPLIERS.filter((s) => s.category === 'Yarn').map((s) => s.name), required: true },
          { name: 'yarn', label: 'Yarn', type: 'select', options: YARNS.map((y) => `${y.code} · ${y.name} ${y.count} ${y.type}`), required: true },
          { name: 'qty', label: 'Quantity', type: 'number', suffix: 'kg', required: true },
          { name: 'rate', label: 'Rate per kg', type: 'number', suffix: 'PKR', required: true },
          { name: 'lot', label: 'Lot number', placeholder: 'LT-26xxx' },
          { name: 'date', label: 'Expected delivery', type: 'date' },
          { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Bilty number, freight terms…' },
        ]}
      />
    </div>
  )
}
