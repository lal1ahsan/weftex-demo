import type { DowntimeCategory, DowntimeRecord, Loom, LoomStatus, LoomType, ProductionPlan, ProductionRecord, ShiftName } from '@/types'
import { OPERATORS } from './factory'
import { FABRICS } from './inventory'
import { createRng, daysAgo, isoDate, pad, roundTo, TODAY_ISO } from './seed'

const rng = createRng(1907)

/**
 * Headline numbers the demo story is built around. Every loom, shift and
 * production record is calibrated so the totals reconcile to these.
 */
export const CALIBRATION = {
  todayActual: 245_500,
  todayTarget: 260_000,
  yesterdayEfficiency: 91.2,
  todayDowntimeMin: 342,
  yesterdayDowntimeMin: 373,
  todayWastagePct: 2.3,
  yesterdayWastagePct: 2.7,
}

export const SHIFT_SPLIT: Record<ShiftName, number> = { Morning: 0.345, Evening: 0.338, Night: 0.317 }
const SHIFT_NAMES: ShiftName[] = ['Morning', 'Evening', 'Night']
/** Morning crews run slightly better than night crews — a pattern owners recognise. */
const SHIFT_PERFORMANCE: Record<ShiftName, number> = { Morning: 1.018, Evening: 1.004, Night: 0.976 }

// ---------------------------------------------------------------- Loom master
const HALL_SPECS: { from: number; to: number; hall: string; type: LoomType; manufacturer: string; model: string; width: number; rpm: [number, number]; year: number }[] = [
  { from: 1, to: 32, hall: 'Hall A', type: 'Air Jet', manufacturer: 'Toyota', model: 'JAT810', width: 75, rpm: [720, 820], year: 2018 },
  { from: 33, to: 56, hall: 'Hall B', type: 'Air Jet', manufacturer: 'Picanol', model: 'OMNIplus-i 4P', width: 85, rpm: [680, 780], year: 2020 },
  { from: 57, to: 72, hall: 'Hall C', type: 'Air Jet', manufacturer: 'Tsudakoma', model: 'ZAX9200i', width: 110, rpm: [600, 680], year: 2022 },
  { from: 73, to: 80, hall: 'Hall C', type: 'Rapier', manufacturer: 'Picanol', model: 'OptiMax-i', width: 135, rpm: [480, 540], year: 2023 },
]

const STOPPED: Record<string, { since: string; reason: string; category: DowntimeCategory; minutes: number }> = {
  'L-03': { since: '08:52', reason: 'Picking stick broken', category: 'Mechanical', minutes: 48 },
  'L-12': { since: '08:35', reason: 'Warp beam tension fault (Beam B-247)', category: 'Beam Issue', minutes: 65 },
  'L-27': { since: '09:12', reason: 'Repeated weft breakage — yarn hairiness', category: 'Yarn Issue', minutes: 28 },
  'L-41': { since: '08:58', reason: 'Main motor tripped', category: 'Electrical', minutes: 42 },
  'L-58': { since: '09:21', reason: 'Operator absent — no relief assigned', category: 'Operator', minutes: 19 },
  'L-66': { since: '09:05', reason: 'Awaiting weft cones from store', category: 'Material Shortage', minutes: 35 },
}
const MAINTENANCE: Record<string, string> = {
  'L-19': 'Scheduled 2,000-hour service',
  'L-73': 'Rapier tape & gripper replacement',
}

const narrowFabrics = FABRICS.filter((f) => f.widthInches <= 63)
const wideFabrics = FABRICS.filter((f) => f.widthInches > 63)
const FIXED_FABRIC: Record<string, string> = { 'L-01': 'FAB-101', 'L-02': 'FAB-102', 'L-03': 'FAB-103', 'L-12': 'FAB-101' }

interface LoomDraft extends Loom { rawEff: number }

const drafts: LoomDraft[] = HALL_SPECS.flatMap((spec) =>
  Array.from({ length: spec.to - spec.from + 1 }, (_, k) => {
    const n = spec.from + k
    const id = `L-${pad(n)}`
    const status: LoomStatus = STOPPED[id] ? 'Stopped' : MAINTENANCE[id] ? 'Maintenance' : 'Running'
    const pool = spec.width >= 110 ? wideFabrics.concat(narrowFabrics.slice(0, 4)) : narrowFabrics
    const fabricCode = FIXED_FABRIC[id] ?? rng.pick(pool).code
    const rawEff = status === 'Running' ? rng.float(92.5, 101) : status === 'Stopped' ? rng.float(56, 78) : rng.float(30, 46)
    const target = roundTo(rng.int(2900, 3600) * (spec.width >= 110 ? 1.05 : 1), 50)
    return {
      id,
      type: spec.type,
      manufacturer: spec.manufacturer,
      model: spec.model,
      widthInches: spec.width,
      rpm: roundTo(rng.int(spec.rpm[0], spec.rpm[1]), 10),
      installed: `${spec.year + (k % 3 === 2 ? 1 : 0)}-${pad(rng.int(1, 12))}-${pad(rng.int(1, 28))}`,
      hall: spec.hall,
      status,
      fabricCode,
      operator: OPERATORS[(n - 1) % OPERATORS.length].name,
      shift: 'Morning' as ShiftName,
      todayProduction: 0,
      target,
      efficiency: 0,
      downtimeMinutes: 0,
      stoppedSince: STOPPED[id]?.since,
      stopReason: STOPPED[id]?.reason ?? MAINTENANCE[id],
      rawEff,
    }
  }),
)

