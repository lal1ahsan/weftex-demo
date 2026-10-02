import type { ReactNode } from 'react'
import type { TooltipProps } from 'recharts'
import { cn } from '@/utils/format'

export const CHART = {
  brand: '#2c47cc',
  brandSoft: '#98adfb',
  target: '#94a3b8',
  teal: '#0ea5a4',
  amber: '#f59e0b',
  rose: '#e5486c',
  violet: '#8b7cf6',
  sky: '#0ea5e9',
  green: '#10b981',
  slate: '#64748b',
  grid: '#eef1f5',
  solar: '#f5a524',
  grid2: '#3b5bdb',
}

/** Categorical palette, ordered for maximum contrast between neighbours. */
export const SERIES = ['#2c47cc', '#0ea5a4', '#f59e0b', '#e5486c', '#8b7cf6', '#64748b', '#84cc16']

export const axisProps = {
  tickLine: false,
  axisLine: false,
  tick: { fontSize: 12, fill: '#64748b' },
} as const

type Formatter = (value: number, name: string) => ReactNode

interface ChartTooltipProps extends TooltipProps<number, string> {
  formatter?: Formatter
  labelFormatter?: (label: string) => ReactNode
}

export function ChartTooltip({ active, payload, label, formatter, labelFormatter }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="min-w-[160px] rounded-xl border border-line bg-white/95 px-3.5 py-3 text-[13px] shadow-pop backdrop-blur">
      {label !== undefined && label !== '' && <p className="mb-2 font-semibold text-slate-900">{labelFormatter ? labelFormatter(String(label)) : label}</p>}
      <div className="space-y-1.5">
        {payload.map((p) => (
          <div key={String(p.dataKey ?? p.name)} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-slate-600">
              <span className="size-2.5 rounded-full" style={{ background: (p.payload?.fill as string) ?? p.color }} />
              {p.name}
            </span>
            <span className="font-semibold text-slate-900 num">{formatter ? formatter(Number(p.value), String(p.name)) : p.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Legend({ items, className }: { items: { label: string; color: string; value?: ReactNode; dashed?: boolean }[]; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-slate-600', className)}>
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-2">
          {i.dashed ? (
            <span className="w-3.5 border-t-2 border-dashed" style={{ borderColor: i.color }} />
          ) : (
            <span className="size-2.5 rounded-full" style={{ background: i.color }} />
          )}
          {i.label}
          {i.value !== undefined && <span className="font-semibold text-slate-900 num">{i.value}</span>}
        </span>
      ))}
    </div>
  )
}

/** Donut legend with share bars — used beside pie charts. */
export function BreakdownList({ items, format }: { items: { label: string; value: number; color: string }[]; format: (v: number) => string }) {
  const total = items.reduce((s, i) => s + i.value, 0) || 1
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.label}>
          <div className="flex items-center justify-between gap-3 text-[13px]">
            <span className="flex items-center gap-2 text-slate-600">
              <span className="size-2.5 rounded-full" style={{ background: i.color }} />
              {i.label}
            </span>
            <span className="text-slate-500 num">
              <b className="font-semibold text-slate-900">{format(i.value)}</b> · {((i.value / total) * 100).toFixed(0)}%
            </span>
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full" style={{ width: `${(i.value / total) * 100}%`, background: i.color }} />
          </div>
        </li>
      ))}
    </ul>
  )
}
