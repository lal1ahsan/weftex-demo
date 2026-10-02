import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/format'

export interface KpiDelta {
  value: string
  /** direction of the change */
  direction: 'up' | 'down'
  /** whether this change is good news */
  good: boolean
  label?: string
}

interface KpiCardProps {
  label: string
  value: ReactNode
  unit?: string
  icon?: ReactNode
  delta?: KpiDelta
  sub?: ReactNode
  footer?: ReactNode
  to?: string
  accent?: 'brand' | 'green' | 'amber' | 'red' | 'teal' | 'violet' | 'slate'
  className?: string
}

const ACCENTS = {
  brand: 'bg-brand-50 text-brand-600',
  green: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-rose-50 text-rose-600',
  teal: 'bg-teal-50 text-teal-600',
  violet: 'bg-violet-50 text-violet-600',
  slate: 'bg-slate-100 text-slate-600',
}

export function DeltaPill({ delta }: { delta: KpiDelta }) {
  const Icon = delta.direction === 'up' ? ArrowUpRight : ArrowDownRight
  return (
    <span className="inline-flex items-center gap-1 text-[13px]">
      <span className={cn('inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold num', delta.good ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')}>
        <Icon className="size-3.5" strokeWidth={2.5} />
        {delta.value}
      </span>
      {delta.label && <span className="text-slate-500">{delta.label}</span>}
    </span>
  )
}

export function KpiCard({ label, value, unit, icon, delta, sub, footer, to, accent = 'brand', className }: KpiCardProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-slate-500">{label}</p>
        {icon && <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl [&>svg]:size-[18px]', ACCENTS[accent])}>{icon}</span>}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="font-display text-[28px] leading-9 font-semibold tracking-tight text-slate-900 num">{value}</span>
        {unit && <span className="text-sm font-medium text-slate-500">{unit}</span>}
      </div>
      {(delta || sub) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-slate-500">
          {delta && <DeltaPill delta={delta} />}
          {sub}
        </div>
      )}
      {footer && <div className="mt-4 border-t border-line pt-3">{footer}</div>}
      {to && <ChevronRight className="absolute right-4 bottom-4 size-4 text-slate-300 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />}
    </>
  )
  const base = cn('group relative block rounded-2xl border border-line bg-white p-5 shadow-card', className)
  if (to) {
    return (
      <Link to={to} className={cn(base, 'transition-all hover:border-brand-200 hover:shadow-pop')}>
        {body}
      </Link>
    )
  }
  return <div className={base}>{body}</div>
}
