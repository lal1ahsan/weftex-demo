import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CircleCheck, CircleX, ClipboardCheck, Hourglass, Plus, ScanSearch } from 'lucide-react'
import type { QualityStatus, Roll } from '@/types'
import { Badge, Button, Card, CardBody, CardHeader, DataTable, DetailItem, KpiCard, Modal, PageHeader, StatusBadge, useToast, type Column } from '@/components/ui'
import { CHART, ChartTooltip, axisProps } from '@/components/charts/ChartKit'
import { QuickFormModal } from '@/components/forms/QuickFormModal'
import { TableActions } from '@/components/common/TableActions'
import { ROLLS } from '@/data/commercial'
import { INSPECTORS } from '@/data/factory'
import { fabricByCode } from '@/data/inventory'
import { date, pct } from '@/utils/format'
import { IS_POLY, TERMS } from '@/data/dataset'

export default function QualityPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [rolls, setRolls] = useState<Roll[]>(ROLLS)
  const [selected, setSelected] = useState<Roll | null>(null)
  const [adding, setAdding] = useState(false)

  const count = (s: QualityStatus) => rolls.filter((r) => r.quality === s).length
  const defects = useMemo(() => {
    const map = new Map<string, number>()
    rolls.forEach((r) => r.defectTypes.forEach((d) => map.set(d, (map.get(d) ?? 0) + 1)))
    return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [rolls])

  const setStatus = (roll: Roll, quality: QualityStatus) => {
    setRolls((rs) => rs.map((r) => (r.id === roll.id ? { ...r, quality, location: quality === 'Rejected' ? 'Rejection Bay' : r.location === 'Rejection Bay' ? (IS_POLY ? 'Finished Goods Store' : 'Warehouse A') : r.location } : r)))
    setSelected(null)
    toast.success(`${TERMS.pack} ${roll.id} marked as ${quality}`, quality === 'Passed' ? 'Released to warehouse stock.' : quality === 'Rejected' ? `Moved to rejection bay and ${TERMS.machine.toLowerCase()} supervisor informed.` : 'Kept on hold for re-inspection.')
  }

  const columns: Column<Roll>[] = [
    { key: 'id', header: TERMS.pack, cell: (r) => <span className="font-semibold text-slate-900">{r.id}</span>, sort: (r) => r.id },
    { key: 'fabric', header: TERMS.productOne, cell: (r) => `${fabricByCode(r.fabricCode)?.construction} ${fabricByCode(r.fabricCode)?.name}` },
    { key: 'inspector', header: 'Inspector', cell: (r) => r.inspector, sort: (r) => r.inspector, hideBelow: 'lg' },
    { key: 'date', header: 'Date', cell: (r) => date(r.date), sort: (r) => r.date, hideBelow: 'md' },
    { key: 'grade', header: 'Quality', align: 'center', cell: (r) => <Badge tone={r.grade === 'A' ? 'green' : r.grade === 'B' ? 'amber' : 'red'}>Grade {r.grade}</Badge>, sort: (r) => r.grade },
    { key: 'defects', header: 'Defects', align: 'right', cell: (r) => r.defects, sort: (r) => r.defects },
    { key: 'types', header: 'Defect Types', cell: (r) => <span className="text-slate-500">{r.defectTypes.join(', ') || '—'}</span>, hideBelow: 'xl', className: 'max-w-[220px] truncate' },
    { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={r.quality} />, sort: (r) => r.quality },
  ]

  return (
    <div>
      <PageHeader
        title="Quality Inspection"
        description={IS_POLY ? 'Bundle inspection results using AQL sampling.' : 'Roll inspection results using the 4-point system.'}
        breadcrumbs={[{ label: 'Quality' }, { label: 'Quality Inspection' }]}
        actions={
          <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>
            New Inspection
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Inspected" value={rolls.length} icon={<ScanSearch />} sub={<span>{TERMS.packs} this week</span>} />
        <KpiCard label="Passed" value={count('Passed')} icon={<CircleCheck />} accent="green" sub={<span>{pct((count('Passed') / rolls.length) * 100)} pass rate</span>} />
        <KpiCard label="Rejected" value={count('Rejected')} icon={<CircleX />} accent="red" sub={<span>{pct((count('Rejected') / rolls.length) * 100)} of {TERMS.packs.toLowerCase()}</span>} />
        <KpiCard label="On Hold" value={count('Hold')} icon={<Hourglass />} accent="amber" sub={<span>Awaiting decision</span>} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title="Top Defects" subtitle="Occurrences this week" />
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={defects} layout="vertical" margin={{ left: 0, right: 12 }} barCategoryGap="28%">
                <CartesianGrid horizontal={false} stroke={CHART.grid} />
                <XAxis type="number" {...axisProps} allowDecimals={false} />
                <YAxis type="category" dataKey="name" {...axisProps} width={100} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" name={TERMS.packs} fill={CHART.rose} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
        <div className="xl:col-span-2">
          <DataTable
            data={rolls}
            columns={columns}
            rowKey={(r) => r.id}
            searchText={(r) => `${r.id} ${r.fabricCode} ${r.inspector} ${r.defectTypes.join(' ')}`}
            searchPlaceholder={`Search ${TERMS.pack.toLowerCase()}, inspector, defect…`}
            filters={[
              { label: 'Status', options: ['Passed', 'Hold', 'Rejected'], value: (r) => r.quality },
              { label: 'Inspector', options: INSPECTORS, value: (r) => r.inspector },
            ]}
            actions={<TableActions />}
            onRowClick={setSelected}
            pageSize={10}
          />
        </div>
      </div>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        icon={<ClipboardCheck />}
        title={selected ? `Inspection · ${selected.id}` : ''}
        description={selected ? `${fabricByCode(selected.fabricCode)?.construction} ${fabricByCode(selected.fabricCode)?.name} · ${selected.loomId}` : ''}
        footer={
          selected && (
            <>
              <Button variant="ghost" onClick={() => navigate(`/fabric/rolls/${selected.id}`)} className="mr-auto">
                View {TERMS.pack.toLowerCase()}
              </Button>
              <Button onClick={() => setStatus(selected, 'Hold')} disabled={selected.quality === 'Hold'}>
                Hold
              </Button>
              <Button variant="danger" onClick={() => setStatus(selected, 'Rejected')} disabled={selected.quality === 'Rejected'}>
                Reject
              </Button>
              <Button variant="primary" onClick={() => setStatus(selected, 'Passed')} disabled={selected.quality === 'Passed'}>
                Pass
              </Button>
            </>
          )
        }
      >
        {selected && (
          <dl className="grid grid-cols-2 gap-4">
            <DetailItem label="Current status" value={<StatusBadge status={selected.quality} />} />
            <DetailItem label="Grade" value={`Grade ${selected.grade}`} />
            <DetailItem label={IS_POLY ? 'Bags / weight' : 'Length / weight'} value={`${selected.meters} ${TERMS.stock} · ${selected.weightKg} kg`} />
            <DetailItem label="Inspector" value={selected.inspector} />
            <DetailItem label="Defects" value={selected.defects} />
            <DetailItem label="Defect types" value={selected.defectTypes.join(', ') || 'None'} />
          </dl>
        )}
      </Modal>

      <QuickFormModal
        open={adding}
        onClose={() => setAdding(false)}
        icon={<ClipboardCheck />}
        title="New Inspection"
        submitLabel="Save Inspection"
        successMessage="Inspection saved."
        fields={[
          { name: 'roll', label: `${TERMS.pack} number`, placeholder: IS_POLY ? 'BN-10321' : 'R-10321', required: true },
          { name: 'inspector', label: 'Inspector', type: 'select', options: INSPECTORS, required: true },
          { name: 'meters', label: IS_POLY ? 'Bags counted' : 'Measured length', type: 'number', suffix: TERMS.stock, required: true },
          { name: 'weight', label: 'Weight', type: 'number', suffix: 'kg' },
          { name: 'points', label: IS_POLY ? 'Defective bags' : 'Defect points', type: 'number', required: true },
          { name: 'result', label: 'Result', type: 'select', options: ['Passed', 'Hold', 'Rejected'], required: true },
          { name: 'notes', label: 'Defects observed', type: 'textarea', placeholder: IS_POLY ? 'Weak seal on 6 bags, print smudge on 3…' : 'Broken picks at 34 m, oil stain at 80 m…' },
        ]}
      />
    </div>
  )
}
