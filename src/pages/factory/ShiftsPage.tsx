import { useState } from 'react'
import { Clock, Pencil, Plus, Users } from 'lucide-react'
import { Button, Card, DataTable, EfficiencyValue, PageHeader, Tabs, useToast, type Column } from '@/components/ui'
import { useApp } from '@/context/AppState'
import { OPERATORS, SHIFTS } from '@/data/factory'
import { byShift, onDate } from '@/data/metrics'
import { TODAY_ISO } from '@/data/seed'
import type { Operator, ShiftName } from '@/types'
import { num } from '@/utils/format'
import { TERMS } from '@/data/dataset'

export default function ShiftsPage() {
  const toast = useToast()
  const { production, looms } = useApp()
  const perf = byShift(onDate(production, TODAY_ISO))
  const [tab, setTab] = useState<ShiftName>('Morning')

  const columns: Column<Operator>[] = [
    { key: 'id', header: 'ID', cell: (o) => <span className="text-slate-500">{o.id}</span> },
    { key: 'name', header: 'Operator', cell: (o) => <span className="font-semibold text-slate-900">{o.name}</span>, sort: (o) => o.name },
    { key: 'looms', header: 'Assigned Looms', cell: (o) => looms.filter((l) => l.operator === o.name).map((l) => l.id).join(', ') || 'Relief / helper', hideBelow: 'md' },
    { key: 'shift', header: 'Shift', cell: (o) => o.shift },
  ]

  return (
    <div>
      <PageHeader
        title="Shifts"
        description="Three 8-hour shifts, supervisors and operator rosters."
        breadcrumbs={[{ label: 'Factory', to: '/factory' }, { label: 'Shifts' }]}
        actions={
          <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => toast.demo('Custom shift patterns (e.g. 2 × 12 hours) are available in the production version.')}>
            Add Shift
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {SHIFTS.map((s, i) => (
          <Card key={s.name} className="relative overflow-hidden p-5">
            <span className="absolute inset-x-0 top-0 h-1" style={{ background: s.color }} />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Shift {s.code}</p>
                <p className="text-lg font-semibold text-slate-900">{s.name}</p>
              </div>
              <Button size="icon-sm" variant="ghost" onClick={() => toast.demo()} aria-label={`Edit ${s.name} shift`}>
                <Pencil className="size-4" />
              </Button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
              <span className="flex items-center gap-1.5 text-slate-600">
                <Clock className="size-4 text-slate-400" />
                {s.start} – {s.end}
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <Users className="size-4 text-slate-400" />
                {s.operators} operators
              </span>
            </div>
            <div className="mt-4 flex items-end justify-between border-t border-line pt-4">
              <div>
                <p className="text-xs text-slate-500">Supervisor</p>
                <p className="text-sm font-semibold text-slate-900">{s.supervisor}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Today · {num(perf[i].actual)} {TERMS.out}</p>
                <EfficiencyValue value={perf[i].efficiency} className="text-lg" />
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="mt-6">
        <Tabs variant="underline" value={tab} onChange={setTab} className="mb-4" tabs={SHIFTS.map((s) => ({ value: s.name, label: `${s.name} roster`, count: OPERATORS.filter((o) => o.shift === s.name).length }))} />
        <DataTable key={tab} data={OPERATORS.filter((o) => o.shift === tab)} columns={columns} rowKey={(o) => o.id} searchText={(o) => o.name} searchPlaceholder="Search operator…" pageSize={10} />
      </div>
    </div>
  )
}
