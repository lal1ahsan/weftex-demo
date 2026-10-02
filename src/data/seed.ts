// Deterministic pseudo-random helpers so the demo looks identical on every load.
export function createRng(seed: number) {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    float: (min: number, max: number) => next() * (max - min) + min,
    pick: <T>(arr: readonly T[]): T => arr[Math.floor(next() * arr.length)],
    weighted: <T>(items: readonly (readonly [T, number])[]): T => {
      const total = items.reduce((s, [, w]) => s + w, 0)
      let r = next() * total
      for (const [item, w] of items) {
        r -= w
        if (r <= 0) return item
      }
      return items[items.length - 1][0]
    },
  }
}

/** The demo is frozen on this date so the story is always consistent. */
export const DEMO_TODAY = new Date(2026, 8, 29, 9, 40)

export function daysAgo(n: number): Date {
  const d = new Date(DEMO_TODAY)
  d.setDate(d.getDate() - n)
  return d
}

export function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const TODAY_ISO = isoDate(DEMO_TODAY)

export const pad = (n: number, len = 2) => String(n).padStart(len, '0')

export const roundTo = (n: number, step: number) => Math.round(n / step) * step
