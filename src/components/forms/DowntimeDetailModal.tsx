import { useNavigate } from 'react-router-dom'
import { Wrench } from 'lucide-react'
import type { DowntimeRecord } from '@/types'
import { Badge, Button, DetailItem, Modal, useToast } from '@/components/ui'
import { DOWNTIME_COLORS } from '@/components/charts/Charts'
import { loomById } from '@/data/production'
import { fabricByCode } from '@/data/inventory'
import { date, duration, num } from '@/utils/format'

/** "View Breakdown" — full context for a single stoppage. */
export function DowntimeDetailModal({ record, onClose }: { record: DowntimeRecord | null; onClose: () => void }) {
  const toast = useToast()
  const navigate = useNavigate()
  if (!record) return null
  const loom = loomById(record.loomId)
  const ongoing = !record.end
  const metersLost = loom ? Math.round((loom.target / 1440) * record.minutes) : 0
  const fabric = loom ? fabricByCode(loom.fabricCode) : undefined

  const timeline = [
    { time: record.start, title: 'Loom stopped', body: `${record.reason} — detected by ${record.category === 'Operator' ? 'supervisor' : 'loom sensor / operator'}` },
    { time: addMin(record.start, Math.min(6, record.minutes)), title: `${record.department} notified`, body: 'Alert sent to shift technician and supervisor' },
    { time: addMin(record.start, Math.min(14, Math.round(record.minutes / 3))), title: 'Technician on loom', body: record.category === 'Material Shortage' ? 'Store asked to issue material' : 'Fault diagnosed, repair started' },
    ...(ongoing ? [] : [{ time: record.end, title: 'Loom restarted', body: record.remarks }]),
  ]

  return (
    <Modal
      open
      onClose={onClose}
      icon={<Wrench />}
      title={`Breakdown ${record.id}`}
      description={`${record.loomId} · ${date(record.date)} · ${record.shift} shift`}
      size="lg"
      footer={
        <>
          <Button onClick={() => toast.demo('Sharing a breakdown report on WhatsApp is available in the production version.')}>Share on WhatsApp</Button>
          <Button
            variant="primary"
            onClick={() => {
              onClose()
              navigate(`/looms/${record.loomId}`)
            }}
          >
            Open Loom {record.loomId}
          </Button>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={ongoing ? 'red' : 'green'} dot>
          {ongoing ? 'Ongoing' : 'Resolved'}
        </Badge>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
          <span className="size-2 rounded-full" style={{ background: DOWNTIME_COLORS[record.category] }} />
          {record.category}
        </span>
      </div>
      <h3 className="mt-3 text-lg font-semibold text-slate-900">{record.reason}</h3>

      <dl className="mt-4 grid grid-cols-2 gap-4 rounded-xl border border-line p-4 sm:grid-cols-4">
        <DetailItem label="Duration" value={duration(record.minutes)} />
        <DetailItem label="Start" value={record.start} />
        <DetailItem label="End" value={record.end || 'Still stopped'} />
        <DetailItem label="Est. meters lost" value={`${num(metersLost)} m`} />
        <DetailItem label="Responsible" value={record.department} />
        <DetailItem label="Loom" value={loom ? `${loom.manufacturer} ${loom.model}` : record.loomId} />
        <DetailItem label="Fabric" value={fabric ? `${fabric.construction} ${fabric.name}` : '—'} />
        <DetailItem label="Hall" value={loom?.hall ?? '—'} />
      </dl>

      <p className="mt-6 mb-3 text-[13px] font-semibold text-slate-900">Timeline</p>
      <ol className="relative space-y-4 border-l border-line pl-5">
        {timeline.map((t, i) => (
          <li key={i} className="relative">
            <span className={`absolute top-1 -left-[25px] size-2.5 rounded-full ring-4 ring-white ${i === timeline.length - 1 && !ongoing ? 'bg-emerald-500' : i === 0 ? 'bg-rose-500' : 'bg-slate-300'}`} />
            <p className="text-[13px] font-semibold text-slate-900">
              <span className="mr-2 font-mono text-xs font-medium text-slate-500">{t.time}</span>
              {t.title}
            </p>
            <p className="text-[13px] text-slate-500">{t.body}</p>
          </li>
        ))}
        {ongoing && (
          <li className="relative">
            <span className="absolute top-1 -left-[25px] size-2.5 animate-pulse rounded-full bg-rose-500 ring-4 ring-white" />
            <p className="text-[13px] font-semibold text-rose-700">Waiting for restart…</p>
          </li>
        )}
      </ol>
    </Modal>
  )
}

function addMin(t: string, m: number) {
  const total = (Number(t.slice(0, 2)) * 60 + Number(t.slice(3)) + m) % 1440
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}
