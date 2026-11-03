import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Factory, Plus } from 'lucide-react'
import type { Loom } from '@/types'
import { Button, DataTable, PageHeader, StatusBadge, type Column } from '@/components/ui'
import { QuickFormModal } from '@/components/forms/QuickFormModal'
import { TableActions } from '@/components/common/TableActions'
import { useApp } from '@/context/AppState'
import { fabricByCode } from '@/data/inventory'
import { date } from '@/utils/format'
import { IS_POLY, TERMS } from '@/data/dataset'

export default function LoomListPage() {
  const navigate = useNavigate()
  const { looms } = useApp()
  const [adding, setAdding] = useState(false)

  const columns: Column<Loom>[] = [
    { key: 'id', header: `${TERMS.machine} No.`, cell: (l) => <span className="font-semibold text-slate-900">{l.id}</span>, sort: (l) => l.id },
    { key: 'type', header: 'Type', cell: (l) => l.type, sort: (l) => l.type },
    { key: 'make', header: 'Manufacturer', cell: (l) => l.manufacturer, sort: (l) => l.manufacturer },
    { key: 'model', header: 'Model', cell: (l) => l.model, hideBelow: 'md' },
    { key: 'width', header: 'Width', align: 'right', cell: (l) => `${l.widthInches}"`, sort: (l) => l.widthInches },
    { key: 'rpm', header: 'RPM', align: 'right', cell: (l) => l.rpm, sort: (l) => l.rpm },
    { key: 'hall', header: TERMS.area, cell: (l) => l.hall, sort: (l) => l.hall, hideBelow: 'lg' },
    { key: 'fabric', header: `Current ${TERMS.productOne}`, cell: (l) => fabricByCode(l.fabricCode)?.construction, hideBelow: 'lg' },
    { key: 'installed', header: 'Installed', cell: (l) => date(l.installed), sort: (l) => l.installed, hideBelow: 'xl' },
    { key: 'status', header: 'Status', cell: (l) => <StatusBadge status={l.status} />, sort: (l) => l.status },
  ]

  return (
    <div>
      <PageHeader
        title={TERMS.machines}
        description={`Master register of all ${TERMS.machines.toLowerCase()} with machine specifications.`}
        breadcrumbs={[{ label: TERMS.machines, to: '/looms' }, { label: TERMS.machines }]}
        actions={
          <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>
            Add {TERMS.machine}
          </Button>
        }
      />
      <DataTable
        data={looms}
        columns={columns}
        rowKey={(l) => l.id}
        onRowClick={(l) => navigate(`/looms/${l.id}`)}
        searchText={(l) => `${l.id} ${l.manufacturer} ${l.model} ${l.type}`}
        searchPlaceholder={`Search ${TERMS.machine.toLowerCase()} no., make, model…`}
        filters={[
          { label: TERMS.area, options: TERMS.areas, value: (l) => l.hall },
          { label: 'Type', options: TERMS.machineTypes, value: (l) => l.type },
          { label: 'Status', options: ['Running', 'Stopped', 'Maintenance'], value: (l) => l.status },
        ]}
        actions={<TableActions importable />}
        pageSize={15}
      />
      <QuickFormModal
        open={adding}
        onClose={() => setAdding(false)}
        icon={<Factory />}
        title={`Add ${TERMS.machine}`}
        description={`Register a new ${TERMS.machine.toLowerCase()} in the factory.`}
        submitLabel={`Save ${TERMS.machine}`}
        successMessage={`${TERMS.machine} added successfully.`}
        fields={[
          { name: 'id', label: `${TERMS.machine} number`, required: true, placeholder: IS_POLY ? 'M-53' : 'L-81' },
          { name: 'type', label: `${TERMS.machine} type`, type: 'select', options: IS_POLY ? TERMS.machineTypes : ['Air Jet', 'Rapier', 'Water Jet', 'Projectile'], required: true },
          { name: 'make', label: 'Manufacturer', type: 'select', options: IS_POLY ? ['Lohia', 'Starlinger', 'J.P. Extrusiontech', 'Other'] : ['Toyota', 'Picanol', 'Tsudakoma', 'Itema', 'Dornier', 'Other'], required: true },
          { name: 'model', label: 'Model', placeholder: IS_POLY ? 'LSL 6' : 'JAT810', required: true },
          { name: 'width', label: IS_POLY ? 'Working width' : 'Reed width', type: 'number', suffix: 'inch', required: true },
          { name: 'rpm', label: 'Speed', type: 'number', suffix: 'RPM', required: true },
          { name: 'hall', label: TERMS.area, type: 'select', options: TERMS.areas, required: true },
          { name: 'installed', label: 'Installation date', type: 'date' },
        ]}
      />
    </div>
  )
}
