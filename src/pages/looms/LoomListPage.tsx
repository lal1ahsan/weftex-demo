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

export default function LoomListPage() {
  const navigate = useNavigate()
  const { looms } = useApp()
  const [adding, setAdding] = useState(false)

  const columns: Column<Loom>[] = [
    { key: 'id', header: 'Loom No.', cell: (l) => <span className="font-semibold text-slate-900">{l.id}</span>, sort: (l) => l.id },
    { key: 'type', header: 'Type', cell: (l) => l.type, sort: (l) => l.type },
    { key: 'make', header: 'Manufacturer', cell: (l) => l.manufacturer, sort: (l) => l.manufacturer },
    { key: 'model', header: 'Model', cell: (l) => l.model, hideBelow: 'md' },
    { key: 'width', header: 'Width', align: 'right', cell: (l) => `${l.widthInches}"`, sort: (l) => l.widthInches },
    { key: 'rpm', header: 'RPM', align: 'right', cell: (l) => l.rpm, sort: (l) => l.rpm },
    { key: 'hall', header: 'Hall', cell: (l) => l.hall, sort: (l) => l.hall, hideBelow: 'lg' },
    { key: 'fabric', header: 'Current Fabric', cell: (l) => fabricByCode(l.fabricCode)?.construction, hideBelow: 'lg' },
    { key: 'installed', header: 'Installed', cell: (l) => date(l.installed), sort: (l) => l.installed, hideBelow: 'xl' },
    { key: 'status', header: 'Status', cell: (l) => <StatusBadge status={l.status} />, sort: (l) => l.status },
  ]

  return (
    <div>
      <PageHeader
        title="Looms"
        description="Master register of all looms with machine specifications."
        breadcrumbs={[{ label: 'Looms', to: '/looms' }, { label: 'Looms' }]}
        actions={
          <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>
            Add Loom
          </Button>
        }
      />
      <DataTable
        data={looms}
        columns={columns}
        rowKey={(l) => l.id}
        onRowClick={(l) => navigate(`/looms/${l.id}`)}
        searchText={(l) => `${l.id} ${l.manufacturer} ${l.model} ${l.type}`}
        searchPlaceholder="Search loom no., make, model…"
        filters={[
          { label: 'Hall', options: ['Hall A', 'Hall B', 'Hall C'], value: (l) => l.hall },
          { label: 'Type', options: ['Air Jet', 'Rapier'], value: (l) => l.type },
          { label: 'Status', options: ['Running', 'Stopped', 'Maintenance'], value: (l) => l.status },
        ]}
        actions={<TableActions importable />}
        pageSize={15}
      />
      <QuickFormModal
        open={adding}
        onClose={() => setAdding(false)}
        icon={<Factory />}
        title="Add Loom"
        description="Register a new loom in the factory."
        submitLabel="Save Loom"
        successMessage="Loom added successfully."
        fields={[
          { name: 'id', label: 'Loom number', required: true, placeholder: 'L-81' },
          { name: 'type', label: 'Loom type', type: 'select', options: ['Air Jet', 'Rapier', 'Water Jet', 'Projectile'], required: true },
          { name: 'make', label: 'Manufacturer', type: 'select', options: ['Toyota', 'Picanol', 'Tsudakoma', 'Itema', 'Dornier', 'Other'], required: true },
          { name: 'model', label: 'Model', placeholder: 'JAT810', required: true },
          { name: 'width', label: 'Reed width', type: 'number', suffix: 'inch', required: true },
          { name: 'rpm', label: 'Speed', type: 'number', suffix: 'RPM', required: true },
          { name: 'hall', label: 'Hall', type: 'select', options: ['Hall A', 'Hall B', 'Hall C'], required: true },
          { name: 'installed', label: 'Installation date', type: 'date' },
        ]}
      />
    </div>
  )
}
