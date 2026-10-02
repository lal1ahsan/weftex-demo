import { useState } from 'react'
import { ArrowUpFromLine, Plus } from 'lucide-react'
import type { YarnIssue } from '@/types'
import { Badge, Button, DataTable, PageHeader, toneFor, type Column } from '@/components/ui'
import { QuickFormModal } from '@/components/forms/QuickFormModal'
import { TableActions } from '@/components/common/TableActions'
import { YARN_ISSUES, YARNS } from '@/data/inventory'
import { date, kg, num, sum } from '@/utils/format'

export default function YarnIssuesPage() {
  const [adding, setAdding] = useState(false)

  const columns: Column<YarnIssue>[] = [
    { key: 'id', header: 'Issue #', cell: (i) => <span className="font-semibold text-slate-900">{i.id}</span>, sort: (i) => i.id },
    { key: 'date', header: 'Date', cell: (i) => date(i.date), sort: (i) => i.date },
    { key: 'yarn', header: 'Yarn', cell: (i) => <span><span className="text-slate-500">{i.yarnCode}</span> · {i.yarnName}</span> },
    { key: 'qty', header: 'Quantity', align: 'right', cell: (i) => <b className="font-semibold text-slate-900">{kg(i.quantityKg)}</b>, sort: (i) => i.quantityKg },
    { key: 'to', header: 'Issued To', cell: (i) => i.issuedTo, hideBelow: 'md' },
    { key: 'purpose', header: 'Purpose', cell: (i) => <Badge tone={toneFor(i.purpose)}>{i.purpose}</Badge>, sort: (i) => i.purpose },
    { key: 'by', header: 'Issued By', cell: (i) => i.issuedBy, hideBelow: 'lg' },
  ]

  return (
    <div>
      <PageHeader
        title="Yarn Issues"
        description={`${num(sum(YARN_ISSUES, (i) => i.quantityKg))} kg issued to sizing and looms in the last 12 days.`}
        breadcrumbs={[{ label: 'Yarn', to: '/yarn' }, { label: 'Yarn Issues' }]}
        actions={
          <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>
            Issue Yarn
          </Button>
        }
      />
      <DataTable
        data={YARN_ISSUES}
        columns={columns}
        rowKey={(i) => i.id}
        searchText={(i) => `${i.id} ${i.yarnCode} ${i.yarnName} ${i.issuedTo}`}
        searchPlaceholder="Search issue, yarn, loom, beam…"
        filters={[{ label: 'Purpose', options: ['Warp', 'Weft'], value: (i) => i.purpose }]}
        actions={<TableActions printable />}
        pageSize={12}
      />
      <QuickFormModal
        open={adding}
        onClose={() => setAdding(false)}
        icon={<ArrowUpFromLine />}
        title="Issue Yarn"
        description="Issue yarn from store to sizing (warp) or looms (weft)."
        submitLabel="Issue Yarn"
        successMessage="Yarn issued successfully."
        fields={[
          { name: 'yarn', label: 'Yarn', type: 'select', options: YARNS.map((y) => `${y.code} · ${y.name} ${y.count} (${num(y.stockKg)} kg)`), required: true, full: true },
          { name: 'qty', label: 'Quantity', type: 'number', suffix: 'kg', required: true },
          { name: 'purpose', label: 'Purpose', type: 'select', options: ['Warp', 'Weft'], required: true },
          { name: 'to', label: 'Issued to', placeholder: 'Sizing — Beam B-291 or L-12', required: true },
          { name: 'by', label: 'Issued by', type: 'select', options: ['Naeem Akhtar', 'Shabbir Hussain'], required: true },
        ]}
      />
    </div>
  )
}
