import type { ReactNode } from 'react'
import { MODULES, REPORT_OPTIONS, type ModuleDef, type ModuleKey, type Perm, type PermSet, type TypeProfile } from '@/data/account'
import { cn } from '@/utils/format'

const ACTIONS: (keyof Perm)[] = ['view', 'add', 'edit']
const NONE: Perm = { view: false, add: false, edit: false }

const has = (m: ModuleDef, a: keyof Perm) => !((a === 'add' && m.noAdd) || (a === 'edit' && m.noEdit))

/** Ticking Add or Edit also ticks View; unticking View clears Add and Edit (3.6). */
function setTick(perms: PermSet, key: ModuleKey, action: keyof Perm, on: boolean): PermSet {
  const row = { ...(perms[key] ?? NONE), [action]: on }
  if (action === 'view' && !on) Object.assign(row, NONE)
  if (action !== 'view' && on) row.view = true
  const next = { ...perms }
  if (row.view || row.add || row.edit) next[key] = row
  else delete next[key]
  return next
}

function Tick({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return <input type="checkbox" aria-label={label} checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="size-4 rounded border-slate-300 accent-brand-600 disabled:opacity-60" />
}

export function countTicks(perms: PermSet | undefined) {
  return Object.values(perms ?? {}).filter((p) => p?.view).length
}

/** Short summary such as "Yarn inventory: Add · Production entry: View". */
export function permSummary(perms: PermSet | undefined, profile: TypeProfile, max = 3) {
  const parts = MODULES.filter((m) => perms?.[m.key]?.view).map((m) => {
    const p = perms![m.key]!
    return `${m.label(profile)}: ${p.edit ? 'Edit' : p.add ? 'Add' : 'View'}`
  })
  if (!parts.length) return 'No access'
  return parts.length > max ? `${parts.slice(0, max).join(' · ')} · +${parts.length - max} more` : parts.join(' · ')
}

interface Props {
  modules: ModuleDef[]
  profile: TypeProfile
  value: PermSet
  onChange: (v: PermSet) => void
  seeMoney: boolean
  onSeeMoney: (v: boolean) => void
  reports?: string[]
  onReports?: (v: string[]) => void
  readOnly?: boolean
  error?: string
  extra?: ReactNode
}

export function PermissionPanel({ modules, profile, value, onChange, seeMoney, onSeeMoney, reports, onReports, readOnly, error, extra }: Props) {
  const allOn = (a: keyof Perm) => modules.filter((m) => has(m, a)).every((m) => value[m.key]?.[a])
  const toggleAll = (a: keyof Perm, on: boolean) => {
    let next = value
    for (const m of modules) if (has(m, a)) next = setTick(next, m.key, a, on)
    onChange(next)
  }

  return (
    <div className="space-y-3">
      <div className={cn('overflow-hidden rounded-xl border', error ? 'border-rose-300' : 'border-line')}>
        <table className="w-full text-[13px]">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Module</th>
              {ACTIONS.map((a) => (
                <th key={a} className="w-16 px-2 py-2 text-center font-medium capitalize">
                  {a}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {!readOnly && (
              <tr className="bg-brand-50/40">
                <td className="px-3 py-2 font-medium text-brand-800">Select all</td>
                {ACTIONS.map((a) => (
                  <td key={a} className="px-2 py-2 text-center">
                    <Tick label={`Select all ${a}`} checked={allOn(a)} onChange={(on) => toggleAll(a, on)} />
                  </td>
                ))}
              </tr>
            )}
            {modules.map((m) => (
              <tr key={m.key}>
                <td className="px-3 py-2 text-slate-800">{m.label(profile)}</td>
                {ACTIONS.map((a) => (
                  <td key={a} className="px-2 py-2 text-center">
                    {has(m, a) ? (
                      <Tick label={`${m.label(profile)} ${a}`} checked={!!value[m.key]?.[a]} disabled={readOnly} onChange={(on) => onChange(setTick(value, m.key, a, on))} />
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}

      <label className="flex items-start gap-2.5 rounded-xl border border-line px-3 py-2.5 text-[13px]">
        <Tick label="See money" checked={seeMoney} disabled={readOnly} onChange={onSeeMoney} />
        <span>
          <span className="font-medium text-slate-800">See money (PKR rates, amounts, values)</span>
          <span className="block text-xs text-slate-500">When off, every PKR column, card and field is hidden, even on modules they can view.</span>
        </span>
      </label>

      {reports && onReports && value.reports?.view && (
        <div className="rounded-xl border border-line px-3 py-2.5">
          <p className="text-[13px] font-medium text-slate-800">Reports they can open</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {REPORT_OPTIONS.filter((r) => profile.hasSizing || !/Sizing|Beams/.test(r)).map((r) => {
              const on = reports.includes(r)
              return (
                <button
                  key={r}
                  type="button"
                  disabled={readOnly}
                  onClick={() => onReports(on ? reports.filter((x) => x !== r) : [...reports, r])}
                  className={cn('rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset', on ? 'bg-brand-50 text-brand-700 ring-brand-200' : 'text-slate-500 ring-line-strong hover:bg-slate-50')}
                >
                  {r}
                </button>
              )
            })}
          </div>
        </div>
      )}
      {extra}
    </div>
  )
}
