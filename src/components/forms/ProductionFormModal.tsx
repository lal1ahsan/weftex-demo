import { useEffect, useMemo, useState } from 'react'
import { ClipboardPlus, Gauge, Recycle } from 'lucide-react'
import { Button, Field, Input, Modal, ProgressBar, Select, Textarea, useToast } from '@/components/ui'
import { useApp } from '@/context/AppState'
import { OPERATORS, SHIFTS } from '@/data/factory'
import { FABRICS } from '@/data/inventory'
import { SHIFT_SPLIT } from '@/data/production'
import { TODAY_ISO } from '@/data/seed'
import type { ProductionRecord, ShiftName } from '@/types'
import { cn, num, pct } from '@/utils/format'

interface Props {
  open: boolean
  onClose: () => void
  defaultLoom?: string
  onSaved?: (r: ProductionRecord) => void
}

const empty = (loom = '') => ({
  date: TODAY_ISO,
  shift: 'Morning' as ShiftName,
  loomId: loom,
  operator: '',
  fabricCode: '',
  target: '',
  actual: '',
  wastage: '',
  remarks: '',
})

export function ProductionFormModal({ open, onClose, defaultLoom, onSaved }: Props) {
  const toast = useToast()
  const { looms, addProduction } = useApp()
  const [v, setV] = useState(() => empty(defaultLoom))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const applyLoom = (loomId: string, shift: ShiftName, base: ReturnType<typeof empty>) => {
    const loom = looms.find((l) => l.id === loomId)
    if (!loom) return { ...base, loomId }
    const idx = SHIFTS.findIndex((s) => s.name === shift)
    const op = OPERATORS[(Number(loom.id.slice(2)) - 1 + idx * 27) % OPERATORS.length]
    return { ...base, loomId, shift, fabricCode: loom.fabricCode, operator: op.name, target: String(Math.round((loom.target * SHIFT_SPLIT[shift]) / 10) * 10) }
  }

  useEffect(() => {
    if (open) {
      setV(defaultLoom ? applyLoom(defaultLoom, 'Morning', empty(defaultLoom)) : empty())
      setErrors({})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultLoom])

  const set = <K extends keyof typeof v>(k: K, value: (typeof v)[K]) => {
    setV((s) => ({ ...s, [k]: value }))
    if (errors[k as string]) setErrors((e) => ({ ...e, [k]: '' }))
  }

  const target = Number(v.target)
  const actual = Number(v.actual)
  const efficiency = target > 0 && actual > 0 ? (actual / target) * 100 : null
  const loom = looms.find((l) => l.id === v.loomId)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!v.date) e.date = 'Select a date'
    if (!v.loomId) e.loomId = 'Select a loom'
    if (!v.operator) e.operator = 'Select the operator'
    if (!v.fabricCode) e.fabricCode = 'Select the fabric'
    if (!v.target || target <= 0) e.target = 'Enter the shift target'
    if (!v.actual) e.actual = 'Enter meters produced'
    else if (actual < 0) e.actual = 'Production cannot be negative'
    else if (target > 0 && actual > target * 1.3) e.actual = `That is ${Math.round((actual / target) * 100)}% of target — please double-check`
    if (v.wastage && (isNaN(Number(v.wastage)) || Number(v.wastage) < 0)) e.wastage = 'Enter wastage in kg'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const save = (another: boolean) => {
    if (!validate()) return
    setSaving(true)
    setTimeout(() => {
      const rec = addProduction({
        date: v.date,
        shift: v.shift,
        loomId: v.loomId,
        operator: v.operator,
        fabricCode: v.fabricCode,
        target,
        actual,
        wastageKg: Number(v.wastage) || 0,
        remarks: v.remarks,
      })
      setSaving(false)
      toast.success('Production record added successfully.', `${rec.loomId} · ${v.shift} shift · ${num(actual)} m (${pct(rec.efficiency)})`)
      onSaved?.(rec)
      if (another) setV((s) => ({ ...empty(), date: s.date, shift: s.shift }))
      else onClose()
    }, 450)
  }

  const operatorOptions = useMemo(() => {
    const names = OPERATORS.filter((o) => o.shift === v.shift).map((o) => o.name)
    return v.operator && !names.includes(v.operator) ? [v.operator, ...names] : names
  }, [v.shift, v.operator])

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={<ClipboardPlus />}
      title="Add Production"
      description="Record meters produced by a loom for one shift."
      size="lg"
      footer={
        <>
          <span className="mr-auto hidden text-xs text-slate-500 sm:block">Tip: selecting a loom fills fabric, operator and target.</span>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={() => save(true)} disabled={saving}>
            Save & add another
          </Button>
          <Button variant="primary" onClick={() => save(false)} loading={saving}>
            Save Production
          </Button>
        </>
      }
    >
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault()
          save(false)
        }}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Date" htmlFor="pf-date" required error={errors.date}>
            <Input id="pf-date" type="date" value={v.date} max={TODAY_ISO} onChange={(e) => set('date', e.target.value)} error={!!errors.date} />
          </Field>
          <Field label="Shift" required className="sm:col-span-2">
            <div className="grid grid-cols-3 gap-2">
              {SHIFTS.map((s) => (
                <button
                  type="button"
                  key={s.name}
                  onClick={() => setV((cur) => (cur.loomId ? applyLoom(cur.loomId, s.name, { ...cur, operator: '' }) : { ...cur, shift: s.name, operator: '' }))}
                  className={cn(
                    'h-10 rounded-lg border text-[13px] font-medium transition-colors',
                    v.shift === s.name ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-100' : 'border-line-strong text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {s.name} <span className="hidden text-xs font-normal text-slate-400 sm:inline">· {s.code}</span>
                </button>
              ))}
            </div>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Loom" htmlFor="pf-loom" required error={errors.loomId}>
            <Select
              id="pf-loom"
              placeholder="Select loom…"
              value={v.loomId}
              error={!!errors.loomId}
              onChange={(e) => {
                setV((cur) => applyLoom(e.target.value, cur.shift, cur))
                setErrors((er) => ({ ...er, loomId: '', fabricCode: '', operator: '', target: '' }))
              }}
              options={looms.map((l) => ({ value: l.id, label: `${l.id} · ${l.hall} · ${l.status}` }))}
            />
          </Field>
          <Field label="Operator" htmlFor="pf-op" required error={errors.operator}>
            <Select id="pf-op" placeholder="Select operator…" value={v.operator} onChange={(e) => set('operator', e.target.value)} options={operatorOptions} error={!!errors.operator} />
          </Field>
          <Field label="Fabric" htmlFor="pf-fabric" required error={errors.fabricCode} className="sm:col-span-2">
            <Select
              id="pf-fabric"
              placeholder="Select fabric…"
              value={v.fabricCode}
              onChange={(e) => set('fabricCode', e.target.value)}
              error={!!errors.fabricCode}
              options={FABRICS.map((f) => ({ value: f.code, label: `${f.code} · ${f.name} · ${f.construction} / ${f.density} · ${f.widthInches}"` }))}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Target" htmlFor="pf-target" required error={errors.target}>
            <Input id="pf-target" type="number" inputMode="numeric" suffix="m" value={v.target} onChange={(e) => set('target', e.target.value)} error={!!errors.target} />
          </Field>
          <Field label="Actual Production" htmlFor="pf-actual" required error={errors.actual}>
            <Input id="pf-actual" type="number" inputMode="numeric" suffix="m" placeholder="0" value={v.actual} onChange={(e) => set('actual', e.target.value)} error={!!errors.actual} autoFocus={!!defaultLoom} />
          </Field>
          <Field label="Wastage" htmlFor="pf-waste" error={errors.wastage}>
            <Input id="pf-waste" type="number" inputMode="decimal" suffix="kg" placeholder="0.0" value={v.wastage} onChange={(e) => set('wastage', e.target.value)} error={!!errors.wastage} />
          </Field>
        </div>

        {/* Live preview */}
        <div className="grid gap-3 rounded-xl border border-line bg-slate-50/70 p-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between text-[13px]">
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <Gauge className="size-4 text-slate-400" /> Shift efficiency
              </span>
              <span className={cn('font-semibold num', efficiency === null ? 'text-slate-400' : efficiency >= 95 ? 'text-emerald-600' : efficiency >= 85 ? 'text-slate-900' : 'text-amber-600')}>
                {efficiency === null ? '—' : pct(efficiency)}
              </span>
            </div>
            <ProgressBar value={efficiency ?? 0} tone="auto" className="mt-2" height="h-2" />
          </div>
          <div className="flex items-center gap-2 text-[13px] text-slate-600 sm:justify-end">
            <Recycle className="size-4 text-slate-400" />
            {loom ? (
              <span>
                {loom.manufacturer} {loom.model} · <b className="font-semibold text-slate-800">{loom.rpm} RPM</b>
              </span>
            ) : (
              <span className="text-slate-400">Select a loom</span>
            )}
          </div>
        </div>

        <Field label="Remarks" htmlFor="pf-remarks">
          <Textarea id="pf-remarks" placeholder="e.g. Beam change at 11:20, warp breaks on left selvedge" value={v.remarks} onChange={(e) => set('remarks', e.target.value)} />
        </Field>
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  )
}
