import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarRange, Plus } from 'lucide-react'
import type { ProductionPlan } from '@/types'
import { Button, Card, PageHeader, ProgressBar, StatusBadge, Tabs } from '@/components/ui'
import { QuickFormModal } from '@/components/forms/QuickFormModal'
import { PRODUCTION_PLANS } from '@/data/production'
import { FABRICS, fabricByCode } from '@/data/inventory'
import { customerById, orderById } from '@/data/commercial'
import { cn, dayMonth, meters, num } from '@/utils/format'

type Filter = 'all' | ProductionPlan['status']

export default function ProductionPlansPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const [adding, setAdding] = useState(false)
  const plans = PRODUCTION_PLANS.filter((p) => filter === 'all' || p.status === filter).sort((a, b) => a.start.localeCompare(b.start)).reverse()
  const count = (s: Filter) => (s === 'all' ? PRODUCTION_PLANS.length : PRODUCTION_PLANS.filter((p) => p.status === s).length)

  return (
    <div>
      <PageHeader
        title="Production Plans"
        description="Which looms are weaving which order, and whether delivery dates are on track."
        breadcrumbs={[{ label: 'Production', to: '/production' }, { label: 'Production Plans' }]}
        actions={
          <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>
            New Plan
          </Button>
        }
      />
      <Tabs
        variant="underline"
        value={filter}
        onChange={setFilter}
        className="mb-5"
        tabs={(['all', 'In Progress', 'Delayed', 'Planned', 'Completed'] as Filter[]).map((s) => ({ value: s, label: s === 'all' ? 'All plans' : s, count: count(s) }))}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {plans.map((p) => {
          const f = fabricByCode(p.fabricCode)!
          const o = orderById(p.orderId)
          const progress = (p.producedMeters / p.plannedMeters) * 100
          return (
            <Card key={p.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-500">{p.id}</p>
                  <p className="mt-0.5 text-base font-semibold text-slate-900">
                    {f.construction} {f.name}
                  </p>
                  <p className="text-[13px] text-slate-500">
                    For{' '}
                    {o ? (
                      <Link to={`/sales/orders/${o.id}`} className="font-medium text-brand-700 hover:underline">
                        {o.id} · {customerById(o.customerId)?.name}
                      </Link>
                    ) : (
                      p.orderId
                    )}
                  </p>
                </div>
                <StatusBadge status={p.status} />
              </div>
              <div className="mt-4 flex items-baseline justify-between text-[13px] num">
                <span className="text-slate-500">
                  <b className="font-semibold text-slate-900">{meters(p.producedMeters)}</b> of {meters(p.plannedMeters)}
                </span>
                <span className={cn('font-semibold', p.status === 'Delayed' ? 'text-rose-600' : 'text-slate-900')}>{progress.toFixed(0)}%</span>
              </div>
              <ProgressBar value={progress} tone={p.status === 'Delayed' ? 'red' : p.status === 'Completed' ? 'green' : 'brand'} className="mt-2" height="h-2" />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-[13px]">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <CalendarRange className="size-4" />
                  {dayMonth(p.start)} → {dayMonth(p.end)}
                </span>
                <span className="flex flex-wrap gap-1">
                  {p.looms.map((l) => (
                    <Link key={l} to={`/looms/${l}`} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700">
                      {l}
                    </Link>
                  ))}
                </span>
              </div>
              {p.status === 'Delayed' && (
                <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {num(p.plannedMeters - p.producedMeters)} m behind schedule — L-03 stopped (picking stick). Consider moving the order to L-07 and L-18 on all shifts.
                </p>
              )}
            </Card>
          )
        })}
      </div>
      <QuickFormModal
        open={adding}
        onClose={() => setAdding(false)}
        icon={<CalendarRange />}
        title="New Production Plan"
        submitLabel="Create Plan"
        successMessage="Production plan created."
        fields={[
          { name: 'order', label: 'Sales order', type: 'select', options: ['SO-1031', 'SO-1030', 'SO-1029', 'SO-1028'], required: true },
          { name: 'fabric', label: 'Fabric', type: 'select', options: FABRICS.map((f) => `${f.code} · ${f.construction} ${f.name}`), required: true },
          { name: 'meters', label: 'Planned quantity', type: 'number', suffix: 'm', required: true },
          { name: 'looms', label: 'Looms', placeholder: 'e.g. L-10, L-11, L-15', required: true },
          { name: 'start', label: 'Start date', type: 'date', required: true },
          { name: 'end', label: 'Target completion', type: 'date', required: true },
        ]}
      />
    </div>
  )
}
