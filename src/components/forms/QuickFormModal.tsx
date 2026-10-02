import { useEffect, useState, type ReactNode } from 'react'
import { Button, Field, Input, Modal, Select, Textarea, useToast } from '@/components/ui'
import { cn } from '@/utils/format'

export interface QuickField {
  name: string
  label: string
  type?: 'text' | 'number' | 'date' | 'time' | 'select' | 'textarea' | 'email' | 'tel'
  options?: string[]
  required?: boolean
  placeholder?: string
  suffix?: string
  defaultValue?: string
  full?: boolean
  hint?: string
}

interface QuickFormModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  icon?: ReactNode
  fields: QuickField[]
  submitLabel: string
  successMessage: string
  onSubmit?: (values: Record<string, string>) => void
}

/**
 * Config-driven form modal for the many "Add …" actions in the demo.
 * Validates required fields and confirms with a toast; nothing is persisted.
 */
export function QuickFormModal({ open, onClose, title, description, icon, fields, submitLabel, successMessage, onSubmit }: QuickFormModalProps) {
  const toast = useToast()
  const initial = () => Object.fromEntries(fields.map((f) => [f.name, f.defaultValue ?? '']))
  const [values, setValues] = useState<Record<string, string>>(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setValues(initial())
      setErrors({})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const set = (name: string, v: string) => {
    setValues((s) => ({ ...s, [name]: v }))
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }))
  }

  const submit = () => {
    const next: Record<string, string> = {}
    fields.forEach((f) => {
      const v = values[f.name]?.trim()
      if (f.required && !v) next[f.name] = `${f.label} is required`
      else if (f.type === 'number' && v && (isNaN(Number(v)) || Number(v) < 0)) next[f.name] = 'Enter a valid positive number'
      else if (f.type === 'email' && v && !/^\S+@\S+\.\S+$/.test(v)) next[f.name] = 'Enter a valid email address'
    })
    setErrors(next)
    if (Object.values(next).some(Boolean)) return
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      onSubmit?.(values)
      toast.success(successMessage, 'Saved in demo mode — data resets when the page reloads.')
      onClose()
    }, 450)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      icon={icon}
      size="lg"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} loading={saving}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        {fields.map((f) => (
          <Field key={f.name} label={f.label} htmlFor={`qf-${f.name}`} required={f.required} error={errors[f.name]} hint={f.hint} className={cn((f.full || f.type === 'textarea') && 'sm:col-span-2')}>
            {f.type === 'select' ? (
              <Select id={`qf-${f.name}`} options={f.options ?? []} placeholder={f.placeholder ?? 'Select…'} value={values[f.name]} onChange={(e) => set(f.name, e.target.value)} error={!!errors[f.name]} />
            ) : f.type === 'textarea' ? (
              <Textarea id={`qf-${f.name}`} placeholder={f.placeholder} value={values[f.name]} onChange={(e) => set(f.name, e.target.value)} />
            ) : (
              <Input
                id={`qf-${f.name}`}
                type={f.type === 'number' ? 'number' : f.type ?? 'text'}
                inputMode={f.type === 'number' ? 'decimal' : undefined}
                placeholder={f.placeholder}
                suffix={f.suffix}
                value={values[f.name]}
                onChange={(e) => set(f.name, e.target.value)}
                error={!!errors[f.name]}
              />
            )}
          </Field>
        ))}
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  )
}
