import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CalendarDays, FileSpreadsheet, FileText, Printer } from 'lucide-react'
import { Button, Card, EmptyState, PageHeader, Select, useToast } from '@/components/ui'
import { LogoMark } from '@/components/brand/Logo'
import { FACTORY } from '@/data/factory'
import { DEMO_TODAY } from '@/data/seed'
import { dateLong } from '@/utils/format'
import { REPORTS } from './reportList'
import { ReportBody, rangeDates, type Range } from './ReportBodies'
import { date } from '@/utils/format'

const RANGE_LABEL: Record<Range, string> = { today: 'Today', yesterday: 'Yesterday', '7d': 'Last 7 days' }

export default function ReportDetailPage() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [range, setRange] = useState<Range>('today')
  const meta = REPORTS.find((r) => r.slug === slug)

  if (!meta) {
    return (
      <Card>
        <EmptyState icon={<FileText />} title="Report not found" action={<Button onClick={() => navigate('/reports')}>Back to Reports</Button>} />
      </Card>
    )
  }

  const days = rangeDates(range)
  const period = meta.dated ? (days.length === 1 ? date(days[0]) : `${date(days[days.length - 1])} – ${date(days[0])}`) : `As of ${dateLong(DEMO_TODAY)}`
  const exportMsg = 'Demo: Report export will be available in the production version.'

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Reports', to: '/reports' }, { label: meta.title }]}
        title={`${meta.title} Report`}
        description={meta.question}
        actions={
          <>
            {meta.dated ? (
              <div className="w-44">
                <Select value={range} onChange={(e) => setRange(e.target.value as Range)} options={(Object.keys(RANGE_LABEL) as Range[]).map((r) => ({ value: r, label: RANGE_LABEL[r] }))} aria-label="Date range" />
              </div>
            ) : (
              <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-white px-3 text-[13px] text-slate-600">
                <CalendarDays className="size-4 text-slate-400" /> {dateLong(DEMO_TODAY)}
              </span>
            )}
            <Button icon={<FileSpreadsheet className="size-4" />} onClick={() => toast.demo(exportMsg)}>
              Export Excel
            </Button>
            <Button icon={<Printer className="size-4" />} onClick={() => toast.demo(exportMsg)}>
              Print
            </Button>
          </>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line bg-slate-50/60 px-6 py-5">
          <div className="flex items-center gap-3">
            <LogoMark className="size-10" />
            <div>
              <p className="text-sm font-semibold text-slate-900">{FACTORY.name}</p>
              <p className="text-xs text-slate-500">{FACTORY.address}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900">{meta.title} Report</p>
            <p className="text-xs text-slate-500">{period}</p>
            <p className="text-xs text-slate-400">Generated {dateLong(DEMO_TODAY)}, 09:40</p>
          </div>
        </div>
        <div key={`${slug}-${range}`} className="space-y-4 p-4 sm:p-6 [&_.shadow-card]:shadow-none">
          <ReportBody slug={slug} range={range} />
        </div>
      </Card>
    </div>
  )
}
