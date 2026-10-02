import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BatteryCharging, Cable, Gauge, Leaf, PlugZap, Sun, Wallet, Zap } from 'lucide-react'
import { Badge, Card, CardBody, CardHeader, DataTable, KpiCard, PageHeader, ProgressBar, Tabs, type Column } from '@/components/ui'
import { CHART, ChartTooltip, Legend, axisProps } from '@/components/charts/ChartKit'
import { TableActions } from '@/components/common/TableActions'
import { ENERGY, MONTHLY_ENERGY, TARIFF } from '@/data/commercial'
import { FACTORY } from '@/data/factory'
import type { EnergyDay } from '@/types'
import { compact, date, dayMonth, num, pct, pkr, pkrCompact, sum } from '@/utils/format'

const today = ENERGY[ENERGY.length - 1]

// Hourly profile for today (solar bell curve + steady weaving load)
const HOURLY = (() => {
  const solarShape = Array.from({ length: 24 }, (_, h) => (h >= 6 && h <= 18 ? Math.sin(((h - 6) / 12) * Math.PI) ** 1.6 : 0))
  const shapeSum = solarShape.reduce((a, b) => a + b, 0)
  const loadTotal = today.gridKwh + today.solarUsedKwh
  return solarShape.map((s, h) => {
    const solar = Math.round((s / shapeSum) * today.solarGenKwh)
    const load = Math.round((loadTotal / 24) * (h >= 17 && h < 21 ? 0.94 : 1.02))
    const used = Math.min(solar, load)
    return { hour: `${String(h).padStart(2, '0')}:00`, load, solar, grid: Math.max(0, load - used) }
  })
})()

const INVERTERS = [
  { name: 'Inverter 1 · Roof Hall A', capacity: 250, today: 1190, status: 'Online' },
  { name: 'Inverter 2 · Roof Hall B', capacity: 200, today: 960, status: 'Online' },
  { name: 'Inverter 3 · Roof Hall C', capacity: 150, today: 700, status: 'Online' },
]

