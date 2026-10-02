import { useState, type ReactNode } from 'react'
import { Bell, Building2, Globe, Plug, Receipt, Ruler } from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader, Field, Input, PageHeader, Select, useToast } from '@/components/ui'
import { FACTORY } from '@/data/factory'
import { cn } from '@/utils/format'

type Section = 'general' | 'production' | 'notifications' | 'integrations' | 'tax'

const SECTIONS: { id: Section; label: string; icon: ReactNode }[] = [
  { id: 'general', label: 'General', icon: <Building2 className="size-4" /> },
  { id: 'production', label: 'Production & Units', icon: <Ruler className="size-4" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="size-4" /> },
  { id: 'tax', label: 'Tax & FBR', icon: <Receipt className="size-4" /> },
  { id: 'integrations', label: 'Integrations', icon: <Plug className="size-4" /> },
]

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-3">
      <span>
        <span className="block text-sm font-medium text-slate-900">{label}</span>
        {description && <span className="block text-[13px] text-slate-500">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn('relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-brand-600' : 'bg-slate-200')}
      >
        <span className={cn('absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform', checked && 'translate-x-5')} />
      </button>
    </label>
  )
}

export default function SettingsPage() {
  const toast = useToast()
  const [section, setSection] = useState<Section>('general')
  const [notif, setNotif] = useState({ loomStop: true, target: true, lowStock: true, daily: true, orders: false })
  const save = () => toast.success('Settings saved.', 'Changes apply to this demo session only.')

  return (
    <div>
      <PageHeader title="Settings" description="Configure the system for your factory." breadcrumbs={[{ label: 'Settings' }]} />
      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={cn('flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium whitespace-nowrap', section === s.id ? 'bg-white text-brand-700 shadow-card ring-1 ring-line' : 'text-slate-600 hover:bg-white/60')}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </nav>

        <Card>
          {section === 'general' && (
            <>
              <CardHeader title="General" subtitle="Factory details and regional preferences" />
              <CardBody className="grid gap-4 sm:grid-cols-2">
                <Field label="Factory name"><Input defaultValue={FACTORY.name} /></Field>
                <Field label="City"><Select defaultValue="Faisalabad" options={['Faisalabad', 'Lahore', 'Karachi', 'Multan', 'Sheikhupura']} /></Field>
                <Field label="Currency"><Select defaultValue="PKR" options={[{ value: 'PKR', label: 'PKR — Pakistani Rupee' }, { value: 'USD', label: 'USD — US Dollar' }]} /></Field>
                <Field label="Language"><Select defaultValue="en" options={[{ value: 'en', label: 'English' }, { value: 'ur', label: 'اردو — Urdu' }]} /></Field>
                <Field label="Time zone"><Input defaultValue={FACTORY.timezone} disabled /></Field>
                <Field label="Fiscal year"><Select defaultValue="jul" options={[{ value: 'jul', label: 'July – June' }, { value: 'jan', label: 'January – December' }]} /></Field>
                <Field label="Date format"><Select defaultValue="dmy" options={[{ value: 'dmy', label: '29 Sep 2026' }, { value: 'iso', label: '2026-09-29' }]} /></Field>
                <Field label="Number format"><Select defaultValue="intl" options={[{ value: 'intl', label: '1,250,000' }, { value: 'pk', label: '12,50,000 (lakh)' }]} /></Field>
              </CardBody>
            </>
          )}
          {section === 'production' && (
            <>
              <CardHeader title="Production & Units" subtitle="How production and efficiency are measured" />
              <CardBody className="grid gap-4 sm:grid-cols-2">
                <Field label="Production unit"><Select defaultValue="m" options={[{ value: 'm', label: 'Meters' }, { value: 'yd', label: 'Yards' }]} /></Field>
                <Field label="Weight unit"><Select defaultValue="kg" options={[{ value: 'kg', label: 'Kilograms' }, { value: 'lb', label: 'Pounds' }]} /></Field>
                <Field label="Target efficiency" hint="Used for colour coding across the system"><Input type="number" defaultValue={92} suffix="%" /></Field>
                <Field label="Wastage benchmark"><Input type="number" defaultValue={2.5} suffix="%" /></Field>
                <Field label="Efficiency formula"><Select defaultValue="target" options={[{ value: 'target', label: 'Actual ÷ Target' }, { value: 'picks', label: 'Actual picks ÷ Theoretical picks' }]} /></Field>
                <Field label="Production day starts at"><Input type="time" defaultValue="07:00" /></Field>
                <Field label="Downtime alert after" hint="Notify supervisor when a loom stays stopped"><Input type="number" defaultValue={15} suffix="min" /></Field>
                <Field label="Approval for production edits"><Select defaultValue="pm" options={[{ value: 'pm', label: 'Production Manager' }, { value: 'none', label: 'Not required' }]} /></Field>
              </CardBody>
            </>
          )}
          {section === 'notifications' && (
            <>
              <CardHeader title="Notifications" subtitle="What the owner and supervisors are alerted about" />
              <CardBody className="divide-y divide-line">
                <Toggle checked={notif.loomStop} onChange={(v) => setNotif((n) => ({ ...n, loomStop: v }))} label="Loom stopped for more than 15 minutes" description="Supervisor and production manager" />
                <Toggle checked={notif.target} onChange={(v) => setNotif((n) => ({ ...n, target: v }))} label="Production below target" description="When a hall is more than 5% below target" />
                <Toggle checked={notif.lowStock} onChange={(v) => setNotif((n) => ({ ...n, lowStock: v }))} label="Yarn below minimum stock" description="Store manager and owner" />
                <Toggle checked={notif.daily} onChange={(v) => setNotif((n) => ({ ...n, daily: v }))} label="Daily owner summary at 8:00 AM" description="Production, downtime, sales and cash — via WhatsApp (production version)" />
                <Toggle checked={notif.orders} onChange={(v) => setNotif((n) => ({ ...n, orders: v }))} label="Order due reminders" description="One day before delivery date" />
              </CardBody>
            </>
          )}
          {section === 'tax' && (
            <>
              <CardHeader title="Tax & FBR" subtitle="Sales tax registration and digital invoicing" actions={<Badge tone="amber">Production version</Badge>} />
              <CardBody className="grid gap-4 sm:grid-cols-2">
                <Field label="NTN"><Input defaultValue={FACTORY.ntn} /></Field>
                <Field label="STRN"><Input defaultValue={FACTORY.strn} /></Field>
                <Field label="Sales tax rate"><Input type="number" defaultValue={18} suffix="%" /></Field>
                <Field label="FBR digital invoicing"><Select defaultValue="off" options={[{ value: 'off', label: 'Not connected' }, { value: 'sandbox', label: 'Sandbox' }]} /></Field>
              </CardBody>
            </>
          )}
          {section === 'integrations' && (
            <>
              <CardHeader title="Integrations" subtitle="Connect GH Weaving to the tools you already use" />
              <CardBody className="grid gap-3 sm:grid-cols-2">
                {[
                  { name: 'WhatsApp Business', body: 'Daily reports and loom alerts', icon: <Globe className="size-5" /> },
                  { name: 'FBR Digital Invoicing', body: 'Real-time sales tax invoices', icon: <Receipt className="size-5" /> },
                  { name: 'Solar inverter monitoring', body: 'Huawei, Sungrow, Growatt', icon: <Plug className="size-5" /> },
                  { name: 'Excel import / export', body: 'Bring your registers in', icon: <Ruler className="size-5" /> },
                ].map((i) => (
                  <div key={i.name} className="flex items-start gap-3 rounded-xl border border-line p-4">
                    <span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-500">{i.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">{i.name}</p>
                      <p className="text-[13px] text-slate-500">{i.body}</p>
                    </div>
                    <Button size="sm" onClick={() => toast.demo(`${i.name} integration is available in the production version.`)}>
                      Connect
                    </Button>
                  </div>
                ))}
              </CardBody>
            </>
          )}
          {section !== 'integrations' && (
            <div className="flex justify-end gap-2 border-t border-line px-5 py-4">
              <Button onClick={() => toast.info('Changes discarded')}>Cancel</Button>
              <Button variant="primary" onClick={save}>
                Save changes
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
