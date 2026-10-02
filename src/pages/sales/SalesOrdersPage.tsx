import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FilePlus2, Plus } from 'lucide-react'
import type { OrderStatus, SalesOrder } from '@/types'
import { Button, DataTable, PageHeader, StatusBadge, Tabs, type Column } from '@/components/ui'
import { QuickFormModal } from '@/components/forms/QuickFormModal'
import { TableActions } from '@/components/common/TableActions'
import { CUSTOMERS, SALES_ORDERS, customerById } from '@/data/commercial'
import { FABRICS, fabricByCode } from '@/data/inventory'
import { TODAY_ISO } from '@/data/seed'
import { cn, date, num, pkr, pkrCompact, sum } from '@/utils/format'

type Filter = 'all' | OrderStatus

export default function SalesOrdersPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('all')
  const [adding, setAdding] = useState(false)
  const rows = SALES_ORDERS.filter((o) => filter === 'all' || o.status === filter)

  const columns: Column<SalesOrder>[] = [
    { key: 'id', header: 'Order #', cell: (o) => <span className="font-semibold text-slate-900">{o.id}</span>, sort: (o) => o.id },
    { key: 'customer', header: 'Customer', cell: (o) => customerById(o.customerId)?.name, sort: (o) => customerById(o.customerId)?.name ?? '' },
    { key: 'fabric', header: 'Fabric', cell: (o) => `${fabricByCode(o.fabricCode)?.construction} ${fabricByCode(o.fabricCode)?.name}`, hideBelow: 'lg' },
    { key: 'qty', header: 'Quantity', align: 'right', cell: (o) => `${num(o.quantity)} m`, sort: (o) => o.quantity },
    { key: 'rate', header: 'Rate', align: 'right', cell: (o) => pkr(o.rate), hideBelow: 'xl' },
    { key: 'total', header: 'Total', align: 'right', cell: (o) => <b className="font-semibold text-slate-900">{pkrCompact(o.quantity * o.rate, 2)}</b>, sort: (o) => o.quantity * o.rate },
    {
      key: 'delivery',
      header: 'Delivery',
      cell: (o) => {
        const late = o.deliveryDate < TODAY_ISO && o.status !== 'Completed' && o.status !== 'Cancelled'
        return <span className={cn(late && 'font-medium text-rose-600')}>{date(o.deliveryDate)}{late && ' · late'}</span>
      },
      sort: (o) => o.deliveryDate,
      hideBelow: 'md',
    },
    { key: 'status', header: 'Status', cell: (o) => <StatusBadge status={o.status} />, sort: (o) => o.status },
  ]

  const statuses: Filter[] = ['all', 'Draft', 'Confirmed', 'Partially Fulfilled', 'Completed', 'Cancelled']

  return (
    <div>
      <PageHeader
        title="Sales Orders"
        description={`${SALES_ORDERS.length} orders · ${pkrCompact(sum(SALES_ORDERS.filter((o) => o.status !== 'Cancelled'), (o) => o.quantity * o.rate))} booked · ${num(sum(SALES_ORDERS, (o) => o.quantity - o.delivered))} m pending delivery`}
        breadcrumbs={[{ label: 'Sales' }, { label: 'Sales Orders' }]}
        actions={
          <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>
            New Order
          </Button>
        }
      />
      <Tabs variant="underline" className="mb-4" value={filter} onChange={setFilter} tabs={statuses.map((s) => ({ value: s, label: s === 'all' ? 'All orders' : s, count: s === 'all' ? SALES_ORDERS.length : SALES_ORDERS.filter((o) => o.status === s).length }))} />
      <DataTable
        data={rows}
        columns={columns}
        rowKey={(o) => o.id}
        searchText={(o) => `${o.id} ${customerById(o.customerId)?.name} ${o.fabricCode}`}
        searchPlaceholder="Search order # or customer…"
        filters={[{ label: 'Customer', options: CUSTOMERS.map((c) => c.name), value: (o) => customerById(o.customerId)?.name ?? '' }]}
        actions={<TableActions printable />}
        onRowClick={(o) => navigate(`/sales/orders/${o.id}`)}
        pageSize={12}
      />
      <QuickFormModal
        open={adding}
        onClose={() => setAdding(false)}
        icon={<FilePlus2 />}
        title="New Sales Order"
        submitLabel="Create Order"
        successMessage="Sales order SO-1032 created as Draft."
        fields={[
          { name: 'customer', label: 'Customer', type: 'select', options: CUSTOMERS.filter((c) => c.status === 'Active').map((c) => c.name), required: true, full: true },
          { name: 'fabric', label: 'Fabric', type: 'select', options: FABRICS.map((f) => `${f.code} · ${f.construction} ${f.name}`), required: true, full: true },
          { name: 'qty', label: 'Quantity', type: 'number', suffix: 'm', required: true },
          { name: 'rate', label: 'Rate', type: 'number', suffix: 'PKR/m', required: true },
          { name: 'delivery', label: 'Delivery date', type: 'date', required: true },
          { name: 'terms', label: 'Payment terms', type: 'select', options: ['Advance', '30 days credit', '45 days credit', '60 days credit'] },
          { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Packing, labelling, delivery address…' },
        ]}
      />
    </div>
  )
}
