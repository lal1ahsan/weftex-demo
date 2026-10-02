import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { Button, Card, CardBody, CardHeader, LOOM_STATUS_COLOR, PageHeader, StatusBadge } from '@/components/ui'
import { Legend } from '@/components/charts/ChartKit'
import { useApp } from '@/context/AppState'
import { fabricByCode } from '@/data/inventory'
import { loomStatusCounts } from '@/data/metrics'
import { cn, duration, num, pct, sum } from '@/utils/format'

export default function LoomStatusPage() {
  const navigate = useNavigate()
  const { looms } = useApp()
  const [hover, setHover] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [seconds, setSeconds] = useState(12)
  const counts = loomStatusCounts(looms)

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const refresh = () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
      setSeconds(0)
    }, 600)
  }

  const hovered = looms.find((l) => l.id === hover)
  const down = looms.filter((l) => l.status !== 'Running')

  return (
    <div>
      <PageHeader
        title="Loom Status"
        description="Floor view of every loom, arranged by hall."
        breadcrumbs={[{ label: 'Looms', to: '/looms' }, { label: 'Loom Status' }]}
        actions={
          <>
            <span className="text-[13px] text-slate-500">Updated {seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m`} ago</span>
            <Button icon={<RefreshCw className={cn('size-4', refreshing && 'animate-spin')} />} onClick={refresh}>
              Refresh
            </Button>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <Card>
            <CardBody className="flex flex-wrap items-center justify-between gap-4 pt-5">
              <Legend items={(['Running', 'Idle', 'Stopped', 'Maintenance'] as const).map((s) => ({ label: s, color: LOOM_STATUS_COLOR[s], value: counts[s] }))} />
              <p className="text-[13px] text-slate-500">
                Hover a loom for details · click to open
              </p>
            </CardBody>
          </Card>
          {(['Hall A', 'Hall B', 'Hall C'] as const).map((hall) => {
            const ls = looms.filter((l) => l.hall === hall)
            const eff = (sum(ls, (l) => l.todayProduction) / sum(ls, (l) => l.target)) * 100
            return (
              <Card key={hall}>
                <CardHeader
                  title={hall}
                  subtitle={`${ls.length} looms · ${ls[0].manufacturer} ${ls[0].model}${hall === 'Hall C' ? ' & Picanol OptiMax-i' : ''}`}
                  actions={<span className="text-sm font-semibold text-slate-900 num">{pct(eff)} efficiency</span>}
                />
                <CardBody>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-2">
                    {ls.map((l) => (
                      <button
                        key={l.id}
                        onMouseEnter={() => setHover(l.id)}
                        onFocus={() => setHover(l.id)}
                        onClick={() => navigate(`/looms/${l.id}`)}
                        className={cn(
                          'relative flex aspect-[4/3] flex-col items-center justify-center rounded-xl border text-center transition-all hover:-translate-y-0.5 hover:shadow-pop',
                          l.status === 'Running' && 'border-emerald-200 bg-emerald-50 text-emerald-900',
                          l.status === 'Idle' && 'border-amber-200 bg-amber-50 text-amber-900',
                          l.status === 'Stopped' && 'border-rose-300 bg-rose-50 text-rose-900',
                          l.status === 'Maintenance' && 'border-sky-200 bg-sky-50 text-sky-900',
                          hover === l.id && 'ring-2 ring-brand-400',
                        )}
                      >
                        {l.status === 'Stopped' && <span className="absolute top-1.5 right-1.5 size-2 animate-ping rounded-full bg-rose-500" />}
                        <span className="text-[13px] font-semibold">{l.id}</span>
                        <span className="text-[11px] opacity-70 num">{Math.round(l.efficiency)}%</span>
                      </button>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )
          })}
        </div>

        <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Card>
            <CardHeader title={hovered ? `Loom ${hovered.id}` : 'Loom details'} subtitle={hovered ? `${hovered.manufacturer} ${hovered.model}` : 'Hover over a loom'} actions={hovered && <StatusBadge status={hovered.status} />} />
            <CardBody>
              {hovered ? (
                <dl className="grid grid-cols-2 gap-3 text-[13px]">
                  {[
                    ['Fabric', `${fabricByCode(hovered.fabricCode)?.construction} ${fabricByCode(hovered.fabricCode)?.name}`],
                    ['Operator', hovered.operator],
                    ['Production', `${num(hovered.todayProduction)} m`],
                    ['Efficiency', pct(hovered.efficiency)],
                    ['RPM', hovered.rpm],
                    ['Downtime', hovered.downtimeMinutes ? duration(hovered.downtimeMinutes) : '—'],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-xs text-slate-500">{k}</dt>
                      <dd className="font-medium text-slate-900">{v}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-[13px] text-slate-500">Move the cursor over any loom on the floor plan to preview it here.</p>
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Not Running" subtitle={`${down.length} looms`} />
            <ul className="divide-y divide-line border-t border-line">
              {down.map((l) => (
                <li key={l.id}>
                  <Link to={`/looms/${l.id}`} className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50">
                    <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ background: LOOM_STATUS_COLOR[l.status] }} />
                    <span className="min-w-0 flex-1">
                      <span className="flex justify-between text-[13px] font-semibold text-slate-900">
                        {l.id}
                        <span className="font-normal text-slate-500">{l.stoppedSince ? `since ${l.stoppedSince}` : l.status}</span>
                      </span>
                      <span className="block truncate text-xs text-slate-500">{l.stopReason}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
