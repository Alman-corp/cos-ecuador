"use client"

import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend,
} from "recharts"

const tooltipStyle = {
  contentStyle: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "8px",
    fontSize: "12px",
    fontFamily: "JetBrains Mono, monospace",
  },
  labelStyle: { color: "#94a3b8" },
}

interface ChartDataPoint {
  label: string
  [key: string]: string | number
}

interface TrendChartProps {
  data: ChartDataPoint[]
  lines: { key: string; color: string; label?: string }[]
  height?: number
  title?: string
}

export function TrendChart({ data, lines, height = 200, title }: TrendChartProps) {
  if (data.length === 0) return null
  return (
    <div>
      {title && <p className="mb-2 text-xs font-semibold text-surface-400 uppercase tracking-wider">{title}</p>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip {...tooltipStyle} />
          {lines.map((l) => (
            <Line
              key={l.key}
              type="monotone"
              dataKey={l.key}
              stroke={l.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: l.color }}
              name={l.label ?? l.key}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

interface AreaTrendProps {
  data: ChartDataPoint[]
  areas: { key: string; color: string; label?: string }[]
  height?: number
  title?: string
}

export function AreaTrendChart({ data, areas, height = 200, title }: AreaTrendProps) {
  if (data.length === 0) return null
  return (
    <div>
      {title && <p className="mb-2 text-xs font-semibold text-surface-400 uppercase tracking-wider">{title}</p>}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip {...tooltipStyle} />
          {areas.map((a) => (
            <Area
              key={a.key}
              type="monotone"
              dataKey={a.key}
              stroke={a.color}
              fill={a.color}
              fillOpacity={0.1}
              strokeWidth={2}
              name={a.label ?? a.key}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

interface BarChartProps {
  data: ChartDataPoint[]
  bars: { key: string; color: string; label?: string }[]
  height?: number
  title?: string
  stacked?: boolean
}

export function BarChartView({ data, bars, height = 200, title, stacked }: BarChartProps) {
  if (data.length === 0) return null
  return (
    <div>
      {title && <p className="mb-2 text-xs font-semibold text-surface-400 uppercase tracking-wider">{title}</p>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip {...tooltipStyle} />
          {bars.map((b) => (
            <Bar
              key={b.key}
              dataKey={b.key}
              fill={b.color}
              stackId={stacked ? "stack" : undefined}
              radius={[3, 3, 0, 0]}
              name={b.label ?? b.key}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

interface PieChartProps {
  data: { name: string; value: number; color: string }[]
  height?: number
  title?: string
  innerRadius?: number
  showLabel?: boolean
}

export function PieChartView({ data, height = 200, title, innerRadius = 0, showLabel = true }: PieChartProps) {
  if (data.length === 0) return null
  return (
    <div>
      {title && <p className="mb-2 text-xs font-semibold text-surface-400 uppercase tracking-wider">{title}</p>}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={Math.min(height, 200) / 2 - 10}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "8px",
              fontSize: "12px",
              fontFamily: "JetBrains Mono, monospace",
            }}
            formatter={(value, name) => [`${Number(value).toLocaleString()}`, String(name)]}
          />
          {showLabel && (
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value: string) => (
                <span className="text-xs text-surface-400">{value}</span>
              )}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
