import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Factory, Gauge, Plus, Recycle, Ruler, Target } from 'lucide-react'
import type { ProductionRecord } from '@/types'
import { Badge, Button, Card, CardBody, CardHeader, DataTable, EfficiencyValue, KpiCard, PageHeader, type Column } from '@/components/ui'
import { CHART, ChartTooltip, Legend, axisProps } from '@/components/charts/ChartKit'
import { ProductionTrendChart } from '@/components/charts/Charts'
import { ProductionFormModal } from '@/components/forms/ProductionFormModal'
import { useApp } from '@/context/AppState'
import { fabricByCode } from '@/data/inventory'
import { SHIFTS } from '@/data/factory'
import { byShift, dailyTrend, loomStatusCounts, onDate, totals, YESTERDAY_ISO } from '@/data/metrics'
import { TODAY_ISO } from '@/data/seed'
import { compact, meters, num, pct } from '@/utils/format'

export default function ProductionDashboardPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { production, looms } = useApp()
  const [adding, setAdding] = useState(false)
  const [fresh, setFresh] = useState<string[]>([])

  useEffect(() => {
    if (params.get('add') === '1') {
      setAdding(true)
      params.delete('add')
      setParams(params, { replace: true })
    }
  }, [params, setParams])

  const today = useMemo(() => onDate(production, TODAY_ISO), [production])
  const t = totals(today)
  const SHIFT_ORDER = { Morning: 0, Evening: 1, Night: 2 }
  const todaySorted = useMemo(
    () => [...today].sort((a, b) => Number(fresh.includes(b.id)) - Number(fresh.includes(a.id)) || a.loomId.localeCompare(b.loomId) || SHIFT_ORDER[a.shift] - SHIFT_ORDER[b.shift]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [today, fresh],
  )
  const y = totals(onDate(production, YESTERDAY_ISO))
  const trend = useMemo(() => dailyTrend(production), [production])
  const shifts = byShift(today)
  const status = loomStatusCounts(looms)

  const byFabric = useMemo(() => {
    const map = new Map<string, number>()
    today.forEach((r) => map.set(r.fabricCode, (map.get(r.fabricCode) ?? 0) + r.actual))
    return [...map.entries()]
      .map(([code, value]) => ({ code, name: `${fabricByCode(code)?.construction} ${fabricByCode(code)?.name}`, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [today])

  const halls = ['Hall A', 'Hall B', 'Hall C'].map((hall) => {
    const ids = new Set(looms.filter((l) => l.hall === hall).map((l) => l.id))
    const tt = totals(today.filter((r) => ids.has(r.loomId)))
    return { hall, actual: tt.actual, target: tt.target }
  })

  const columns: Column<ProductionRecord>[] = [
    {
      key: 'loom',
      header: 'Loom',
      cell: (r) => (
        <span className="flex items-center gap-2 font-semibold text-slate-900">
          {r.loomId}
          {fresh.includes(r.id) && <Badge tone="green">New</Badge>}
        </span>
      ),
      sort: (r) => r.loomId,
    },
    { key: 'shift', header: 'Shift', cell: (r) => r.shift, sort: (r) => r.shift },
    { key: 'op', header: 'Operator', cell: (r) => r.operator, hideBelow: 'lg' },
    { key: 'fabric', header: 'Fabric', cell: (r) => fabricByCode(r.fabricCode)?.construction, hideBelow: 'md' },
    { key: 'target', header: 'Target', align: 'right', cell: (r) => meters(r.target), hideBelow: 'md' },
    { key: 'actual', header: 'Actual', align: 'right', cell: (r) => <b className="font-semibold text-slate-900">{meters(r.actual)}</b>, sort: (r) => r.actual },
    { key: 'eff', header: 'Efficiency', align: 'right', cell: (r) => <EfficiencyValue value={r.efficiency} />, sort: (r) => r.efficiency },
    { key: 'waste', header: 'Wastage', align: 'right', cell: (r) => `${r.wastageKg.toFixed(1)} kg`, sort: (r) => r.wastageKg, hideBelow: 'xl' },
  ]

  return (
    <div>
      <PageHeader
        title="Production Dashboard"
        description="Today's output across all halls, shifts and fabrics."
        breadcrumbs={[{ label: 'Production' }, { label: 'Production Dashboard' }]}
        actions={
          <>
            <Button onClick={() => navigate('/production/daily')}>Daily register</Button>
            <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>
              Add Production
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Production Today" value={num(t.actual)} unit="m" icon={<Ruler />} delta={{ value: `${(((t.actual - y.actual) / y.actual) * 100).toFixed(1)}%`, direction: t.actual >= y.actual ? 'up' : 'down', good: t.actual >= y.actual, label: 'vs yesterday' }} />
        <KpiCard label="Target" value={num(t.target)} unit="m" icon={<Target />} accent="slate" sub={<span>Gap {num(Math.max(0, t.target - t.actual))} m</span>} />
        <KpiCard label="Efficiency" value={pct(t.efficiency)} icon={<Gauge />} accent="green" delta={{ value: `${(t.efficiency - y.efficiency >= 0 ? '+' : '')}${(t.efficiency - y.efficiency).toFixed(1)}%`, direction: t.efficiency >= y.efficiency ? 'up' : 'down', good: t.efficiency >= y.efficiency, label: 'vs yesterday' }} />
        <KpiCard label="Wastage" value={pct(t.wastagePct)} icon={<Recycle />} accent="amber" sub={<span>{num(t.wasteKg)} kg of {num(t.yarnKg)} kg yarn</span>} to="/production/wastage" />
        <KpiCard label="Looms Running" value={`${status.Running}/${looms.length}`} icon={<Factory />} accent="teal" sub={<span>{status.Stopped} stopped · {status.Maintenance} maintenance</span>} to="/looms/status" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Production vs Target" subtitle="Last 7 days" actions={<Legend items={[{ label: 'Actual', color: CHART.brand }, { label: 'Target', color: CHART.target, dashed: true }]} />} />
          <CardBody>
            <ProductionTrendChart data={trend} height={270} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Shift Performance" subtitle="Today" />
          <CardBody className="space-y-4">
            {shifts.map((s, i) => (
              <div key={s.shift} className="rounded-xl border border-line p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <span className="size-2.5 rounded-full" style={{ background: SHIFTS[i].color }} />
                    {s.shift} <span className="font-normal text-slate-400">· Shift {SHIFTS[i].code}</span>
                  </span>
                  <EfficiencyValue value={s.efficiency} />
                </div>
                <div className="mt-2 flex items-baseline justify-between text-[13px] text-slate-500 num">
                  <span>
                    <b className="font-display text-lg font-semibold text-slate-900">{num(s.actual)}</b> m
                  </span>
                  <span>Supervisor: {SHIFTS[i].supervisor}</span>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Production by Fabric" subtitle="Today · top 8 constructions" />
          <CardBody>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byFabric} layout="vertical" margin={{ left: 8, right: 16 }} barCategoryGap="25%">
                <CartesianGrid horizontal={false} stroke={CHART.grid} />
                <XAxis type="number" {...axisProps} tickFormatter={compact} />
                <YAxis type="category" dataKey="name" {...axisProps} width={150} />
                <Tooltip content={<ChartTooltip formatter={(v) => meters(v)} />} />
                <Bar dataKey="value" name="Production" fill={CHART.brand} radius={[0, 4, 4, 0]} onClick={(d: { code?: string }) => d.code && navigate(`/fabric/${d.code}`)} className="cursor-pointer" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Production by Hall" subtitle="Today · actual vs target" actions={<Legend items={[{ label: 'Actual', color: CHART.brand }, { label: 'Target', color: '#dfe6ff' }]} />} />
          <CardBody>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={halls} margin={{ left: -8, right: 8 }} barGap={6}>
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="hall" {...axisProps} dy={8} />
                <YAxis {...axisProps} tickFormatter={compact} />
                <Tooltip content={<ChartTooltip formatter={(v) => meters(v)} />} />
                <Bar dataKey="target" name="Target" fill="#dfe6ff" radius={[6, 6, 0, 0]} maxBarSize={48} />
                <Bar dataKey="actual" name="Actual" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {halls.map((h) => (
                    <Cell key={h.hall} fill={h.actual / h.target >= 0.95 ? CHART.green : CHART.brand} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      <div className="mt-4">
        <DataTable
          title="Today's Production Entries"
          subtitle={`${num(today.length)} shift entries`}
          data={todaySorted}
          columns={columns}
          rowKey={(r) => r.id}
          searchText={(r) => `${r.loomId} ${r.operator} ${r.fabricCode}`}
          searchPlaceholder="Search loom or operator…"
          filters={[
            { label: 'Shift', options: ['Morning', 'Evening', 'Night'], value: (r) => r.shift },
            { label: 'Fabric', options: [...new Set(today.map((r) => r.fabricCode))].sort(), value: (r) => r.fabricCode },
          ]}
          onRowClick={(r) => navigate(`/looms/${r.loomId}`)}
          rowClassName={(r) => (fresh.includes(r.id) ? 'bg-emerald-50/50' : undefined)}
        />
      </div>

      <ProductionFormModal open={adding} onClose={() => setAdding(false)} onSaved={(r) => setFresh((f) => [...f, r.id])} />
    </div>
  )
}

