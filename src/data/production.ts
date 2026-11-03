import type { DowntimeCategory, DowntimeRecord, Loom, LoomStatus, LoomType, ProductionPlan, ProductionRecord, ShiftName } from '@/types'
import { IS_POLY } from './dataset'
import { OPERATORS } from './factory'
import { FABRICS, unitKg } from './inventory'
import { createRng, daysAgo, isoDate, pad, roundTo, TODAY_ISO } from './seed'

const rng = createRng(1907)

/**
 * Headline numbers the demo story is built around. Every loom, shift and
 * production record is calibrated so the totals reconcile to these.
 */
export const CALIBRATION = IS_POLY
  ? {
      // Poly bags: production is counted in kg of output per machine.
      todayActual: 43_400,
      todayTarget: 46_000,
      yesterdayEfficiency: 92.1,
      todayDowntimeMin: 286,
      yesterdayDowntimeMin: 318,
      todayWastagePct: 3.1,
      yesterdayWastagePct: 3.4,
    }
  : {
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
type HallSpec = { from: number; to: number; hall: string; type: LoomType; manufacturer: string; model: string; width: number; rpm: [number, number]; year: number; target: [number, number] }

const WEAVING_SPECS: HallSpec[] = [
  { from: 1, to: 32, hall: 'Hall A', type: 'Air Jet', manufacturer: 'Toyota', model: 'JAT810', width: 75, rpm: [720, 820], year: 2018, target: [2900, 3600] },
  { from: 33, to: 56, hall: 'Hall B', type: 'Air Jet', manufacturer: 'Picanol', model: 'OMNIplus-i 4P', width: 85, rpm: [680, 780], year: 2020, target: [2900, 3600] },
  { from: 57, to: 72, hall: 'Hall C', type: 'Air Jet', manufacturer: 'Tsudakoma', model: 'ZAX9200i', width: 110, rpm: [600, 680], year: 2022, target: [2900, 3600] },
  { from: 73, to: 80, hall: 'Hall C', type: 'Rapier', manufacturer: 'Picanol', model: 'OptiMax-i', width: 135, rpm: [480, 540], year: 2023, target: [2900, 3600] },
]

/** Poly bags: tape extruders → circular looms → printing → cutting & sealing (2.3). Targets are kg per day. */
const POLY_SPECS: HallSpec[] = [
  { from: 1, to: 6, hall: 'Extrusion', type: 'Extruder', manufacturer: 'Lohia', model: 'LT-1000 tape line', width: 60, rpm: [80, 110], year: 2016, target: [4300, 4900] },
  { from: 7, to: 30, hall: 'Weaving', type: 'Circular Loom', manufacturer: 'Lohia', model: 'LSL 6', width: 22, rpm: [150, 180], year: 2017, target: [100, 125] },
  { from: 31, to: 42, hall: 'Weaving', type: 'Circular Loom', manufacturer: 'Starlinger', model: 'SL 6', width: 28, rpm: [160, 190], year: 2021, target: [115, 140] },
  { from: 43, to: 46, hall: 'Printing', type: 'Printing', manufacturer: 'Lohia', model: 'Flexo 4-colour', width: 40, rpm: [60, 90], year: 2019, target: [1400, 1700] },
  { from: 47, to: 52, hall: 'Conversion', type: 'Cutting & Sealing', manufacturer: 'Lohia', model: 'CS-160 cut & stitch', width: 40, rpm: [40, 60], year: 2020, target: [1250, 1550] },
]

const HALL_SPECS = IS_POLY ? POLY_SPECS : WEAVING_SPECS
const MACHINE_COUNT = HALL_SPECS[HALL_SPECS.length - 1].to
const ID_PREFIX = IS_POLY ? 'M-' : 'L-'

type Stop = { since: string; reason: string; category: DowntimeCategory; minutes: number }

const POLY_STOPPED: Record<string, Stop> = {
  'M-03': { since: '08:40', reason: 'Screen pack choked — melt pressure high', category: 'Mechanical', minutes: 60 },
  'M-12': { since: '08:55', reason: 'Shuttle broken', category: 'Mechanical', minutes: 45 },
  'M-19': { since: '09:10', reason: 'Repeated tape breakage — low tenacity', category: 'Tape Issue', minutes: 30 },
  'M-33': { since: '09:02', reason: 'Main motor tripped', category: 'Electrical', minutes: 38 },
  'M-44': { since: '09:18', reason: 'Ink smudging — anilox roller dirty', category: 'Print Issue', minutes: 22 },
  'M-49': { since: '09:25', reason: 'Waiting for printed fabric rolls', category: 'Material Shortage', minutes: 15 },
}
const POLY_MAINTENANCE: Record<string, string> = {
  'M-05': 'Scheduled screw & barrel cleaning',
  'M-38': 'Shuttle wheel & reed replacement',
}

const WEAVING_STOPPED: Record<string, Stop> = {
  'L-03': { since: '08:52', reason: 'Picking stick broken', category: 'Mechanical', minutes: 48 },
  'L-12': { since: '08:35', reason: 'Warp beam tension fault (Beam B-247)', category: 'Beam Issue', minutes: 65 },
  'L-27': { since: '09:12', reason: 'Repeated weft breakage — yarn hairiness', category: 'Yarn Issue', minutes: 28 },
  'L-41': { since: '08:58', reason: 'Main motor tripped', category: 'Electrical', minutes: 42 },
  'L-58': { since: '09:21', reason: 'Operator absent — no relief assigned', category: 'Operator', minutes: 19 },
  'L-66': { since: '09:05', reason: 'Awaiting weft cones from store', category: 'Material Shortage', minutes: 35 },
}
const WEAVING_MAINTENANCE: Record<string, string> = {
  'L-19': 'Scheduled 2,000-hour service',
  'L-73': 'Rapier tape & gripper replacement',
}

const STOPPED = IS_POLY ? POLY_STOPPED : WEAVING_STOPPED
const MAINTENANCE = IS_POLY ? POLY_MAINTENANCE : WEAVING_MAINTENANCE

const narrowFabrics = FABRICS.filter((f) => f.widthInches <= 63)
const wideFabrics = FABRICS.filter((f) => f.widthInches > 63)
const FIXED_FABRIC: Record<string, string> = IS_POLY
  ? { 'M-01': 'BAG-101', 'M-07': 'BAG-101', 'M-12': 'BAG-101', 'M-43': 'BAG-101', 'M-47': 'BAG-101' }
  : { 'L-01': 'FAB-101', 'L-02': 'FAB-102', 'L-03': 'FAB-103', 'L-12': 'FAB-101' }

interface LoomDraft extends Loom { rawEff: number }

const drafts: LoomDraft[] = HALL_SPECS.flatMap((spec) =>
  Array.from({ length: spec.to - spec.from + 1 }, (_, k) => {
    const n = spec.from + k
    const id = `${ID_PREFIX}${pad(n)}`
    const status: LoomStatus = STOPPED[id] ? 'Stopped' : MAINTENANCE[id] ? 'Maintenance' : 'Running'
    const pool = IS_POLY ? FABRICS : spec.width >= 110 ? wideFabrics.concat(narrowFabrics.slice(0, 4)) : narrowFabrics
    const fabricCode = FIXED_FABRIC[id] ?? rng.pick(pool).code
    const rawEff = status === 'Running' ? rng.float(92.5, 101) : status === 'Stopped' ? rng.float(56, 78) : rng.float(30, 46)
    const target = IS_POLY ? roundTo(rng.int(spec.target[0], spec.target[1]), spec.target[1] < 500 ? 5 : 50) : roundTo(rng.int(2900, 3600) * (spec.width >= 110 ? 1.05 : 1), 50)
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
const WEAVING_REASONS: Partial<Record<DowntimeCategory, string[]>> = {
  Mechanical: ['Picking stick broken', 'Heald frame damage', 'Reed damage', 'Take-up roller slip', 'Bearing noise — dobby'],
  Electrical: ['Main motor tripped', 'Sensor fault — weft detector', 'Power fluctuation (FESCO)', 'Control panel reset', 'Inverter fault'],
  'Yarn Issue': ['Repeated weft breakage', 'Warp breakage — weak yarn', 'Wrong count on cone', 'Slub / thick place'],
  'Beam Issue': ['Warp beam tension fault', 'Beam change', 'Sizing defect on beam', 'Beam knotting'],
  Operator: ['Operator absent', 'Shift change delay', 'Late start after break'],
  Maintenance: ['Scheduled lubrication', 'Nozzle cleaning', 'Preventive maintenance'],
  'Material Shortage': ['Awaiting weft cones', 'Beam not ready from sizing', 'Waiting for design approval'],
}
const POLY_REASONS: Partial<Record<DowntimeCategory, string[]>> = {
  Mechanical: ['Shuttle broken', 'Screen pack choked', 'Godet roller bearing noise', 'Cutting blade blunt', 'Winder tension fault'],
  Electrical: ['Main motor tripped', 'Heater zone fault — extruder', 'Power fluctuation (LESCO)', 'Control panel reset', 'Inverter fault'],
  'Tape Issue': ['Repeated tape breakage', 'Tape width out of spec', 'Low tape tenacity', 'Bobbin running out'],
  'Print Issue': ['Ink smudging', 'Print registration off', 'Plate change', 'Anilox roller cleaning'],
  Operator: ['Operator absent', 'Shift change delay', 'Late start after break'],
  Maintenance: ['Scheduled lubrication', 'Die cleaning', 'Preventive maintenance'],
  'Material Shortage': ['Awaiting granules from store', 'Waiting for printed rolls', 'Waiting for design approval'],
}
const DOWNTIME_REASONS = (IS_POLY ? POLY_REASONS : WEAVING_REASONS) as Record<DowntimeCategory, string[]>
export const DOWNTIME_DEPARTMENT: Record<DowntimeCategory, string> = {
  Mechanical: 'Maintenance', Electrical: 'Electrical', 'Yarn Issue': 'Store / QC', 'Beam Issue': 'Preparation',
  'Tape Issue': 'Extrusion / QC', 'Print Issue': 'Printing', Operator: 'Production', Maintenance: 'Maintenance', 'Material Shortage': 'Store',
}

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3))
const fromMin = (m: number) => `${pad(Math.floor(((m % 1440) + 1440) % 1440 / 60))}:${pad(((m % 60) + 60) % 60)}`
const shiftAt = (t: string): ShiftName => {
  const m = toMin(t)
  return m >= 420 && m < 900 ? 'Morning' : m >= 900 && m < 1380 ? 'Evening' : 'Night'
}

const EARLIER_TODAY: { loomId: string; start: string; minutes: number; category: DowntimeCategory; reason: string }[] = IS_POLY
  ? [
      { loomId: 'M-02', start: '02:30', minutes: 34, category: 'Electrical', reason: 'Heater zone fault — extruder' },
      { loomId: 'M-25', start: '04:10', minutes: 25, category: 'Tape Issue', reason: 'Bobbin running out' },
      { loomId: 'M-48', start: '05:50', minutes: 17, category: 'Mechanical', reason: 'Cutting blade blunt' },
    ]
  : [
      { loomId: 'L-08', start: '02:10', minutes: 32, category: 'Electrical', reason: 'Power fluctuation (FESCO)' },
      { loomId: 'L-33', start: '04:25', minutes: 26, category: 'Yarn Issue', reason: 'Warp breakage — weak yarn' },
      { loomId: 'L-50', start: '05:40', minutes: 47, category: 'Mechanical', reason: 'Heald frame damage' },
    ]

const todayDowntime: DowntimeRecord[] = [
  ...Object.entries(STOPPED).map(([loomId, s]) => ({ loomId, start: s.since, minutes: s.minutes, category: s.category, reason: s.reason, ongoing: true })),
  ...EARLIER_TODAY.map((d) => ({ ...d, ongoing: false })),
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
  remarks: d.ongoing ? `${IS_POLY ? 'Machine' : 'Loom'} still stopped — technician assigned` : 'Resolved',
}))

