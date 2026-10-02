import { useNavigate } from 'react-router-dom'
import { Area, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { compact, meters, pct, duration } from '@/utils/format'
import { CHART, ChartTooltip, SERIES, axisProps } from './ChartKit'

export function ProductionTrendChart({ data, height = 280 }: { data: { label: string; actual: number; target: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="prodFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART.brand} stopOpacity={0.18} />
            <stop offset="100%" stopColor={CHART.brand} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={CHART.grid} />
        <XAxis dataKey="label" {...axisProps} dy={8} />
        <YAxis {...axisProps} tickFormatter={compact} width={52} domain={['dataMin - 20000', 'auto']} />
        <Tooltip content={<ChartTooltip formatter={(v) => meters(v)} />} />
        <Area type="monotone" dataKey="actual" name="Actual" stroke={CHART.brand} strokeWidth={2.5} fill="url(#prodFill)" dot={{ r: 3, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 5 }} />
        <Line type="monotone" dataKey="target" name="Target" stroke={CHART.target} strokeWidth={2} strokeDasharray="5 5" dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

export function DonutChart({
  data,
  height = 220,
  format,
  centerLabel,
  centerValue,
}: {
  data: { name: string; value: number; color: string }[]
  height?: number
  format: (v: number) => string
  centerLabel?: string
  centerValue?: string
}) {
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={<ChartTooltip formatter={(v) => format(v)} />} />
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="68%" outerRadius="94%" paddingAngle={2} stroke="none" startAngle={90} endAngle={-270}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} className="transition-opacity hover:opacity-80" />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {centerValue && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-xl font-semibold text-slate-900 num">{centerValue}</span>
          {centerLabel && <span className="text-xs text-slate-500">{centerLabel}</span>}
        </div>
      )}
    </div>
  )
}

export const effColor = (e: number) => (e >= 95 ? CHART.green : e >= 85 ? CHART.brand : e >= 70 ? CHART.amber : CHART.rose)

export function LoomEfficiencyChart({ data, height = 280 }: { data: { loomId: string; efficiency: number }[]; height?: number }) {
  const navigate = useNavigate()
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap="22%">
        <CartesianGrid vertical={false} stroke={CHART.grid} />
        <XAxis dataKey="loomId" {...axisProps} interval={data.length > 24 ? 'preserveStartEnd' : 0} dy={8} />
        <YAxis {...axisProps} domain={[0, 110]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v) => `${v}%`} />
        <Tooltip content={<ChartTooltip formatter={(v) => pct(v)} labelFormatter={(l) => `Loom ${l} · click to open`} />} />
        <Bar dataKey="efficiency" name="Efficiency" radius={[4, 4, 0, 0]} onClick={(d: { loomId?: string }) => d.loomId && navigate(`/looms/${d.loomId}`)} className="cursor-pointer">
          {data.map((d) => (
            <Cell key={d.loomId} fill={effColor(d.efficiency)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export const DOWNTIME_COLORS: Record<string, string> = {
  Mechanical: SERIES[0],
  Electrical: SERIES[1],
  'Yarn Issue': SERIES[2],
  'Beam Issue': SERIES[3],
  Maintenance: SERIES[4],
  Operator: SERIES[5],
  'Material Shortage': SERIES[6],
}

export function DowntimeBarChart({ data, height = 260 }: { data: { category: string; minutes: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }} barCategoryGap="28%">
        <CartesianGrid horizontal={false} stroke={CHART.grid} />
        <XAxis type="number" {...axisProps} tickFormatter={(v) => duration(v)} />
        <YAxis type="category" dataKey="category" {...axisProps} width={118} />
        <Tooltip content={<ChartTooltip formatter={(v) => duration(v)} />} />
        <Bar dataKey="minutes" name="Downtime" radius={[0, 4, 4, 0]}>
          {data.map((d) => (
            <Cell key={d.category} fill={DOWNTIME_COLORS[d.category] ?? CHART.slate} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
