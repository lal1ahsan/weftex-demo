import { useMemo, useState } from 'react'
import { Calculator, FileDown, RotateCcw, TrendingDown, TrendingUp } from 'lucide-react'
import { Button, Card, CardBody, CardHeader, Field, Input, PageHeader, Select, useToast } from '@/components/ui'
import { BreakdownList, SERIES } from '@/components/charts/ChartKit'
import { DonutChart } from '@/components/charts/Charts'
import { FABRICS, FABRIC_YARN_RATE } from '@/data/inventory'
import { costPerMeter, EXAMPLE_BATCH } from '@/data/costing'
import { cn, num, pkr, pkrM } from '@/utils/format'

type Inputs = { quantity: number; yarn: number; labour: number; electricity: number; maintenance: number; other: number; sellingPrice: number }

const COST_KEYS = [
  { key: 'yarn', label: 'Yarn Cost', color: SERIES[0], hint: 'Warp + weft yarn incl. wastage' },
  { key: 'labour', label: 'Labour Cost', color: SERIES[1], hint: 'Weavers, helpers, supervisors' },
  { key: 'electricity', label: 'Electricity Cost', color: SERIES[2], hint: 'Grid + generator, net of solar' },
  { key: 'maintenance', label: 'Maintenance', color: SERIES[3], hint: 'Spares, lubricants, repairs' },
  { key: 'other', label: 'Other', color: SERIES[5], hint: 'Sizing, overheads, packing' },
] as const

/** Presets: the reference example, plus real fabrics from the cost model at 20,000 m. */
const PRESETS: { id: string; label: string; inputs: Inputs }[] = [
  { id: 'example', label: EXAMPLE_BATCH.label, inputs: { ...EXAMPLE_BATCH } },
  ...FABRICS.slice(0, 6).map((f) => {
    const c = costPerMeter({ ...f, yarnRate: FABRIC_YARN_RATE[f.code] })
    const q = 20_000
    const r = (n: number) => Math.round((n * q) / 1000) * 1000
    return {
      id: f.code,
      label: `${f.code} · ${f.construction} ${f.name} · 20,000 m`,
      inputs: { quantity: q, yarn: r(c.yarn), labour: r(c.labour), electricity: r(c.electricity), maintenance: r(c.maintenance), other: r(c.sizing + c.overhead), sellingPrice: f.ratePerMeter },
    }
  }),
]

