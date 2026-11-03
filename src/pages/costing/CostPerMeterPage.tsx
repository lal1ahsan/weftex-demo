import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Coins, Percent, TrendingUp, TriangleAlert } from 'lucide-react'
import { Card, CardBody, CardHeader, DataTable, KpiCard, PageHeader, type Column } from '@/components/ui'
import { CHART, ChartTooltip, Legend, SERIES, axisProps } from '@/components/charts/ChartKit'
import { TableActions } from '@/components/common/TableActions'
import { FABRICS } from '@/data/inventory'
import { unitCost } from '@/data/metrics'
import { cn, pct, pkrM as pkr } from '@/utils/format'
import { IS_POLY, TERMS } from '@/data/dataset'

interface Row {
  /** Cost lines p0…p5, in PARTS order; p0 is the raw material. */
  p0: number
  p1: number
  p2: number
  p3: number
  p4: number
  p5: number
  total: number
  code: string
  name: string
  construction: string
  rate: number
  margin: number
  marginPct: number
}

const COLORS = [SERIES[0], SERIES[4], SERIES[1], SERIES[2], SERIES[3], SERIES[5]]
const KEYS = ['p0', 'p1', 'p2', 'p3', 'p4', 'p5'] as const
/** Weaving: yarn, sizing, labour, electricity, maintenance, overhead. Poly bags: granules and each stage. */
const PARTS = unitCost(FABRICS[0]).items.map((it, i) => ({ key: KEYS[i], label: it.label, color: COLORS[i] }))
const U = IS_POLY ? 'bag' : 'm'
const UNIT_TITLE = IS_POLY ? 'Bag' : 'Meter'
/** The two cost lines shown as their own columns. */
const SHOWN: [(typeof KEYS)[number], string, string][] = IS_POLY
  ? [['p1', 'ext', 'Extrusion'], ['p2', 'wv', 'Weaving']]
  : [['p3', 'elec', 'Electricity'], ['p2', 'lab', 'Labour']]

export default function CostPerMeterPage() {
  const navigate = useNavigate()
  const rows = useMemo<Row[]>(
    () =>
      FABRICS.map((f) => {
        const u = unitCost(f)
        const c = { ...(Object.fromEntries(u.items.map((it, i) => [KEYS[i], it.value])) as Record<(typeof KEYS)[number], number>), total: u.total }
        return { ...c, code: f.code, name: f.name, construction: f.construction, rate: f.ratePerMeter, margin: f.ratePerMeter - c.total, marginPct: ((f.ratePerMeter - c.total) / f.ratePerMeter) * 100 }
      }),
    [],
  )
  const avgMargin = rows.reduce((s, r) => s + r.marginPct, 0) / rows.length
  const best = [...rows].sort((a, b) => b.marginPct - a.marginPct)[0]
  const worst = [...rows].sort((a, b) => a.marginPct - b.marginPct)[0]
  const conv = rows.reduce((s, r) => s + (r.total - r.p0), 0) / rows.length

  const chart = rows.slice(0, 12).map((r) => ({ ...r, name: r.construction + ' ' + r.name.split(' ')[0] }))

  const columns: Column<Row>[] = [
    { key: 'fabric', header: TERMS.productOne, cell: (r) => <span><b className="font-semibold text-slate-900">{r.construction}</b> <span className="text-slate-500">{r.name}</span></span>, sort: (r) => r.name },
    { key: 'yarn', header: TERMS.raw, align: 'right', cell: (r) => pkr(r.p0), sort: (r) => r.p0 },
    { key: 'conv', header: 'Conversion', align: 'right', cell: (r) => pkr(r.total - r.p0), sort: (r) => r.total - r.p0, hideBelow: 'md' },
    ...SHOWN.map(([k, key, header]): Column<Row> => ({ key, header, align: 'right', cell: (r) => pkr(r[k]), hideBelow: 'xl' })),
    { key: 'total', header: `Cost / ${U}`, align: 'right', cell: (r) => <b className="font-semibold text-slate-900">{pkr(r.total)}</b>, sort: (r) => r.total },
    { key: 'rate', header: `Selling / ${U}`, align: 'right', cell: (r) => pkr(r.rate), sort: (r) => r.rate, hideBelow: 'lg' },
    { key: 'margin', header: `Margin / ${U}`, align: 'right', cell: (r) => <span className="font-semibold text-emerald-600">+{pkr(r.margin)}</span>, sort: (r) => r.margin },
    { key: 'pct', header: 'Margin %', align: 'right', cell: (r) => <span className={cn('font-semibold', r.marginPct < 10 ? 'text-amber-600' : 'text-slate-900')}>{pct(r.marginPct)}</span>, sort: (r) => r.marginPct },
  ]

  return (
    <div>
      <PageHeader title={`Cost per ${UNIT_TITLE}`} description={IS_POLY ? 'Cost and margin for every bag product — based on current granule rates, tariff and wages.' : 'Cost and margin for every fabric quality — based on current yarn rates, tariff and wages.'} breadcrumbs={[{ label: 'Costing', to: '/costing' }, { label: `Cost per ${UNIT_TITLE}` }]} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Average Margin" value={pct(avgMargin)} icon={<Percent />} accent="green" sub={<span>Across {rows.length} {IS_POLY ? 'products' : 'qualities'}</span>} />
        <KpiCard label="Avg. Conversion Cost" value={pkr(conv)} unit={`/${U}`} icon={<Coins />} accent="brand" sub={<span>Everything except {TERMS.raw.toLowerCase()}</span>} />
        <KpiCard label="Most Profitable" value={pct(best.marginPct)} icon={<TrendingUp />} accent="teal" sub={<span>{best.construction} {best.name}</span>} to={`/fabric/${best.code}`} />
        <KpiCard label="Lowest Margin" value={pct(worst.marginPct)} icon={<TriangleAlert />} accent="amber" sub={<span>{worst.construction} {worst.name}</span>} to={`/fabric/${worst.code}`} />
      </div>

      <Card className="mt-4">
        <CardHeader title={`Cost Build-up per ${UNIT_TITLE}`} subtitle={`PKR per ${UNIT_TITLE.toLowerCase()} by component`} actions={<Legend items={PARTS.map((p) => ({ label: p.label, color: p.color }))} />} />
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chart} margin={{ left: -4, right: 8 }}>
              <CartesianGrid vertical={false} stroke={CHART.grid} />
              <XAxis dataKey="name" {...axisProps} interval={0} angle={-20} textAnchor="end" height={56} tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis {...axisProps} tickFormatter={(v) => `${v}`} />
              <Tooltip content={<ChartTooltip formatter={(v) => pkr(v)} />} />
              {PARTS.map((p, i) => (
                <Bar key={p.key} dataKey={p.key} name={p.label} stackId="c" fill={p.color} maxBarSize={36} radius={i === PARTS.length - 1 ? [4, 4, 0, 0] : undefined} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      <div className="mt-4">
        <DataTable title={`${TERMS.productOne} Costing`} data={rows} columns={columns} rowKey={(r) => r.code} onRowClick={(r) => navigate(`/fabric/${r.code}`)} defaultSort={{ key: 'pct', dir: 'desc' }} actions={<TableActions printable />} pageSize={20} />
      </div>
    </div>
  )
}
