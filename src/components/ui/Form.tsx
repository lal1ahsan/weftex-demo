import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/format'

const control =
  'w-full rounded-lg border bg-white text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-4 disabled:bg-slate-50 disabled:text-slate-500'
const controlState = (error?: boolean) =>
  error ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : 'border-line-strong hover:border-slate-300 focus:border-brand-400 focus:ring-brand-100'

interface FieldProps {
  label: string
  htmlFor?: string
  required?: boolean
  error?: string
  hint?: string
  children: ReactNode
  className?: string
}

export function Field({ label, htmlFor, required, error, hint, children, className }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>
      {children}
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  icon?: ReactNode
  suffix?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className, error, icon, suffix, ...rest }, ref) {
  return (
    <div className="relative">
      {icon && <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400 [&>svg]:size-4">{icon}</span>}
      <input ref={ref} className={cn(control, controlState(error), 'h-10 px-3', icon && 'pl-9', suffix && 'pr-12', className)} {...rest} />
      {suffix && <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-medium text-slate-400">{suffix}</span>}
    </div>
  )
})

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
  options: (string | { value: string; label: string })[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ className, error, options, placeholder, ...rest }, ref) {
  return (
    <div className="relative">
      <select ref={ref} className={cn(control, controlState(error), 'h-10 appearance-none pr-9 pl-3', className)} {...rest}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => {
          const opt = typeof o === 'string' ? { value: o, label: o } : o
          return (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          )
        })}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-400" />
    </div>
  )
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }>(function Textarea(
  { className, error, ...rest },
  ref,
) {
  return <textarea ref={ref} className={cn(control, controlState(error), 'min-h-[84px] px-3 py-2', className)} {...rest} />
})

/** Compact select used in table toolbars. */
export function FilterSelect({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: string[]; label: string }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className={cn(
          'h-9 appearance-none rounded-lg border bg-white pr-8 pl-3 text-[13px] font-medium transition-colors focus:ring-4 focus:ring-brand-100 focus:outline-none',
          value ? 'border-brand-300 text-brand-700' : 'border-line-strong text-slate-600 hover:border-slate-300',
        )}
      >
        <option value="">{label}: All</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {label}: {o}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-slate-400" />
    </div>
  )
}
