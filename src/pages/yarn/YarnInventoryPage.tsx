import { useState } from 'react'
import { ArrowDownToLine, ArrowUpFromLine, Boxes, PackageCheck, Plus, Spool, TriangleAlert, Wallet } from 'lucide-react'
import type { YarnItem } from '@/types'
import { Button, DataTable, DetailItem, KpiCard, Modal, PageHeader, ProgressBar, StatusBadge, useToast, type Column } from '@/components/ui'
import { QuickFormModal } from '@/components/forms/QuickFormModal'
import { TableActions } from '@/components/common/TableActions'
import { SUPPLIERS, YARN_ISSUES, YARN_PURCHASES, YARNS, yarnStatus } from '@/data/inventory'
import { useQueryParam } from '@/hooks/useQueryParam'
import { date, kg, num, pkr, pkrCompact, sum } from '@/utils/format'

export default function YarnInventoryPage() {
  const q = useQueryParam('q')
  const toast = useToast()
  const [adding, setAdding] = useState(false)
  const [selected, setSelected] = useState<YarnItem | null>(null)

  const totalKg = sum(YARNS, (y) => y.stockKg)
  const value = sum(YARNS, (y) => y.stockKg * y.costPerKg)
  const low = YARNS.filter((y) => yarnStatus(y) !== 'In Stock')
  const incoming = sum(YARNS, (y) => y.incomingKg)
  const issued = sum(YARNS, (y) => y.issuedKgMonth)

  const columns: Column<YarnItem>[] = [
    { key: 'code', header: 'Yarn Code', cell: (y) => <span className="font-semibold text-slate-900">{y.code}</span>, sort: (y) => y.code },
    { key: 'name', header: 'Yarn Name', cell: (y) => y.name, sort: (y) => y.name },
    { key: 'count', header: 'Count', cell: (y) => <span className="font-medium text-slate-900">{y.count}</span>, sort: (y) => parseFloat(y.count) || 0 },
    { key: 'type', header: 'Type', cell: (y) => y.type, hideBelow: 'md' },
    { key: 'supplier', header: 'Supplier', cell: (y) => y.supplier, sort: (y) => y.supplier, hideBelow: 'lg' },
    {
      key: 'stock',
      header: 'Current Stock',
      align: 'right',
      sort: (y) => y.stockKg,
      cell: (y) => (
        <div className="ml-auto w-32">
          <span className="font-semibold text-slate-900">{num(y.stockKg)}</span>
          <ProgressBar value={y.stockKg} max={Math.max(y.minStockKg * 3, y.stockKg)} tone={yarnStatus(y) === 'In Stock' ? 'green' : yarnStatus(y) === 'Low Stock' ? 'amber' : 'red'} className="mt-1" height="h-1" />
        </div>
      ),
    },
    { key: 'unit', header: 'Unit', cell: () => 'KG', hideBelow: 'xl' },
    { key: 'cost', header: 'Cost/kg', align: 'right', cell: (y) => pkr(y.costPerKg), sort: (y) => y.costPerKg },
    { key: 'value', header: 'Value', align: 'right', cell: (y) => pkrCompact(y.stockKg * y.costPerKg), sort: (y) => y.stockKg * y.costPerKg, hideBelow: 'xl' },
    { key: 'status', header: 'Status', cell: (y) => <StatusBadge status={yarnStatus(y)} />, sort: (y) => yarnStatus(y) },
  ]

  const purchases = selected ? YARN_PURCHASES.filter((p) => p.yarnCode === selected.code).slice(0, 4) : []
  const issues = selected ? YARN_ISSUES.filter((p) => p.yarnCode === selected.code).slice(0, 4) : []

  return (
    <div>
      <PageHeader
        title="Yarn Inventory"
        description="Stock by count, lot and supplier across both yarn stores."
        breadcrumbs={[{ label: 'Yarn' }, { label: 'Yarn Inventory' }]}
        actions={
          <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>
            Add Yarn
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Total Yarn Stock" value={num(totalKg)} unit="kg" icon={<Boxes />} sub={<span>{YARNS.length} yarn items</span>} />
        <KpiCard label="Stock Value" value={pkrCompact(value)} icon={<Wallet />} accent="violet" sub={<span>At weighted average cost</span>} />
        <KpiCard label="Low Stock Items" value={low.length} icon={<TriangleAlert />} accent="amber" sub={<span>{low.map((y) => y.code).join(', ')}</span>} />
        <KpiCard label="Incoming" value={num(incoming)} unit="kg" icon={<ArrowDownToLine />} accent="teal" sub={<span>{YARN_PURCHASES.filter((p) => p.status !== 'Received').length} open purchases</span>} />
        <KpiCard label="Issued (Sep)" value={num(issued)} unit="kg" icon={<ArrowUpFromLine />} accent="slate" sub={<span>To sizing & looms</span>} />
      </div>

      <div className="mt-4">
        <DataTable
          data={YARNS}
          columns={columns}
          rowKey={(y) => y.code}
          initialQuery={q}
          searchText={(y) => `${y.code} ${y.name} ${y.count} ${y.type} ${y.supplier} ${y.lot}`}
          searchPlaceholder="Search code, count, supplier…"
          filters={[
            { label: 'Material', options: [...new Set(YARNS.map((y) => y.material))].sort(), value: (y) => y.material },
            { label: 'Status', options: ['In Stock', 'Low Stock', 'Out of Stock'], value: (y) => yarnStatus(y) },
            { label: 'Store', options: ['Yarn Store 1', 'Yarn Store 2'], value: (y) => y.warehouse },
          ]}
          actions={<TableActions importable />}
          onRowClick={setSelected}
          rowClassName={(y) => (yarnStatus(y) !== 'In Stock' ? 'bg-amber-50/30' : undefined)}
          pageSize={12}
        />
      </div>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        icon={<Spool />}
        title={selected ? `${selected.code} · ${selected.name} ${selected.count}` : ''}
        description={selected ? `${selected.type} · ${selected.material} · Lot ${selected.lot}` : ''}
        size="lg"
        footer={
          <>
            <Button onClick={() => toast.demo('Stock adjustments with approval are available in the production version.')}>Adjust stock</Button>
            <Button variant="primary" icon={<PackageCheck className="size-4" />} onClick={() => toast.demo('Raising a purchase order from low stock is available in the production version.')}>
              Reorder
            </Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-5">
            <dl className="grid grid-cols-2 gap-4 rounded-xl border border-line p-4 sm:grid-cols-4">
              <DetailItem label="In stock" value={kg(selected.stockKg)} />
              <DetailItem label="Minimum" value={kg(selected.minStockKg)} />
              <DetailItem label="Cost / kg" value={pkr(selected.costPerKg)} />
              <DetailItem label="Value" value={pkrCompact(selected.stockKg * selected.costPerKg)} />
              <DetailItem label="Supplier" value={selected.supplier} />
              <DetailItem label="Store" value={selected.warehouse} />
              <DetailItem label="Incoming" value={kg(selected.incomingKg)} />
              <DetailItem label="Status" value={<StatusBadge status={yarnStatus(selected)} />} />
            </dl>
            <div className="grid gap-4 sm:grid-cols-2">
              <Movement title="Recent receipts" empty="No receipts this month" rows={purchases.map((p) => [date(p.date), p.supplier, `+${num(p.quantityKg)} kg`])} positive />
              <Movement title="Recent issues" empty="No issues this month" rows={issues.map((p) => [date(p.date), p.issuedTo, `−${num(p.quantityKg)} kg`])} />
            </div>
          </div>
        )}
      </Modal>

      <QuickFormModal
        open={adding}
        onClose={() => setAdding(false)}
        icon={<Spool />}
        title="Add Yarn"
        description="Create a new yarn item in the master list."
        submitLabel="Save Yarn"
        successMessage="Yarn item added successfully."
        fields={[
          { name: 'name', label: 'Yarn name', placeholder: 'Cotton Yarn', required: true },
          { name: 'count', label: 'Count', placeholder: '40s', required: true },
          { name: 'type', label: 'Type', type: 'select', options: ['Combed', 'Carded', 'Compact Combed', 'Open End', 'Ring Spun', 'Textured'], required: true },
          { name: 'material', label: 'Material', type: 'select', options: ['Cotton', 'Poly/Cotton', 'Polyester', 'Viscose', 'Poly/Viscose', 'Linen/Cotton'], required: true },
          { name: 'supplier', label: 'Supplier', type: 'select', options: SUPPLIERS.filter((s) => s.category === 'Yarn').map((s) => s.name), required: true },
          { name: 'lot', label: 'Lot number', placeholder: 'LT-26xxx' },
          { name: 'qty', label: 'Opening stock', type: 'number', suffix: 'kg', required: true },
          { name: 'cost', label: 'Cost per kg', type: 'number', suffix: 'PKR', required: true },
          { name: 'min', label: 'Minimum stock', type: 'number', suffix: 'kg' },
          { name: 'store', label: 'Store', type: 'select', options: ['Yarn Store 1', 'Yarn Store 2'] },
        ]}
      />
    </div>
  )
}

function Movement({ title, rows, empty, positive }: { title: string; rows: string[][]; empty: string; positive?: boolean }) {
  return (
    <div>
      <p className="mb-2 text-[13px] font-semibold text-slate-900">{title}</p>
      {rows.length === 0 ? (
        <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-[13px] text-slate-500">{empty}</p>
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {rows.map((r, i) => (
            <li key={i} className="flex items-center justify-between gap-3 px-3 py-2 text-[13px]">
              <span className="min-w-0">
                <span className="block truncate text-slate-800">{r[1]}</span>
                <span className="text-xs text-slate-500">{r[0]}</span>
              </span>
              <span className={`font-semibold num ${positive ? 'text-emerald-600' : 'text-slate-700'}`}>{r[2]}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
