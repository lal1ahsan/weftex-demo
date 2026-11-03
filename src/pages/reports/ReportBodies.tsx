import type { ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DataTable, EfficiencyValue, StatusBadge, type Column } from '@/components/ui'
import { CHART, ChartTooltip, axisProps } from '@/components/charts/ChartKit'
import { DOWNTIME_COLORS } from '@/components/charts/Charts'
import { useApp } from '@/context/AppState'
import { FABRICS, YARN_PURCHASES, YARNS, supplierById, yarnStatus } from '@/data/inventory'
import { CUSTOMERS, ENERGY, PURCHASE_ORDERS, SALES_ORDERS, customerById } from '@/data/commercial'
import { byLoom, downtimeByCategory, totals, unitCost } from '@/data/metrics'
import { yarnUsedKg } from '@/data/production'
import { daysAgo, isoDate } from '@/data/seed'
import { compact, date, duration, kg, meters, num, pct, pkr, pkrCompact, stockQty, sum } from '@/utils/format'
import type { Customer, DowntimeRecord, EnergyDay, Fabric, PurchaseOrder, SalesOrder, YarnItem } from '@/types'
import { IS_POLY, TERMS } from '@/data/dataset'

export type Range = 'today' | 'yesterday' | '7d'

export const rangeDates = (r: Range) => (r === 'today' ? [isoDate(daysAgo(0))] : r === 'yesterday' ? [isoDate(daysAgo(1))] : Array.from({ length: 7 }, (_, i) => isoDate(daysAgo(i))))

function Summary({ items }: { items: [string, ReactNode][] }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
      {items.map(([k, v]) => (
        <div key={k} className="bg-white px-4 py-3">
          <p className="text-xs font-medium text-slate-500">{k}</p>
          <p className="mt-0.5 font-display text-lg font-semibold text-slate-900 num">{v}</p>
        </div>
      ))}
    </div>
  )
}

