import type { ReactNode } from 'react'
import { cn } from '@/utils/format'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-slate-200/70', className)} />
}

export function EmptyState({ icon, title, body, action, className }: { icon: ReactNode; title: string; body?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-12 text-center', className)}>
      <span className="grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400 [&>svg]:size-6">{icon}</span>
      <p className="mt-3 text-sm font-semibold text-slate-800">{title}</p>
      {body && <p className="mt-1 max-w-sm text-[13px] text-slate-500">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ProgressBar({ value, max = 100, tone = 'brand', className, height = 'h-1.5' }: { value: number; max?: number; tone?: 'brand' | 'green' | 'amber' | 'red' | 'auto'; className?: string; height?: string }) {
  const p = Math.max(0, Math.min(100, (value / max) * 100))
  const color =
    tone === 'auto'
      ? p >= 95 ? 'bg-emerald-500' : p >= 85 ? 'bg-brand-500' : p >= 70 ? 'bg-amber-500' : 'bg-rose-500'
      : { brand: 'bg-brand-500', green: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-rose-500' }[tone]
  return (
    <div className={cn('w-full overflow-hidden rounded-full bg-slate-100', height, className)}>
      <div className={cn('h-full rounded-full transition-[width] duration-500', color)} style={{ width: `${p}%` }} />
    </div>
  )
}

/** Efficiency number with traffic-light colouring. */
export function EfficiencyValue({ value, className }: { value: number; className?: string }) {
  const color = value >= 95 ? 'text-emerald-600' : value >= 85 ? 'text-slate-800' : value >= 70 ? 'text-amber-600' : 'text-rose-600'
  return <span className={cn('font-semibold num', color, className)}>{value.toFixed(1)}%</span>
}
