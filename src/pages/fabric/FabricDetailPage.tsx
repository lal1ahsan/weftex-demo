import { Link, useNavigate, useParams } from 'react-router-dom'
import { Layers, ShoppingBag } from 'lucide-react'
import type { Roll } from '@/types'
import { Button, Card, CardBody, CardHeader, DataTable, DetailItem, EmptyState, KpiCard, PageHeader, StatusBadge, useToast, type Column } from '@/components/ui'
import { BreakdownList, SERIES } from '@/components/charts/ChartKit'
import { useApp } from '@/context/AppState'
import { fabricByCode } from '@/data/inventory'
import { ROLLS, SALES_ORDERS, customerById } from '@/data/commercial'
import { unitCost } from '@/data/metrics'
import { date, kg, num, pkr, pkrCompact, pkrM } from '@/utils/format'
import { IS_POLY, TERMS } from '@/data/dataset'

/** Same colour per cost line as before: yarn, sizing, labour, electricity, maintenance, overhead. */
const COST_COLORS = [SERIES[0], SERIES[4], SERIES[1], SERIES[2], SERIES[3], SERIES[5]]

export default function FabricDetailPage() {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { looms } = useApp()
  const f = fabricByCode(code)

  if (!f) {
    return (
      <Card>
        <EmptyState icon={<Layers />} title={`${TERMS.productOne} “${code}” not found`} action={<Button onClick={() => navigate('/fabric')}>Back to {TERMS.product} Inventory</Button>} />
      </Card>
    )
  }

  const rolls = ROLLS.filter((r) => r.fabricCode === f.code)
  const weaving = looms.filter((l) => l.fabricCode === f.code)
  const orders = SALES_ORDERS.filter((o) => o.fabricCode === f.code && o.status !== 'Cancelled')
  const cost = unitCost(f)
  const margin = ((f.ratePerMeter - cost.total) / f.ratePerMeter) * 100

  const columns: Column<Roll>[] = [
    { key: 'id', header: TERMS.pack, cell: (r) => <span className="font-semibold text-brand-700">{r.id}</span>, sort: (r) => r.id },
    { key: 'loom', header: TERMS.machine, cell: (r) => r.loomId },
    { key: 'date', header: 'Date', cell: (r) => date(r.date), sort: (r) => r.date, hideBelow: 'md' },
    { key: 'm', header: (TERMS.stockLong[0].toUpperCase() + TERMS.stockLong.slice(1)), align: 'right', cell: (r) => num(r.meters), sort: (r) => r.meters },
    { key: 'kg', header: 'Weight', align: 'right', cell: (r) => kg(r.weightKg), hideBelow: 'md' },
    { key: 'grade', header: 'Grade', align: 'center', cell: (r) => r.grade },
    { key: 'q', header: 'Quality', cell: (r) => <StatusBadge status={r.quality} /> },
    { key: 's', header: 'Status', cell: (r) => <StatusBadge status={r.status} />, hideBelow: 'lg' },
  ]

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: TERMS.product, to: '/fabric' }, { label: `${TERMS.product} Inventory`, to: '/fabric' }, { label: f.code }]}
        title={IS_POLY ? f.name : `${f.construction} ${f.name}`}
        meta={<StatusBadge status={f.status} />}
        description={IS_POLY ? `${f.code} · ${f.construction} · ${f.density} mesh · ${f.gsm} GSM · ${f.weave}` : `${f.code} · ${f.density} · ${f.widthInches}" · ${f.gsm} GSM · ${f.weave}`}
        actions={
          <Button variant="primary" icon={<ShoppingBag className="size-4" />} onClick={() => toast.demo('Creating a sales order from stock is available in the production version.')}>
            Create Sales Order
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="In Stock" value={num(f.meters)} unit={TERMS.stock} sub={<span>{f.rolls} {TERMS.packs.toLowerCase()} · {kg(f.weightKg)}</span>} />
        <KpiCard label="Stock Value" value={pkrCompact(f.meters * f.ratePerMeter)} accent="violet" sub={<span>@ {pkr(f.ratePerMeter)}/{IS_POLY ? 'bag' : 'm'}</span>} />
        <KpiCard label={IS_POLY ? 'Cost per Bag' : 'Cost per Meter'} value={pkrM(cost.total)} accent="amber" sub={<span>Gross margin {margin.toFixed(1)}%</span>} to="/costing/per-meter" />
        <KpiCard label={IS_POLY ? `${TERMS.machines} Running` : 'Looms Weaving'} value={weaving.length} accent="teal" sub={<span>{weaving.slice(0, 5).map((l) => l.id).join(', ') || 'None right now'}</span>} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title="Specification" />
          <CardBody>
            <dl className="grid grid-cols-2 gap-4">
              <DetailItem label={`${TERMS.productOne} code`} value={f.code} />
              <DetailItem label={IS_POLY ? 'Product' : 'Quality'} value={f.name} />
              <DetailItem label={IS_POLY ? 'Size (width × length)' : 'Yarn counts (warp × weft)'} value={f.construction} />
              <DetailItem label={IS_POLY ? 'Mesh' : 'Reed × pick'} value={f.density} />
              <DetailItem label="Width" value={`${f.widthInches}" (${Math.round(f.widthInches * 2.54)} cm)`} />
              <DetailItem label="GSM" value={f.gsm} />
              <DetailItem label={TERMS.weave} value={f.weave} />
              <DetailItem label="Location" value={f.location} />
            </dl>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={IS_POLY ? 'Cost per Bag' : 'Cost per Meter'} subtitle={`${pkrM(cost.total)} · selling ${pkr(f.ratePerMeter)}`} />
          <CardBody>
            <BreakdownList format={(v) => pkrM(v)} items={cost.items.map((it, i) => ({ ...it, color: COST_COLORS[i] }))} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Open Orders" subtitle={`${orders.length} orders for this ${TERMS.productOne.toLowerCase()}`} />
          {orders.length === 0 ? (
            <EmptyState icon={<ShoppingBag />} title="No orders" body={`No customer orders for this ${IS_POLY ? 'product' : 'quality'} yet.`} className="py-8" />
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
                      {num(o.quantity)} {TERMS.stock}<br />
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
        <DataTable title={TERMS.packs} subtitle={`${rolls.length} ${TERMS.packs.toLowerCase()} of this ${IS_POLY ? 'product' : 'quality'}`} data={rolls} columns={columns} rowKey={(r) => r.id} onRowClick={(r) => navigate(`/fabric/rolls/${r.id}`)} pageSize={8} emptyMessage={`No ${TERMS.packs.toLowerCase()} recorded for this ${TERMS.productOne.toLowerCase()} this week.`} />
      </div>
    </div>
  )
}
