import { useNavigate, useParams } from 'react-router-dom'
import { MessageCircle, Phone, Users } from 'lucide-react'
import type { SalesOrder } from '@/types'
import { Button, Card, CardBody, CardHeader, DataTable, DetailItem, EmptyState, KpiCard, PageHeader, ProgressBar, StatusBadge, useToast, type Column } from '@/components/ui'
import { CUSTOMERS, SALES_ORDERS } from '@/data/commercial'
import { fabricByCode } from '@/data/inventory'
import { date, num, pct, pkr, pkrCompact } from '@/utils/format'
import { TERMS } from '@/data/dataset'

export default function CustomerDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const c = CUSTOMERS.find((x) => x.id === id)

  if (!c) {
    return (
      <Card>
        <EmptyState icon={<Users />} title="Customer not found" action={<Button onClick={() => navigate('/sales/customers')}>Back to Customers</Button>} />
      </Card>
    )
  }

  const orders = SALES_ORDERS.filter((o) => o.customerId === c.id)
  const util = (c.outstanding / c.creditLimit) * 100

  const columns: Column<SalesOrder>[] = [
    { key: 'id', header: 'Order', cell: (o) => <span className="font-semibold text-brand-700">{o.id}</span>, sort: (o) => o.id },
    { key: 'date', header: 'Date', cell: (o) => date(o.date), sort: (o) => o.date },
    { key: 'fabric', header: TERMS.productOne, cell: (o) => `${fabricByCode(o.fabricCode)?.construction} ${fabricByCode(o.fabricCode)?.name}`, hideBelow: 'md' },
    { key: 'qty', header: 'Quantity', align: 'right', cell: (o) => `${num(o.quantity)} ${TERMS.stock}` },
    { key: 'total', header: 'Total', align: 'right', cell: (o) => pkr(o.quantity * o.rate), sort: (o) => o.quantity * o.rate },
    { key: 'status', header: 'Status', cell: (o) => <StatusBadge status={o.status} /> },
  ]

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Sales', to: '/sales/customers' }, { label: 'Customers', to: '/sales/customers' }, { label: c.name }]}
        title={c.name}
        meta={<StatusBadge status={c.status} />}
        description={`${c.city} · ${c.contact} · NTN ${c.ntn}`}
        actions={
          <>
            <Button icon={<Phone className="size-4" />} onClick={() => toast.info(`Call ${c.contact}`, c.phone)}>
              Call
            </Button>
            <Button variant="primary" icon={<MessageCircle className="size-4" />} onClick={() => toast.demo('Sending a WhatsApp payment reminder is available in the production version.')}>
              Send payment reminder
            </Button>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Outstanding" value={pkrCompact(c.outstanding)} accent="violet" />
        <KpiCard label="Credit Limit" value={pkrCompact(c.creditLimit)} accent="slate" footer={<div><div className="mb-1.5 flex justify-between text-xs text-slate-500"><span>Utilisation</span><span className="font-semibold text-slate-800">{pct(util, 0)}</span></div><ProgressBar value={util} tone={util > 80 ? 'red' : util > 50 ? 'amber' : 'green'} /></div>} />
        <KpiCard label="Orders" value={c.orders} accent="teal" sub={<span>{orders.length} in the last 60 days</span>} />
        <KpiCard label="Avg. Payment Days" value="38" unit="days" accent="amber" sub={<span>Terms: 45 days</span>} />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title="Customer Details" />
          <CardBody>
            <dl className="grid grid-cols-2 gap-4">
              <DetailItem label="Contact person" value={c.contact} />
              <DetailItem label="Mobile" value={c.phone} />
              <DetailItem label="City" value={c.city} />
              <DetailItem label="NTN" value={c.ntn} />
              <DetailItem label="Customer ID" value={c.id} />
              <DetailItem label="Status" value={<StatusBadge status={c.status} />} />
            </dl>
          </CardBody>
        </Card>
        <div className="xl:col-span-2">
          <DataTable title="Recent Orders" data={orders} columns={columns} rowKey={(o) => o.id} onRowClick={(o) => navigate(`/sales/orders/${o.id}`)} pageSize={6} emptyMessage="No orders in the last 60 days." />
        </div>
      </div>
    </div>
  )
}
