import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Check, FileText, ShoppingBag, Truck } from 'lucide-react'
import type { OrderStatus } from '@/types'
import { Button, Card, CardBody, CardHeader, DetailItem, EmptyState, PageHeader, ProgressBar, StatusBadge, useToast } from '@/components/ui'
import { DISPATCHES, SALES_ORDERS, customerById } from '@/data/commercial'
import { fabricByCode } from '@/data/inventory'
import { PRODUCTION_PLANS } from '@/data/production'
import { cn, date, num, pkr } from '@/utils/format'
import { IS_POLY, TERMS } from '@/data/dataset'

const FLOW: OrderStatus[] = ['Draft', 'Confirmed', 'Partially Fulfilled', 'Completed']

export default function SalesOrderDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const base = SALES_ORDERS.find((o) => o.id === id)
  const [status, setStatus] = useState<OrderStatus | undefined>(base?.status)

  if (!base || !status) {
    return (
      <Card>
        <EmptyState icon={<ShoppingBag />} title={`Order “${id}” not found`} action={<Button onClick={() => navigate('/sales/orders')}>Back to Sales Orders</Button>} />
      </Card>
    )
  }

  const o = { ...base, status }
  const c = customerById(o.customerId)!
  const f = fabricByCode(o.fabricCode)!
  const subtotal = o.quantity * o.rate
  const gst = subtotal * 0.18
  const dispatches = DISPATCHES.filter((d) => d.orderId === o.id)
  const plan = PRODUCTION_PLANS.find((p) => p.orderId === o.id)
  const step = o.status === 'Cancelled' ? -1 : FLOW.indexOf(o.status)

  const timeline = [
    { label: 'Order created', date: o.date, done: true },
    { label: 'Confirmed by customer', date: o.date, done: step >= 1 },
    { label: 'In production', date: plan?.start ?? o.date, done: step >= 1 },
    { label: `Partially dispatched${o.delivered ? ` · ${num(o.delivered)} ${TERMS.stock}` : ''}`, date: dispatches[0]?.date, done: step >= 2 },
    { label: 'Fully delivered', date: o.deliveryDate, done: step >= 3 },
  ]

  const advance = () => {
    const next = FLOW[Math.min(step + 1, FLOW.length - 1)]
    setStatus(next)
    toast.success(`${o.id} updated to ${next}`)
  }

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: 'Sales', to: '/sales/orders' }, { label: 'Sales Orders', to: '/sales/orders' }, { label: o.id }]}
        title={`Sales Order ${o.id}`}
        meta={<StatusBadge status={o.status} />}
        description={`${c.name} · placed ${date(o.date)} · delivery ${date(o.deliveryDate)}`}
        actions={
          <>
            <Button icon={<FileText className="size-4" />} onClick={() => toast.demo('Sales tax invoice with FBR digital invoicing is available in the production version.')}>
              Invoice
            </Button>
            <Button icon={<Truck className="size-4" />} onClick={() => navigate('/sales/dispatch')}>
              Dispatch
            </Button>
            {step >= 0 && step < FLOW.length - 1 && (
              <Button variant="primary" onClick={advance}>
                Mark as {FLOW[step + 1]}
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card>
            <CardHeader title="Order Items" />
            <div className="overflow-x-auto border-t border-line">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/70 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  <tr>
                    <th className="px-5 py-2.5 text-left">{TERMS.productOne}</th>
                    <th className="px-4 py-2.5 text-right">Quantity</th>
                    <th className="px-4 py-2.5 text-right">Delivered</th>
                    <th className="px-4 py-2.5 text-right">Rate</th>
                    <th className="px-5 py-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-line">
                    <td className="px-5 py-4">
                      <Link to={`/fabric/${f.code}`} className="font-semibold text-slate-900 hover:text-brand-700">
                        {f.construction} {f.name}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {f.code} · {f.density}{IS_POLY ? ' mesh' : ''} · {f.widthInches}" · {f.gsm} GSM
                      </p>
                    </td>
                    <td className="px-4 py-4 text-right num">{num(o.quantity)} {TERMS.stock}</td>
                    <td className="px-4 py-4 text-right num">{num(o.delivered)} {TERMS.stock}</td>
                    <td className="px-4 py-4 text-right num">{pkr(o.rate)}</td>
                    <td className="px-5 py-4 text-right font-semibold text-slate-900 num">{pkr(subtotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex justify-end border-t border-line px-5 py-4">
              <dl className="w-full max-w-xs space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <dt>Subtotal</dt>
                  <dd className="num">{pkr(subtotal)}</dd>
                </div>
                <div className="flex justify-between text-slate-600">
                  <dt>Sales tax (18%)</dt>
                  <dd className="num">{pkr(gst)}</dd>
                </div>
                <div className="flex justify-between border-t border-line pt-2 text-base font-semibold text-slate-900">
                  <dt>Total</dt>
                  <dd className="num">{pkr(subtotal + gst)}</dd>
                </div>
              </dl>
            </div>
          </Card>

          <Card>
            <CardHeader title="Delivery" subtitle={`${num(o.quantity - o.delivered)} ${TERMS.stock} remaining`} />
            <CardBody>
              <div className="flex items-baseline justify-between text-[13px] num">
                <span className="text-slate-600">
                  <b className="font-semibold text-slate-900">{num(o.delivered)} {TERMS.stock}</b> delivered of {num(o.quantity)} {TERMS.stock}
                </span>
                <span className="font-semibold text-slate-900">{Math.round((o.delivered / o.quantity) * 100)}%</span>
              </div>
              <ProgressBar value={o.delivered} max={o.quantity} className="mt-2" height="h-2" />
              {dispatches.length > 0 ? (
                <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
                  {dispatches.map((d) => (
                    <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-[13px]">
                      <span className="font-semibold text-slate-900">{d.id}</span>
                      <span className="text-slate-500">{date(d.date)}</span>
                      <span className="text-slate-500 num">
                        {d.rolls} {TERMS.packs.toLowerCase()} · {num(d.meters)} {TERMS.stock}
                      </span>
                      <span className="text-slate-500">{d.vehicle}</span>
                      <StatusBadge status={d.status} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-[13px] text-slate-500">No dispatches yet.</p>
              )}
              {plan && (
                <p className="mt-4 text-[13px] text-slate-600">
                  Production plan{' '}
                  <Link to="/production/plans" className="font-semibold text-brand-700 hover:underline">
                    {plan.id}
                  </Link>{' '}
                  on {plan.looms.join(', ')} — {num(plan.producedMeters)} of {num(plan.plannedMeters)} {TERMS.stock} {IS_POLY ? 'made' : 'woven'}.
                </p>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Customer" actions={<Link to={`/sales/customers/${c.id}`} className="text-[13px] font-medium text-brand-600 hover:text-brand-700">View</Link>} />
            <CardBody>
              <p className="text-base font-semibold text-slate-900">{c.name}</p>
              <p className="text-[13px] text-slate-500">{c.city}</p>
              <dl className="mt-4 grid grid-cols-2 gap-4">
                <DetailItem label="Contact" value={c.contact} />
                <DetailItem label="Mobile" value={c.phone} />
                <DetailItem label="NTN" value={c.ntn} />
                <DetailItem label="Payment terms" value={o.paymentTerms} />
              </dl>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Status Timeline" />
            <CardBody>
              {o.status === 'Cancelled' ? (
                <p className="rounded-lg bg-rose-50 px-4 py-3 text-[13px] text-rose-700">This order was cancelled by the customer.</p>
              ) : (
                <ol className="space-y-4">
                  {timeline.map((t, i) => (
                    <li key={i} className="flex gap-3">
                      <span className={cn('mt-0.5 grid size-5 shrink-0 place-items-center rounded-full', t.done ? 'bg-emerald-500 text-white' : 'border-2 border-line-strong bg-white')}>
                        {t.done && <Check className="size-3" strokeWidth={3} />}
                      </span>
                      <span>
                        <span className={cn('block text-[13px] font-medium', t.done ? 'text-slate-900' : 'text-slate-400')}>{t.label}</span>
                        {t.date && <span className="text-xs text-slate-500">{t.done ? date(t.date) : `Expected ${date(t.date)}`}</span>}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
