import { Link } from 'react-router-dom'
import { Building2, Clock, Factory, MapPin, Pencil, Sun, Users, Warehouse, Zap } from 'lucide-react'
import { Button, Card, CardBody, CardHeader, DetailItem, KpiCard, PageHeader, useToast } from '@/components/ui'
import { useApp } from '@/context/AppState'
import { FACTORY, OPERATORS, SHIFTS, USERS } from '@/data/factory'
import { num } from '@/utils/format'
import { IS_POLY, TERMS } from '@/data/dataset'

export default function FactoryOverviewPage() {
  const toast = useToast()
  const { looms } = useApp()
  const halls = FACTORY.halls.map((h) => {
    const ls = looms.filter((l) => l.hall === h)
    return { hall: h, count: ls.length, types: [...new Set(ls.map((l) => `${l.manufacturer} ${l.model}`))] }
  })

  return (
    <div>
      <PageHeader
        title="Factory Overview"
        description={`Company profile, ${TERMS.area.toLowerCase()}s, warehouses and utilities.`}
        breadcrumbs={[{ label: 'Factory' }, { label: 'Factory Overview' }]}
        actions={
          <Button icon={<Pencil className="size-4" />} onClick={() => toast.demo('Editing factory settings is available in the production version.')}>
            Edit Profile
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={TERMS.machines} value={looms.length} icon={<Factory />} to="/looms/list" sub={<span>{TERMS.areas.length} {TERMS.area.toLowerCase()}s</span>} />
        <KpiCard label="Operators" value={OPERATORS.length} icon={<Users />} accent="teal" sub={<span>3 shifts</span>} to="/factory/shifts" />
        <KpiCard label="System Users" value={USERS.filter((u) => u.status === 'Active').length} icon={<Users />} accent="violet" to="/factory/users" />
        <KpiCard label="Connected Load" value={num(FACTORY.sanctionedLoadKw)} unit="kW" icon={<Zap />} accent="amber" sub={<span>+ {FACTORY.solarCapacityKw} kW solar</span>} to="/electricity/grid" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Company Profile" />
          <CardBody>
            <div className="mb-5 flex items-start gap-4">
              <span className="grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                <Building2 className="size-7" />
              </span>
              <div>
                <p className="text-lg font-semibold text-slate-900">{FACTORY.name}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-slate-500">
                  <MapPin className="size-3.5" />
                  {FACTORY.address}
                </p>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              <DetailItem label="NTN" value={FACTORY.ntn} />
              <DetailItem label="STRN" value={FACTORY.strn} />
              <DetailItem label="Established" value={FACTORY.established} />
              <DetailItem label="Phone" value={FACTORY.phone} />
              <DetailItem label="Email" value={FACTORY.email} />
              <DetailItem label="Currency" value="Pakistani Rupee (PKR)" />
              <DetailItem label="Time zone" value={FACTORY.timezone} />
              <DetailItem label="Fiscal year" value={FACTORY.fiscalYear} />
              <DetailItem label={IS_POLY ? 'LESCO reference' : 'FESCO reference'} value={FACTORY.fescoReference} />
            </dl>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Shifts" actions={<Link to="/factory/shifts" className="text-[13px] font-medium text-brand-600 hover:text-brand-700">Manage</Link>} />
          <ul className="divide-y divide-line border-t border-line">
            {SHIFTS.map((s) => (
              <li key={s.name} className="flex items-center gap-3 px-5 py-3.5">
                <span className="grid size-9 place-items-center rounded-lg text-sm font-semibold text-white" style={{ background: s.color }}>
                  {s.code}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-slate-900">{s.name}</span>
                  <span className="block text-xs text-slate-500">{s.supervisor}</span>
                </span>
                <span className="flex items-center gap-1 text-[13px] text-slate-600 num">
                  <Clock className="size-3.5 text-slate-400" />
                  {s.start}–{s.end}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title={IS_POLY ? 'Production Sections' : 'Weaving Halls'} />
          <ul className="divide-y divide-line border-t border-line">
            {halls.map((h) => (
              <li key={h.hall} className="flex items-center gap-3 px-5 py-3.5">
                <Factory className="size-5 text-slate-400" />
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-slate-900">{h.hall}</span>
                  <span className="block text-xs text-slate-500">{h.types.join(' · ')}</span>
                </span>
                <span className="text-sm font-semibold text-slate-900 num">{h.count} {TERMS.machines.toLowerCase()}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Warehouses & Utilities" />
          <ul className="divide-y divide-line border-t border-line">
            {FACTORY.warehouses.map((w) => (
              <li key={w} className="flex items-center gap-3 px-5 py-3.5">
                <Warehouse className="size-5 text-slate-400" />
                <span className="flex-1 text-sm font-medium text-slate-900">{w}</span>
                <span className="text-xs text-slate-500">{w.startsWith('Yarn') || w.startsWith('Granules') ? `${TERMS.raw} store` : IS_POLY ? 'Finished bags' : 'Finished fabric'}</span>
              </li>
            ))}
            <li className="flex items-center gap-3 px-5 py-3.5">
              <Sun className="size-5 text-amber-500" />
              <span className="flex-1 text-sm font-medium text-slate-900">Rooftop solar plant</span>
              <span className="text-xs text-slate-500">{FACTORY.solarCapacityKw} kW · net-metered</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
