import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { DowntimeRecord } from '@/types'
import { Badge, Button, DataTable, PageHeader, type Column } from '@/components/ui'
import { DOWNTIME_COLORS } from '@/components/charts/Charts'
import { DowntimeFormModal } from '@/components/forms/DowntimeFormModal'
import { DowntimeDetailModal } from '@/components/forms/DowntimeDetailModal'
import { TableActions } from '@/components/common/TableActions'
import { useApp } from '@/context/AppState'
import { DOWNTIME_CATEGORIES } from '@/data/production'
import { useQueryParam } from '@/hooks/useQueryParam'
import { date, duration } from '@/utils/format'

export default function DowntimeRecordsPage() {
  const { downtime } = useApp()
  const q = useQueryParam('q')
  const [adding, setAdding] = useState(false)
  const [selected, setSelected] = useState<DowntimeRecord | null>(null)

  const columns: Column<DowntimeRecord>[] = [
    { key: 'id', header: 'ID', cell: (d) => <span className="text-slate-500">{d.id}</span>, hideBelow: 'lg' },
    { key: 'loom', header: 'Loom', cell: (d) => <span className="font-semibold text-slate-900">{d.loomId}</span>, sort: (d) => d.loomId },
    { key: 'date', header: 'Date', cell: (d) => date(d.date), sort: (d) => d.date + d.start },
    { key: 'shift', header: 'Shift', cell: (d) => d.shift, hideBelow: 'md' },
    { key: 'time', header: 'Time', cell: (d) => `${d.start} – ${d.end || 'now'}`, hideBelow: 'md' },
    { key: 'dur', header: 'Duration', align: 'right', cell: (d) => <Badge tone={d.end ? 'slate' : 'red'}>{duration(d.minutes)}</Badge>, sort: (d) => d.minutes },
    {
      key: 'cat',
      header: 'Category',
      cell: (d) => (
        <span className="inline-flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: DOWNTIME_COLORS[d.category] }} />
          {d.category}
        </span>
      ),
      sort: (d) => d.category,
    },
    { key: 'reason', header: 'Reason', cell: (d) => d.reason, className: 'max-w-[260px] truncate' },
    { key: 'dept', header: 'Responsible', cell: (d) => d.department, hideBelow: 'xl' },
  ]

  return (
    <div>
      <PageHeader
        title="Downtime Records"
        description="Every loom stoppage with its cause. Click a record to view the breakdown."
        breadcrumbs={[{ label: 'Downtime', to: '/downtime' }, { label: 'Downtime Records' }]}
        actions={
          <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>
            Record Downtime
          </Button>
        }
      />
      <DataTable
        data={downtime}
        columns={columns}
        rowKey={(d) => d.id}
        initialQuery={q}
        searchText={(d) => `${d.id} ${d.loomId} ${d.reason} ${d.remarks}`}
        searchPlaceholder="Search loom, reason…"
        filters={[
          { label: 'Category', options: DOWNTIME_CATEGORIES, value: (d) => d.category },
          { label: 'Shift', options: ['Morning', 'Evening', 'Night'], value: (d) => d.shift },
          { label: 'Status', options: ['Ongoing', 'Resolved'], value: (d) => (d.end ? 'Resolved' : 'Ongoing') },
        ]}
        actions={<TableActions printable />}
        onRowClick={setSelected}
        defaultSort={{ key: 'date', dir: 'desc' }}
        pageSize={15}
      />
      <DowntimeFormModal open={adding} onClose={() => setAdding(false)} />
      <DowntimeDetailModal record={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
