import type { ReactNode } from 'react'
import { cn } from '@/utils/format'

export type Tone = 'green' | 'amber' | 'red' | 'blue' | 'slate' | 'violet' | 'teal'

const TONES: Record<Tone, { pill: string; dot: string }> = {
  green: { pill: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15', dot: 'bg-emerald-500' },
  amber: { pill: 'bg-amber-50 text-amber-800 ring-amber-600/20', dot: 'bg-amber-500' },
  red: { pill: 'bg-rose-50 text-rose-700 ring-rose-600/15', dot: 'bg-rose-500' },
  blue: { pill: 'bg-sky-50 text-sky-700 ring-sky-600/15', dot: 'bg-sky-500' },
  slate: { pill: 'bg-slate-100 text-slate-600 ring-slate-500/15', dot: 'bg-slate-400' },
  violet: { pill: 'bg-violet-50 text-violet-700 ring-violet-600/15', dot: 'bg-violet-500' },
  teal: { pill: 'bg-teal-50 text-teal-700 ring-teal-600/15', dot: 'bg-teal-500' },
}

/** Map every status string used in the demo to a tone, so badges are consistent everywhere. */
const STATUS_TONE: Record<string, Tone> = {
  Running: 'green', Idle: 'amber', Stopped: 'red', Maintenance: 'blue',
  'In Stock': 'green', 'Low Stock': 'amber', 'Out of Stock': 'red',
  Available: 'green', Reserved: 'blue', 'On Hold': 'amber',
  Passed: 'green', Rejected: 'red', Hold: 'amber',
  Active: 'green', Inactive: 'slate', Invited: 'blue', Disabled: 'slate',
  Draft: 'slate', Confirmed: 'blue', 'Partially Fulfilled': 'amber', Completed: 'green', Cancelled: 'red',
  Received: 'green', 'In Transit': 'blue', Pending: 'amber', 'Partially Received': 'amber', Approved: 'blue',
  Delivered: 'green', Loading: 'amber', Dispatched: 'slate',
  Planned: 'slate', 'In Progress': 'blue', Delayed: 'red',
  Resolved: 'green', Ongoing: 'red',
  Warp: 'violet', Weft: 'teal',
}

export const toneFor = (status: string): Tone => STATUS_TONE[status] ?? 'slate'

export function Badge({ tone = 'slate', children, dot, className }: { tone?: Tone; children: ReactNode; dot?: boolean; className?: string }) {
  const t = TONES[tone]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset', t.pill, className)}>
      {dot && <span className={cn('size-1.5 rounded-full', t.dot)} />}
      {children}
    </span>
  )
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge tone={toneFor(status)} dot className={className}>
      {status}
    </Badge>
  )
}

export const LOOM_STATUS_COLOR: Record<string, string> = {
  Running: '#10b981',
  Idle: '#f59e0b',
  Stopped: '#f43f5e',
  Maintenance: '#0ea5e9',
}
