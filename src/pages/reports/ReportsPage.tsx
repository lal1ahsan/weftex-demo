import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, CalendarClock, Search } from 'lucide-react'
import { Button, PageHeader, useToast } from '@/components/ui'
import { REPORTS } from './reportList'

const GROUPS = ['Production', 'Inventory', 'Commercial', 'Finance'] as const

export default function ReportsPage() {
  const toast = useToast()
  const [q, setQ] = useState('')
  const list = REPORTS.filter((r) => `${r.title} ${r.question}`.toLowerCase().includes(q.toLowerCase()))

  return (
    <div>
      <PageHeader
        title="Reports Center"
        description="Every report answers one question an owner asks every day."
        breadcrumbs={[{ label: 'Reports' }]}
        actions={
          <>
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reports…" className="h-9 w-full rounded-lg border border-line-strong bg-white pr-3 pl-9 text-[13px] focus:border-brand-400 focus:ring-4 focus:ring-brand-100 focus:outline-none" />
            </div>
            <Button icon={<CalendarClock className="size-4" />} onClick={() => toast.demo('Scheduled reports by email / WhatsApp are available in the production version.')}>
              Schedule
            </Button>
          </>
        }
      />
      {list.length === 0 && <p className="rounded-2xl border border-line bg-white px-6 py-12 text-center text-sm text-slate-500">No reports match “{q}”.</p>}
      <div className="space-y-8">
        {GROUPS.map((g) => {
          const items = list.filter((r) => r.group === g)
          if (!items.length) return null
          return (
            <section key={g}>
              <h2 className="mb-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">{g}</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {items.map((r) => (
                  <Link key={r.slug} to={`/reports/${r.slug}`} className="group relative rounded-2xl border border-line bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-pop">
                    <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                      <r.icon className="size-5" />
                    </span>
                    <ArrowUpRight className="absolute top-5 right-5 size-4 text-slate-300 transition-colors group-hover:text-brand-500" />
                    <p className="mt-4 text-[15px] font-semibold text-slate-900">{r.title} Report</p>
                    <p className="mt-1 text-[13px] leading-5 text-slate-500">{r.question}</p>
                  </Link>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
