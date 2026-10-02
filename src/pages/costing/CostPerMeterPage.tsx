import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Coins, Percent, TrendingUp, TriangleAlert } from 'lucide-react'
import { Card, CardBody, CardHeader, DataTable, KpiCard, PageHeader, type Column } from '@/components/ui'
import { CHART, ChartTooltip, Legend, SERIES, axisProps } from '@/components/charts/ChartKit'
import { TableActions } from '@/components/common/TableActions'
import { FABRICS, FABRIC_YARN_RATE } from '@/data/inventory'
import { costPerMeter, type CostBreakdown } from '@/data/costing'
import { cn, pct, pkrM as pkr } from '@/utils/format'

interface Row extends CostBreakdown {
  code: string
  name: string
  construction: string
  rate: number
  margin: number
  marginPct: number
}

const PARTS = [
  { key: 'yarn', label: 'Yarn', color: SERIES[0] },
  { key: 'sizing', label: 'Sizing', color: SERIES[4] },
  { key: 'labour', label: 'Labour', color: SERIES[1] },
  { key: 'electricity', label: 'Electricity', color: SERIES[2] },
  { key: 'maintenance', label: 'Maintenance', color: SERIES[3] },
  { key: 'overhead', label: 'Overhead', color: SERIES[5] },
] as const

export default function CostPerMeterPage() {
  const navigate = useNavigate()
  const rows = useMemo<Row[]>(
    () =>
      FABRICS.map((f) => {
        const c = costPerMeter({ ...f, yarnRate: FABRIC_YARN_RATE[f.code] })
        return { ...c, code: f.code, name: f.name, construction: f.construction, rate: f.ratePerMeter, margin: f.ratePerMeter - c.total, marginPct: ((f.ratePerMeter - c.total) / f.ratePerMeter) * 100 }
      }),
    [],
  )
  const avgMargin = rows.reduce((s, r) => s + r.marginPct, 0) / rows.length
  const best = [...rows].sort((a, b) => b.marginPct - a.marginPct)[0]
  const worst = [...rows].sort((a, b) => a.marginPct - b.marginPct)[0]
  const conv = rows.reduce((s, r) => s + (r.total - r.yarn), 0) / rows.length

  const chart = rows.slice(0, 12).map((r) => ({ ...r, name: r.construction + ' ' + r.name.split(' ')[0] }))

  const columns: Column<Row>[] = [
    { key: 'fabric', header: 'Fabric', cell: (r) => <span><b className="font-semibold text-slate-900">{r.construction}</b> <span className="text-slate-500">{r.name}</span></span>, sort: (r) => r.name },
    { key: 'yarn', header: 'Yarn', align: 'right', cell: (r) => pkr(r.yarn), sort: (r) => r.yarn },
    { key: 'conv', header: 'Conversion', align: 'right', cell: (r) => pkr(r.total - r.yarn), sort: (r) => r.total - r.yarn, hideBelow: 'md' },
    { key: 'elec', header: 'Electricity', align: 'right', cell: (r) => pkr(r.electricity), hideBelow: 'xl' },
    { key: 'lab', header: 'Labour', align: 'right', cell: (r) => pkr(r.labour), hideBelow: 'xl' },
    { key: 'total', header: 'Cost / m', align: 'right', cell: (r) => <b className="font-semibold text-slate-900">{pkr(r.total)}</b>, sort: (r) => r.total },
    { key: 'rate', header: 'Selling / m', align: 'right', cell: (r) => pkr(r.rate), sort: (r) => r.rate, hideBelow: 'lg' },
    { key: 'margin', header: 'Margin / m', align: 'right', cell: (r) => <span className="font-semibold text-emerald-600">+{pkr(r.margin)}</span>, sort: (r) => r.margin },
    { key: 'pct', header: 'Margin %', align: 'right', cell: (r) => <span className={cn('font-semibold', r.marginPct < 10 ? 'text-amber-600' : 'text-slate-900')}>{pct(r.marginPct)}</span>, sort: (r) => r.marginPct },
  ]

  return (
    <div>
      <PageHeader title="Cost per Meter" description="Cost and margin for every fabric quality — based on current yarn rates, tariff and wages." breadcrumbs={[{ label: 'Costing', to: '/costing' }, { label: 'Cost per Meter' }]} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Average Margin" value={pct(avgMargin)} icon={<Percent />} accent="green" sub={<span>Across {rows.length} qualities</span>} />
        <KpiCard label="Avg. Conversion Cost" value={pkr(conv)} unit="/m" icon={<Coins />} accent="brand" sub={<span>Everything except yarn</span>} />
        <KpiCard label="Most Profitable" value={pct(best.marginPct)} icon={<TrendingUp />} accent="teal" sub={<span>{best.construction} {best.name}</span>} to={`/fabric/${best.code}`} />
        <KpiCard label="Lowest Margin" value={pct(worst.marginPct)} icon={<TriangleAlert />} accent="amber" sub={<span>{worst.construction} {worst.name}</span>} to={`/fabric/${worst.code}`} />
      </div>

      <Card className="mt-4">
        <CardHeader title="Cost Build-up per Meter" subtitle="PKR per meter by component" actions={<Legend items={PARTS.map((p) => ({ label: p.label, color: p.color }))} />} />
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
        <DataTable title="Fabric Costing" data={rows} columns={columns} rowKey={(r) => r.code} onRowClick={(r) => navigate(`/fabric/${r.code}`)} defaultSort={{ key: 'pct', dir: 'desc' }} actions={<TableActions printable />} pageSize={20} />
      </div>
    </div>
  )
}
