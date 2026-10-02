import { useMemo, useState } from 'react'
import { Plus, Receipt } from 'lucide-react'
import type { Expense, ExpenseCategory } from '@/types'
import { Badge, Button, Card, CardBody, CardHeader, DataTable, KpiCard, PageHeader, type Column } from '@/components/ui'
import { BreakdownList, SERIES } from '@/components/charts/ChartKit'
import { DonutChart } from '@/components/charts/Charts'
import { QuickFormModal } from '@/components/forms/QuickFormModal'
import { TableActions } from '@/components/common/TableActions'
import { EXPENSES } from '@/data/commercial'
import { date, pkr, pkrCompact, sum } from '@/utils/format'

const CATEGORIES: ExpenseCategory[] = ['Electricity', 'Labour', 'Repair', 'Transport', 'Rent', 'Miscellaneous']
const COLORS: Record<ExpenseCategory, string> = { Electricity: SERIES[2], Labour: SERIES[1], Repair: SERIES[3], Transport: SERIES[4], Rent: SERIES[0], Miscellaneous: SERIES[5] }

export default function ExpensesPage() {
  const [items, setItems] = useState<Expense[]>(EXPENSES)
  const [adding, setAdding] = useState(false)
  const total = sum(items, (e) => e.amount)
  const byCat = useMemo(() => CATEGORIES.map((c) => ({ label: c, value: sum(items.filter((e) => e.category === c), (e) => e.amount), color: COLORS[c] })).sort((a, b) => b.value - a.value), [items])

  const columns: Column<Expense>[] = [
    { key: 'date', header: 'Date', cell: (e) => date(e.date), sort: (e) => e.date },
    {
      key: 'cat',
      header: 'Category',
      cell: (e) => (
        <span className="inline-flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: COLORS[e.category] }} />
          {e.category}
        </span>
      ),
      sort: (e) => e.category,
    },
    { key: 'desc', header: 'Description', cell: (e) => <span className="font-medium text-slate-900">{e.description}</span> },
    { key: 'paid', header: 'Paid To', cell: (e) => e.paidTo, hideBelow: 'lg' },
    { key: 'method', header: 'Method', cell: (e) => <Badge tone="slate">{e.method}</Badge>, hideBelow: 'md' },
    { key: 'amount', header: 'Amount', align: 'right', cell: (e) => <b className="font-semibold text-slate-900">{pkr(e.amount)}</b>, sort: (e) => e.amount },
  ]

  return (
    <div>
      <PageHeader
        title="Expenses"
        description="Factory running costs for September 2026."
        breadcrumbs={[{ label: 'Expenses' }]}
        actions={
          <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>
            Add Expense
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Expenses (Sep)" value={pkrCompact(total)} icon={<Receipt />} sub={<span>{items.length} entries</span>} />
        {byCat.slice(0, 3).map((c) => (
          <KpiCard key={c.label} label={c.label} value={pkrCompact(c.value)} accent={c.label === 'Electricity' ? 'amber' : c.label === 'Labour' ? 'teal' : 'red'} sub={<span>{((c.value / total) * 100).toFixed(0)}% of total</span>} />
        ))}
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title="Expense Breakdown" subtitle="By category" />
          <CardBody>
            <DonutChart data={byCat.map((c) => ({ name: c.label, value: c.value, color: c.color }))} format={pkr} centerValue={pkrCompact(total)} centerLabel="this month" height={200} />
            <div className="mt-5">
              <BreakdownList items={byCat} format={(v) => pkrCompact(v)} />
            </div>
          </CardBody>
        </Card>
        <div className="xl:col-span-2">
          <DataTable
            data={items}
            columns={columns}
            rowKey={(e) => e.id}
            searchText={(e) => `${e.description} ${e.paidTo} ${e.category}`}
            searchPlaceholder="Search expenses…"
            filters={[
              { label: 'Category', options: CATEGORIES, value: (e) => e.category },
              { label: 'Method', options: ['Bank', 'Cash', 'Cheque'], value: (e) => e.method },
            ]}
            actions={<TableActions />}
            pageSize={12}
          />
        </div>
      </div>
      <QuickFormModal
        open={adding}
        onClose={() => setAdding(false)}
        icon={<Receipt />}
        title="Add Expense"
        submitLabel="Save Expense"
        successMessage="Expense added successfully."
        onSubmit={(v) =>
          setItems((xs) => [
            { id: `EX-${9200 + xs.length}`, date: v.date || '2026-09-29', category: v.category as ExpenseCategory, description: v.description, amount: Number(v.amount), paidTo: v.paidTo || '—', method: (v.method || 'Cash') as Expense['method'] },
            ...xs,
          ])
        }
        fields={[
          { name: 'date', label: 'Date', type: 'date', defaultValue: '2026-09-29', required: true },
          { name: 'category', label: 'Category', type: 'select', options: CATEGORIES, required: true },
          { name: 'description', label: 'Description', required: true, full: true },
          { name: 'amount', label: 'Amount', type: 'number', suffix: 'PKR', required: true },
          { name: 'method', label: 'Payment method', type: 'select', options: ['Bank', 'Cash', 'Cheque'] },
          { name: 'paidTo', label: 'Paid to', full: true },
        ]}
      />
    </div>
  )
}
