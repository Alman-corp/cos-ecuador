"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface Slice {
  name: string
  value: number
  color: string
}

interface DonutChartProps {
  data: Slice[]
  height?: number
  innerRadius?: number
  outerRadius?: number
  showLegend?: boolean
}

export function DonutChart({
  data,
  height = 300,
  innerRadius = 60,
  outerRadius = 100,
  showLegend = true,
}: DonutChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          dataKey="value"
          nameKey="name"
          paddingAngle={2}
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color || `hsl(${(index * 45) % 360}, 70%, 50%)`} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number, name: string) => [value.toLocaleString(), name]} />
        {showLegend && <Legend />}
      </PieChart>
    </ResponsiveContainer>
  )
}