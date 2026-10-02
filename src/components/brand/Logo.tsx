import { cn } from '@/utils/format'

/** Woven-grid mark: three warp threads crossed by three weft threads. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn('size-9', className)} aria-hidden>
      <rect width="40" height="40" rx="10" fill="#2c47cc" />
      <g strokeLinecap="round" strokeWidth="3">
        <path d="M10 14h20M10 20h20M10 26h20" stroke="#fff" strokeOpacity=".4" />
        <path d="M14 9v22M20 9v22M26 9v22" stroke="#fff" />
        <path d="M12.5 20h3M24.5 14h3M24.5 26h3M18.5 26h3M18.5 14h3" stroke="#fff" />
      </g>
    </svg>
  )
}

export function Logo({ dark = false, compact = false, className }: { dark?: boolean; compact?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark />
      {!compact && (
        <div className="leading-none">
          <div className={cn('font-display text-[17px] font-bold tracking-tight', dark ? 'text-white' : 'text-slate-900')}>
            GH <span className={dark ? 'text-brand-300' : 'text-brand-600'}>WEAVING</span>
          </div>
          <div className={cn('mt-1 text-[10.5px] font-medium tracking-[0.08em] uppercase', dark ? 'text-slate-400' : 'text-slate-500')}>Factory Management</div>
        </div>
      )}
    </div>
  )
}
