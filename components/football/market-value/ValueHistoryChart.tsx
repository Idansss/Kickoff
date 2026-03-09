'use client'

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

interface HistoryPoint {
  date: string
  valueEur: number
  formatted: string
}

interface ValueHistoryChartProps {
  history: HistoryPoint[]
  color?: string
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
}

function formatValue(v: number) {
  if (v >= 1_000_000_000) return `€${(v / 1_000_000_000).toFixed(2)}bn`
  return `€${(v / 1_000_000).toFixed(1)}m`
}

export function ValueHistoryChart({ history, color = '#22c55e' }: ValueHistoryChartProps) {
  if (history.length < 2) {
    return (
      <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
        Not enough data points to draw a chart.
      </div>
    )
  }

  const data = history.map((h) => ({
    date: formatShortDate(h.date),
    rawDate: h.date,
    value: h.valueEur,
    label: h.formatted,
  }))

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`mvGrad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatValue}
          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <Tooltip
          formatter={(val: number) => [formatValue(val), 'Market value']}
          contentStyle={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#mvGrad-${color.replace('#', '')})`}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0, fill: color }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
