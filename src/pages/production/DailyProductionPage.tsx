import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import type { ProductionRecord } from '@/types'
import { Button, DataTable, EfficiencyValue, PageHeader, Select, type Column } from '@/components/ui'
import { ProductionFormModal } from '@/components/forms/ProductionFormModal'
import { TableActions } from '@/components/common/TableActions'
import { useApp } from '@/context/AppState'
import { fabricByCode } from '@/data/inventory'
import { totals } from '@/data/metrics'
import { daysAgo, isoDate } from '@/data/seed'
import { date, meters, num, pct } from '@/utils/format'
import { TERMS } from '@/data/dataset'

const DATES = Array.from({ length: 7 }, (_, i) => isoDate(daysAgo(i)))

export default function DailyProductionPage() {
  const navigate = useNavigate()
  const { production } = useApp()
  const [day, setDay] = useState(DATES[0])
  const [adding, setAdding] = useState(false)

  const rows = useMemo(() => (day === 'all' ? production : production.filter((r) => r.date === day)), [production, day])
  const t = totals(rows)

  const columns: Column<ProductionRecord>[] = [
    { key: 'id', header: 'Entry', cell: (r) => <span className="text-slate-500">{r.id}</span>, hideBelow: 'xl' },
    { key: 'date', header: 'Date', cell: (r) => date(r.date), sort: (r) => r.date },
    { key: 'shift', header: 'Shift', cell: (r) => r.shift, sort: (r) => r.shift },
    { key: 'loom', header: TERMS.machine, cell: (r) => <span className="font-semibold text-slate-900">{r.loomId}</span>, sort: (r) => r.loomId },
    { key: 'op', header: 'Operator', cell: (r) => r.operator, sort: (r) => r.operator, hideBelow: 'lg' },
    { key: 'fabric', header: TERMS.productOne, cell: (r) => `${fabricByCode(r.fabricCode)?.construction} · ${fabricByCode(r.fabricCode)?.name}`, hideBelow: 'md' },
    { key: 'target', header: 'Target', align: 'right', cell: (r) => meters(r.target), sort: (r) => r.target },
    { key: 'actual', header: 'Actual', align: 'right', cell: (r) => <b className="font-semibold text-slate-900">{meters(r.actual)}</b>, sort: (r) => r.actual },
    { key: 'eff', header: 'Eff.', align: 'right', cell: (r) => <EfficiencyValue value={r.efficiency} />, sort: (r) => r.efficiency },
    { key: 'waste', header: 'Wastage', align: 'right', cell: (r) => `${r.wastageKg.toFixed(1)} kg`, sort: (r) => r.wastageKg, hideBelow: 'md' },
    { key: 'remarks', header: 'Remarks', cell: (r) => <span className="text-slate-500">{r.remarks || '—'}</span>, hideBelow: 'xl', className: 'max-w-[220px] truncate' },
  ]

  return (
    <div>
      <PageHeader
        title="Daily Production"
        description={`Shift-wise production register for every ${TERMS.machine.toLowerCase()} — replaces the paper register.`}
        breadcrumbs={[{ label: 'Production', to: '/production' }, { label: 'Daily Production' }]}
        actions={
          <>
            <div className="w-48">
              <Select value={day} onChange={(e) => setDay(e.target.value)} options={[...DATES.map((d, i) => ({ value: d, label: i === 0 ? `Today · ${date(d)}` : i === 1 ? `Yesterday · ${date(d)}` : date(d) })), { value: 'all', label: 'Last 7 days' }]} />
            </div>
            <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>
              Add Production
            </Button>
          </>
        }
      />
      <div className="mb-4 grid grid-cols-2 gap-3 rounded-2xl border border-line bg-white p-4 shadow-card sm:grid-cols-4">
        {[
          ['Entries', num(rows.length)],
          ['Production', meters(t.actual)],
          ['Efficiency', pct(t.efficiency)],
          ['Wastage', `${num(t.wasteKg)} kg · ${pct(t.wastagePct)}`],
        ].map(([k, v]) => (
          <div key={k} className="px-1">
            <p className="text-xs font-medium text-slate-500">{k}</p>
            <p className="mt-0.5 font-display text-lg font-semibold text-slate-900 num">{v}</p>
          </div>
        ))}
      </div>
      <DataTable
        data={rows}
        columns={columns}
        rowKey={(r) => r.id}
        searchText={(r) => `${r.id} ${r.loomId} ${r.operator} ${r.fabricCode} ${r.remarks}`}
        searchPlaceholder={`Search ${TERMS.machine.toLowerCase()}, operator, remarks…`}
        filters={[
          { label: 'Shift', options: ['Morning', 'Evening', 'Night'], value: (r) => r.shift },
          { label: 'Efficiency', options: ['Below 85%', '85–95%', 'Above 95%'], value: (r) => (r.efficiency < 85 ? 'Below 85%' : r.efficiency <= 95 ? '85–95%' : 'Above 95%') },
        ]}
        actions={<TableActions importable printable />}
        onRowClick={(r) => navigate(`/looms/${r.loomId}`)}
        pageSize={15}
      />
      <ProductionFormModal open={adding} onClose={() => setAdding(false)} />
    </div>
  )
}
