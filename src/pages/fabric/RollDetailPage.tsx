import { Link, useNavigate, useParams } from 'react-router-dom'
import { Factory, Package, Printer, Spool, ClipboardCheck, Warehouse, Truck } from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader, DetailItem, EmptyState, PageHeader, StatusBadge, useToast } from '@/components/ui'
import { ROLLS, SALES_ORDERS } from '@/data/commercial'
import { fabricByCode, YARNS } from '@/data/inventory'
import { loomById } from '@/data/production'
import { cn, date } from '@/utils/format'

export default function RollDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const roll = ROLLS.find((r) => r.id === id)

  if (!roll) {
    return (
      <Card>
        <EmptyState icon={<Package />} title={`Roll “${id}” not found`} action={<Button onClick={() => navigate('/fabric/rolls')}>Back to Rolls</Button>} />
      </Card>
    )
  }

  const fabric = fabricByCode(roll.fabricCode)!
  const loom = loomById(roll.loomId)
  const yarn = YARNS.find((y) => y.count === fabric.construction.split('×')[0] + 's') ?? YARNS[0]
  const order = roll.status !== 'In Stock' ? SALES_ORDERS.find((o) => o.fabricCode === roll.fabricCode && o.status !== 'Cancelled') : undefined

  const trace = [
    { icon: Spool, title: 'Yarn issued', body: `${yarn.code} · ${yarn.name} ${yarn.count} · Lot ${yarn.lot}`, to: `/yarn?q=${yarn.code}`, done: true },
    { icon: Factory, title: `Woven on ${roll.loomId}`, body: loom ? `${loom.manufacturer} ${loom.model} · ${loom.hall} · Beam B-247` : roll.loomId, to: `/looms/${roll.loomId}`, done: true },
    { icon: ClipboardCheck, title: `Inspected — ${roll.quality}`, body: `By ${roll.inspector} · ${roll.defects} defect${roll.defects === 1 ? '' : 's'}${roll.defectTypes.length ? ` (${roll.defectTypes.join(', ')})` : ''}`, to: '/quality', done: true },
    { icon: Warehouse, title: `Stored in ${roll.location}`, body: `Rack ${roll.location === 'Warehouse A' ? 'A-' : 'B-'}${(Number(roll.id.slice(2)) % 24) + 1}`, done: true },
    { icon: Truck, title: order ? `${roll.status === 'Dispatched' ? 'Dispatched' : 'Reserved'} for ${order.id}` : 'Available for sale', body: order ? 'Customer order allocation' : 'Not yet allocated', to: order ? `/sales/orders/${order.id}` : undefined, done: !!order },
  ]

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Fabric', to: '/fabric' }, { label: 'Rolls', to: '/fabric/rolls' }, { label: roll.id }]}
        title={`Roll #${roll.id}`}
        meta={<StatusBadge status={roll.quality} />}
        description={`${fabric.construction} ${fabric.name} · produced ${date(roll.date)}`}
        actions={
          <Button icon={<Printer className="size-4" />} onClick={() => toast.demo('Printing roll labels is available in the production version.')}>
            Print Label
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        {/* Roll ticket */}
        <Card className="overflow-hidden">
          <div className="bg-ink-900 px-6 py-5 text-white">
            <p className="text-xs tracking-widest text-slate-400 uppercase">GH Weaving · Roll Ticket</p>
            <p className="mt-1 font-display text-3xl font-semibold">{roll.id}</p>
          </div>
          <div className="space-y-4 p-6">
            <dl className="grid grid-cols-2 gap-4">
              <DetailItem label="Fabric" value={fabric.construction} />
              <DetailItem label="Fabric name" value={fabric.name} />
              <DetailItem label="Loom" value={<Link to={`/looms/${roll.loomId}`} className="text-brand-700 hover:underline">{roll.loomId}</Link>} />
              <DetailItem label="Grade" value={<Badge tone={roll.grade === 'A' ? 'green' : roll.grade === 'B' ? 'amber' : 'red'}>Grade {roll.grade}</Badge>} />
              <DetailItem label="Length" value={`${roll.meters} m`} />
              <DetailItem label="Weight" value={`${roll.weightKg} kg`} />
              <DetailItem label="Quality" value={<StatusBadge status={roll.quality} />} />
              <DetailItem label="Location" value={roll.location} />
            </dl>
            {/* Barcode-style strip */}
            <div className="rounded-xl border border-dashed border-line-strong p-4">
              <div className="flex h-12 items-stretch gap-[2px]" aria-hidden>
                {roll.id.split('').concat(fabric.code.split('')).flatMap((c, i) => {
                  const w = (c.charCodeAt(0) + i) % 4
                  return [<span key={`b${i}`} className="bg-slate-900" style={{ width: w + 1 }} />, <span key={`s${i}`} style={{ width: ((c.charCodeAt(0) * 3) % 3) + 1 }} />]
                })}
              </div>
              <p className="mt-2 text-center font-mono text-xs tracking-[0.3em] text-slate-600">
                {roll.id.replace('-', '')}
                {fabric.code.replace('FAB-', '')}
              </p>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Traceability" subtitle="From yarn lot to customer — every step is linked" />
            <CardBody>
              <ol className="space-y-1">
                {trace.map((t, i) => {
                  const inner = (
                    <>
                      <span className={cn('relative z-10 grid size-10 shrink-0 place-items-center rounded-xl', t.done ? 'bg-brand-50 text-brand-600' : 'bg-slate-100 text-slate-400')}>
                        <t.icon className="size-5" />
                      </span>
                      <span className="min-w-0 py-1">
                        <span className="block text-sm font-semibold text-slate-900">{t.title}</span>
                        <span className="block text-[13px] text-slate-500">{t.body}</span>
                      </span>
                    </>
                  )
                  return (
                    <li key={i} className="relative">
                      {i < trace.length - 1 && <span className="absolute top-12 bottom-[-4px] left-[27px] w-px bg-line-strong" />}
                      {t.to ? (
                        <Link to={t.to} className="flex gap-4 rounded-xl p-2 hover:bg-slate-50">
                          {inner}
                        </Link>
                      ) : (
                        <div className="flex gap-4 p-2">{inner}</div>
                      )}
                    </li>
                  )
                })}
              </ol>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Inspection Result" />
            <CardBody>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <DetailItem label="Inspector" value={roll.inspector} />
                <DetailItem label="Defects" value={roll.defects} />
                <DetailItem label="Points / 100 m²" value={((roll.defects * 4 * 100) / (roll.meters * fabric.widthInches * 0.0254)).toFixed(1)} />
                <DetailItem label="Standard" value="4-point system" />
              </dl>
              {roll.defectTypes.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {roll.defectTypes.map((d) => (
                    <Badge key={d} tone="slate">
                      {d}
                    </Badge>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
