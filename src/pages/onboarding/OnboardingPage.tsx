import { useState, type FormEvent, type ReactNode } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BarChart3, Check, Factory, Layers, LayoutDashboard, Package, Sparkles, Spool, Timer, Truck } from 'lucide-react'
import { AuthShell } from '@/components/auth/AuthShell'
import { Button, Field, Input, Select } from '@/components/ui'
import { useAccount } from '@/context/Account'
import { NAME_MAX, PRODUCT_UNITS, RAW_UNITS, TYPE_PROFILES, type BusinessType, type OnboardingDraft, type ProductUnit, type RawUnit } from '@/data/account'
import { cn } from '@/utils/format'

const STEPS = ['Business', 'Names and units', 'First factory'] as const
const CITIES = ['Faisalabad', 'Khurrianwala', 'Jaranwala', 'Lahore', 'Sheikhupura', 'Multan', 'Karachi']
const TYPE_ICONS: Record<BusinessType, ReactNode> = { weaving: <Layers />, polybag: <Package />, other: <Sparkles /> }

const EMPTY: OnboardingDraft = { step: 1, businessName: '', otherTypeName: '', factoryName: '', city: '' }

/** PRD 2.2 — shown once after sign-up; progress is saved after each step. */
export default function OnboardingPage() {
  const { ready, me, business, signOut, saveOnboarding, finishOnboarding } = useAccount()
  const navigate = useNavigate()
  const editing = !!business && business.status !== 'Active'
  const [d, setD] = useState<OnboardingDraft>(() => (editing ? { ...EMPTY, ...me?.onboarding, step: 1 } : { ...EMPTY, ...me?.onboarding }))
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [saving, setSaving] = useState(false)

  if (!ready) return null
  if (!me) return <Navigate to="/login" replace />
  if (!me.phoneVerified) return <Navigate to="/signup/verify" replace />
  if (business?.status === 'Active') return <Navigate to="/" replace />

  const change = (patch: Partial<OnboardingDraft>) => {
    setD((x) => ({ ...x, ...patch }))
    setErrors((e) => ({ ...e, ...Object.fromEntries(Object.keys(patch).map((k) => [k, undefined])) }))
  }

  const pickType = (type: BusinessType) => {
    const p = TYPE_PROFILES[type]
    // Units and names follow the type's defaults until the Owner picks their own (2.2).
    change({ type, rawUnit: p.defaultRaw, productUnit: p.defaultProduct, rawMaterialName: p.rawMaterial, finishedGoodsName: p.finishedGoods, machineName: p.machines })
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (d.step === 1) {
      if (!d.businessName.trim()) e.businessName = 'Business name is required'
      else if (d.businessName.trim().length > 100) e.businessName = 'Use at most 100 characters'
      if (!d.type) e.type = 'Choose your business type'
      if (d.type === 'other' && !d.otherTypeName.trim()) e.otherTypeName = 'Type of business is required'
    }
    if (d.step === 2) {
      const name = (v: string | undefined, label: string, key: string) => {
        if (!v?.trim()) e[key] = `${label} is required`
        else if (v.trim().length > NAME_MAX) e[key] = `Use at most ${NAME_MAX} characters`
      }
      name(d.rawMaterialName, 'Raw material name', 'rawMaterialName')
      name(d.finishedGoodsName, 'Finished product name', 'finishedGoodsName')
      name(d.machineName, 'Machine name', 'machineName')
      if (!d.rawUnit) e.rawUnit = 'Raw material input unit is required'
      if (!d.productUnit) e.productUnit = 'Final product unit is required'
    }
    if (d.step === 3) {
      if (!d.factoryName.trim()) e.factoryName = 'Factory name is required'
      else if (d.factoryName.trim().length > 60) e.factoryName = 'Use at most 60 characters'
      if (!d.city.trim()) e.city = 'City is required'
    }
    setErrors(e)
    return !Object.keys(e).length
  }

  const next = (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    if (d.step < 3) {
      const moved = { ...d, step: (d.step + 1) as OnboardingDraft['step'] }
      saveOnboarding(moved)
      setD(moved)
      return
    }
    setSaving(true)
    saveOnboarding(d)
    if (!editing) finishOnboarding()
    setTimeout(() => navigate('/pending', { replace: true }), 500)
  }

  const back = () => {
    const moved = { ...d, step: (d.step - 1) as OnboardingDraft['step'] }
    saveOnboarding(moved)
    setD(moved)
  }

  return (
    <AuthShell
      width="max-w-[620px]"
      aside={
        <button
          onClick={() => {
            signOut()
            navigate('/login')
          }}
          className="text-[13px] font-medium text-slate-500 hover:text-slate-800"
        >
          Sign out
        </button>
      }
    >
      <p className="text-[13px] font-medium text-brand-600">{editing ? 'Edit your details' : `Welcome, ${me.firstName}`}</p>
      <h1 className="mt-1 text-[24px] font-semibold text-slate-900">Set up your business</h1>

      {/* Progress: 1 Business → 2 Names and units → 3 First factory */}
      <ol className="mt-6 flex items-center gap-2">
        {STEPS.map((label, i) => {
          const n = i + 1
          const done = n < d.step
          const current = n === d.step
          return (
            <li key={label} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  'grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold',
                  done ? 'bg-brand-600 text-white' : current ? 'bg-brand-50 text-brand-700 ring-2 ring-brand-500' : 'bg-slate-100 text-slate-400',
                )}
              >
                {done ? <Check className="size-3.5" /> : n}
              </span>
              <span className={cn('hidden text-[13px] font-medium sm:inline', current ? 'text-slate-900' : 'text-slate-400')}>{label}</span>
              {n < STEPS.length && <span className={cn('h-0.5 flex-1 rounded', done ? 'bg-brand-500' : 'bg-slate-200')} />}
            </li>
          )
        })}
      </ol>

      <form onSubmit={next} className="mt-7 space-y-5" noValidate>
        {d.step === 1 && (
          <>
            <Field label="Business name" htmlFor="bname" required error={errors.businessName} hint="Shown in the sidebar, reports and exports">
              <Input id="bname" autoFocus maxLength={100} placeholder="e.g. GH Weaving Mills" value={d.businessName} onChange={(e) => change({ businessName: e.target.value })} error={!!errors.businessName} />
            </Field>
            <div>
              <p className="mb-1.5 text-[13px] font-medium text-slate-700">
                Business type<span className="ml-0.5 text-rose-500">*</span>
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {(Object.keys(TYPE_PROFILES) as BusinessType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => pickType(t)}
                    aria-pressed={d.type === t}
                    className={cn(
                      'relative rounded-xl border p-4 text-left transition-colors',
                      d.type === t ? 'border-brand-500 bg-brand-50/60 ring-4 ring-brand-100' : 'border-line-strong hover:border-slate-300 hover:bg-slate-50',
                    )}
                  >
                    <span className={cn('grid size-9 place-items-center rounded-lg [&>svg]:size-[18px]', d.type === t ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500')}>{TYPE_ICONS[t]}</span>
                    <span className="mt-3 block text-sm font-semibold text-slate-900">{TYPE_PROFILES[t].label}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{TYPE_PROFILES[t].short}</span>
                    {d.type === t && <Check className="absolute top-3 right-3 size-4 text-brand-600" />}
                  </button>
                ))}
              </div>
              {errors.type && <p className="mt-1 text-xs text-rose-600">{errors.type}</p>}
              {d.type && <p className="mt-2 text-xs text-slate-500">The type decides the menus, words and units Weftex shows.</p>}
            </div>
            {d.type === 'other' && (
              <Field label="Type of business" htmlFor="otype" required error={errors.otherTypeName}>
                <Input id="otype" maxLength={60} placeholder="e.g. Carton manufacturing" value={d.otherTypeName} onChange={(e) => change({ otherTypeName: e.target.value })} error={!!errors.otherTypeName} />
              </Field>
            )}
          </>
        )}

        {d.step === 2 && (
          <>
            <p className="text-[13.5px] text-slate-600">
              What you call things, and how you count what comes in and what you make.{' '}
              {d.type && d.type !== 'other' && `We filled in the usual words and units for ${TYPE_PROFILES[d.type].label.toLowerCase()}; change them if yours differ.`}
            </p>
            <div className="grid gap-5 sm:grid-cols-[1fr_190px]">
              <div className="space-y-4">
                <Field label="Raw material name" htmlFor="rawname" required error={errors.rawMaterialName} hint="e.g. Yarn, Granules, Dhaga">
                  <Input id="rawname" maxLength={NAME_MAX} placeholder="e.g. Granules" value={d.rawMaterialName ?? ''} onChange={(e) => change({ rawMaterialName: e.target.value })} error={!!errors.rawMaterialName} />
                </Field>
                <Field label="Finished product name" htmlFor="fgname" required error={errors.finishedGoodsName} hint="e.g. Fabric, Bags">
                  <Input id="fgname" maxLength={NAME_MAX} placeholder="e.g. Bags" value={d.finishedGoodsName ?? ''} onChange={(e) => change({ finishedGoodsName: e.target.value })} error={!!errors.finishedGoodsName} />
                </Field>
                <Field label="Machine name" htmlFor="mname" required error={errors.machineName} hint="e.g. Looms, Machines">
                  <Input id="mname" maxLength={NAME_MAX} placeholder="e.g. Machines" value={d.machineName ?? ''} onChange={(e) => change({ machineName: e.target.value })} error={!!errors.machineName} />
                </Field>
              </div>
              <SidebarPreview raw={d.rawMaterialName} product={d.finishedGoodsName} machines={d.machineName} />
            </div>
            <UnitPicker label="Raw material input unit" hint={d.type === 'weaving' ? 'How yarn is counted' : 'How raw material is counted'} options={RAW_UNITS} value={d.rawUnit} onChange={(v) => change({ rawUnit: v as RawUnit })} error={errors.rawUnit} />
            <UnitPicker label="Final product unit" hint={d.type === 'weaving' ? 'How fabric is counted' : 'How finished goods are counted'} options={PRODUCT_UNITS} value={d.productUnit} onChange={(v) => change({ productUnit: v as ProductUnit })} error={errors.productUnit} />
            <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-500">You can change the names any time in Settings. The type and units can change only until the first stock or production record is saved.</p>
          </>
        )}

        {d.step === 3 && (
          <>
            <p className="text-[13.5px] text-slate-600">Your first factory. Day and Night shifts are created for it; more factories can be added later.</p>
            <Field label="Factory name" htmlFor="fname" required error={errors.factoryName}>
              <Input id="fname" autoFocus maxLength={60} icon={<Factory />} placeholder="e.g. GH Weaving Factory" value={d.factoryName} onChange={(e) => change({ factoryName: e.target.value })} error={!!errors.factoryName} />
            </Field>
            <Field label="City" htmlFor="city" required error={errors.city} hint="Pick one or type another">
              <Input id="city" list="cities" placeholder="Faisalabad" value={d.city} onChange={(e) => change({ city: e.target.value })} error={!!errors.city} />
              <datalist id="cities">
                {CITIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
          </>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-line pt-5">
          {d.step > 1 ? (
            <Button variant="ghost" icon={<ArrowLeft className="size-4" />} onClick={back}>
              Back
            </Button>
          ) : (
            <span />
          )}
          <Button type="submit" variant="primary" size="lg" loading={saving}>
            {d.step < 3 ? 'Continue' : editing ? 'Save changes' : 'Get started'}
            {!saving && d.step < 3 && <ArrowRight className="size-4" />}
          </Button>
        </div>
      </form>
    </AuthShell>
  )
}

function UnitPicker({ label, hint, options, value, onChange, error }: { label: string; hint: string; options: string[]; value?: string; onChange: (v: string) => void; error?: string }) {
  return (
    <Field label={label} required error={error} hint={hint}>
      <div className="hidden gap-2 sm:flex" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={value === o}
            onClick={() => onChange(o)}
            className={cn(
              'h-10 flex-1 rounded-lg border text-sm font-medium transition-colors',
              value === o ? 'border-brand-500 bg-brand-50 text-brand-700 ring-4 ring-brand-100' : 'border-line-strong text-slate-600 hover:border-slate-300 hover:bg-slate-50',
              error && value !== o && 'border-rose-300',
            )}
          >
            {o}
          </button>
        ))}
      </div>
      <div className="sm:hidden">
        <Select aria-label={label} placeholder="Choose…" options={options} value={value ?? ''} onChange={(e) => onChange(e.target.value)} error={!!error} />
      </div>
    </Field>
  )
}

/** A live preview of the sidebar, so the Owner sees their words as they type (2.2). */
function SidebarPreview({ raw, product, machines }: { raw?: string; product?: string; machines?: string }) {
  const items = [
    { icon: <LayoutDashboard />, label: 'Dashboard' },
    { icon: <Factory />, label: machines?.trim() || 'Machines' },
    { icon: <Spool />, label: raw?.trim() || 'Raw material' },
    { icon: <BarChart3 />, label: 'Production' },
    { icon: <Timer />, label: 'Downtime' },
    { icon: <Layers />, label: product?.trim() || 'Finished product' },
    { icon: <Truck />, label: 'Sales' },
  ]
  return (
    <div aria-label="Sidebar preview" className="rounded-xl bg-ink-900 p-3 text-white">
      <p className="px-2 pb-2 text-[10.5px] font-semibold tracking-wide text-white/50 uppercase">Sidebar preview</p>
      <ul className="space-y-0.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-2 truncate rounded-md px-2 py-1.5 text-[12.5px] text-white/85 [&>svg]:size-3.5 [&>svg]:shrink-0 [&>svg]:text-white/60">
            {it.icon}
            <span className="truncate">{it.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
