import { useEffect, useState } from 'react'
import { TimerOff } from 'lucide-react'
import { Button, Field, Input, Modal, Select, Textarea, useToast } from '@/components/ui'
import { useApp } from '@/context/AppState'
import { DOWNTIME_CATEGORIES, DOWNTIME_DEPARTMENT, DOWNTIME_REASON_OPTIONS } from '@/data/production'
import { TODAY_ISO } from '@/data/seed'
import type { DowntimeCategory, ShiftName } from '@/types'
import { duration } from '@/utils/format'
import { TERMS } from '@/data/dataset'

const empty = (loom = '') => ({ loomId: loom, date: TODAY_ISO, shift: 'Morning' as ShiftName, start: '', end: '', category: '' as DowntimeCategory | '', reason: '', remarks: '' })

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))

export function DowntimeFormModal({ open, onClose, defaultLoom }: { open: boolean; onClose: () => void; defaultLoom?: string }) {
  const toast = useToast()
  const { looms, addDowntime } = useApp()
  const [v, setV] = useState(() => empty(defaultLoom))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setV(empty(defaultLoom))
      setErrors({})
    }
  }, [open, defaultLoom])

  const set = <K extends keyof typeof v>(k: K, value: (typeof v)[K]) => {
    setV((s) => ({ ...s, [k]: value }))
    setErrors((e) => ({ ...e, [k]: '' }))
  }

  let minutes = 0
  if (v.start && v.end) {
    minutes = toMin(v.end) - toMin(v.start)
    if (minutes < 0) minutes += 1440 // crosses midnight (night shift)
  }

  const save = () => {
    const e: Record<string, string> = {}
    if (!v.loomId) e.loomId = `Select a ${TERMS.machine.toLowerCase()}`
    if (!v.date) e.date = 'Select a date'
    if (!v.start) e.start = 'Enter start time'
    if (!v.end) e.end = 'Enter end time'
    if (v.start && v.end && minutes === 0) e.end = 'End time must differ from start'
    if (minutes > 720) e.end = 'Stoppage longer than 12 hours — check the times'
    if (!v.category) e.category = 'Select a category'
    if (!v.reason) e.reason = 'Select a reason'
    setErrors(e)
    if (Object.keys(e).length) return
    setSaving(true)
    setTimeout(() => {
      addDowntime({
        loomId: v.loomId,
        date: v.date,
        shift: v.shift,
        start: v.start,
        end: v.end,
        minutes,
        category: v.category as DowntimeCategory,
        reason: v.reason,
        department: DOWNTIME_DEPARTMENT[v.category as DowntimeCategory],
        remarks: v.remarks || 'Resolved',
      })
      setSaving(false)
      toast.success('Downtime recorded successfully.', `${v.loomId} · ${v.category} · ${duration(minutes)}`)
      onClose()
    }, 450)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={<TimerOff />}
      title="Record Downtime"
      description={`Log a ${TERMS.machine.toLowerCase()} stoppage with its reason so breakdowns can be analysed.`}
      size="lg"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} loading={saving}>
            Save Downtime
          </Button>
        </>
      }
    >
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <Field label={TERMS.machine} htmlFor="df-loom" required error={errors.loomId}>
          <Select id="df-loom" placeholder={`Select ${TERMS.machine.toLowerCase()}…`} value={v.loomId} onChange={(e) => set('loomId', e.target.value)} error={!!errors.loomId} options={looms.map((l) => ({ value: l.id, label: `${l.id} · ${l.hall}` }))} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Date" htmlFor="df-date" required error={errors.date}>
            <Input id="df-date" type="date" max={TODAY_ISO} value={v.date} onChange={(e) => set('date', e.target.value)} error={!!errors.date} />
          </Field>
          <Field label="Shift" htmlFor="df-shift" required>
            <Select id="df-shift" value={v.shift} onChange={(e) => set('shift', e.target.value as ShiftName)} options={['Morning', 'Evening', 'Night']} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Start Time" htmlFor="df-start" required error={errors.start}>
            <Input id="df-start" type="time" value={v.start} onChange={(e) => set('start', e.target.value)} error={!!errors.start} />
          </Field>
          <Field label="End Time" htmlFor="df-end" required error={errors.end}>
            <Input id="df-end" type="time" value={v.end} onChange={(e) => set('end', e.target.value)} error={!!errors.end} />
          </Field>
        </div>
        <div className="flex items-end">
          <div className="flex h-10 w-full items-center justify-between rounded-lg bg-slate-50 px-3 text-[13px]">
            <span className="text-slate-500">Duration</span>
            <span className="font-semibold text-slate-900 num">{minutes > 0 ? duration(minutes) : '—'}</span>
          </div>
        </div>
        <Field label="Category" htmlFor="df-cat" required error={errors.category}>
          <Select
            id="df-cat"
            placeholder="Select category…"
            value={v.category}
            onChange={(e) => {
              set('category', e.target.value as DowntimeCategory)
              setV((s) => ({ ...s, reason: '' }))
            }}
            options={DOWNTIME_CATEGORIES}
            error={!!errors.category}
          />
        </Field>
        <Field label="Reason" htmlFor="df-reason" required error={errors.reason} hint={v.category ? `Responsible: ${DOWNTIME_DEPARTMENT[v.category]}` : undefined}>
          <Select
            id="df-reason"
            placeholder={v.category ? 'Select reason…' : 'Select a category first'}
            disabled={!v.category}
            value={v.reason}
            onChange={(e) => set('reason', e.target.value)}
            options={v.category ? DOWNTIME_REASON_OPTIONS[v.category] : []}
            error={!!errors.reason}
          />
        </Field>
        <Field label="Remarks" htmlFor="df-remarks" className="sm:col-span-2">
          <Textarea id="df-remarks" placeholder="What was done to fix it? Parts replaced, technician name…" value={v.remarks} onChange={(e) => set('remarks', e.target.value)} />
        </Field>
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  )
}
