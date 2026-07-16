"use client"

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts"

interface Series {
  key: string
  name: string
  color: string
}

interface FinancialLineChartProps {
  data: Record<string, string | number>[]
  series: Series[]
  xKey?: string
  height?: number
  showMovingAverage?: boolean
  movingAverageWindow?: number
}

export function FinancialLineChart({
  data,
  series,
  xKey = "period",
  height = 350,
  showMovingAverage = false,
  movingAverageWindow = 3,
}: FinancialLineChartProps) {
  const chartData = showMovingAverage
    ? data.map((row, i) => {
        const enriched: Record<string, string | number> = { ...row }
        for (const s of series) {
          const values = data.slice(Math.max(0, i - movingAverageWindow + 1), i + 1).map((d) => Number(d[s.key]))
          enriched[`${s.key}_ma`] = values.length > 0 ? +(values.reduce((a, b) => a + b, 0) / values.length).toFixed(0) : null
        }
        return enriched
      })
    : data

  const allSeries: { key: string; color: string; type?: "monotone" | "dashed" }[] = []
  for (const s of series) {
    allSeries.push({ key: s.key, color: s.color })
    if (showMovingAverage) {
      allSeries.push({ key: `${s.key}_ma`, color: s.color, type: "dashed" })
    }
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={enrichedDataChart(enrichedData)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        {allSeries.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            stroke={s.color}
            strokeDasharray={s.type === "dashed" ? "5 5" : undefined}
            dot={false}
            strokeWidth={s.type === "dashed" ? 1.5 : 2}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

function enrichedData(data: Record<string, string | number>[]) {
  return data as Record<string, string | number>[]
}