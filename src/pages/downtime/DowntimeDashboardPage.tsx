import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity, AlertOctagon, ArrowRight, Factory, Plus, Timer } from 'lucide-react'
import type { DowntimeRecord } from '@/types'
import { Badge, Button, Card, CardBody, CardHeader, KpiCard, PageHeader, Tabs } from '@/components/ui'
import { CHART, ChartTooltip, Legend, axisProps } from '@/components/charts/ChartKit'
import { DOWNTIME_COLORS, DowntimeBarChart } from '@/components/charts/Charts'
import { DowntimeFormModal } from '@/components/forms/DowntimeFormModal'
import { DowntimeDetailModal } from '@/components/forms/DowntimeDetailModal'
import { useApp } from '@/context/AppState'
import { downtimeByCategory } from '@/data/metrics'
import { DOWNTIME_CATEGORIES } from '@/data/production'
import { daysAgo, isoDate, TODAY_ISO } from '@/data/seed'
import { dayShort, duration, num } from '@/utils/format'
import { TERMS } from '@/data/dataset'

export default function DowntimeDashboardPage() {
  const { downtime, looms } = useApp()
  const [range, setRange] = useState<'today' | 'week'>('week')
  const [adding, setAdding] = useState(false)
  const [selected, setSelected] = useState<DowntimeRecord | null>(null)

  const records = useMemo(() => (range === 'today' ? downtime.filter((d) => d.date === TODAY_ISO) : downtime), [downtime, range])
  const total = records.reduce((s, d) => s + d.minutes, 0)
  const loomsAffected = new Set(records.map((d) => d.loomId)).size
  const byCat = downtimeByCategory(records)
  const ongoing = downtime.filter((d) => !d.end)

  const daily = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const iso = isoDate(daysAgo(6 - i))
        const row: Record<string, number | string> = { label: iso === TODAY_ISO ? 'Today' : dayShort(iso) }
        DOWNTIME_CATEGORIES.forEach((c) => (row[c] = downtime.filter((d) => d.date === iso && d.category === c).reduce((s, d) => s + d.minutes, 0)))
        return row
      }),
    [downtime],
  )

  const topLooms = useMemo(() => {
    const map = new Map<string, { minutes: number; count: number }>()
    records.forEach((d) => {
      const c = map.get(d.loomId) ?? { minutes: 0, count: 0 }
      map.set(d.loomId, { minutes: c.minutes + d.minutes, count: c.count + 1 })
    })
    return [...map.entries()].sort((a, b) => b[1].minutes - a[1].minutes).slice(0, 6)
  }, [records])

  return (
    <div>
      <PageHeader
        title="Downtime Dashboard"
        description={`Why ${TERMS.machines.toLowerCase()} are stopping, for how long, and who needs to act.`}
        breadcrumbs={[{ label: 'Downtime' }, { label: 'Downtime Dashboard' }]}
        actions={
          <>
            <Tabs
              value={range}
              onChange={setRange}
              tabs={[
                { value: 'today', label: 'Today' },
                { value: 'week', label: 'Last 7 days' },
              ]}
            />
            <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>
              Record Downtime
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Downtime" value={duration(total)} icon={<Timer />} accent="red" sub={<span>{range === 'today' ? 'Today' : 'Last 7 days'}</span>} />
        <KpiCard label="Average per Breakdown" value={duration(records.length ? total / records.length : 0)} icon={<Activity />} accent="amber" sub={<span>Benchmark under 40m</span>} />
        <KpiCard label="Breakdowns" value={num(records.length)} icon={<AlertOctagon />} accent="violet" sub={<span>{ongoing.length} ongoing right now</span>} />
        <KpiCard label={`${TERMS.machines} Affected`} value={num(loomsAffected)} icon={<Factory />} accent="slate" sub={<span>of {looms.length} {TERMS.machines.toLowerCase()}</span>} />
      </div>

      {ongoing.length > 0 && (
        <Card className="mt-4 border-rose-200">
          <CardHeader title="Stopped Right Now" subtitle="Ongoing stoppages — click to view breakdown" actions={<Badge tone="red" dot>{ongoing.length} {TERMS.machines.toLowerCase()}</Badge>} />
          <div className="grid gap-px border-t border-line bg-line sm:grid-cols-2 xl:grid-cols-3">
            {ongoing.map((d) => (
              <button key={d.id} onClick={() => setSelected(d)} className="flex items-start gap-3 bg-white px-5 py-4 text-left hover:bg-rose-50/40">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-rose-50 font-display text-xs font-semibold text-rose-700">{d.loomId.replace(TERMS.idPrefix, '')}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-slate-900">{d.loomId}</span>
                    <span className="text-xs font-semibold text-rose-600 num">{duration(d.minutes)}</span>
                  </span>
                  <span className="block truncate text-xs text-slate-600">{d.reason}</span>
                  <span className="block text-xs text-slate-400">
                    Since {d.start} · {d.department}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </Card>
      )}

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Downtime by Reason" subtitle={range === 'today' ? 'Today' : 'Last 7 days'} />
          <CardBody>
            <DowntimeBarChart data={byCat} height={280} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Daily Downtime" subtitle="Minutes per day, by category" />
          <CardBody>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={daily} margin={{ left: -8, right: 8 }}>
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="label" {...axisProps} dy={8} />
                <YAxis {...axisProps} tickFormatter={(v) => `${Math.round(v / 60)}h`} />
                <Tooltip content={<ChartTooltip formatter={(v) => duration(v)} />} />
                {DOWNTIME_CATEGORIES.map((c, i) => (
                  <Bar key={c} dataKey={c} stackId="a" fill={DOWNTIME_COLORS[c]} maxBarSize={40} radius={i === DOWNTIME_CATEGORIES.length - 1 ? [4, 4, 0, 0] : undefined} />
                ))}
              </BarChart>
            </ResponsiveContainer>
            <Legend className="mt-3" items={DOWNTIME_CATEGORIES.map((c) => ({ label: c, color: DOWNTIME_COLORS[c] }))} />
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title={`Most Affected ${TERMS.machines}`} subtitle={range === 'today' ? 'Today' : 'Last 7 days'} />
          <ul className="divide-y divide-line border-t border-line">
            {topLooms.map(([loomId, v], i) => (
              <li key={loomId}>
                <Link to={`/looms/${loomId}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                  <span className="w-5 text-xs font-semibold text-slate-400">{i + 1}</span>
                  <span className="flex-1 text-[13px] font-semibold text-slate-900">{loomId}</span>
                  <span className="text-xs text-slate-500">{v.count} stops</span>
                  <span className="w-16 text-right text-[13px] font-semibold text-slate-900 num">{duration(v.minutes)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader
            title="Recent Breakdowns"
            actions={
              <Link to="/downtime/records" className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-600 hover:text-brand-700">
                All records <ArrowRight className="size-3.5" />
              </Link>
            }
          />
          <ul className="divide-y divide-line border-t border-line">
            {records.slice(0, 7).map((d) => (
              <li key={d.id}>
                <button onClick={() => setSelected(d)} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-slate-50">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: DOWNTIME_COLORS[d.category] }} />
                  <span className="w-12 text-[13px] font-semibold text-slate-900">{d.loomId}</span>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-slate-600">{d.reason}</span>
                  <span className="hidden text-xs text-slate-400 sm:block">
                    {dayShort(d.date)} · {d.start}
                  </span>
                  <Badge tone={d.end ? 'slate' : 'red'}>{duration(d.minutes)}</Badge>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <DowntimeFormModal open={adding} onClose={() => setAdding(false)} />
      <DowntimeDetailModal record={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