// Scale targets to the factory target, then actuals to the factory actual.
const targetScale = CALIBRATION.todayTarget / drafts.reduce((s, l) => s + l.target, 0)
drafts.forEach((l) => (l.target = roundTo(l.target * targetScale, 10)))
drafts[drafts.length - 1].target += CALIBRATION.todayTarget - drafts.reduce((s, l) => s + l.target, 0)

const rawActual = drafts.map((l) => (l.target * l.rawEff) / 100)
const actualScale = CALIBRATION.todayActual / rawActual.reduce((a, b) => a + b, 0)
drafts.forEach((l, i) => (l.todayProduction = roundTo(rawActual[i] * actualScale, 10)))
const residual = CALIBRATION.todayActual - drafts.reduce((s, l) => s + l.todayProduction, 0)
drafts[4].todayProduction += residual

// ---------------------------------------------------------------- Downtime
const DOWNTIME_REASONS: Record<DowntimeCategory, string[]> = {
  Mechanical: ['Picking stick broken', 'Heald frame damage', 'Reed damage', 'Take-up roller slip', 'Bearing noise — dobby'],
  Electrical: ['Main motor tripped', 'Sensor fault — weft detector', 'Power fluctuation (FESCO)', 'Control panel reset', 'Inverter fault'],
  'Yarn Issue': ['Repeated weft breakage', 'Warp breakage — weak yarn', 'Wrong count on cone', 'Slub / thick place'],
  'Beam Issue': ['Warp beam tension fault', 'Beam change', 'Sizing defect on beam', 'Beam knotting'],
  Operator: ['Operator absent', 'Shift change delay', 'Late start after break'],
  Maintenance: ['Scheduled lubrication', 'Nozzle cleaning', 'Preventive maintenance'],
  'Material Shortage': ['Awaiting weft cones', 'Beam not ready from sizing', 'Waiting for design approval'],
}
export const DOWNTIME_DEPARTMENT: Record<DowntimeCategory, string> = {
  Mechanical: 'Maintenance', Electrical: 'Electrical', 'Yarn Issue': 'Store / QC', 'Beam Issue': 'Preparation',
  Operator: 'Production', Maintenance: 'Maintenance', 'Material Shortage': 'Store',
}

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3))
const fromMin = (m: number) => `${pad(Math.floor(((m % 1440) + 1440) % 1440 / 60))}:${pad(((m % 60) + 60) % 60)}`
const shiftAt = (t: string): ShiftName => {
  const m = toMin(t)
  return m >= 420 && m < 900 ? 'Morning' : m >= 900 && m < 1380 ? 'Evening' : 'Night'
}

const todayDowntime: DowntimeRecord[] = [
  ...Object.entries(STOPPED).map(([loomId, s]) => ({ loomId, start: s.since, minutes: s.minutes, category: s.category, reason: s.reason, ongoing: true })),
  { loomId: 'L-08', start: '02:10', minutes: 32, category: 'Electrical' as DowntimeCategory, reason: 'Power fluctuation (FESCO)', ongoing: false },
  { loomId: 'L-33', start: '04:25', minutes: 26, category: 'Yarn Issue' as DowntimeCategory, reason: 'Warp breakage — weak yarn', ongoing: false },
  { loomId: 'L-50', start: '05:40', minutes: 47, category: 'Mechanical' as DowntimeCategory, reason: 'Heald frame damage', ongoing: false },
].map((d, i) => ({
  id: `DT-${3350 - i}`,
  loomId: d.loomId,
  date: TODAY_ISO,
  shift: shiftAt(d.start),
  start: d.start,
  end: d.ongoing ? '' : fromMin(toMin(d.start) + d.minutes),
  minutes: d.minutes,
  category: d.category,
  reason: d.reason,
  department: DOWNTIME_DEPARTMENT[d.category],
  remarks: d.ongoing ? 'Loom still stopped — technician assigned' : 'Resolved',
}))

