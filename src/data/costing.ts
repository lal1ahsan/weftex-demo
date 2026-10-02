/**
 * Cost-per-meter model for grey fabric. Kept independent of the inventory
 * module so fabric selling rates can be derived from it.
 */
export interface FabricCostInput {
  widthInches: number
  gsm: number
  density: string // reed × pick
  yarnRate: number // blended PKR/kg
}

export interface CostBreakdown {
  yarnKgPerM: number
  yarn: number
  sizing: number
  labour: number
  electricity: number
  maintenance: number
  overhead: number
  total: number
}

export const WASTAGE_ALLOWANCE = 0.023

export function costPerMeter(f: FabricCostInput): CostBreakdown {
  const picks = Number(f.density.split('×')[1]) || 72
  const ends = Number(f.density.split('×')[0]) || 100
  const yarnKgPerM = f.widthInches * 0.0254 * (f.gsm / 1000)
  const pickFactor = 0.4 + 0.6 * (picks / 72)
  const widthFactor = Math.sqrt(f.widthInches / 63)
  const r2 = (n: number) => Math.round(n * 100) / 100
  const yarn = r2(yarnKgPerM * (1 + WASTAGE_ALLOWANCE) * f.yarnRate)
  const sizing = r2(6.5 * (ends / 133) * widthFactor)
  const labour = r2(9.5 * pickFactor * widthFactor)
  const electricity = r2(11 * pickFactor * widthFactor)
  const maintenance = r2(3.2 * pickFactor)
  const overhead = r2(5.5 * widthFactor)
  return { yarnKgPerM, yarn, sizing, labour, electricity, maintenance, overhead, total: r2(yarn + sizing + labour + electricity + maintenance + overhead) }
}

/** Default scenario for the cost calculator — the founder's reference example. */
export const EXAMPLE_BATCH = {
  label: 'Example batch · 20,000 m',
  quantity: 20_000,
  yarn: 500_000,
  labour: 70_000,
  electricity: 80_000,
  maintenance: 30_000,
  other: 20_000,
  sellingPrice: 42,
}
