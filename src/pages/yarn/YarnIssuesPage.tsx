import { useState } from 'react'
import { ArrowUpFromLine, Plus } from 'lucide-react'
import type { YarnIssue } from '@/types'
import { Badge, Button, DataTable, PageHeader, toneFor, type Column } from '@/components/ui'
import { QuickFormModal } from '@/components/forms/QuickFormModal'
import { TableActions } from '@/components/common/TableActions'
import { YARN_ISSUES, YARNS } from '@/data/inventory'
import { date, kg, num, sum } from '@/utils/format'
import { IS_POLY, TERMS } from '@/data/dataset'

const PURPOSES = IS_POLY ? ['Extrusion', 'Printing', 'Lamination', 'Stitching'] : ['Warp', 'Weft']

export default function YarnIssuesPage() {
  const [adding, setAdding] = useState(false)

  const columns: Column<YarnIssue>[] = [
    { key: 'id', header: 'Issue #', cell: (i) => <span className="font-semibold text-slate-900">{i.id}</span>, sort: (i) => i.id },
    { key: 'date', header: 'Date', cell: (i) => date(i.date), sort: (i) => i.date },
    { key: 'yarn', header: TERMS.raw, cell: (i) => <span><span className="text-slate-500">{i.yarnCode}</span> · {i.yarnName}</span> },
    { key: 'qty', header: 'Quantity', align: 'right', cell: (i) => <b className="font-semibold text-slate-900">{kg(i.quantityKg)}</b>, sort: (i) => i.quantityKg },
    { key: 'to', header: 'Issued To', cell: (i) => i.issuedTo, hideBelow: 'md' },
    { key: 'purpose', header: 'Purpose', cell: (i) => <Badge tone={toneFor(i.purpose)}>{i.purpose}</Badge>, sort: (i) => i.purpose },
    { key: 'by', header: 'Issued By', cell: (i) => i.issuedBy, hideBelow: 'lg' },
  ]

  return (
    <div>
      <PageHeader
        title={`${TERMS.raw} Issues`}
        description={`${num(sum(YARN_ISSUES, (i) => i.quantityKg))} kg issued to ${IS_POLY ? 'extruders, printing and conversion' : 'sizing and looms'} in the last 12 days.`}
        breadcrumbs={[{ label: TERMS.raw, to: '/yarn' }, { label: `${TERMS.raw} Issues` }]}
        actions={
          <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>
            Issue {TERMS.raw}
          </Button>
        }
      />
      <DataTable
        data={YARN_ISSUES}
        columns={columns}
        rowKey={(i) => i.id}
        searchText={(i) => `${i.id} ${i.yarnCode} ${i.yarnName} ${i.issuedTo}`}
        searchPlaceholder={IS_POLY ? `Search issue, ${TERMS.raw.toLowerCase()}, ${TERMS.machine.toLowerCase()}…` : 'Search issue, yarn, loom, beam…'}
        filters={[{ label: 'Purpose', options: PURPOSES, value: (i) => i.purpose }]}
        actions={<TableActions printable />}
        pageSize={12}
      />
      <QuickFormModal
        open={adding}
        onClose={() => setAdding(false)}
        icon={<ArrowUpFromLine />}
        title={`Issue ${TERMS.raw}`}
        description={IS_POLY ? `Issue ${TERMS.raw.toLowerCase()} from store to extruders, printing, lamination or stitching.` : 'Issue yarn from store to sizing (warp) or looms (weft).'}
        submitLabel={`Issue ${TERMS.raw}`}
        successMessage={`${TERMS.raw} issued successfully.`}
        fields={[
          { name: 'yarn', label: TERMS.raw, type: 'select', options: YARNS.map((y) => `${y.code} · ${y.name} ${y.count} (${num(y.stockKg)} kg)`), required: true, full: true },
          { name: 'qty', label: 'Quantity', type: 'number', suffix: 'kg', required: true },
          { name: 'purpose', label: 'Purpose', type: 'select', options: PURPOSES, required: true },
          { name: 'to', label: 'Issued to', placeholder: IS_POLY ? 'Extrusion — M-02' : 'Sizing — Beam B-291 or L-12', required: true },
          { name: 'by', label: 'Issued by', type: 'select', options: IS_POLY ? ['Arif Hussain', 'Zafar Iqbal'] : ['Naeem Akhtar', 'Shabbir Hussain'], required: true },
        ]}
      />
    </div>
  )
}