function ChartBox({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-line p-4">{children}</div>
}

// ---------------------------------------------------------------- Production
function DailyProduction({ range }: { range: Range }) {
  const { production, looms } = useApp()
  const days = rangeDates(range)
  const recs = production.filter((r) => days.includes(r.date))
  const t = totals(recs)
  const hallRows = TERMS.areas.flatMap((hall) =>
    (['Morning', 'Evening', 'Night'] as const).map((shift) => {
      const ids = new Set(looms.filter((l) => l.hall === hall).map((l) => l.id))
      const rs = recs.filter((r) => ids.has(r.loomId) && r.shift === shift)
      const tt = totals(rs)
      return { key: `${hall}-${shift}`, hall, shift, entries: rs.length, ...tt }
    }),
  )
  type HR = (typeof hallRows)[number]
  const columns: Column<HR>[] = [
    { key: 'hall', header: TERMS.area, cell: (r) => <b className="font-semibold text-slate-900">{r.hall}</b>, sort: (r) => r.hall },
    { key: 'shift', header: 'Shift', cell: (r) => r.shift },
    { key: 'entries', header: 'Entries', align: 'right', cell: (r) => r.entries },
    { key: 'target', header: 'Target', align: 'right', cell: (r) => meters(r.target) },
    { key: 'actual', header: 'Actual', align: 'right', cell: (r) => <b className="font-semibold text-slate-900">{meters(r.actual)}</b>, sort: (r) => r.actual },
    { key: 'eff', header: 'Efficiency', align: 'right', cell: (r) => <EfficiencyValue value={r.efficiency} />, sort: (r) => r.efficiency },
    { key: 'waste', header: 'Wastage', align: 'right', cell: (r) => pct(r.wastagePct, 2) },
  ]
  return (
    <>
      <Summary items={[['Production', meters(t.actual)], ['Target', meters(t.target)], ['Efficiency', pct(t.efficiency)], ['Wastage', pct(t.wastagePct)]]} />
      <DataTable data={hallRows} columns={columns} rowKey={(r) => r.key} pageSize={9} filters={[{ label: TERMS.area, options: TERMS.areas, value: (r) => r.hall }]} searchText={(r) => `${r.hall} ${r.shift}`} />
    </>
  )
}

function LoomEfficiency({ range }: { range: Range }) {
  const { production, looms } = useApp()
  const days = rangeDates(range)
  const rows = byLoom(production.filter((r) => days.includes(r.date))).map((r) => ({ ...r, loom: looms.find((l) => l.id === r.loomId)! }))
  const below = rows.filter((r) => r.efficiency < 90)
  type R = (typeof rows)[number]
  const columns: Column<R>[] = [
    { key: 'loom', header: TERMS.machine, cell: (r) => <b className="font-semibold text-slate-900">{r.loomId}</b>, sort: (r) => r.loomId },
    { key: 'hall', header: TERMS.area, cell: (r) => r.loom.hall },
    { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={r.loom.status} />, hideBelow: 'md' },
    { key: 'target', header: 'Target', align: 'right', cell: (r) => meters(r.target) },
    { key: 'actual', header: 'Actual', align: 'right', cell: (r) => meters(r.actual), sort: (r) => r.actual },
    { key: 'gap', header: 'Gap', align: 'right', cell: (r) => <span className={r.actual < r.target ? 'text-rose-600' : 'text-emerald-600'}>{r.actual - r.target > 0 ? '+' : ''}{num(r.actual - r.target)} {TERMS.out}</span>, sort: (r) => r.actual - r.target },
    { key: 'eff', header: 'Efficiency', align: 'right', cell: (r) => <EfficiencyValue value={r.efficiency} />, sort: (r) => r.efficiency },
  ]
  return (
    <>
      <Summary items={[[TERMS.machines, rows.length], ['Below 90%', below.length], [`Best ${TERMS.machine.toLowerCase()}`, [...rows].sort((a, b) => b.efficiency - a.efficiency)[0]?.loomId ?? '—'], [`Lost ${TERMS.outLong}`, meters(sum(below, (r) => r.target - r.actual))]]} />
      <DataTable data={rows} columns={columns} rowKey={(r) => r.loomId} defaultSort={{ key: 'eff', dir: 'asc' }} searchText={(r) => r.loomId} filters={[{ label: TERMS.area, options: TERMS.areas, value: (r) => r.loom.hall }, { label: 'Band', options: ['Below 90%', '90% and above'], value: (r) => (r.efficiency < 90 ? 'Below 90%' : '90% and above') }]} pageSize={15} />
    </>
  )
}

function DowntimeReport({ range }: { range: Range }) {
  const { downtime } = useApp()
  const days = rangeDates(range)
  const recs = downtime.filter((d) => days.includes(d.date))
  const byCat = downtimeByCategory(recs)
  const columns: Column<DowntimeRecord>[] = [
    { key: 'date', header: 'Date', cell: (d) => date(d.date), sort: (d) => d.date + d.start },
    { key: 'loom', header: 'Loom', cell: (d) => <b className="font-semibold text-slate-900">{d.loomId}</b>, sort: (d) => d.loomId },
    { key: 'time', header: 'Time', cell: (d) => `${d.start}–${d.end || 'now'}` },
    { key: 'cat', header: 'Category', cell: (d) => d.category, sort: (d) => d.category },
    { key: 'reason', header: 'Reason', cell: (d) => d.reason, hideBelow: 'md' },
    { key: 'min', header: 'Duration', align: 'right', cell: (d) => duration(d.minutes), sort: (d) => d.minutes },
  ]
  return (
    <>
      <Summary items={[['Total downtime', duration(sum(recs, (d) => d.minutes))], ['Breakdowns', recs.length], ['Looms affected', new Set(recs.map((d) => d.loomId)).size], ['Top reason', byCat[0]?.category ?? '—']]} />
      <ChartBox>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={byCat} margin={{ left: -8 }}>
            <CartesianGrid vertical={false} stroke={CHART.grid} />
            <XAxis dataKey="category" {...axisProps} />
            <YAxis {...axisProps} tickFormatter={(v) => `${Math.round(v / 60)}h`} />
            <Tooltip content={<ChartTooltip formatter={(v) => duration(v)} />} />
            <Bar dataKey="minutes" name="Downtime" radius={[4, 4, 0, 0]} maxBarSize={48}>
              {byCat.map((c) => (
                <Cell key={c.category} fill={DOWNTIME_COLORS[c.category]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartBox>
      <DataTable data={recs} columns={columns} rowKey={(d) => d.id} searchText={(d) => `${d.loomId} ${d.reason}`} filters={[{ label: 'Category', options: byCat.map((c) => c.category), value: (d) => d.category }]} defaultSort={{ key: 'date', dir: 'desc' }} />
    </>
  )
}

function WastageReport({ range }: { range: Range }) {
  const { production } = useApp()
  const days = rangeDates(range)
  const recs = production.filter((r) => days.includes(r.date))
  const t = totals(recs)
  const rows = byLoom(recs)
    .map((l) => {
      const rs = recs.filter((r) => r.loomId === l.loomId)
      const w = sum(rs, (r) => r.wastageKg)
      const y = sum(rs, yarnUsedKg)
      return { loomId: l.loomId, wasteKg: w, yarnKg: y, pct: (w / y) * 100 }
    })
  type R = (typeof rows)[number]
  const columns: Column<R>[] = [
    { key: 'loom', header: TERMS.machine, cell: (r) => <b className="font-semibold text-slate-900">{r.loomId}</b>, sort: (r) => r.loomId },
    { key: 'yarn', header: `${TERMS.raw} used`, align: 'right', cell: (r) => kg(r.yarnKg), sort: (r) => r.yarnKg },
    { key: 'waste', header: 'Wastage', align: 'right', cell: (r) => `${r.wasteKg.toFixed(1)} kg`, sort: (r) => r.wasteKg },
    { key: 'pct', header: 'Wastage %', align: 'right', cell: (r) => <span className={r.pct > WASTE_RED ? 'font-semibold text-rose-600' : 'font-semibold text-slate-800'}>{pct(r.pct, 2)}</span>, sort: (r) => r.pct },
  ]
  return (
    <>
      <Summary items={[['Wastage', pct(t.wastagePct)], ['Wastage kg', kg(t.wasteKg)], [`${TERMS.raw} consumed`, kg(t.yarnKg)], [`${TERMS.machines} above ${WASTE_RED}%`, rows.filter((r) => r.pct > WASTE_RED).length]]} />
      <DataTable data={rows} columns={columns} rowKey={(r) => r.loomId} defaultSort={{ key: 'pct', dir: 'desc' }} searchText={(r) => r.loomId} pageSize={15} />
    </>
  )
}

const WASTE_RED = IS_POLY ? 3.6 : 2.6
const U = IS_POLY ? 'bag' : 'm'

// ---------------------------------------------------------------- Inventory
function YarnStock() {
  const columns: Column<YarnItem>[] = [
    { key: 'code', header: 'Code', cell: (y) => <b className="font-semibold text-slate-900">{y.code}</b>, sort: (y) => y.code },
    { key: 'name', header: TERMS.raw, cell: (y) => `${y.name} ${y.count} ${y.type}` },
    { key: 'open', header: 'Opening', align: 'right', cell: (y) => kg(y.stockKg + y.issuedKgMonth - y.incomingKg * 0.5), hideBelow: 'md' },
    { key: 'in', header: 'Received', align: 'right', cell: (y) => kg(y.incomingKg * 0.5), hideBelow: 'md' },
    { key: 'out', header: 'Issued', align: 'right', cell: (y) => kg(y.issuedKgMonth), sort: (y) => y.issuedKgMonth },
    { key: 'close', header: 'Closing', align: 'right', cell: (y) => <b className="font-semibold text-slate-900">{kg(y.stockKg)}</b>, sort: (y) => y.stockKg },
    { key: 'value', header: 'Value', align: 'right', cell: (y) => pkrCompact(y.stockKg * y.costPerKg), sort: (y) => y.stockKg * y.costPerKg },
    { key: 'status', header: 'Status', cell: (y) => <StatusBadge status={yarnStatus(y)} /> },
  ]
  return (
    <>
      <Summary items={[['Closing stock', kg(sum(YARNS, (y) => y.stockKg))], ['Stock value', pkrCompact(sum(YARNS, (y) => y.stockKg * y.costPerKg))], ['Issued (month)', kg(sum(YARNS, (y) => y.issuedKgMonth))], ['Low / out of stock', YARNS.filter((y) => yarnStatus(y) !== 'In Stock').length]]} />
      <DataTable data={YARNS} columns={columns} rowKey={(y) => y.code} searchText={(y) => `${y.code} ${y.name} ${y.count}`} filters={[{ label: 'Status', options: ['In Stock', 'Low Stock', 'Out of Stock'], value: (y) => yarnStatus(y) }]} pageSize={15} />
    </>
  )
}

function FabricStock() {
  const columns: Column<Fabric>[] = [
    { key: 'code', header: 'Code', cell: (f) => <b className="font-semibold text-slate-900">{f.code}</b>, sort: (f) => f.code },
    { key: 'fabric', header: TERMS.productOne, cell: (f) => `${f.construction} ${f.name}` },
    { key: 'rolls', header: TERMS.packs, align: 'right', cell: (f) => f.rolls, sort: (f) => f.rolls },
    { key: 'meters', header: (TERMS.stockLong[0].toUpperCase() + TERMS.stockLong.slice(1)), align: 'right', cell: (f) => num(f.meters), sort: (f) => f.meters },
    { key: 'rate', header: 'Rate', align: 'right', cell: (f) => pkr(f.ratePerMeter), hideBelow: 'md' },
    { key: 'value', header: 'Value', align: 'right', cell: (f) => <b className="font-semibold text-slate-900">{pkrCompact(f.meters * f.ratePerMeter)}</b>, sort: (f) => f.meters * f.ratePerMeter },
    { key: 'status', header: 'Status', cell: (f) => <StatusBadge status={f.status} /> },
  ]
  const avail = FABRICS.filter((f) => f.status === 'Available')
  return (
    <>
      <Summary items={[['Total stock', stockQty(sum(FABRICS, (f) => f.meters))], ['Available to sell', stockQty(sum(avail, (f) => f.meters))], ['Stock value', pkrCompact(sum(FABRICS, (f) => f.meters * f.ratePerMeter))], [TERMS.packs, num(sum(FABRICS, (f) => f.rolls))]]} />
      <DataTable data={FABRICS} columns={columns} rowKey={(f) => f.code} searchText={(f) => `${f.code} ${f.name} ${f.construction}`} filters={[{ label: 'Status', options: ['Available', 'Reserved', 'On Hold'], value: (f) => f.status }]} pageSize={20} />
    </>
  )
}

// ---------------------------------------------------------------- Commercial
function SalesReport() {
  const live = SALES_ORDERS.filter((o) => o.status !== 'Cancelled')
  const columns: Column<SalesOrder>[] = [
    { key: 'id', header: 'Order', cell: (o) => <b className="font-semibold text-slate-900">{o.id}</b>, sort: (o) => o.id },
    { key: 'date', header: 'Date', cell: (o) => date(o.date), sort: (o) => o.date },
    { key: 'cust', header: 'Customer', cell: (o) => customerById(o.customerId)?.name },
    { key: 'qty', header: 'Quantity', align: 'right', cell: (o) => stockQty(o.quantity), sort: (o) => o.quantity },
    { key: 'value', header: 'Value', align: 'right', cell: (o) => pkr(o.quantity * o.rate), sort: (o) => o.quantity * o.rate },
    { key: 'status', header: 'Status', cell: (o) => <StatusBadge status={o.status} /> },
  ]
  const byCustomer = CUSTOMERS.map((c) => ({ name: c.name.split(' ').slice(0, 2).join(' '), value: sum(live.filter((o) => o.customerId === c.id), (o) => o.quantity * o.rate) }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
  return (
    <>
      <Summary items={[['Orders', live.length], ['Booked value', pkrCompact(sum(live, (o) => o.quantity * o.rate))], [`${(TERMS.stockLong[0].toUpperCase() + TERMS.stockLong.slice(1))} booked`, stockQty(sum(live, (o) => o.quantity))], ['Delivered', stockQty(sum(live, (o) => o.delivered))]]} />
      <ChartBox>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={byCustomer} margin={{ left: -4 }}>
            <CartesianGrid vertical={false} stroke={CHART.grid} />
            <XAxis dataKey="name" {...axisProps} interval={0} tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis {...axisProps} tickFormatter={(v) => compact(v)} />
            <Tooltip content={<ChartTooltip formatter={(v) => pkr(v)} />} />
            <Bar dataKey="value" name="Sales" fill={CHART.brand} radius={[4, 4, 0, 0]} maxBarSize={44} />
          </BarChart>
        </ResponsiveContainer>
      </ChartBox>
      <DataTable data={SALES_ORDERS} columns={columns} rowKey={(o) => o.id} searchText={(o) => `${o.id} ${customerById(o.customerId)?.name}`} filters={[{ label: 'Status', options: ['Draft', 'Confirmed', 'Partially Fulfilled', 'Completed', 'Cancelled'], value: (o) => o.status }]} />
    </>
  )
}

function PurchasesReport() {
  const columns: Column<PurchaseOrder>[] = [
    { key: 'id', header: 'PO', cell: (p) => <b className="font-semibold text-slate-900">{p.id}</b>, sort: (p) => p.id },
    { key: 'date', header: 'Date', cell: (p) => date(p.date), sort: (p) => p.date },
    { key: 'sup', header: 'Supplier', cell: (p) => supplierById(p.supplierId)?.name },
    { key: 'item', header: 'Item', cell: (p) => p.item, hideBelow: 'md' },
    { key: 'amount', header: 'Amount', align: 'right', cell: (p) => pkr(p.quantity * p.rate), sort: (p) => p.quantity * p.rate },
    { key: 'status', header: 'Status', cell: (p) => <StatusBadge status={p.status} /> },
  ]
  const live = PURCHASE_ORDERS.filter((p) => p.status !== 'Cancelled')
  return (
    <>
      <Summary items={[['Purchase orders', live.length], ['Committed', pkrCompact(sum(live, (p) => p.quantity * p.rate))], [`${TERMS.raw} purchases`, pkrCompact(sum(YARN_PURCHASES, (p) => p.quantityKg * p.rate))], ['Open POs', live.filter((p) => p.status !== 'Received').length]]} />
      <DataTable data={PURCHASE_ORDERS} columns={columns} rowKey={(p) => p.id} searchText={(p) => `${p.id} ${supplierById(p.supplierId)?.name} ${p.item}`} filters={[{ label: 'Status', options: ['Draft', 'Approved', 'Partially Received', 'Received', 'Cancelled'], value: (p) => p.status }]} />
    </>
  )
}

// ---------------------------------------------------------------- Finance
function ProductionCostReport() {
  const rows = FABRICS.map((f) => {
    const u = unitCost(f)
    return { f, c: { total: u.total, yarn: u.items[0].value } }
  })
  type R = (typeof rows)[number]
  const columns: Column<R>[] = [
    { key: 'fabric', header: TERMS.productOne, cell: (r) => <span><b className="font-semibold text-slate-900">{r.f.construction}</b> {r.f.name}</span> },
    { key: 'yarn', header: TERMS.raw, align: 'right', cell: (r) => pkr(r.c.yarn) },
    { key: 'conv', header: 'Conversion', align: 'right', cell: (r) => pkr(r.c.total - r.c.yarn), hideBelow: 'md' },
    { key: 'total', header: `Cost / ${U}`, align: 'right', cell: (r) => <b className="font-semibold text-slate-900">{pkr(r.c.total)}</b>, sort: (r) => r.c.total },
    { key: 'rate', header: `Rate / ${U}`, align: 'right', cell: (r) => pkr(r.f.ratePerMeter) },
    { key: 'margin', header: 'Margin', align: 'right', cell: (r) => pct(((r.f.ratePerMeter - r.c.total) / r.f.ratePerMeter) * 100), sort: (r) => (r.f.ratePerMeter - r.c.total) / r.f.ratePerMeter },
  ]
  return (
    <>
      <Summary items={[[IS_POLY ? 'Products' : 'Qualities', rows.length], [`Avg. cost / ${U}`, pkr(sum(rows, (r) => r.c.total) / rows.length)], [`Avg. ${TERMS.raw.toLowerCase()} share`, pct((sum(rows, (r) => r.c.yarn) / sum(rows, (r) => r.c.total)) * 100, 0)], ['Avg. margin', pct(sum(rows, (r) => (r.f.ratePerMeter - r.c.total) / r.f.ratePerMeter) / rows.length * 100)]]} />
      <DataTable data={rows} columns={columns} rowKey={(r) => r.f.code} searchText={(r) => `${r.f.code} ${r.f.name}`} pageSize={20} />
    </>
  )
}

function ElectricityReport() {
  const { production } = useApp()
  const columns: Column<EnergyDay & { meters: number }>[] = [
    { key: 'date', header: 'Date', cell: (e) => date(e.date), sort: (e) => e.date },
    { key: 'grid', header: 'Grid kWh', align: 'right', cell: (e) => num(e.gridKwh) },
    { key: 'solar', header: 'Solar kWh', align: 'right', cell: (e) => num(e.solarUsedKwh) },
    { key: 'cost', header: 'Grid cost', align: 'right', cell: (e) => pkr(e.gridCost), sort: (e) => e.gridCost },
    { key: 'save', header: 'Solar savings', align: 'right', cell: (e) => pkr(e.solarSavings), hideBelow: 'md' },
    { key: 'prod', header: 'Production', align: 'right', cell: (e) => (e.meters ? meters(e.meters) : '—'), hideBelow: 'md' },
  ]
  const rows = [...ENERGY].reverse().map((e) => ({ ...e, meters: sum(production.filter((r) => r.date === e.date), (r) => r.actual) }))
  return (
    <>
      <Summary items={[['Grid units (30d)', `${compact(sum(ENERGY, (e) => e.gridKwh))} kWh`], ['Grid cost (30d)', pkrCompact(sum(ENERGY, (e) => e.gridCost))], ['Solar savings (30d)', pkrCompact(sum(ENERGY, (e) => e.solarSavings))], ['Solar share', pct((sum(ENERGY, (e) => e.solarUsedKwh) / sum(ENERGY, (e) => e.solarUsedKwh + e.gridKwh)) * 100, 0)]]} />
      <DataTable data={rows} columns={columns} rowKey={(e) => e.date} pageSize={10} />
    </>
  )
}

function ReceivablesReport() {
  const rows = CUSTOMERS.filter((c) => c.outstanding > 0).map((c, i) => {
    const b = [0.45, 0.3, 0.15, 0.1].map((s, k) => Math.round(c.outstanding * (k === (i % 4) ? s + 0.1 : s - 0.1 / 3)))
    return { c, current: b[0], d30: b[1], d60: b[2], d90: c.outstanding - b[0] - b[1] - b[2] }
  })
  type R = (typeof rows)[number]
  const columns: Column<R>[] = [
    { key: 'cust', header: 'Customer', cell: (r) => <b className="font-semibold text-slate-900">{r.c.name}</b>, sort: (r) => r.c.name },
    { key: 'city', header: 'City', cell: (r) => r.c.city, hideBelow: 'md' },
    { key: 'cur', header: '0–30 days', align: 'right', cell: (r) => pkr(r.current) },
    { key: 'd30', header: '31–60', align: 'right', cell: (r) => pkr(r.d30), hideBelow: 'md' },
    { key: 'd60', header: '61–90', align: 'right', cell: (r) => pkr(r.d60), hideBelow: 'lg' },
    { key: 'd90', header: '90+', align: 'right', cell: (r) => <span className={r.d90 > 0 ? 'font-semibold text-rose-600' : ''}>{pkr(r.d90)}</span>, sort: (r) => r.d90 },
    { key: 'total', header: 'Outstanding', align: 'right', cell: (r) => <b className="font-semibold text-slate-900">{pkr(r.c.outstanding)}</b>, sort: (r) => r.c.outstanding },
  ]
  return (
    <>
      <Summary items={[['Total receivable', pkrCompact(sum(CUSTOMERS, (c: Customer) => c.outstanding))], ['0–30 days', pkrCompact(sum(rows, (r) => r.current))], ['Over 60 days', pkrCompact(sum(rows, (r) => r.d60 + r.d90))], ['Customers', rows.length]]} />
      <DataTable data={rows} columns={columns} rowKey={(r) => r.c.id} searchText={(r) => `${r.c.name} ${r.c.city}`} defaultSort={{ key: 'total', dir: 'desc' }} pageSize={20} />
    </>
  )
}

export function ReportBody({ slug, range }: { slug: string; range: Range }) {
  switch (slug) {
    case 'daily-production':
      return <DailyProduction range={range} />
    case 'loom-efficiency':
      return <LoomEfficiency range={range} />
    case 'downtime':
      return <DowntimeReport range={range} />
    case 'wastage':
      return <WastageReport range={range} />
    case 'yarn-stock':
      return <YarnStock />
    case 'fabric-stock':
      return <FabricStock />
    case 'sales':
      return <SalesReport />
    case 'purchases':
      return <PurchasesReport />
    case 'production-cost':
      return <ProductionCostReport />
    case 'electricity':
      return <ElectricityReport />
    case 'receivables':
      return <ReceivablesReport />
    default:
      return null
  }
}