const CATEGORY_WEIGHTS: [DowntimeCategory, number][] = IS_POLY
  ? [['Mechanical', 32], ['Electrical', 19], ['Tape Issue', 16], ['Print Issue', 10], ['Maintenance', 11], ['Operator', 7], ['Material Shortage', 5]]
  : [['Mechanical', 30], ['Electrical', 20], ['Yarn Issue', 17], ['Beam Issue', 11], ['Maintenance', 10], ['Operator', 7], ['Material Shortage', 5]]
const historyDowntime: DowntimeRecord[] = Array.from({ length: 43 }, (_, i) => {
  const day = 1 + Math.floor(i / 7.2)
  const category = rng.weighted(CATEGORY_WEIGHTS)
  const startMin = rng.int(0, 1439)
  const minutes = category === 'Maintenance' ? rng.int(45, 120) : rng.int(12, 95)
  const start = fromMin(startMin)
  return {
    id: `DT-${3341 - i}`,
    loomId: `${ID_PREFIX}${pad(rng.int(1, MACHINE_COUNT))}`,
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
/** Kg in one unit of production: a meter of fabric, or (poly bags, counted in kg) 1. */
const kgPerMeter = (fabricCode: string) => {
  if (IS_POLY) return 1
  return unitKg(FABRICS.find((x) => x.code === fabricCode)!)
}

// 7-day factory efficiency path, ending today at 94.4% (poly bags 94.3%)
const DAY_EFF = IS_POLY ? [91.4, 92.8, 90.9, 93.2, 92.5, CALIBRATION.yesterdayEfficiency, 94.3] : [92.6, 90.4, 93.1, 92.2, 93.8, CALIBRATION.yesterdayEfficiency, 94.4]

let prodSeq = 48210
export const PRODUCTION: ProductionRecord[] = []
for (let d = 6; d >= 0; d--) {
  // Per-loom variation, scaled so the factory total hits that day's efficiency
  const raw = LOOMS.map((l) => l.target * rng.float(0.88, 1.02))
  const dayScale = (DAY_EFF[6 - d] / 100) * CALIBRATION.todayTarget / raw.reduce((a, b) => a + b, 0)
  LOOMS.forEach((loom, li) => {
    const loomDay = d === 0 ? loom.todayProduction : roundTo(raw[li] * dayScale, loom.target < 500 ? 1 : 10)
    SHIFT_NAMES.forEach((shift, si) => {
      const step = loom.target < 500 ? 1 : 10
      const target = si < 2 ? roundTo(loom.target * SHIFT_SPLIT[shift], step) : loom.target - roundTo(loom.target * SHIFT_SPLIT.Morning, step) - roundTo(loom.target * SHIFT_SPLIT.Evening, step)
      const share = (k: ShiftName) => roundTo(loomDay * SHIFT_SPLIT[k] * SHIFT_PERFORMANCE[k], step)
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

const POLY_PLANS: ProductionPlan[] = [
  { id: 'PP-0921', fabricCode: 'BAG-101', orderId: 'SO-1024', looms: ['M-01', 'M-07', 'M-08', 'M-09', 'M-43', 'M-47'], plannedMeters: 120000, producedMeters: 96500, start: isoDate(daysAgo(9)), end: isoDate(daysAgo(-2)), status: 'In Progress' },
  { id: 'PP-0920', fabricCode: 'BAG-102', orderId: 'SO-1023', looms: ['M-02', 'M-10', 'M-11', 'M-48'], plannedMeters: 80000, producedMeters: 80000, start: isoDate(daysAgo(16)), end: isoDate(daysAgo(3)), status: 'Completed' },
  { id: 'PP-0922', fabricCode: 'BAG-104', orderId: 'SO-1026', looms: ['M-03', 'M-12', 'M-13', 'M-44', 'M-49'], plannedMeters: 60000, producedMeters: 31500, start: isoDate(daysAgo(6)), end: isoDate(daysAgo(1)), status: 'Delayed' },
  { id: 'PP-0923', fabricCode: 'BAG-106', orderId: 'SO-1027', looms: ['M-04', 'M-31', 'M-32', 'M-45', 'M-50'], plannedMeters: 150000, producedMeters: 62000, start: isoDate(daysAgo(4)), end: isoDate(daysAgo(-8)), status: 'In Progress' },
  { id: 'PP-0924', fabricCode: 'BAG-105', orderId: 'SO-1028', looms: ['M-06', 'M-33', 'M-34', 'M-51'], plannedMeters: 70000, producedMeters: 14500, start: isoDate(daysAgo(2)), end: isoDate(daysAgo(-11)), status: 'In Progress' },
  { id: 'PP-0925', fabricCode: 'BAG-108', orderId: 'SO-1029', looms: ['M-14', 'M-15', 'M-16', 'M-52'], plannedMeters: 90000, producedMeters: 0, start: isoDate(daysAgo(-3)), end: isoDate(daysAgo(-15)), status: 'Planned' },
  { id: 'PP-0919', fabricCode: 'BAG-112', orderId: 'SO-1019', looms: ['M-20', 'M-21'], plannedMeters: 30000, producedMeters: 30000, start: isoDate(daysAgo(20)), end: isoDate(daysAgo(8)), status: 'Completed' },
  { id: 'PP-0926', fabricCode: 'BAG-111', orderId: 'SO-1030', looms: ['M-39', 'M-40', 'M-41'], plannedMeters: 2400, producedMeters: 0, start: isoDate(daysAgo(-5)), end: isoDate(daysAgo(-20)), status: 'Planned' },
]

export const PRODUCTION_PLANS: ProductionPlan[] = IS_POLY ? POLY_PLANS : [
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