const CATEGORY_WEIGHTS: [DowntimeCategory, number][] = [
  ['Mechanical', 30], ['Electrical', 20], ['Yarn Issue', 17], ['Beam Issue', 11], ['Maintenance', 10], ['Operator', 7], ['Material Shortage', 5],
]
const historyDowntime: DowntimeRecord[] = Array.from({ length: 43 }, (_, i) => {
  const day = 1 + Math.floor(i / 7.2)
  const category = rng.weighted(CATEGORY_WEIGHTS)
  const startMin = rng.int(0, 1439)
  const minutes = category === 'Maintenance' ? rng.int(45, 120) : rng.int(12, 95)
  const start = fromMin(startMin)
  return {
    id: `DT-${3341 - i}`,
    loomId: `L-${pad(rng.int(1, 80))}`,
    date: isoDate(daysAgo(day)),
    shift: shiftAt(start),
    start,
    end: fromMin(startMin + minutes),
    minutes,
    category,
    reason: rng.pick(DOWNTIME_REASONS[category]),
    department: DOWNTIME_DEPARTMENT[category],
    remarks: rng.pick(['Resolved', 'Resolved — part replaced', 'Resolved by shift technician', 'Repeat issue — monitor', 'Resolved']),
  }
})

// Make yesterday's total reconcile with the dashboard comparison (373 min)
{
  const yIso = isoDate(daysAgo(1))
  const y = historyDowntime.filter((d) => d.date === yIso)
  const others = y.slice(0, -1).reduce((s, d) => s + d.minutes, 0)
  const last = y[y.length - 1]
  if (last && CALIBRATION.yesterdayDowntimeMin - others > 5) {
    last.minutes = CALIBRATION.yesterdayDowntimeMin - others
    last.end = fromMin(toMin(last.start) + last.minutes)
  } else {
    let remaining = CALIBRATION.yesterdayDowntimeMin
    y.forEach((d, i) => {
      d.minutes = i === y.length - 1 ? remaining : Math.round(CALIBRATION.yesterdayDowntimeMin / y.length)
      remaining -= d.minutes
      d.end = fromMin(toMin(d.start) + d.minutes)
    })
  }
}

export const DOWNTIME: DowntimeRecord[] = [...todayDowntime, ...historyDowntime]
export const DOWNTIME_CATEGORIES = CATEGORY_WEIGHTS.map(([c]) => c)
export const DOWNTIME_REASON_OPTIONS = DOWNTIME_REASONS

// Finalise looms with downtime + efficiency
export const LOOMS: Loom[] = drafts.map(({ rawEff: _rawEff, ...l }) => ({
  ...l,
  efficiency: Math.round((l.todayProduction / l.target) * 1000) / 10,
  downtimeMinutes: todayDowntime.filter((d) => d.loomId === l.id).reduce((s, d) => s + d.minutes, 0),
}))

export const loomById = (id: string) => LOOMS.find((l) => l.id === id)

// ---------------------------------------------------------------- Production records
const kgPerMeter = (fabricCode: string) => {
  const f = FABRICS.find((x) => x.code === fabricCode)!
  return f.widthInches * 0.0254 * (f.gsm / 1000)
}

// 7-day factory efficiency path, ending today at 94.4%
const DAY_EFF = [92.6, 90.4, 93.1, 92.2, 93.8, CALIBRATION.yesterdayEfficiency, 94.4]

let prodSeq = 48210
export const PRODUCTION: ProductionRecord[] = []
for (let d = 6; d >= 0; d--) {
  // Per-loom variation, scaled so the factory total hits that day's efficiency
  const raw = LOOMS.map((l) => l.target * rng.float(0.88, 1.02))
  const dayScale = (DAY_EFF[6 - d] / 100) * CALIBRATION.todayTarget / raw.reduce((a, b) => a + b, 0)
  LOOMS.forEach((loom, li) => {
    const loomDay = d === 0 ? loom.todayProduction : roundTo(raw[li] * dayScale, 10)
    SHIFT_NAMES.forEach((shift, si) => {
      const target = si < 2 ? roundTo(loom.target * SHIFT_SPLIT[shift], 10) : loom.target - roundTo(loom.target * SHIFT_SPLIT.Morning, 10) - roundTo(loom.target * SHIFT_SPLIT.Evening, 10)
      const share = (k: ShiftName) => roundTo(loomDay * SHIFT_SPLIT[k] * SHIFT_PERFORMANCE[k], 10)
      const actual = si < 2 ? share(shift) : loomDay - share('Morning') - share('Evening')
      const wastagePct = (d === 0 ? CALIBRATION.todayWastagePct : d === 1 ? CALIBRATION.yesterdayWastagePct : rng.float(2.2, 2.9)) * rng.float(0.8, 1.2)
      const op = OPERATORS[(Number(loom.id.slice(2)) - 1 + si * 27) % OPERATORS.length]
      PRODUCTION.push({
        id: `PR-${prodSeq++}`,
        date: isoDate(daysAgo(d)),
        shift,
        loomId: loom.id,
        operator: op.name,
        fabricCode: loom.fabricCode,
        target,
        actual,
        wastageKg: Math.round(actual * kgPerMeter(loom.fabricCode) * (wastagePct / 100) * 10) / 10,
        efficiency: Math.round((actual / target) * 1000) / 10,
        remarks: d === 0 && STOPPED[loom.id] && shift === 'Morning' ? STOPPED[loom.id].reason : '',
      })
    })
  })
}
PRODUCTION.reverse()

