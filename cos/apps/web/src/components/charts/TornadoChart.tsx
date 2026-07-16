"use client"

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts"

interface TornadoItem {
  variable: string
  low: number
  high: number
  baseline: number
  color?: string
}

interface TornadoChartProps {
  data: TornadoItem[]
  height?: number
}

export function TornadoChart({ data, height = 400 }: TornadoChartProps) {
  const sorted = [...data].sort((a, b) => Math.abs(b.high - b.baseline) - Math.abs(a.high - a.baseline))

  const chartData = sorted.map((d) => ({
    variable: d.variable,
    lowDelta: -(d.baseline - d.low),
    highDelta: d.high - d.baseline,
    baseline: 0,
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 20, right: 30, left: 60, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 12 }} />
        <YAxis dataKey="variable" type="category" tick={{ fontSize: 12 }} width={120} />
        <Tooltip formatter={(value: number) => value.toFixed(0)} />
        <Bar dataKey="lowDelta" fill="#ef4444" stackId="a" name="Impacto Bajo" />
        <Bar dataKey="highDelta" fill="#22c55e" stackId="a" name="Impacto Alto" />
      </BarChart>
    </ResponsiveContainer>
  )
}