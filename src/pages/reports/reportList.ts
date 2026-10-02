import type { LucideIcon } from 'lucide-react'
import { BarChart3, Calculator, Gauge, HandCoins, Layers, Recycle, ShoppingCart, Spool, Timer, TrendingUp, Zap } from 'lucide-react'

export interface ReportMeta {
  slug: string
  title: string
  question: string
  icon: LucideIcon
  group: 'Production' | 'Inventory' | 'Commercial' | 'Finance'
  /** Does this report respond to the date filter? */
  dated?: boolean
}

export const REPORTS: ReportMeta[] = [
  { slug: 'daily-production', title: 'Daily Production', question: 'How much did we produce today?', icon: BarChart3, group: 'Production', dated: true },
  { slug: 'loom-efficiency', title: 'Loom Efficiency', question: 'Which looms are producing below target?', icon: Gauge, group: 'Production', dated: true },
  { slug: 'downtime', title: 'Downtime', question: 'Why are machines stopping?', icon: Timer, group: 'Production', dated: true },
  { slug: 'wastage', title: 'Wastage', question: 'Where are we losing material?', icon: Recycle, group: 'Production', dated: true },
  { slug: 'yarn-stock', title: 'Yarn Stock', question: 'Where did the yarn go?', icon: Spool, group: 'Inventory' },
  { slug: 'fabric-stock', title: 'Fabric Stock', question: 'What can we sell right now?', icon: Layers, group: 'Inventory' },
  { slug: 'sales', title: 'Sales', question: 'What have we sold, to whom?', icon: TrendingUp, group: 'Commercial' },
  { slug: 'purchases', title: 'Purchases', question: 'What have we bought, from whom?', icon: ShoppingCart, group: 'Commercial' },
  { slug: 'production-cost', title: 'Production Cost', question: 'What does one meter actually cost?', icon: Calculator, group: 'Finance' },
  { slug: 'electricity', title: 'Electricity', question: 'How much energy cost is embedded in production?', icon: Zap, group: 'Finance' },
  { slug: 'receivables', title: 'Receivables', question: 'Who owes us money?', icon: HandCoins, group: 'Finance' },
]
