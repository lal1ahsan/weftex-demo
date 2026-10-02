import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Bar, CartesianGrid, Line, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertOctagon, CheckCircle2, ChevronLeft, ChevronRight, ClipboardPlus, Factory, TimerOff, Wrench } from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader, DataTable, DetailItem, EfficiencyValue, EmptyState, KpiCard, PageHeader, ProgressBar, StatusBadge, useToast, type Column } from '@/components/ui'
import { CHART, ChartTooltip, Legend, axisProps } from '@/components/charts/ChartKit'
import { ProductionFormModal } from '@/components/forms/ProductionFormModal'
import { DowntimeFormModal } from '@/components/forms/DowntimeFormModal'
import { useApp } from '@/context/AppState'
import { fabricByCode } from '@/data/inventory'
import { ROLLS } from '@/data/commercial'
import { SHIFTS } from '@/data/factory'
import { TODAY_ISO } from '@/data/seed'
import { dailyTrend } from '@/data/metrics'
import type { DowntimeRecord, ProductionRecord } from '@/types'
import { compact, date, duration, meters, num, pct, sum } from '@/utils/format'

export default function LoomDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { looms, production, downtime, setLoomStatus } = useApp()
  const [modal, setModal] = useState<'production' | 'downtime' | null>(null)

  const loom = looms.find((l) => l.id === id)
  const idx = looms.findIndex((l) => l.id === id)

  const records = useMemo(() => production.filter((r) => r.loomId === id), [production, id])
  const stops = useMemo(() => downtime.filter((d) => d.loomId === id), [downtime, id])
  const trend = useMemo(() => dailyTrend(records), [records])
  const rolls = ROLLS.filter((r) => r.loomId === id).slice(0, 6)

  if (!loom) {
    return (
      <Card>
        <EmptyState icon={<Factory />} title={`Loom “${id}” not found`} body="It may have been removed or the link is incorrect." action={<Button onClick={() => navigate('/looms')}>Back to Loom Dashboard</Button>} />
      </Card>
    )
  }

  const fabric = fabricByCode(loom.fabricCode)!
  const today = records.filter((r) => r.date === TODAY_ISO)
  const weekEff = (sum(records, (r) => r.actual) / Math.max(1, sum(records, (r) => r.target))) * 100
  const weekDowntime = sum(stops, (d) => d.minutes)
  const todayStops = stops.filter((s) => s.date === TODAY_ISO).length
  const prev = looms[idx - 1]
  const next = looms[idx + 1]

  const histColumns: Column<ProductionRecord>[] = [
    { key: 'date', header: 'Date', cell: (r) => date(r.date), sort: (r) => r.date },
    { key: 'shift', header: 'Shift', cell: (r) => r.shift },
    { key: 'op', header: 'Operator', cell: (r) => r.operator, hideBelow: 'md' },
    { key: 'target', header: 'Target', align: 'right', cell: (r) => meters(r.target) },
    { key: 'actual', header: 'Actual', align: 'right', cell: (r) => <b className="font-semibold text-slate-900">{meters(r.actual)}</b>, sort: (r) => r.actual },
    { key: 'eff', header: 'Efficiency', align: 'right', cell: (r) => <EfficiencyValue value={r.efficiency} />, sort: (r) => r.efficiency },
    { key: 'waste', header: 'Wastage', align: 'right', cell: (r) => `${r.wastageKg.toFixed(1)} kg`, hideBelow: 'lg' },
  ]

  const resolve = () => {
    setLoomStatus(loom.id, 'Running')
    toast.success(`${loom.id} marked as running`, 'Downtime closed and the supervisor has been notified.')
  }

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Looms', to: '/looms' }, { label: 'Loom Dashboard', to: '/looms' }, { label: loom.id }]}
        title={`Loom ${loom.id}`}
        meta={<StatusBadge status={loom.status} />}
        description={`${loom.manufacturer} ${loom.model} · ${loom.type} · ${loom.hall}`}
        actions={
          <>
            <div className="mr-1 flex">
              <Button size="icon" variant="ghost" disabled={!prev} onClick={() => prev && navigate(`/looms/${prev.id}`)} aria-label="Previous loom">
                <ChevronLeft className="size-4" />
              </Button>
              <Button size="icon" variant="ghost" disabled={!next} onClick={() => next && navigate(`/looms/${next.id}`)} aria-label="Next loom">
                <ChevronRight className="size-4" />
              </Button>
            </div>
            <Button icon={<TimerOff className="size-4" />} onClick={() => setModal('downtime')}>
              Record Downtime
            </Button>
            <Button variant="primary" icon={<ClipboardPlus className="size-4" />} onClick={() => setModal('production')}>
              Add Production
            </Button>
          </>
        }
      />

      {loom.status === 'Stopped' && (
        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <span className="grid size-10 place-items-center rounded-xl bg-white text-rose-600 shadow-sm">
            <AlertOctagon className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-rose-900">
              Stopped since {loom.stoppedSince} · {duration(loom.downtimeMinutes)} lost so far
            </p>
            <p className="text-[13px] text-rose-700">{loom.stopReason} — technician assigned</p>
          </div>
          <Button variant="secondary" icon={<CheckCircle2 className="size-4 text-emerald-600" />} onClick={resolve}>
            Mark as Running
          </Button>
        </div>
      )}
      {loom.status === 'Maintenance' && (
        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-sky-200 bg-sky-50 p-4">
          <span className="grid size-10 place-items-center rounded-xl bg-white text-sky-600 shadow-sm">
            <Wrench className="size-5" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-sky-900">Under planned maintenance</p>
            <p className="text-[13px] text-sky-700">{loom.stopReason} · expected back in Evening shift</p>
          </div>
          <Button variant="secondary" onClick={resolve}>
            Complete maintenance
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Today's Production" value={num(loom.todayProduction)} unit="m" sub={<span>Target {num(loom.target)} m</span>} />
        <KpiCard label="Efficiency Today" value={pct(loom.efficiency)} accent={loom.efficiency >= 90 ? 'green' : 'amber'} footer={<ProgressBar value={loom.efficiency} tone="auto" height="h-2" />} />
        <KpiCard label="Downtime Today" value={loom.downtimeMinutes ? duration(loom.downtimeMinutes) : '0m'} accent="red" sub={<span>{todayStops} {todayStops === 1 ? 'stoppage' : 'stoppages'}</span>} />
        <KpiCard label="7-day Efficiency" value={pct(weekEff)} sub={<span>{duration(weekDowntime)} downtime this week</span>} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title="Loom Information" />
          <CardBody>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
              <DetailItem label="Loom number" value={loom.id} />
              <DetailItem label="Type" value={loom.type} />
              <DetailItem label="Manufacturer" value={loom.manufacturer} />
              <DetailItem label="Model" value={loom.model} />
              <DetailItem label="Reed width" value={`${loom.widthInches}" (${Math.round(loom.widthInches * 2.54)} cm)`} />
              <DetailItem label="Speed" value={`${loom.rpm} RPM`} />
              <DetailItem label="Installed" value={date(loom.installed)} />
              <DetailItem label="Location" value={loom.hall} />
            </dl>
            <div className="mt-5 rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">Current fabric</p>
              <Link to={`/fabric/${fabric.code}`} className="mt-1 block text-sm font-semibold text-brand-700 hover:underline">
                {fabric.code} · {fabric.name}
              </Link>
              <p className="mt-0.5 text-[13px] text-slate-600">
                {fabric.construction} / {fabric.density} · {fabric.widthInches}" · {fabric.gsm} GSM · {fabric.weave}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-line pt-3">
                <DetailItem label="Operator" value={loom.operator} />
                <DetailItem label="Shift" value={`${loom.shift} (${SHIFTS[0].start}–${SHIFTS[0].end})`} />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader
            title="Production — Last 7 Days"
            subtitle="Meters per day vs target"
            actions={
              <Legend
                items={[
                  { label: 'Actual', color: CHART.brand },
                  { label: 'Target', color: CHART.target, dashed: true },
                ]}
              />
            }
          />
          <CardBody>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={trend} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="label" {...axisProps} dy={8} />
                <YAxis {...axisProps} tickFormatter={compact} />
                <Tooltip content={<ChartTooltip formatter={(v) => meters(v)} />} />
                <Bar dataKey="actual" name="Actual" fill={CHART.brand} radius={[6, 6, 0, 0]} maxBarSize={44} />
                <Line dataKey="target" name="Target" stroke={CHART.target} strokeDasharray="5 5" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4">
              {SHIFTS.map((s) => {
                const r = today.find((x) => x.shift === s.name)
                return (
                  <div key={s.name}>
                    <p className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="size-2 rounded-full" style={{ background: s.color }} />
                      {s.name} today
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 num">{r ? meters(r.actual) : '—'}</p>
                    {r && <EfficiencyValue value={r.efficiency} className="text-xs" />}
                  </div>
                )
              })}
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <DataTable title="Recent Production History" subtitle="Shift-wise entries" data={records} columns={histColumns} rowKey={(r) => r.id} pageSize={8} />
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader title="Downtime History" subtitle={`${stops.length} stoppages · ${duration(weekDowntime)}`} />
            {stops.length === 0 ? (
              <EmptyState icon={<CheckCircle2 />} title="No stoppages recorded" body="This loom has run without breakdowns this week." className="py-8" />
            ) : (
              <ul className="divide-y divide-line border-t border-line">
                {stops.slice(0, 5).map((d: DowntimeRecord) => (
                  <li key={d.id} className="flex items-start justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-slate-900">{d.reason}</p>
                      <p className="text-xs text-slate-500">
                        {date(d.date)} · {d.start}
                        {d.end ? `–${d.end}` : ' · ongoing'} · {d.category}
                      </p>
                    </div>
                    <Badge tone={d.end ? 'slate' : 'red'}>{duration(d.minutes)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <CardHeader title="Rolls from this Loom" />
            {rolls.length === 0 ? (
              <EmptyState icon={<Factory />} title="No rolls this week" className="py-8" />
            ) : (
              <ul className="divide-y divide-line border-t border-line">
                {rolls.map((r) => (
                  <li key={r.id}>
                    <Link to={`/fabric/rolls/${r.id}`} className="flex items-center justify-between px-5 py-2.5 text-[13px] hover:bg-slate-50">
                      <span className="font-semibold text-brand-700">{r.id}</span>
                      <span className="text-slate-500 num">
                        {r.meters} m · {r.weightKg} kg
                      </span>
                      <StatusBadge status={r.quality} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <ProductionFormModal open={modal === 'production'} onClose={() => setModal(null)} defaultLoom={loom.id} />
      <DowntimeFormModal open={modal === 'downtime'} onClose={() => setModal(null)} defaultLoom={loom.id} />
    </div>
  )
}