export default function ElectricityPage() {
  const { tab = 'grid' } = useParams()
  const navigate = useNavigate()
  const current = tab === 'solar' ? 'solar' : 'grid'

  const daily = useMemo(() => ENERGY.map((e) => ({ ...e, label: dayMonth(e.date) })), [])
  const month = {
    grid: sum(ENERGY, (e) => e.gridKwh),
    solar: sum(ENERGY, (e) => e.solarUsedKwh),
    cost: sum(ENERGY, (e) => e.gridCost),
    savings: sum(ENERGY, (e) => e.solarSavings),
    gen: sum(ENERGY, (e) => e.solarGenKwh),
    export: sum(ENERGY, (e) => e.exportKwh),
  }
  const solarShare = (today.solarUsedKwh / (today.solarUsedKwh + today.gridKwh)) * 100

  const columns: Column<EnergyDay>[] = [
    { key: 'date', header: 'Date', cell: (e) => date(e.date), sort: (e) => e.date },
    { key: 'grid', header: 'Grid kWh', align: 'right', cell: (e) => num(e.gridKwh), sort: (e) => e.gridKwh },
    { key: 'peak', header: 'Peak kWh', align: 'right', cell: (e) => num(e.peakKwh), hideBelow: 'md' },
    { key: 'solar', header: 'Solar Used', align: 'right', cell: (e) => num(e.solarUsedKwh), sort: (e) => e.solarUsedKwh },
    { key: 'gen', header: 'Solar Gen.', align: 'right', cell: (e) => num(e.solarGenKwh), hideBelow: 'lg' },
    { key: 'cost', header: 'Grid Cost', align: 'right', cell: (e) => <b className="font-semibold text-slate-900">{pkr(e.gridCost)}</b>, sort: (e) => e.gridCost },
    { key: 'save', header: 'Solar Savings', align: 'right', cell: (e) => <span className="font-semibold text-emerald-600">{pkr(e.solarSavings)}</span>, sort: (e) => e.solarSavings, hideBelow: 'md' },
  ]

  return (
    <div>
      <PageHeader
        title="Electricity & Solar"
        description={`FESCO ref. ${FACTORY.fescoReference} · sanctioned load ${num(FACTORY.sanctionedLoadKw)} kW · ${FACTORY.solarCapacityKw} kW rooftop solar`}
        breadcrumbs={[{ label: 'Electricity' }, { label: current === 'grid' ? 'Grid' : 'Solar' }]}
        actions={
          <Tabs
            value={current}
            onChange={(t) => navigate(`/electricity/${t}`)}
            tabs={[
              { value: 'grid', label: <span className="flex items-center gap-1.5"><PlugZap className="size-4" /> Grid</span> },
              { value: 'solar', label: <span className="flex items-center gap-1.5"><Sun className="size-4" /> Solar</span> },
            ]}
          />
        }
      />

      <p className="mb-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">Today's Energy</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Grid Consumption" value={num(today.gridKwh)} unit="kWh" icon={<Zap />} accent="brand" sub={<span>Peak {num(today.peakKwh)} kWh</span>} />
        <KpiCard label="Solar Generation" value={num(today.solarGenKwh)} unit="kWh" icon={<Sun />} accent="amber" sub={<span>{pct((today.solarGenKwh / (FACTORY.solarCapacityKw * 5.5)) * 100, 0)} of expected</span>} />
        <KpiCard label="Solar Consumption" value={num(today.solarUsedKwh)} unit="kWh" icon={<BatteryCharging />} accent="green" sub={<span>{pct(solarShare, 0)} of factory load</span>} />
        <KpiCard label="Grid Cost" value={pkr(today.gridCost)} icon={<Wallet />} accent="red" sub={<span>≈ {pkr(today.gridCost / today.gridKwh)}/kWh</span>} />
        <KpiCard label="Solar Savings" value={pkr(today.solarSavings)} icon={<Leaf />} accent="teal" sub={<span>{num(today.exportKwh)} kWh exported</span>} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title={current === 'grid' ? 'Grid vs Solar' : 'Solar Generation Today'} subtitle={current === 'grid' ? 'Last 30 days · kWh consumed' : 'Hourly · kWh'} actions={<Legend items={current === 'grid' ? [{ label: 'Grid', color: CHART.grid2 }, { label: 'Solar', color: CHART.solar }] : [{ label: 'Solar', color: CHART.solar }, { label: 'Factory load', color: CHART.slate, dashed: true }]} />} />
          <CardBody>
            <ResponsiveContainer width="100%" height={280}>
              {current === 'grid' ? (
                <AreaChart data={daily} margin={{ left: -8, right: 8 }}>
                  <defs>
                    <linearGradient id="gGrid" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART.grid2} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={CHART.grid2} stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="gSolar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART.solar} stopOpacity={0.45} />
                      <stop offset="100%" stopColor={CHART.solar} stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={CHART.grid} />
                  <XAxis dataKey="label" {...axisProps} interval={4} dy={8} />
                  <YAxis {...axisProps} tickFormatter={compact} />
                  <Tooltip content={<ChartTooltip formatter={(v) => `${num(v)} kWh`} />} />
                  <Area type="monotone" dataKey="gridKwh" name="Grid" stackId="1" stroke={CHART.grid2} strokeWidth={2} fill="url(#gGrid)" />
                  <Area type="monotone" dataKey="solarUsedKwh" name="Solar" stackId="1" stroke={CHART.solar} strokeWidth={2} fill="url(#gSolar)" />
                </AreaChart>
              ) : (
                <ComposedChart data={HOURLY} margin={{ left: -8, right: 8 }}>
                  <defs>
                    <linearGradient id="gSun" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART.solar} stopOpacity={0.5} />
                      <stop offset="100%" stopColor={CHART.solar} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={CHART.grid} />
                  <XAxis dataKey="hour" {...axisProps} interval={2} dy={8} />
                  <YAxis {...axisProps} />
                  <Tooltip content={<ChartTooltip formatter={(v) => `${num(v)} kWh`} />} />
                  <Area type="monotone" dataKey="solar" name="Solar" stroke={CHART.solar} strokeWidth={2.5} fill="url(#gSun)" />
                  <Line type="monotone" dataKey="load" name="Factory load" stroke={CHART.slate} strokeDasharray="5 5" strokeWidth={2} dot={false} />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {current === 'grid' ? (
          <Card>
            <CardHeader title="Tariff" subtitle="Configured per NEPRA notification" actions={<Badge tone="blue">Active</Badge>} />
            <CardBody className="space-y-4">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">{TARIFF.name}</p>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-[13px]">
                  <div>
                    <dt className="text-xs text-slate-500">Peak rate</dt>
                    <dd className="font-semibold text-slate-900">PKR {TARIFF.peakRate}/kWh</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Off-peak rate</dt>
                    <dd className="font-semibold text-slate-900">PKR {TARIFF.offPeakRate}/kWh</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Peak hours</dt>
                    <dd className="font-semibold text-slate-900">{TARIFF.peakHours}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Fixed charges</dt>
                    <dd className="font-semibold text-slate-900">{TARIFF.fixedCharges}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs text-slate-500">{TARIFF.fpa}</p>
              </div>
              <div>
                <div className="mb-1.5 flex justify-between text-[13px]">
                  <span className="text-slate-600">Peak share of grid units</span>
                  <span className="font-semibold text-slate-900">{pct((today.peakKwh / today.gridKwh) * 100, 0)}</span>
                </div>
                <ProgressBar value={(today.peakKwh / today.gridKwh) * 100} tone="amber" height="h-2" />
                <p className="mt-2 text-xs text-slate-500">Shifting 10% of peak load to off-peak would save ≈ {pkr(today.peakKwh * 0.1 * (TARIFF.peakRate - TARIFF.offPeakRate) * 30)}/month.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 border-t border-line pt-4">
                <div>
                  <p className="text-xs text-slate-500">Grid this month</p>
                  <p className="font-display text-lg font-semibold text-slate-900 num">{compact(month.grid)} kWh</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Bill to date</p>
                  <p className="font-display text-lg font-semibold text-slate-900 num">{pkrCompact(month.cost)}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardHeader title="Inverters" subtitle={`${FACTORY.solarCapacityKw} kW installed`} actions={<Badge tone="green" dot>All online</Badge>} />
            <CardBody className="space-y-3">
              {INVERTERS.map((inv) => (
                <div key={inv.name} className="rounded-xl border border-line p-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-[13px] font-semibold text-slate-900">
                      <Cable className="size-4 text-slate-400" />
                      {inv.name}
                    </span>
                    <span className="size-2 rounded-full bg-emerald-500" />
                  </div>
                  <div className="mt-2 flex items-baseline justify-between text-[13px] text-slate-500 num">
                    <span>
                      <b className="font-display text-base font-semibold text-slate-900">{num(inv.today)}</b> kWh today
                    </span>
                    <span>{inv.capacity} kW</span>
                  </div>
                  <ProgressBar value={inv.today} max={inv.capacity * 5.5} tone="amber" className="mt-2" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-emerald-50/60 p-4">
                <div>
                  <p className="text-xs text-emerald-700">Savings this month</p>
                  <p className="font-display text-lg font-semibold text-emerald-700 num">{pkrCompact(month.savings)}</p>
                </div>
                <div>
                  <p className="text-xs text-emerald-700">CO₂ avoided</p>
                  <p className="font-display text-lg font-semibold text-emerald-700 num">{num(Math.round(month.gen * 0.45 / 1000))} t</p>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Daily Energy Consumption" subtitle="Last 14 days · kWh" actions={<Legend items={[{ label: 'Grid', color: CHART.grid2 }, { label: 'Solar', color: CHART.solar }]} />} />
          <CardBody>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={daily.slice(-14)} margin={{ left: -8, right: 8 }}>
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="label" {...axisProps} interval={1} dy={8} />
                <YAxis {...axisProps} tickFormatter={compact} />
                <Tooltip content={<ChartTooltip formatter={(v) => `${num(v)} kWh`} />} />
                <Bar dataKey="gridKwh" name="Grid" stackId="e" fill={CHART.grid2} maxBarSize={28} />
                <Bar dataKey="solarUsedKwh" name="Solar" stackId="e" fill={CHART.solar} radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Monthly Electricity Cost" subtitle="Grid bill vs solar savings · PKR" actions={<Legend items={[{ label: 'Grid bill', color: CHART.grid2 }, { label: 'Solar savings', color: CHART.green }]} />} />
          <CardBody>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={MONTHLY_ENERGY} margin={{ left: -4, right: 8 }} barGap={4}>
                <CartesianGrid vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="month" {...axisProps} dy={8} />
                <YAxis {...axisProps} tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} />
                <Tooltip content={<ChartTooltip formatter={(v) => pkr(v)} />} />
                <Bar dataKey="grid" name="Grid bill" fill={CHART.grid2} radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="solar" name="Solar savings" fill={CHART.green} radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      <div className="mt-4">
        <DataTable
          title={current === 'grid' ? 'Daily Meter Readings' : 'Daily Solar Log'}
          subtitle="Last 30 days"
          data={[...ENERGY].reverse()}
          columns={columns}
          rowKey={(e) => e.date}
          actions={<TableActions importable />}
          pageSize={10}
        />
      </div>

      <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <Gauge className="size-3.5" /> Demo data. Inverter and smart-meter integrations are planned for a later version.
      </p>
    </div>
  )
}
