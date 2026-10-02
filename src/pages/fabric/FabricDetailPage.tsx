import { Link, useNavigate, useParams } from 'react-router-dom'
import { Layers, ShoppingBag } from 'lucide-react'
import type { Roll } from '@/types'
import { Button, Card, CardBody, CardHeader, DataTable, DetailItem, EmptyState, KpiCard, PageHeader, StatusBadge, useToast, type Column } from '@/components/ui'
import { BreakdownList, SERIES } from '@/components/charts/ChartKit'
import { useApp } from '@/context/AppState'
import { FABRIC_YARN_RATE, fabricByCode } from '@/data/inventory'
import { ROLLS, SALES_ORDERS, customerById } from '@/data/commercial'
import { costPerMeter } from '@/data/costing'
import { date, kg, num, pkr, pkrCompact, pkrM } from '@/utils/format'

export default function FabricDetailPage() {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { looms } = useApp()
  const f = fabricByCode(code)

  if (!f) {
    return (
      <Card>
        <EmptyState icon={<Layers />} title={`Fabric “${code}” not found`} action={<Button onClick={() => navigate('/fabric')}>Back to Fabric Inventory</Button>} />
      </Card>
    )
  }

  const rolls = ROLLS.filter((r) => r.fabricCode === f.code)
  const weaving = looms.filter((l) => l.fabricCode === f.code)
  const orders = SALES_ORDERS.filter((o) => o.fabricCode === f.code && o.status !== 'Cancelled')
  const cost = costPerMeter({ ...f, yarnRate: FABRIC_YARN_RATE[f.code] })
  const margin = ((f.ratePerMeter - cost.total) / f.ratePerMeter) * 100

  const columns: Column<Roll>[] = [
    { key: 'id', header: 'Roll', cell: (r) => <span className="font-semibold text-brand-700">{r.id}</span>, sort: (r) => r.id },
    { key: 'loom', header: 'Loom', cell: (r) => r.loomId },
    { key: 'date', header: 'Date', cell: (r) => date(r.date), sort: (r) => r.date, hideBelow: 'md' },
    { key: 'm', header: 'Meters', align: 'right', cell: (r) => num(r.meters), sort: (r) => r.meters },
    { key: 'kg', header: 'Weight', align: 'right', cell: (r) => kg(r.weightKg), hideBelow: 'md' },
    { key: 'grade', header: 'Grade', align: 'center', cell: (r) => r.grade },
    { key: 'q', header: 'Quality', cell: (r) => <StatusBadge status={r.quality} /> },
    { key: 's', header: 'Status', cell: (r) => <StatusBadge status={r.status} />, hideBelow: 'lg' },
  ]

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Fabric', to: '/fabric' }, { label: 'Fabric Inventory', to: '/fabric' }, { label: f.code }]}
        title={`${f.construction} ${f.name}`}
        meta={<StatusBadge status={f.status} />}
        description={`${f.code} · ${f.density} · ${f.widthInches}" · ${f.gsm} GSM · ${f.weave}`}
        actions={
          <Button variant="primary" icon={<ShoppingBag className="size-4" />} onClick={() => toast.demo('Creating a sales order from stock is available in the production version.')}>
            Create Sales Order
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="In Stock" value={num(f.meters)} unit="m" sub={<span>{f.rolls} rolls · {kg(f.weightKg)}</span>} />
        <KpiCard label="Stock Value" value={pkrCompact(f.meters * f.ratePerMeter)} accent="violet" sub={<span>@ {pkr(f.ratePerMeter)}/m</span>} />
        <KpiCard label="Cost per Meter" value={pkrM(cost.total)} accent="amber" sub={<span>Gross margin {margin.toFixed(1)}%</span>} to="/costing/per-meter" />
        <KpiCard label="Looms Weaving" value={weaving.length} accent="teal" sub={<span>{weaving.slice(0, 5).map((l) => l.id).join(', ') || 'None right now'}</span>} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title="Specification" />
          <CardBody>
            <dl className="grid grid-cols-2 gap-4">
              <DetailItem label="Fabric code" value={f.code} />
              <DetailItem label="Quality" value={f.name} />
              <DetailItem label="Yarn counts (warp × weft)" value={f.construction} />
              <DetailItem label="Reed × pick" value={f.density} />
              <DetailItem label="Width" value={`${f.widthInches}" (${Math.round(f.widthInches * 2.54)} cm)`} />
              <DetailItem label="GSM" value={f.gsm} />
              <DetailItem label="Weave" value={f.weave} />
              <DetailItem label="Location" value={f.location} />
            </dl>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Cost per Meter" subtitle={`${pkrM(cost.total)} · selling ${pkr(f.ratePerMeter)}`} />
          <CardBody>
            <BreakdownList
              format={(v) => pkrM(v)}
              items={[
                { label: 'Yarn', value: cost.yarn, color: SERIES[0] },
                { label: 'Sizing', value: cost.sizing, color: SERIES[4] },
                { label: 'Labour', value: cost.labour, color: SERIES[1] },
                { label: 'Electricity', value: cost.electricity, color: SERIES[2] },
                { label: 'Maintenance', value: cost.maintenance, color: SERIES[3] },
                { label: 'Overhead', value: cost.overhead, color: SERIES[5] },
              ]}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Open Orders" subtitle={`${orders.length} orders for this fabric`} />
          {orders.length === 0 ? (
            <EmptyState icon={<ShoppingBag />} title="No orders" body="No customer orders for this quality yet." className="py-8" />
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {orders.slice(0, 6).map((o) => (
                <li key={o.id}>
                  <Link to={`/sales/orders/${o.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50">
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold text-slate-900">{o.id}</span>
                      <span className="block truncate text-xs text-slate-500">{customerById(o.customerId)?.name}</span>
                    </span>
                    <span className="text-right text-xs text-slate-500 num">
                      {num(o.quantity)} m<br />
                      <StatusBadge status={o.status} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <div className="mt-4">
        <DataTable title="Rolls" subtitle={`${rolls.length} rolls of this quality`} data={rolls} columns={columns} rowKey={(r) => r.id} onRowClick={(r) => navigate(`/fabric/rolls/${r.id}`)} pageSize={8} emptyMessage="No rolls recorded for this fabric this week." />
      </div>
    </div>
  )
}
