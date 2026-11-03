import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Factory,
  FileDown,
  Gauge,
  Layers,
  PackageOpen,
  Plus,
  Recycle,
  Ruler,
  Spool,
  Sun,
  Timer,
  Wallet,
  Wrench,
} from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader, KpiCard, ProgressBar, Tabs, useToast } from '@/components/ui'
import { BreakdownList, Legend, CHART } from '@/components/charts/ChartKit'
import { DonutChart, DOWNTIME_COLORS, LoomEfficiencyChart, ProductionTrendChart } from '@/components/charts/Charts'
import { useApp } from '@/context/AppState'
import { SHIFTS } from '@/data/factory'
import { useAccount } from '@/context/Account'
import { FABRICS, YARNS, yarnStatus } from '@/data/inventory'
import { CUSTOMERS, ENERGY, SALES_ORDERS, customerById } from '@/data/commercial'
import { IS_POLY, TERMS } from '@/data/dataset'
import { DEMO_TODAY, TODAY_ISO } from '@/data/seed'
import { byLoom, byShift, dailyTrend, downtimeByCategory, loomStatusCounts, onDate, productionValue, totals, YESTERDAY_ISO } from '@/data/metrics'
import { cn, dateLong, delta, duration, meters, num, pct, pkrCompact, pkrM, sum } from '@/utils/format'

