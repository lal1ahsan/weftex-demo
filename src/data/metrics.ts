import type { DowntimeCategory, DowntimeRecord, Loom, LoomStatus, ProductionRecord, ShiftName } from '@/types'
import { yarnUsedKg } from './production'
import { daysAgo, isoDate, TODAY_ISO } from './seed'
import { dayShort, sum } from '@/utils/format'

export const YESTERDAY_ISO = isoDate(daysAgo(1))

export function totals(records: ProductionRecord[]) {
  const actual = sum(records, (r) => r.actual)
  const target = sum(records, (r) => r.target)
  const wasteKg = sum(records, (r) => r.wastageKg)
  const yarnKg = sum(records, yarnUsedKg)
  return {
    actual,
    target,
    efficiency: target ? (actual / target) * 100 : 0,
    wasteKg,
    yarnKg,
    wastagePct: yarnKg ? (wasteKg / yarnKg) * 100 : 0,
  }
}

export const onDate = (records: ProductionRecord[], iso: string) => records.filter((r) => r.date === iso)

export function dailyTrend(records: ProductionRecord[], days = 7) {
  return Array.from({ length: days }, (_, i) => {
    const iso = isoDate(daysAgo(days - 1 - i))
    const t = totals(onDate(records, iso))
    return { date: iso, label: iso === TODAY_ISO ? 'Today' : dayShort(iso), actual: t.actual, target: t.target, efficiency: t.efficiency, wastagePct: t.wastagePct }
  })
}

export function byShift(records: ProductionRecord[]) {
  return (['Morning', 'Evening', 'Night'] as ShiftName[]).map((shift) => {
    const t = totals(records.filter((r) => r.shift === shift))
    return { shift, ...t }
  })
}

export function downtimeByCategory(records: DowntimeRecord[]) {
  const map = new Map<DowntimeCategory, { minutes: number; count: number }>()
  records.forEach((r) => {
    const cur = map.get(r.category) ?? { minutes: 0, count: 0 }
    map.set(r.category, { minutes: cur.minutes + r.minutes, count: cur.count + 1 })
  })
  return [...map.entries()].map(([category, v]) => ({ category, ...v })).sort((a, b) => b.minutes - a.minutes)
}

export function loomStatusCounts(looms: Loom[]) {
  const counts: Record<LoomStatus, number> = { Running: 0, Idle: 0, Stopped: 0, Maintenance: 0 }
  looms.forEach((l) => counts[l.status]++)
  return counts
}

export function byLoom(records: ProductionRecord[]) {
  const map = new Map<string, { actual: number; target: number }>()
  records.forEach((r) => {
    const cur = map.get(r.loomId) ?? { actual: 0, target: 0 }
    map.set(r.loomId, { actual: cur.actual + r.actual, target: cur.target + r.target })
  })
  return [...map.entries()].map(([loomId, v]) => ({ loomId, ...v, efficiency: v.target ? (v.actual / v.target) * 100 : 0 }))
}
