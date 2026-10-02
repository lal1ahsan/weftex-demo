import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Plus, Truck } from 'lucide-react'
import type { Dispatch } from '@/types'
import { Button, DataTable, KpiCard, PageHeader, StatusBadge, type Column } from '@/components/ui'
import { QuickFormModal } from '@/components/forms/QuickFormModal'
import { TableActions } from '@/components/common/TableActions'
import { DISPATCHES, SALES_ORDERS, customerById } from '@/data/commercial'
import { fabricByCode } from '@/data/inventory'
import { date, num, sum } from '@/utils/format'

export default function DispatchPage() {
  const navigate = useNavigate()
  const [adding, setAdding] = useState(false)

  const columns: Column<Dispatch>[] = [
    { key: 'id', header: 'Dispatch #', cell: (d) => <span className="font-semibold text-slate-900">{d.id}</span>, sort: (d) => d.id },
    { key: 'date', header: 'Date', cell: (d) => date(d.date), sort: (d) => d.date },
    { key: 'order', header: 'Order', cell: (d) => <span className="font-medium text-brand-700">{d.orderId}</span> },
    { key: 'customer', header: 'Customer', cell: (d) => customerById(d.customerId)?.name },
    { key: 'fabric', header: 'Fabric', cell: (d) => fabricByCode(d.fabricCode)?.construction, hideBelow: 'lg' },
    { key: 'rolls', header: 'Rolls', align: 'right', cell: (d) => d.rolls, hideBelow: 'md' },
    { key: 'm', header: 'Meters', align: 'right', cell: (d) => num(d.meters), sort: (d) => d.meters },
    { key: 'vehicle', header: 'Vehicle', cell: (d) => <span>{d.vehicle}<span className="block text-xs text-slate-400">{d.driver}</span></span>, hideBelow: 'xl' },
    { key: 'status', header: 'Status', cell: (d) => <StatusBadge status={d.status} />, sort: (d) => d.status },
  ]

  return (
    <div>
      <PageHeader
        title="Dispatch"
        description="Delivery notes for fabric leaving the factory gate."
        breadcrumbs={[{ label: 'Sales' }, { label: 'Dispatch' }]}
        actions={
          <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>
            New Dispatch
          </Button>
        }
      />
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <KpiCard label="Dispatched (14 days)" value={num(sum(DISPATCHES, (d) => d.meters))} unit="m" icon={<Truck />} />
        <KpiCard label="Rolls Dispatched" value={num(sum(DISPATCHES, (d) => d.rolls))} icon={<Package />} accent="violet" />
        <KpiCard label="In Transit / Loading" value={DISPATCHES.filter((d) => d.status !== 'Delivered').length} accent="amber" sub={<span>Vehicles on the road</span>} />
      </div>
      <DataTable
        data={DISPATCHES}
        columns={columns}
        rowKey={(d) => d.id}
        searchText={(d) => `${d.id} ${d.orderId} ${customerById(d.customerId)?.name} ${d.vehicle}`}
        searchPlaceholder="Search dispatch, order, vehicle…"
        filters={[{ label: 'Status', options: ['Loading', 'In Transit', 'Delivered'], value: (d) => d.status }]}
        actions={<TableActions printable />}
        onRowClick={(d) => navigate(`/sales/orders/${d.orderId}`)}
      />
      <QuickFormModal
        open={adding}
        onClose={() => setAdding(false)}
        icon={<Truck />}
        title="New Dispatch"
        submitLabel="Create Delivery Note"
        successMessage="Delivery note DN-7741 created."
        fields={[
          { name: 'order', label: 'Sales order', type: 'select', options: SALES_ORDERS.filter((o) => o.status === 'Confirmed' || o.status === 'Partially Fulfilled').map((o) => `${o.id} · ${customerById(o.customerId)?.name}`), required: true, full: true },
          { name: 'rolls', label: 'Number of rolls', type: 'number', required: true },
          { name: 'meters', label: 'Meters', type: 'number', suffix: 'm', required: true },
          { name: 'vehicle', label: 'Vehicle number', placeholder: 'FDA-1234', required: true },
          { name: 'driver', label: 'Driver name', required: true },
          { name: 'bilty', label: 'Bilty / GR number' },
        ]}
      />
    </div>
  )
}