export default function ProductionCostPage() {
  const toast = useToast()
  const [preset, setPreset] = useState(PRESETS[0].id)
  const [v, setV] = useState<Inputs>(PRESETS[0].inputs)

  const load = (id: string) => {
    setPreset(id)
    setV(PRESETS.find((p) => p.id === id)!.inputs)
  }

  const r = useMemo(() => {
    const total = v.yarn + v.labour + v.electricity + v.maintenance + v.other
    const perM = v.quantity > 0 ? total / v.quantity : 0
    const marginPerM = v.sellingPrice - perM
    return {
      total,
      perM,
      marginPerM,
      marginPct: v.sellingPrice > 0 ? (marginPerM / v.sellingPrice) * 100 : 0,
      revenue: v.sellingPrice * v.quantity,
      profit: marginPerM * v.quantity,
    }
  }, [v])

  const sensitivity = [
    { label: 'Yarn price +5%', delta: (v.yarn * 0.05) / v.quantity },
    { label: 'Electricity tariff +10%', delta: (v.electricity * 0.1) / v.quantity },
    { label: 'Efficiency +2% (same costs, more meters)', delta: r.perM / 1.02 - r.perM },
    { label: 'Wastage −0.5% (yarn saved)', delta: -(v.yarn * 0.005) / v.quantity },
  ]

  const set = (k: keyof Inputs, val: string) => setV((s) => ({ ...s, [k]: Math.max(0, Number(val) || 0) }))

  return (
    <div>
      <PageHeader
        title="Production Cost Calculator"
        description="What one meter of fabric actually costs, and what you earn on it."
        breadcrumbs={[{ label: 'Costing' }, { label: 'Production Cost' }]}
        actions={
          <>
            <Button icon={<RotateCcw className="size-4" />} onClick={() => load(preset)}>
              Reset
            </Button>
            <Button icon={<FileDown className="size-4" />} onClick={() => toast.demo('Costing sheets in PDF / Excel are available in the production version.')}>
              Export
            </Button>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        {/* Inputs */}
        <Card>
          <CardHeader title="Cost Inputs" subtitle="Edit any value — results update instantly" actions={<Calculator className="size-5 text-slate-400" />} />
          <CardBody className="space-y-6">
            <Field label="Scenario" htmlFor="preset">
              <Select id="preset" value={preset} onChange={(e) => load(e.target.value)} options={PRESETS.map((p) => ({ value: p.id, label: p.label }))} />
            </Field>

            <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4">
              <Field label="Production Quantity" htmlFor="qty">
                <Input id="qty" type="number" min={1} value={v.quantity} onChange={(e) => set('quantity', e.target.value)} suffix="meters" className="h-11 text-base font-semibold" />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {COST_KEYS.map((c) => (
                <Field key={c.key} label={c.label} htmlFor={c.key} hint={`${c.hint} · ${pkrM(v.quantity ? v[c.key] / v.quantity : 0)}/m`}>
                  <div className="relative">
                    <span className="absolute top-1/2 left-0 h-6 w-1 -translate-y-1/2 rounded-r" style={{ background: c.color }} />
                    <Input id={c.key} type="number" min={0} step={1000} value={v[c.key]} onChange={(e) => set(c.key, e.target.value)} suffix="PKR" />
                  </div>
                </Field>
              ))}
              <Field label="Selling Price" htmlFor="price" hint="Your rate to the customer">
                <Input id="price" type="number" min={0} step={0.5} value={v.sellingPrice} onChange={(e) => set('sellingPrice', e.target.value)} suffix="PKR/m" />
              </Field>
            </div>

            <div className="border-t border-dashed border-line-strong pt-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-slate-600">Total Cost</span>
                <span className="font-display text-2xl font-semibold text-slate-900 num">{pkr(r.total)}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          <div className="weave-pattern relative overflow-hidden rounded-2xl bg-ink-900 p-6 text-white shadow-pop">
            <div className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-brand-600/30 blur-3xl" />
            <p className="relative text-[13px] font-medium text-slate-300">Cost per Meter</p>
            <p className="relative mt-1 font-display text-5xl font-semibold tracking-tight num">{pkrM(r.perM)}</p>
            <p className="relative mt-1 text-[13px] text-slate-400 num">
              {pkr(r.total)} ÷ {num(v.quantity)} m
            </p>
            <div className="relative mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-5">
              <div>
                <p className="text-xs text-slate-400">Estimated Selling Price</p>
                <p className="mt-1 font-display text-xl font-semibold num">{pkrM(v.sellingPrice)}/m</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Gross Contribution</p>
                <p className={cn('mt-1 font-display text-xl font-semibold num', r.marginPerM >= 0 ? 'text-emerald-300' : 'text-rose-300')}>
                  {r.marginPerM >= 0 ? '+' : '−'}
                  {pkrM(Math.abs(r.marginPerM))}/m
                </p>
              </div>
            </div>
          </div>

          <Card className="p-5">
            <p className="text-[13px] font-medium text-slate-500">Estimated Gross Margin</p>
            <div className="mt-1 flex items-baseline justify-between gap-3">
              <span className={cn('font-display text-3xl font-semibold num', r.marginPct >= 10 ? 'text-emerald-600' : r.marginPct >= 0 ? 'text-amber-600' : 'text-rose-600')}>{r.marginPct.toFixed(1)}%</span>
              <span className="text-right text-[13px] text-slate-500 num">
                <b className="block font-display text-lg font-semibold text-slate-900">{pkr(r.profit)}</b>
                on {pkr(r.revenue)} sales
              </span>
            </div>
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div className={cn('h-full rounded-full transition-all', r.marginPct >= 10 ? 'bg-emerald-500' : r.marginPct >= 0 ? 'bg-amber-500' : 'bg-rose-500')} style={{ width: `${Math.min(100, Math.max(0, r.marginPct * 3))}%` }} />
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Break-even selling price: <b className="font-semibold text-slate-800">{pkrM(r.perM)}/m</b>
            </p>
          </Card>

          <Card>
            <CardHeader title="Cost Breakdown" subtitle="Share of total cost" />
            <CardBody>
              <DonutChart data={COST_KEYS.map((c) => ({ name: c.label.replace(' Cost', ''), value: v[c.key], color: c.color }))} format={pkr} height={180} centerValue={pkrM(r.perM)} centerLabel="per meter" />
              <div className="mt-4">
                <BreakdownList items={COST_KEYS.map((c) => ({ label: c.label.replace(' Cost', ''), value: v[c.key], color: c.color }))} format={(x) => pkr(x)} />
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <Card className="mt-4">
        <CardHeader title="What-if Analysis" subtitle="How changes move your cost per meter" />
        <div className="grid gap-px border-t border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
          {sensitivity.map((s) => {
            const up = s.delta > 0
            return (
              <div key={s.label} className="bg-white p-5">
                <p className="text-[13px] text-slate-600">{s.label}</p>
                <p className={cn('mt-2 flex items-center gap-1.5 font-display text-xl font-semibold num', up ? 'text-rose-600' : 'text-emerald-600')}>
                  {up ? <TrendingUp className="size-5" /> : <TrendingDown className="size-5" />}
                  {up ? '+' : '−'}
                  {pkrM(Math.abs(s.delta))}/m
                </p>
                <p className="mt-1 text-xs text-slate-500 num">
                  New cost {pkrM(r.perM + s.delta)}/m · {up ? 'costs' : 'saves'} {pkr(Math.abs(s.delta * v.quantity))} per batch
                </p>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
