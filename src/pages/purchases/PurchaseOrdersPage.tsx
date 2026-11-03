import { useState } from 'react'
import { FilePlus2, Plus } from 'lucide-react'
import type { PurchaseOrder } from '@/types'
import { Button, DataTable, PageHeader, StatusBadge, type Column } from '@/components/ui'
import { QuickFormModal } from '@/components/forms/QuickFormModal'
import { TableActions } from '@/components/common/TableActions'
import { PURCHASE_ORDERS } from '@/data/commercial'
import { SUPPLIERS, supplierById } from '@/data/inventory'
import { date, num, pkr, pkrCompact, sum } from '@/utils/format'
import { IS_POLY } from '@/data/dataset'

export default function PurchaseOrdersPage() {
  const [adding, setAdding] = useState(false)

  const columns: Column<PurchaseOrder>[] = [
    { key: 'id', header: 'PO #', cell: (p) => <span className="font-semibold text-slate-900">{p.id}</span>, sort: (p) => p.id },
    { key: 'date', header: 'Date', cell: (p) => date(p.date), sort: (p) => p.date },
    { key: 'supplier', header: 'Supplier', cell: (p) => supplierById(p.supplierId)?.name, sort: (p) => supplierById(p.supplierId)?.name ?? '' },
    { key: 'item', header: 'Item', cell: (p) => p.item, hideBelow: 'md' },
    { key: 'qty', header: 'Quantity', align: 'right', cell: (p) => `${num(p.quantity)} ${p.unit}`, sort: (p) => p.quantity },
    { key: 'rate', header: 'Rate', align: 'right', cell: (p) => pkr(p.rate), hideBelow: 'xl' },
    { key: 'amount', header: 'Amount', align: 'right', cell: (p) => <b className="font-semibold text-slate-900">{pkr(p.quantity * p.rate)}</b>, sort: (p) => p.quantity * p.rate },
    { key: 'expected', header: 'Expected', cell: (p) => date(p.expected), hideBelow: 'lg' },
    { key: 'status', header: 'Status', cell: (p) => <StatusBadge status={p.status} />, sort: (p) => p.status },
  ]

  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        description={`${PURCHASE_ORDERS.length} orders · ${pkrCompact(sum(PURCHASE_ORDERS.filter((p) => p.status !== 'Cancelled'), (p) => p.quantity * p.rate))} committed`}
        breadcrumbs={[{ label: 'Purchases' }, { label: 'Purchase Orders' }]}
        actions={
          <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>
            New Purchase Order
          </Button>
        }
      />
      <DataTable
        data={PURCHASE_ORDERS}
        columns={columns}
        rowKey={(p) => p.id}
        searchText={(p) => `${p.id} ${supplierById(p.supplierId)?.name} ${p.item}`}
        searchPlaceholder="Search PO, supplier, item…"
        filters={[
          { label: 'Status', options: ['Draft', 'Approved', 'Partially Received', 'Received', 'Cancelled'], value: (p) => p.status },
          { label: 'Category', options: [...new Set(SUPPLIERS.map((s) => s.category))], value: (p) => supplierById(p.supplierId)?.category ?? '' },
        ]}
        actions={<TableActions printable />}
        pageSize={12}
      />
      <QuickFormModal
        open={adding}
        onClose={() => setAdding(false)}
        icon={<FilePlus2 />}
        title="New Purchase Order"
        submitLabel="Create PO"
        successMessage="Purchase order PO-3181 created and sent for approval."
        fields={[
          { name: 'supplier', label: 'Supplier', type: 'select', options: SUPPLIERS.filter((s) => s.status === 'Active').map((s) => s.name), required: true, full: true },
          { name: 'item', label: 'Item', required: true, full: true, placeholder: IS_POLY ? 'PP Homopolymer H030SG' : 'Cotton Yarn 40s Combed' },
          { name: 'qty', label: 'Quantity', type: 'number', required: true },
          { name: 'unit', label: 'Unit', type: 'select', options: ['kg', 'pcs', 'set', 'beam', 'litre'], required: true },
          { name: 'rate', label: 'Rate', type: 'number', suffix: 'PKR', required: true },
          { name: 'expected', label: 'Expected date', type: 'date' },
        ]}
      />
    </div>
  )
}
