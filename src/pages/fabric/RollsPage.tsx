import { useNavigate } from 'react-router-dom'
import { Eye, QrCode } from 'lucide-react'
import type { Roll } from '@/types'
import { Button, DataTable, PageHeader, StatusBadge, useToast, type Column } from '@/components/ui'
import { TableActions } from '@/components/common/TableActions'
import { ROLLS } from '@/data/commercial'
import { fabricByCode } from '@/data/inventory'
import { useQueryParam } from '@/hooks/useQueryParam'
import { date, kg, num, sum } from '@/utils/format'
import { IS_POLY, TERMS } from '@/data/dataset'

export default function RollsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const q = useQueryParam('q')

  const columns: Column<Roll>[] = [
    { key: 'id', header: `${TERMS.pack} #`, cell: (r) => <span className="font-semibold text-slate-900">{r.id}</span>, sort: (r) => r.id },
    { key: 'fabric', header: TERMS.productOne, cell: (r) => <span><b className="font-semibold text-slate-800">{fabricByCode(r.fabricCode)?.construction}</b> <span className="text-slate-500">{fabricByCode(r.fabricCode)?.name}</span></span> },
    { key: 'loom', header: TERMS.machine, cell: (r) => r.loomId, sort: (r) => r.loomId },
    { key: 'date', header: 'Date', cell: (r) => date(r.date), sort: (r) => r.date, hideBelow: 'lg' },
    { key: 'm', header: IS_POLY ? 'Bags' : 'Length', align: 'right', cell: (r) => `${r.meters} ${TERMS.stock}`, sort: (r) => r.meters },
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
          View {TERMS.pack}
        </Button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title={TERMS.packs}
        description={`${ROLLS.length} ${TERMS.packs.toLowerCase()} · ${num(sum(ROLLS, (r) => r.meters))} ${TERMS.stock} produced and inspected this week.`}
        breadcrumbs={[{ label: TERMS.product, to: '/fabric' }, { label: TERMS.packs }]}
        actions={
          <Button icon={<QrCode className="size-4" />} onClick={() => toast.demo(`Barcode / QR ${TERMS.pack.toLowerCase()} labels are available in the production version.`)}>
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
        searchPlaceholder={`Search ${TERMS.pack.toLowerCase()} #, ${TERMS.machine.toLowerCase()}, ${TERMS.productOne.toLowerCase()}…`}
        filters={[
          { label: 'Quality', options: ['Passed', 'Hold', 'Rejected'], value: (r) => r.quality },
          { label: 'Status', options: ['In Stock', 'Reserved', 'Dispatched'], value: (r) => r.status },
          { label: 'Location', options: IS_POLY ? ['Finished Goods Store', 'Bundle Store', 'Rejection Bay'] : ['Warehouse A', 'Warehouse B', 'Rejection Bay'], value: (r) => r.location },
        ]}
        actions={<TableActions />}
        onRowClick={(r) => navigate(`/fabric/rolls/${r.id}`)}
        pageSize={15}
      />
    </div>
  )
}
