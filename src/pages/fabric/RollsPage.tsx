import { useNavigate } from 'react-router-dom'
import { Eye, QrCode } from 'lucide-react'
import type { Roll } from '@/types'
import { Button, DataTable, PageHeader, StatusBadge, useToast, type Column } from '@/components/ui'
import { TableActions } from '@/components/common/TableActions'
import { ROLLS } from '@/data/commercial'
import { fabricByCode } from '@/data/inventory'
import { useQueryParam } from '@/hooks/useQueryParam'
import { date, kg, num, sum } from '@/utils/format'

export default function RollsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const q = useQueryParam('q')

  const columns: Column<Roll>[] = [
    { key: 'id', header: 'Roll #', cell: (r) => <span className="font-semibold text-slate-900">{r.id}</span>, sort: (r) => r.id },
    { key: 'fabric', header: 'Fabric', cell: (r) => <span><b className="font-semibold text-slate-800">{fabricByCode(r.fabricCode)?.construction}</b> <span className="text-slate-500">{fabricByCode(r.fabricCode)?.name}</span></span> },
    { key: 'loom', header: 'Loom', cell: (r) => r.loomId, sort: (r) => r.loomId },
    { key: 'date', header: 'Date', cell: (r) => date(r.date), sort: (r) => r.date, hideBelow: 'lg' },
    { key: 'm', header: 'Length', align: 'right', cell: (r) => `${r.meters} m`, sort: (r) => r.meters },
    { key: 'kg', header: 'Weight', align: 'right', cell: (r) => kg(r.weightKg), sort: (r) => r.weightKg, hideBelow: 'md' },
    { key: 'q', header: 'Quality', cell: (r) => <StatusBadge status={r.quality} />, sort: (r) => r.quality },
    { key: 'loc', header: 'Location', cell: (r) => r.location, hideBelow: 'xl' },
    { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={r.status} />, sort: (r) => r.status, hideBelow: 'md' },
    {
      key: 'view',
      header: '',
      align: 'right',
      cell: (r) => (
        <Button size="sm" variant="ghost" icon={<Eye className="size-4" />} onClick={(e) => { e.stopPropagation(); navigate(`/fabric/rolls/${r.id}`) }}>
          View Roll
        </Button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Rolls"
        description={`${ROLLS.length} rolls · ${num(sum(ROLLS, (r) => r.meters))} m produced and inspected this week.`}
        breadcrumbs={[{ label: 'Fabric', to: '/fabric' }, { label: 'Rolls' }]}
        actions={
          <Button icon={<QrCode className="size-4" />} onClick={() => toast.demo('Barcode / QR roll labels are available in the production version.')}>
            Print Labels
          </Button>
        }
      />
      <DataTable
        data={ROLLS}
        columns={columns}
        rowKey={(r) => r.id}
        initialQuery={q}
        searchText={(r) => `${r.id} ${r.fabricCode} ${r.loomId} ${fabricByCode(r.fabricCode)?.construction}`}
        searchPlaceholder="Search roll #, loom, fabric…"
        filters={[
          { label: 'Quality', options: ['Passed', 'Hold', 'Rejected'], value: (r) => r.quality },
          { label: 'Status', options: ['In Stock', 'Reserved', 'Dispatched'], value: (r) => r.status },
          { label: 'Location', options: ['Warehouse A', 'Warehouse B', 'Rejection Bay'], value: (r) => r.location },
        ]}
        actions={<TableActions />}
        onRowClick={(r) => navigate(`/fabric/rolls/${r.id}`)}
        pageSize={15}
      />
    </div>
  )
}
