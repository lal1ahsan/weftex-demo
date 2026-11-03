import type { BusinessNames, BusinessType, Db } from './account'

/**
 * Which demo data the screens show. The data modules build their records once
 * when the app loads, so the data set is chosen here, from the business of
 * whoever is signed in, and the app reloads if a different business signs in.
 * Weaving and Other show the GH Weaving data; Poly bag manufacturing shows Al-Noor Poly Pack.
 */
export type Dataset = 'weaving' | 'polybag'

export const datasetFor = (type?: BusinessType): Dataset => (type === 'polybag' ? 'polybag' : 'weaving')

function signedInBusiness(): { type?: BusinessType; names?: BusinessNames } {
  try {
    const raw = localStorage.getItem('weftex-session') ?? sessionStorage.getItem('weftex-session')
    const db = JSON.parse(localStorage.getItem('weftex-demo-db') ?? 'null') as Db | null
    const session = raw ? (JSON.parse(raw) as { userId: string; expires: number }) : null
    if (!db || !session || session.expires < Date.now()) return {}
    const businessId = db.accounts.find((a) => a.id === session.userId)?.businessId
    const b = db.businesses.find((x) => x.id === businessId)
    return b ? { type: b.type, names: b.names } : {}
  } catch {
    return {}
  }
}

const loaded = signedInBusiness()

export const DATASET: Dataset = datasetFor(loaded.type)
export const IS_POLY = DATASET === 'polybag'

/** The names the screens were built with; a change in Settings reloads the app. */
export const LOADED_NAMES = loaded.names

const singular = (w: string) => (/[^s]s$/i.test(w) ? w.slice(0, -1) : w)

export interface Terms {
  /** "Loom" / "Machine" — the business's own machine name, singular. */
  machine: string
  machines: string
  raw: string
  /** The finished product as a menu name ("Fabric", "Bags"), and as one item ("Fabric", "Bag"). */
  product: string
  productOne: string
  /** Unit of one production entry: meters of fabric, or kg of output. */
  out: string
  outLong: string
  /** Unit finished goods are stocked and sold in. */
  stock: string
  stockLong: string
  /** What finished goods are packed in: rolls of fabric, bundles of bags. */
  pack: string
  packs: string
  /** Where machines stand. */
  area: string
  areas: string[]
  machineTypes: string[]
  operator: string
  operators: string
  /** Column labels for raw material items. */
  rawCount: string
  rawType: string
  /** Column labels for finished goods. */
  construction: string
  density: string
  weave: string
  gsm: string
  defects: string[]
  /** Machine id prefix, e.g. L-01 / M-01. */
  idPrefix: string
}

const WEAVING: Terms = {
  machine: 'Loom',
  machines: 'Looms',
  raw: 'Yarn',
  product: 'Fabric',
  productOne: 'Fabric',
  out: 'm',
  outLong: 'meters',
  stock: 'm',
  stockLong: 'meters',
  pack: 'Roll',
  packs: 'Rolls',
  area: 'Hall',
  areas: ['Hall A', 'Hall B', 'Hall C'],
  machineTypes: ['Air Jet', 'Rapier'],
  operator: 'Operator',
  operators: 'Operators',
  rawCount: 'Count',
  rawType: 'Type',
  construction: 'Construction',
  density: 'Density',
  weave: 'Weave',
  gsm: 'GSM',
  defects: ['Broken pick', 'Float', 'Thick place', 'Oil stain', 'Reed mark', 'Starting mark', 'Missing end', 'Slub', 'Weft bar'],
  idPrefix: 'L-',
}

const POLY: Terms = {
  machine: 'Machine',
  machines: 'Machines',
  raw: 'Granules',
  product: 'Bags',
  productOne: 'Bag',
  out: 'kg',
  outLong: 'kg',
  stock: 'bags',
  stockLong: 'bags',
  pack: 'Bundle',
  packs: 'Bundles',
  area: 'Section',
  areas: ['Extrusion', 'Weaving', 'Printing', 'Conversion'],
  machineTypes: ['Extruder', 'Circular Loom', 'Printing', 'Cutting & Sealing'],
  operator: 'Operator',
  operators: 'Operators',
  rawCount: 'Grade',
  rawType: 'Form',
  construction: 'Size',
  density: 'Mesh',
  weave: 'Finish',
  gsm: 'GSM',
  defects: ['Weak seal', 'Print smudge', 'Uneven cut', 'Tape break', 'Low GSM', 'Hole in fabric', 'Wrong colour', 'Loose stitch'],
  idPrefix: 'M-',
}

const base = IS_POLY ? POLY : WEAVING

export const TERMS: Terms = LOADED_NAMES
  ? {
      ...base,
      raw: LOADED_NAMES.rawMaterial,
      product: LOADED_NAMES.finishedGoods,
      productOne: singular(LOADED_NAMES.finishedGoods),
      machines: LOADED_NAMES.machines,
      machine: singular(LOADED_NAMES.machines),
    }
  : base
