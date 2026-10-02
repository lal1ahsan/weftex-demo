import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Recycle, Scale, Spool, TrendingDown } from 'lucide-react'
import { Card, CardBody, CardHeader, DataTable, KpiCard, PageHeader, ProgressBar, type Column } from '@/components/ui'
import { CHART, ChartTooltip, axisProps } from '@/components/charts/ChartKit'
import { TableActions } from '@/components/common/TableActions'
import { useApp } from '@/context/AppState'
import { FABRICS, YARNS } from '@/data/inventory'
import { dailyTrend, onDate, totals, YESTERDAY_ISO } from '@/data/metrics'
import { yarnUsedKg } from '@/data/production'
import { TODAY_ISO } from '@/data/seed'
import { cn, kg, num, pct, pkr } from '@/utils/format'

interface Row {
  code: string
  name: string
  construction: string
  produced: number
  yarnKg: number
  wasteKg: number
  pct: number
}

export default function WastagePage() {
  const { production } = useApp()
  const today = totals(onDate(production, TODAY_ISO))
  const yesterday = totals(onDate(production, YESTERDAY_ISO))
  const week = totals(production)
  const trend = dailyTrend(production)
  const avgYarnRate = YARNS.reduce((s, y) => s + y.costPerKg, 0) / YARNS.length

  const rows = useMemo<Row[]>(
    () =>
      FABRICS.map((f) => {
        const rs = production.filter((r) => r.fabricCode === f.code)
        const yarnKg = rs.reduce((s, r) => s + yarnUsedKg(r), 0)
        const wasteKg = rs.reduce((s, r) => s + r.wastageKg, 0)
        return { code: f.code, name: f.name, construction: f.construction, produced: rs.reduce((s, r) => s + r.actual, 0), yarnKg, wasteKg, pct: yarnKg ? (wasteKg / yarnKg) * 100 : 0 }
      }).filter((r) => r.produced > 0),
    [production],
  )

  const columns: Column<Row>[] = [
    { key: 'fabric', header: 'Fabric', cell: (r) => <span><b className="font-semibold text-slate-900">{r.construction}</b> <span className="text-slate-500">{r.name}</span></span>, sort: (r) => r.name },
    { key: 'produced', header: 'Produced', align: 'right', cell: (r) => `${num(r.produced)} m`, sort: (r) => r.produced, hideBelow: 'md' },
    { key: 'yarn', header: 'Yarn Used', align: 'right', cell: (r) => kg(r.yarnKg), sort: (r) => r.yarnKg },
    { key: 'waste', header: 'Wastage', align: 'right', cell: (r) => kg(r.wasteKg), sort: (r) => r.wasteKg },
    {
      key: 'pct',
      header: 'Wastage %',
      align: 'right',
      sort: (r) => r.pct,
      cell: (r) => (
        <div className="ml-auto flex w-32 items-center gap-2">
          <ProgressBar value={r.pct} max={4} tone={r.pct > 2.6 ? 'red' : r.pct > 2.3 ? 'amber' : 'green'} />
          <span className={cn('w-12 font-semibold', r.pct > 2.6 ? 'text-rose-600' : 'text-slate-800')}>{pct(r.pct, 2)}</span>
        </div>
      ),
    },
    { key: 'value', header: 'Loss Value', align: 'right', cell: (r) => pkr(r.wasteKg * avgYarnRate), sort: (r) => r.wasteKg, hideBelow: 'lg' },
  ]

  return (
    <div>
      <PageHeader title="Wastage" description="Where yarn is being lost between issue and finished fabric." breadcrumbs={[{ label: 'Production', to: '/production' }, { label: 'Wastage' }]} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Wastage Today" value={pct(today.wastagePct)} icon={<Recycle />} accent="amber" delta={{ value: `${Math.abs(today.wastagePct - yesterday.wastagePct).toFixed(1)}%`, direction: today.wastagePct <= yesterday.wastagePct ? 'down' : 'up', good: today.wastagePct <= yesterday.wastagePct, label: 'vs yesterday' }} />
        <KpiCard label="Wastage Today (kg)" value={num(today.wasteKg)} unit="kg" icon={<Scale />} accent="red" sub={<span>≈ {pkr(today.wasteKg * avgYarnRate)} of yarn</span>} />
        <KpiCard label="7-day Wastage" value={pct(week.wastagePct)} icon={<TrendingDown />} accent="slate" sub={<span>{num(week.wasteKg)} kg in 7 days</span>} />
        <KpiCard label="Yarn Consumed Today" value={num(today.yarnKg)} unit="kg" icon={<Spool />} accent="violet" />
      </div>

      <Card className="mt-4">
        <CardHeader title="Wastage Trend" subtitle="Last 7 days · factory benchmark 2.5%" />
        <CardBody>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={trend} margin={{ left: -12, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="wasteFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART.amber} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={CHART.amber} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={CHART.grid} />
              <XAxis dataKey="label" {...axisProps} dy={8} />
              <YAxis {...axisProps} domain={[1.5, 3.5]} tickFormatter={(v) => `${v}%`} />
              <Tooltip content={<ChartTooltip formatter={(v) => pct(v, 2)} />} />
              <ReferenceLine y={2.5} stroke={CHART.rose} strokeDasharray="4 4" label={{ value: 'Benchmark 2.5%', position: 'insideTopRight', fill: CHART.rose, fontSize: 12 }} />
              <Area type="monotone" dataKey="wastagePct" name="Wastage" stroke={CHART.amber} strokeWidth={2.5} fill="url(#wasteFill)" dot={{ r: 3, fill: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      <div className="mt-4">
        <DataTable title="Wastage by Fabric" subtitle="Last 7 days" data={rows} columns={columns} rowKey={(r) => r.code} defaultSort={{ key: 'pct', dir: 'desc' }} actions={<TableActions />} />
      </div>
    </div>
  )
}