export default function DashboardPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { production, downtime, looms } = useApp()
  const { me } = useAccount()
  const [effView, setEffView] = useState<'lowest' | 'highest' | 'all'>('lowest')
  const [dtRange, setDtRange] = useState<'today' | 'week'>('today')

  const m = useMemo(() => {
    const today = totals(onDate(production, TODAY_ISO))
    const yesterday = totals(onDate(production, YESTERDAY_ISO))
    const dtToday = downtime.filter((d) => d.date === TODAY_ISO)
    const dtYesterday = downtime.filter((d) => d.date === YESTERDAY_ISO)
    return {
      today,
      yesterday,
      trend: dailyTrend(production),
      shifts: byShift(onDate(production, TODAY_ISO)),
      loomEff: byLoom(onDate(production, TODAY_ISO)),
      dtToday: sum(dtToday, (d) => d.minutes),
      dtYesterday: sum(dtYesterday, (d) => d.minutes),
      status: loomStatusCounts(looms),
    }
  }, [production, downtime, looms])

  const dtData = useMemo(() => downtimeByCategory(dtRange === 'today' ? downtime.filter((d) => d.date === TODAY_ISO) : downtime), [downtime, dtRange])

  const effData = useMemo(() => {
    const sorted = [...m.loomEff].sort((a, b) => a.efficiency - b.efficiency)
    if (effView === 'lowest') return sorted.slice(0, 16)
    if (effView === 'highest') return sorted.slice(-16).reverse()
    return [...m.loomEff].sort((a, b) => a.loomId.localeCompare(b.loomId))
  }, [m.loomEff, effView])

  const yarnValue = sum(YARNS, (y) => y.stockKg * y.costPerKg)
  const fabricValue = sum(FABRICS, (f) => f.meters * f.ratePerMeter)
  const receivables = sum(CUSTOMERS, (c) => c.outstanding)
  const effDelta = m.today.efficiency - m.yesterday.efficiency
  const dtDelta = delta(m.dtToday, m.dtYesterday)
  const wasteDelta = m.today.wastagePct - m.yesterday.wastagePct

  // Business snapshot (today's production valued at selling rates vs cost per meter, or per bag)
  const snapshot = useMemo(() => {
    const v = productionValue(onDate(production, TODAY_ISO))
    return { value: v.value, cost: v.cost, margin: v.margin, costPerM: v.costPerUnit }
  }, [production])

  const attention = [
    ...looms
      .filter((l) => l.status === 'Stopped')
      .sort((a, b) => (a.stoppedSince ?? '').localeCompare(b.stoppedSince ?? ''))
      .map((l) => ({ key: l.id, tone: 'red' as const, title: `${l.id} stopped since ${l.stoppedSince}`, body: l.stopReason ?? '', to: `/looms/${l.id}` })),
    ...YARNS.filter((y) => yarnStatus(y) !== 'In Stock')
      .slice(0, 2)
      .map((y) => ({ key: y.code, tone: 'amber' as const, title: `${y.name} ${y.count} ${y.type} — ${yarnStatus(y).toLowerCase()}`, body: `${num(y.stockKg)} kg left · minimum ${num(y.minStockKg)} kg`, to: `/yarn?q=${y.code}` })),
    ...SALES_ORDERS.filter((o) => o.id === 'SO-1024').map((o) => ({
      key: o.id,
      tone: 'blue' as const,
      title: `${o.id} due tomorrow`,
      body: `${customerById(o.customerId)?.name} · ${num(o.quantity - o.delivered)} ${TERMS.stock} pending`,
      to: `/sales/orders/${o.id}`,
    })),
  ]

  const halls = TERMS.areas.map((hall) => {
    const ls = looms.filter((l) => l.hall === hall)
    const a = sum(ls, (l) => l.todayProduction)
    const t = sum(ls, (l) => l.target)
    return { hall, looms: ls.length, running: ls.filter((l) => l.status === 'Running').length, actual: a, efficiency: (a / t) * 100 }
  })

  const weakest = [...halls].sort((a, b) => a.efficiency - b.efficiency)[0]
  const weakestStops = looms.filter((l) => l.hall === weakest?.hall && l.status === 'Stopped').slice(0, 2)

  const energy = ENERGY[ENERGY.length - 1]
  const hour = DEMO_TODAY.getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-slate-500">{dateLong(DEMO_TODAY)}</p>
          <h1 className="mt-1 text-[28px] font-semibold text-slate-900">
            {greeting}, {me?.firstName}
          </h1>
          <p className="mt-1 text-[15px] text-slate-500">Here's what's happening in your factory today.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 hidden items-center gap-1.5 text-[13px] text-slate-500 sm:inline-flex">
            <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
            Updated 2 min ago
          </span>
          <Button icon={<FileDown className="size-4" />} onClick={() => toast.demo('The daily owner report (PDF / WhatsApp) is available in the production version.')}>
            Daily report
          </Button>
          <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => navigate('/production?add=1')}>
            Add Production
          </Button>
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={`Total ${TERMS.machines}`}
          value={looms.length}
          icon={<Factory />}
          to="/looms"
          footer={
            <div>
              <div className="flex h-2 overflow-hidden rounded-full bg-slate-100">
                <span className="bg-emerald-500" style={{ width: `${(m.status.Running / looms.length) * 100}%` }} />
                <span className="bg-amber-400" style={{ width: `${(m.status.Idle / looms.length) * 100}%` }} />
                <span className="bg-rose-500" style={{ width: `${(m.status.Stopped / looms.length) * 100}%` }} />
                <span className="bg-sky-500" style={{ width: `${(m.status.Maintenance / looms.length) * 100}%` }} />
              </div>
              <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[13px]">
                <span className="text-slate-600"><b className="font-semibold text-emerald-600 num">{m.status.Running}</b> Running</span>
                <span className="text-slate-600"><b className="font-semibold text-rose-600 num">{m.status.Stopped}</b> Stopped</span>
                <span className="text-slate-600"><b className="font-semibold text-sky-600 num">{m.status.Maintenance}</b> Maint.</span>
              </div>
            </div>
          }
        />
        <KpiCard
          label="Today's Production"
          value={num(m.today.actual)}
          unit={TERMS.out}
          icon={<Ruler />}
          to="/production"
          footer={
            <div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-slate-600">
                  <b className="font-semibold text-slate-900 num">{pct(m.today.efficiency)}</b> of target
                </span>
                <span className="text-slate-500 num">{num(m.today.target)} {TERMS.out}</span>
              </div>
              <ProgressBar value={m.today.efficiency} className="mt-2" height="h-2" />
            </div>
          }
        />
        <KpiCard
          label={`${TERMS.machine} Efficiency`}
          value={pct(m.today.efficiency)}
          icon={<Gauge />}
          accent="green"
          to="/looms/status"
          delta={{ value: `${effDelta >= 0 ? '+' : ''}${effDelta.toFixed(1)}%`, direction: effDelta >= 0 ? 'up' : 'down', good: effDelta >= 0, label: 'vs yesterday' }}
          footer={<p className="text-[13px] text-slate-500">Target efficiency <b className="font-semibold text-slate-800">92.0%</b></p>}
        />
        <KpiCard
          label="Downtime Today"
          value={duration(m.dtToday)}
          icon={<Timer />}
          accent="red"
          to="/downtime"
          delta={{ value: `${dtDelta.toFixed(1)}%`, direction: dtDelta <= 0 ? 'down' : 'up', good: dtDelta <= 0, label: 'vs yesterday' }}
          footer={
            <p className="text-[13px] text-slate-500">
              <b className="font-semibold text-slate-800 num">{downtime.filter((d) => d.date === TODAY_ISO).length}</b> stoppages ·{' '}
              <b className="font-semibold text-slate-800 num">{m.status.Stopped}</b> {TERMS.machines.toLowerCase()} down now
            </p>
          }
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Wastage"
          value={pct(m.today.wastagePct)}
          icon={<Recycle />}
          accent="amber"
          to="/production/wastage"
          delta={{ value: `${Math.abs(wasteDelta).toFixed(1)}%`, direction: wasteDelta <= 0 ? 'down' : 'up', good: wasteDelta <= 0, label: wasteDelta <= 0 ? 'better' : 'worse' }}
        />
        <KpiCard label={`${TERMS.raw} Stock`} value={pkrCompact(yarnValue)} icon={<Spool />} accent="violet" to="/yarn" sub={<span>{num(sum(YARNS, (y) => y.stockKg))} kg · {YARNS.length} {IS_POLY ? 'items' : 'counts'}</span>} />
        <KpiCard label={`${TERMS.product} Stock`} value={pkrCompact(fabricValue)} icon={<Layers />} accent="teal" to="/fabric" sub={<span>{num(sum(FABRICS, (f) => f.meters))} {TERMS.stock} · {num(sum(FABRICS, (f) => f.rolls))} {TERMS.packs.toLowerCase()}</span>} />
        <KpiCard label="Receivables" value={pkrCompact(receivables)} icon={<Wallet />} accent="slate" to="/sales/customers" sub={<span>{CUSTOMERS.filter((c) => c.outstanding > 0).length} customers · PKR 4.1M overdue</span>} />
      </div>

      {/* Trend + shift */}
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Production Trend"
            subtitle={`Last 7 days · ${TERMS.outLong}`}
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
            <ProductionTrendChart data={m.trend} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Production by Shift" subtitle={`Today · ${TERMS.outLong}`} />
          <CardBody>
            <DonutChart
              data={m.shifts.map((s, i) => ({ name: s.shift, value: s.actual, color: SHIFTS[i].color }))}
              format={meters}
              centerValue={`${(m.today.actual / 1000).toFixed(1)}K`}
              centerLabel={TERMS.outLong}
              height={190}
            />
            <ul className="mt-4 divide-y divide-line">
              {m.shifts.map((s, i) => (
                <li key={s.shift} className="flex items-center justify-between py-2.5 text-[13px]">
                  <span className="flex items-center gap-2.5">
                    <span className="size-2.5 rounded-full" style={{ background: SHIFTS[i].color }} />
                    <span className="font-medium text-slate-800">{s.shift}</span>
                    <span className="text-slate-400">{SHIFTS[i].start}–{SHIFTS[i].end}</span>
                  </span>
                  <span className="text-right num">
                    <b className="font-semibold text-slate-900">{num(s.actual)} {TERMS.out}</b>
                    <span className={cn('ml-2', s.efficiency >= 95 ? 'text-emerald-600' : 'text-slate-500')}>{pct(s.efficiency)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      {/* Loom efficiency + downtime */}
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title={`${TERMS.machine} Efficiency`}
            subtitle={`Today · click a bar to open the ${TERMS.machine.toLowerCase()}`}
            actions={
              <Tabs
                value={effView}
                onChange={setEffView}
                tabs={[
                  { value: 'lowest', label: 'Lowest 16' },
                  { value: 'highest', label: 'Highest 16' },
                  { value: 'all', label: `All ${looms.length}` },
                ]}
              />
            }
          />
          <CardBody>
            <LoomEfficiencyChart data={effData} height={268} />
            <Legend
              className="mt-3"
              items={[
                { label: '≥ 95%', color: CHART.green },
                { label: '85–95%', color: CHART.brand },
                { label: '70–85%', color: CHART.amber },
                { label: '< 70%', color: CHART.rose },
              ]}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader
            title="Downtime Analysis"
            subtitle="By reason"
            actions={
              <Tabs
                value={dtRange}
                onChange={setDtRange}
                tabs={[
                  { value: 'today', label: 'Today' },
                  { value: 'week', label: '7 days' },
                ]}
              />
            }
          />
          <CardBody>
            <DonutChart
              data={dtData.map((d) => ({ name: d.category, value: d.minutes, color: DOWNTIME_COLORS[d.category] }))}
              format={duration}
              centerValue={duration(sum(dtData, (d) => d.minutes))}
              centerLabel="total downtime"
              height={180}
            />
            <div className="mt-4">
              <BreakdownList items={dtData.slice(0, 5).map((d) => ({ label: d.category, value: d.minutes, color: DOWNTIME_COLORS[d.category] }))} format={duration} />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Attention / halls / business */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader title="Needs Attention" subtitle={`${attention.length} items`} actions={<Badge tone="red">{m.status.Stopped} {TERMS.machines.toLowerCase()} down</Badge>} />
          <ul className="divide-y divide-line border-t border-line">
            {attention.slice(0, 7).map((a) => (
              <li key={a.key}>
                <Link to={a.to} className="group flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                  <span
                    className={cn(
                      'grid size-8 shrink-0 place-items-center rounded-lg',
                      a.tone === 'red' ? 'bg-rose-50 text-rose-600' : a.tone === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-sky-50 text-sky-600',
                    )}
                  >
                    {a.tone === 'red' ? <Wrench className="size-4" /> : a.tone === 'amber' ? <AlertTriangle className="size-4" /> : <PackageOpen className="size-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-slate-900">{a.title}</span>
                    <span className="block truncate text-xs text-slate-500">{a.body}</span>
                  </span>
                  <ArrowRight className="size-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title={`${TERMS.area} Performance`} subtitle="Today" actions={<Button size="sm" variant="ghost" onClick={() => navigate('/looms/status')}>Floor view <ArrowRight className="size-3.5" /></Button>} />
          <CardBody className="space-y-5">
            {halls.map((h) => (
              <div key={h.hall}>
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{h.hall}</p>
                    <p className="text-xs text-slate-500">
                      {h.running}/{h.looms} running · {num(h.actual)} {TERMS.out}
                    </p>
                  </div>
                  <span className={cn('font-display text-lg font-semibold num', h.efficiency >= 95 ? 'text-emerald-600' : h.efficiency >= 92 ? 'text-slate-900' : 'text-amber-600')}>{pct(h.efficiency)}</span>
                </div>
                <ProgressBar value={h.efficiency} tone="auto" className="mt-2" height="h-2" />
              </div>
            ))}
            {weakest && (
              <div className="rounded-xl bg-slate-50 p-3.5 text-[13px] text-slate-600">
                <b className="font-semibold text-slate-800">{weakest.hall}</b> is the weakest {TERMS.area.toLowerCase()} today
                {weakestStops.length > 0 ? (
                  <>
                    {' '}— {weakestStops.map((l) => `${l.id} (${l.stopReason?.split(/ — | \(/)[0].toLowerCase()})`).join(', ')} {weakestStops.length > 1 ? 'are' : 'is'} stopped.
                  </>
                ) : (
                  '.'
                )}
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2 xl:col-span-1">
          <CardHeader title="Business Snapshot" subtitle="Today's production at current rates" actions={<Button size="sm" variant="ghost" onClick={() => navigate('/costing')}>Costing <ArrowRight className="size-3.5" /></Button>} />
          <CardBody>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Production value', value: pkrCompact(snapshot.value) },
                { label: 'Production cost', value: pkrCompact(snapshot.cost) },
                { label: IS_POLY ? 'Avg. cost / bag' : 'Avg. cost / meter', value: pkrM(snapshot.costPerM) },
                { label: 'Est. gross margin', value: pkrCompact(snapshot.margin), good: true },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-line p-3.5">
                  <p className="text-xs text-slate-500">{s.label}</p>
                  <p className={cn('mt-1 font-display text-lg font-semibold num', s.good ? 'text-emerald-600' : 'text-slate-900')}>{s.value}</p>
                </div>
              ))}
            </div>
            <Link to="/electricity/solar" className="mt-3 flex items-center gap-3 rounded-xl bg-amber-50/70 p-3.5 hover:bg-amber-50">
              <span className="grid size-9 place-items-center rounded-lg bg-white text-amber-500 shadow-sm">
                <Sun className="size-[18px]" />
              </span>
              <span className="flex-1 text-[13px]">
                <span className="block font-semibold text-slate-900">Solar saved {pkrCompact(energy.solarSavings)} today</span>
                <span className="block text-slate-500">
                  {num(energy.solarUsedKwh)} kWh self-consumed · {Math.round((energy.solarUsedKwh / (energy.solarUsedKwh + energy.gridKwh)) * 100)}% of load
                </span>
              </span>
              <ArrowRight className="size-4 text-amber-500" />
            </Link>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