// Calibrate wastage for today / yesterday to the dashboard figures
;[
  [TODAY_ISO, CALIBRATION.todayWastagePct],
  [isoDate(daysAgo(1)), CALIBRATION.yesterdayWastagePct],
].forEach(([iso, targetPct]) => {
  const recs = PRODUCTION.filter((r) => r.date === iso)
  const waste = recs.reduce((s, r) => s + r.wastageKg, 0)
  const fabricKg = recs.reduce((s, r) => s + r.actual * kgPerMeter(r.fabricCode), 0)
  // waste / (fabricKg + waste) = p  →  waste = p·fabricKg / (1 − p)
  const p = Number(targetPct) / 100
  const k = (p * fabricKg) / (1 - p) / waste
  recs.forEach((r) => (r.wastageKg = Math.round(r.wastageKg * k * 10) / 10))
})

export function yarnUsedKg(r: Pick<ProductionRecord, 'actual' | 'fabricCode' | 'wastageKg'>) {
  return r.actual * kgPerMeter(r.fabricCode) + r.wastageKg
}

export const PRODUCTION_PLANS: ProductionPlan[] = [
  { id: 'PP-0921', fabricCode: 'FAB-101', orderId: 'SO-1024', looms: ['L-01', 'L-12', 'L-14', 'L-22'], plannedMeters: 48000, producedMeters: 41250, start: isoDate(daysAgo(9)), end: isoDate(daysAgo(-2)), status: 'In Progress' },
  { id: 'PP-0920', fabricCode: 'FAB-102', orderId: 'SO-1023', looms: ['L-02', 'L-05', 'L-09'], plannedMeters: 36000, producedMeters: 36000, start: isoDate(daysAgo(16)), end: isoDate(daysAgo(3)), status: 'Completed' },
  { id: 'PP-0922', fabricCode: 'FAB-103', orderId: 'SO-1026', looms: ['L-03', 'L-07', 'L-18'], plannedMeters: 30000, producedMeters: 17400, start: isoDate(daysAgo(6)), end: isoDate(daysAgo(1)), status: 'Delayed' },
  { id: 'PP-0923', fabricCode: 'FAB-109', orderId: 'SO-1027', looms: ['L-57', 'L-59', 'L-61', 'L-62'], plannedMeters: 52000, producedMeters: 22800, start: isoDate(daysAgo(4)), end: isoDate(daysAgo(-8)), status: 'In Progress' },
  { id: 'PP-0924', fabricCode: 'FAB-111', orderId: 'SO-1028', looms: ['L-64', 'L-67', 'L-70'], plannedMeters: 40000, producedMeters: 9650, start: isoDate(daysAgo(2)), end: isoDate(daysAgo(-11)), status: 'In Progress' },
  { id: 'PP-0925', fabricCode: 'FAB-105', orderId: 'SO-1029', looms: ['L-33', 'L-36', 'L-40', 'L-44'], plannedMeters: 44000, producedMeters: 0, start: isoDate(daysAgo(-3)), end: isoDate(daysAgo(-15)), status: 'Planned' },
  { id: 'PP-0919', fabricCode: 'FAB-113', orderId: 'SO-1019', looms: ['L-24', 'L-25'], plannedMeters: 18000, producedMeters: 18000, start: isoDate(daysAgo(20)), end: isoDate(daysAgo(8)), status: 'Completed' },
  { id: 'PP-0926', fabricCode: 'FAB-119', orderId: 'SO-1030', looms: ['L-74', 'L-75', 'L-76'], plannedMeters: 15000, producedMeters: 0, start: isoDate(daysAgo(-5)), end: isoDate(daysAgo(-20)), status: 'Planned' },
  { id: 'PP-0918', fabricCode: 'FAB-112', orderId: 'SO-1017', looms: ['L-45', 'L-46', 'L-47'], plannedMeters: 27000, producedMeters: 27000, start: isoDate(daysAgo(24)), end: isoDate(daysAgo(12)), status: 'Completed' },
  { id: 'PP-0927', fabricCode: 'FAB-104', orderId: 'SO-1031', looms: ['L-10', 'L-11'], plannedMeters: 20000, producedMeters: 4200, start: isoDate(daysAgo(1)), end: isoDate(daysAgo(-6)), status: 'In Progress' },
]
