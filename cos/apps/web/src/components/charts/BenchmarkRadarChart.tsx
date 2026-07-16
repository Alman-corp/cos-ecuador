"use client"

import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend, Tooltip,
} from "recharts"

interface Metric {
  metric: string
  actual: number
  benchmark: number
  max: number
}

interface BenchmarkRadarChartProps {
  data: Metric[]
  height?: number
}

export function BenchmarkRadarChart({ data, height = 400 }: BenchmarkRadarChartProps) {
  const normalized = data.map((d) => ({
    metric: d.metric,
    actual: +((d.actual / d.max) * 100).toFixed(1),
    benchmark: +((d.benchmark / d.max) * 100).toFixed(1),
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={normalized} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
        <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
        <Legend />
        <Radar name="Actual" dataKey="actual" stroke="#2563eb" fill="#2563eb" fillOpacity={0.3} />
        <Radar name="Benchmark" dataKey="benchmark" stroke="#9333ea" fill="#9333ea" fillOpacity={0.1} strokeDasharray="4 4" />
      </RadarChart>
    </ResponsiveContainer>
  )
}