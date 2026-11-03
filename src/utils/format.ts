import { clsx, type ClassValue } from 'clsx'
import { TERMS } from '@/data/dataset'

export const cn = (...inputs: ClassValue[]) => clsx(inputs)

const nf0 = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 })
const nf1 = new Intl.NumberFormat('en-PK', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

export const num = (n: number, digits = 0) => (digits === 0 ? nf0.format(n) : new Intl.NumberFormat('en-PK', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n))

export const pct = (n: number, digits = 1) => `${digits === 1 ? nf1.format(n) : num(n, digits)}%`

export const pkr = (n: number) => `PKR ${nf0.format(Math.round(n))}`

/** Per-meter money: keeps paisa precision (PKR 35.00, PKR 1.25) */
export const pkrM = (n: number) => `PKR ${new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)}`

/** PKR 25.4M / PKR 850K — compact money for KPI tiles */
export function pkrCompact(n: number, digits = 1) {
  const abs = Math.abs(n)
  if (abs >= 1_000_000_000) return `PKR ${(n / 1_000_000_000).toFixed(digits)}B`
  if (abs >= 1_000_000) return `PKR ${(n / 1_000_000).toFixed(digits)}M`
  if (abs >= 1_000) return `PKR ${(n / 1_000).toFixed(abs >= 100_000 ? 0 : digits)}K`
  return `PKR ${nf0.format(n)}`
}

export const compact = (n: number) => {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${(n / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}K`
  return nf0.format(n)
}

/** A production quantity in the business's output unit: meters of fabric, or kg for poly bags. */
export const meters = (n: number) => `${nf0.format(n)} ${TERMS.out}`
/** A finished-goods quantity: meters of fabric, or bags. */
export const stockQty = (n: number) => `${nf0.format(n)} ${TERMS.stock}`
export const kg = (n: number) => `${nf0.format(n)} kg`

export function duration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (h === 0) return `${m}m`
  return `${h}h ${String(m).padStart(2, '0')}m`
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const parse = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const date = (iso: string) => {
  const d = parse(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}
export const dateLong = (d: Date) => `${d.getDate()} ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`
export const dayShort = (iso: string) => {
  const d = parse(iso)
  return `${DAYS[d.getDay()]} ${d.getDate()}`
}
export const dayMonth = (iso: string) => {
  const d = parse(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

export const sum = <T,>(arr: readonly T[], fn: (x: T) => number) => arr.reduce((s, x) => s + fn(x), 0)

export function groupBy<T, K extends string>(arr: readonly T[], fn: (x: T) => K): Record<K, T[]> {
  return arr.reduce(
    (acc, x) => {
      const k = fn(x)
      ;(acc[k] ||= []).push(x)
      return acc
    },
    {} as Record<K, T[]>,
  )
}

export function delta(current: number, previous: number) {
  if (!previous) return 0
  return ((current - previous) / previous) * 100
}
