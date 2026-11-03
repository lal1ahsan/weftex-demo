import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardPlus, LayoutGrid, List, Search, TimerOff, User } from 'lucide-react'
import type { Loom, LoomStatus } from '@/types'
import { Button, DataTable, EfficiencyValue, EmptyState, LOOM_STATUS_COLOR, PageHeader, ProgressBar, StatusBadge, Tabs, type Column } from '@/components/ui'
import { ProductionFormModal } from '@/components/forms/ProductionFormModal'
import { DowntimeFormModal } from '@/components/forms/DowntimeFormModal'
import { useApp } from '@/context/AppState'
import { fabricByCode } from '@/data/inventory'
import { loomStatusCounts } from '@/data/metrics'
import { cn, duration, num, pct, sum } from '@/utils/format'
import { TERMS } from '@/data/dataset'

const STATUSES: LoomStatus[] = ['Running', 'Idle', 'Stopped', 'Maintenance']

export default function LoomDashboardPage() {
  const navigate = useNavigate()
  const { looms } = useApp()
  const [hall, setHall] = useState<string>('all')
  const [status, setStatus] = useState<LoomStatus | null>(null)
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [sortBy, setSortBy] = useState<'id' | 'eff'>('id')
  const [q, setQ] = useState('')
  const [modal, setModal] = useState<'production' | 'downtime' | null>(null)

  const counts = loomStatusCounts(looms)
  const avgEff = (sum(looms, (l) => l.todayProduction) / sum(looms, (l) => l.target)) * 100

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    let ls = looms.filter((l) => (hall === 'all' || l.hall === hall) && (!status || l.status === status))
    if (query) ls = ls.filter((l) => `${l.id} ${l.operator} ${l.fabricCode} ${fabricByCode(l.fabricCode)?.construction}`.toLowerCase().includes(query))
    return sortBy === 'eff' ? [...ls].sort((a, b) => a.efficiency - b.efficiency) : ls
  }, [looms, hall, status, sortBy, q])

  const columns: Column<Loom>[] = [
    { key: 'id', header: TERMS.machine, cell: (l) => <span className="font-semibold text-slate-900">{l.id}</span>, sort: (l) => l.id },
    { key: 'status', header: 'Status', cell: (l) => <StatusBadge status={l.status} />, sort: (l) => l.status },
    { key: 'fabric', header: TERMS.productOne, cell: (l) => <span>{fabricByCode(l.fabricCode)?.construction} <span className="text-slate-400">· {fabricByCode(l.fabricCode)?.name}</span></span> },
    { key: 'hall', header: TERMS.area, cell: (l) => l.hall, hideBelow: 'lg' },
    { key: 'operator', header: 'Operator', cell: (l) => l.operator, hideBelow: 'xl' },
    { key: 'prod', header: 'Production', align: 'right', cell: (l) => `${num(l.todayProduction)} ${TERMS.out}`, sort: (l) => l.todayProduction },
    { key: 'target', header: 'Target', align: 'right', cell: (l) => `${num(l.target)} ${TERMS.out}`, sort: (l) => l.target, hideBelow: 'md' },
    { key: 'eff', header: 'Efficiency', align: 'right', cell: (l) => <EfficiencyValue value={l.efficiency} />, sort: (l) => l.efficiency },
    { key: 'dt', header: 'Downtime', align: 'right', cell: (l) => (l.downtimeMinutes ? duration(l.downtimeMinutes) : <span className="text-slate-300">—</span>), sort: (l) => l.downtimeMinutes, hideBelow: 'md' },
  ]

  return (
    <div>
      <PageHeader
        title={`${TERMS.machine} Dashboard`}
        description={`Live status and today's output for every ${TERMS.machine.toLowerCase()} on the floor.`}
        breadcrumbs={[{ label: TERMS.machines }, { label: `${TERMS.machine} Dashboard` }]}
        actions={
          <>
            <Button icon={<TimerOff className="size-4" />} onClick={() => setModal('downtime')}>
              Record Downtime
            </Button>
            <Button variant="primary" icon={<ClipboardPlus className="size-4" />} onClick={() => setModal('production')}>
              Add Production
            </Button>
          </>
        }
      />

      {/* Status filter tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus((cur) => (cur === s ? null : s))}
            className={cn(
              'rounded-2xl border bg-white p-4 text-left shadow-card transition-all hover:shadow-pop',
              status === s ? 'border-brand-400 ring-4 ring-brand-100' : 'border-line',
            )}
          >
            <span className="flex items-center gap-2 text-[13px] font-medium text-slate-500">
              <span className="size-2.5 rounded-full" style={{ background: LOOM_STATUS_COLOR[s] }} />
              {s}
            </span>
            <span className="mt-1 block font-display text-[26px] font-semibold text-slate-900 num">{counts[s]}</span>
          </button>
        ))}
        <div className="col-span-2 rounded-2xl border border-line bg-white p-4 shadow-card md:col-span-1">
          <span className="text-[13px] font-medium text-slate-500">Average efficiency</span>
          <span className="mt-1 block font-display text-[26px] font-semibold text-slate-900 num">{pct(avgEff)}</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Tabs
          value={hall}
          onChange={setHall}
          tabs={[
            { value: 'all', label: `All ${TERMS.area.toLowerCase()}s`, count: looms.length },
            ...TERMS.areas.map((a) => ({ value: a, label: a, count: looms.filter((l) => l.hall === a).length })),
          ]}
        />
        <div className="relative w-full sm:w-60">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`${TERMS.machine}, operator, ${TERMS.productOne.toLowerCase()}…`}
            className="h-9 w-full rounded-lg border border-line-strong bg-white pr-3 pl-9 text-[13px] focus:border-brand-400 focus:ring-4 focus:ring-brand-100 focus:outline-none"
          />
        </div>
        {status && (
          <button onClick={() => setStatus(null)} className="text-[13px] font-medium text-brand-600 hover:text-brand-700">
            Clear “{status}” filter
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          {view === 'grid' && (
            <Tabs
              value={sortBy}
              onChange={setSortBy}
              tabs={[
                { value: 'id', label: `${TERMS.machine} no.` },
                { value: 'eff', label: 'Lowest efficiency' },
              ]}
            />
          )}
          <div className="inline-flex rounded-lg border border-line-strong bg-white p-0.5">
            {(['grid', 'table'] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className={cn('rounded-md p-1.5', view === v ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-700')} aria-label={`${v} view`}>
                {v === 'grid' ? <LayoutGrid className="size-4" /> : <List className="size-4" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4">
        {view === 'table' ? (
          <DataTable data={filtered} columns={columns} rowKey={(l) => l.id} onRowClick={(l) => navigate(`/looms/${l.id}`)} pageSize={20} />
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white">
            <EmptyState icon={<Search />} title={`No ${TERMS.machines.toLowerCase()} match`} body={`Try another ${TERMS.area.toLowerCase()}, status or search term.`} action={<Button size="sm" onClick={() => { setQ(''); setStatus(null); setHall('all') }}>Reset filters</Button>} />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filtered.map((l) => (
              <LoomCard key={l.id} loom={l} onClick={() => navigate(`/looms/${l.id}`)} />
            ))}
          </div>
        )}
      </div>

      <ProductionFormModal open={modal === 'production'} onClose={() => setModal(null)} />
      <DowntimeFormModal open={modal === 'downtime'} onClose={() => setModal(null)} />
    </div>
  )
}

function LoomCard({ loom: l, onClick }: { loom: Loom; onClick: () => void }) {
  const fabric = fabricByCode(l.fabricCode)
  const down = l.status === 'Stopped' || l.status === 'Maintenance'
  return (
    <button onClick={onClick} className="group relative overflow-hidden rounded-2xl border border-line bg-white p-4 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-pop">
      <span className="absolute inset-y-0 left-0 w-1" style={{ background: LOOM_STATUS_COLOR[l.status] }} />
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-lg font-semibold text-slate-900">{l.id}</p>
          <p className="text-xs text-slate-500">
            {l.hall} · {l.manufacturer} {l.type}
          </p>
        </div>
        <StatusBadge status={l.status} />
      </div>
      <div className="mt-3 flex items-center justify-between text-[13px]">
        <span className="font-medium text-slate-700">{fabric?.construction}</span>
        <span className="truncate pl-2 text-slate-500">{fabric?.name}</span>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div className="text-[13px] text-slate-500 num">
          <b className="font-display text-base font-semibold text-slate-900">{num(l.todayProduction)}</b> / {num(l.target)} {TERMS.out}
        </div>
        <EfficiencyValue value={l.efficiency} className="text-[15px]" />
      </div>
      <ProgressBar value={l.efficiency} tone="auto" className="mt-2" />
      {down ? (
        <p className={cn('mt-3 truncate rounded-lg px-2.5 py-1.5 text-xs font-medium', l.status === 'Stopped' ? 'bg-rose-50 text-rose-700' : 'bg-sky-50 text-sky-700')}>
          {l.status === 'Stopped' ? `Since ${l.stoppedSince} · ` : ''}
          {l.stopReason}
        </p>
      ) : (
        <p className="mt-3 flex items-center gap-1.5 truncate text-xs text-slate-500">
          <User className="size-3.5" /> {l.operator} · {l.rpm} RPM
        </p>
      )}
    </button>
  )
}
