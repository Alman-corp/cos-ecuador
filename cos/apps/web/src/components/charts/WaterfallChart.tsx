"use client"

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts"

interface WaterfallItem {
  name: string
  value: number
  type: "start" | "positive" | "negative" | "end"
}

interface WaterfallChartProps {
  data: WaterfallItem[]
  height?: number
  currency?: string
}

export function WaterfallChart({ data, height = 350, currency = "USD" }: WaterfallChartProps) {
  let cumulative = 0
  const chartData = data.map((item) => {
    if (item.type === "start" || item.type === "end") {
      cumulative = item.value
      return { ...item, start: 0, end: item.value }
    }
    const start = cumulative
    cumulative += item.value
    return { ...item, start, end: cumulative }
  })

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={(v: number) => `${currency === "USD" ? "$" : "$"}${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value: number, _name: string, props: { payload: WaterfallItem }) => {
            const label = props.type === "start" ? "Saldo Inicial" : props.type === "end" ? "Saldo Final" : props.type === "positive" ? "Entrada" : "Salida"
            return [`${currency === "USD" ? "$" : "$"}${value.toLocaleString()}`, label]
          }}
        />
        <Bar
          dataKey="end"
          fill="transparent"
          stroke="none"
        />
        <Bar
          dataKey="start"
          stackId="a"
          fill="transparent"
          stroke="none"
        />
        {/* Invisible bar to create waterfall effect; actual bars use cell colors */}
        {chartData.map((entry, index) => (
          <Bar key={index} dataKey="cumulative" fill="transparent" stroke="none" hide />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}