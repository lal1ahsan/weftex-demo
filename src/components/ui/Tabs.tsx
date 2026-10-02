import type { ReactNode } from 'react'
import { cn } from '@/utils/format'

interface TabsProps<T extends string> {
  value: T
  onChange: (v: T) => void
  tabs: { value: T; label: ReactNode; count?: number }[]
  variant?: 'underline' | 'pill'
  className?: string
}

export function Tabs<T extends string>({ value, onChange, tabs, variant = 'pill', className }: TabsProps<T>) {
  if (variant === 'underline') {
    return (
      <div className={cn('flex gap-6 overflow-x-auto border-b border-line', className)} role="tablist">
        {tabs.map((t) => (
          <button
            key={t.value}
            role="tab"
            aria-selected={value === t.value}
            onClick={() => onChange(t.value)}
            className={cn(
              '-mb-px flex items-center gap-2 border-b-2 pb-3 text-sm font-medium whitespace-nowrap transition-colors',
              value === t.value ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800',
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={cn('rounded-full px-1.5 py-0.5 text-[11px] num', value === t.value ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-500')}>{t.count}</span>
            )}
          </button>
        ))}
      </div>
    )
  }
  return (
    <div className={cn('inline-flex rounded-xl bg-slate-100 p-1', className)} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium whitespace-nowrap transition-all',
            value === t.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800',
          )}
        >
          {t.label}
          {t.count !== undefined && <span className="text-slate-400 num">{t.count}</span>}
        </button>
      ))}
    </div>
  )
}
