import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CircleCheck, Layers, Lock, PackageSearch, Plus, Ruler } from 'lucide-react'
import type { Fabric } from '@/types'
import { Button, DataTable, KpiCard, PageHeader, StatusBadge, type Column } from '@/components/ui'
import { QuickFormModal } from '@/components/forms/QuickFormModal'
import { TableActions } from '@/components/common/TableActions'
import { FABRICS } from '@/data/inventory'
import { useQueryParam } from '@/hooks/useQueryParam'
import { kg, num, pkr, pkrCompact, sum } from '@/utils/format'

export default function FabricInventoryPage() {
  const navigate = useNavigate()
  const q = useQueryParam('q')
  const [adding, setAdding] = useState(false)
  const byStatus = (s: Fabric['status']) => FABRICS.filter((f) => f.status === s)

  const columns: Column<Fabric>[] = [
    { key: 'code', header: 'Fabric Code', cell: (f) => <span className="font-semibold text-slate-900">{f.code}</span>, sort: (f) => f.code },
    { key: 'name', header: 'Fabric', cell: (f) => f.name, sort: (f) => f.name, hideBelow: 'md' },
    { key: 'construction', header: 'Construction', cell: (f) => <span><b className="font-semibold text-slate-800">{f.construction}</b> <span className="text-slate-400">/ {f.density}</span></span> },
    { key: 'width', header: 'Width', align: 'right', cell: (f) => `${f.widthInches}"`, sort: (f) => f.widthInches, hideBelow: 'lg' },
    { key: 'rolls', header: 'Rolls', align: 'right', cell: (f) => num(f.rolls), sort: (f) => f.rolls },
    { key: 'meters', header: 'Meters', align: 'right', cell: (f) => <b className="font-semibold text-slate-900">{num(f.meters)}</b>, sort: (f) => f.meters },
    { key: 'weight', header: 'Weight', align: 'right', cell: (f) => kg(f.weightKg), sort: (f) => f.weightKg, hideBelow: 'xl' },
    { key: 'value', header: 'Value', align: 'right', cell: (f) => pkrCompact(f.meters * f.ratePerMeter), sort: (f) => f.meters * f.ratePerMeter, hideBelow: 'lg' },
    { key: 'location', header: 'Location', cell: (f) => f.location, hideBelow: 'xl' },
    { key: 'status', header: 'Status', cell: (f) => <StatusBadge status={f.status} />, sort: (f) => f.status },
  ]

  return (
    <div>
      <PageHeader
        title="Fabric Inventory"
        description="Finished grey fabric in the warehouse — what you can sell right now."
        breadcrumbs={[{ label: 'Fabric' }, { label: 'Fabric Inventory' }]}
        actions={
          <>
            <Button onClick={() => navigate('/fabric/rolls')}>View Rolls</Button>
            <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>
              Add Fabric
            </Button>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Total Fabric Stock" value={num(sum(FABRICS, (f) => f.meters))} unit="m" icon={<Ruler />} sub={<span>{pkrCompact(sum(FABRICS, (f) => f.meters * f.ratePerMeter))} value</span>} />
        <KpiCard label="Total Rolls" value={num(sum(FABRICS, (f) => f.rolls))} icon={<Layers />} accent="violet" sub={<span>{FABRICS.length} fabric qualities</span>} />
        <KpiCard label="Available" value={num(sum(byStatus('Available'), (f) => f.meters))} unit="m" icon={<CircleCheck />} accent="green" sub={<span>{byStatus('Available').length} qualities</span>} />
        <KpiCard label="Reserved" value={num(sum(byStatus('Reserved'), (f) => f.meters))} unit="m" icon={<Lock />} accent="brand" sub={<span>Against open orders</span>} />
        <KpiCard label="On Hold" value={num(sum(byStatus('On Hold'), (f) => f.meters))} unit="m" icon={<PackageSearch />} accent="amber" sub={<span>Awaiting QC decision</span>} />
      </div>
      <div className="mt-4">
        <DataTable
          data={FABRICS}
          columns={columns}
          rowKey={(f) => f.code}
          initialQuery={q}
          searchText={(f) => `${f.code} ${f.name} ${f.construction} ${f.density} ${f.weave}`}
          searchPlaceholder="Search code, construction, name…"
          filters={[
            { label: 'Status', options: ['Available', 'Reserved', 'On Hold'], value: (f) => f.status },
            { label: 'Location', options: ['Warehouse A', 'Warehouse B'], value: (f) => f.location },
            { label: 'Weave', options: [...new Set(FABRICS.map((f) => f.weave))].sort(), value: (f) => f.weave },
          ]}
          actions={<TableActions importable />}
          onRowClick={(f) => navigate(`/fabric/${f.code}`)}
          pageSize={20}
          summary={(rows) => (
            <tr className="text-[13px] text-slate-900">
              <td className="px-5 py-3">Total ({rows.length})</td>
              <td className="hidden md:table-cell" />
              <td />
              <td className="hidden lg:table-cell" />
              <td className="px-4 py-3 text-right num">{num(sum(rows, (f) => f.rolls))}</td>
              <td className="px-4 py-3 text-right num">{num(sum(rows, (f) => f.meters))}</td>
              <td className="hidden px-4 py-3 text-right xl:table-cell num">{kg(sum(rows, (f) => f.weightKg))}</td>
              <td className="hidden px-4 py-3 text-right lg:table-cell num">{pkrCompact(sum(rows, (f) => f.meters * f.ratePerMeter))}</td>
              <td className="hidden xl:table-cell" />
              <td />
            </tr>
          )}
        />
      </div>
      <QuickFormModal
        open={adding}
        onClose={() => setAdding(false)}
        icon={<Layers />}
        title="Add Fabric Quality"
        submitLabel="Save Fabric"
        successMessage="Fabric quality added."
        fields={[
          { name: 'name', label: 'Fabric name', placeholder: 'Cotton Sheeting', required: true },
          { name: 'construction', label: 'Yarn counts', placeholder: '40×40', required: true },
          { name: 'density', label: 'Reed × pick', placeholder: '133×72', required: true },
          { name: 'width', label: 'Width', type: 'number', suffix: 'inch', required: true },
          { name: 'gsm', label: 'GSM', type: 'number' },
          { name: 'weave', label: 'Weave', type: 'select', options: ['Plain', '2/1 Twill', '3/1 Twill', 'Dobby', 'Satin', 'Jacquard'] },
          { name: 'rate', label: 'Selling rate', type: 'number', suffix: 'PKR/m', hint: `e.g. ${pkr(FABRICS[0].ratePerMeter)} for 40×40 sheeting` },
        ]}
      />
    </div>
  )
}
