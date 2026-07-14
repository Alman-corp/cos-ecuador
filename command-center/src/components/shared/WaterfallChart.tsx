"use client"

import { motion } from "framer-motion"

interface WaterfallItem {
  label: string
  value: number
  type: "total" | "positive" | "negative"
  format?: (n: number) => string
}

interface Props {
  items: WaterfallItem[]
  height?: number
}

function defaultFormat(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

export function WaterfallChart({ items, height = 280 }: Props) {
  if (items.length === 0) return null

  const absoluteValues = items.map((item) => Math.abs(item.value))
  const maxVal = Math.max(...absoluteValues, 1)
  const padding = 60

  let runningTotal = 0
  const barData = items.map((item) => {
    const isTotal = item.type === "total"
    const start = isTotal ? 0 : runningTotal
    const end = isTotal ? item.value : (item.type === "positive" ? runningTotal + item.value : runningTotal - Math.abs(item.value))
    const barStart = Math.min(start, end)
    const barEnd = Math.max(start, end)
    const barHeight = Math.abs(end - start)
    if (!isTotal) runningTotal = end
    return {
      ...item,
      barStart,
      barEnd,
      barHeight,
      pctHeight: (barHeight / maxVal) * 100,
    }
  })

  const totalMax = Math.max(...barData.map((d) => Math.max(d.barStart, d.barEnd)), 1)
  const scale = (height - padding) / totalMax

  return (
    <div className="w-full" style={{ height }}>
      <svg width="100%" height={height} viewBox={`0 0 ${items.length * 100 + 40} ${height}`} className="overflow-visible">
        {barData.map((d, i) => {
          const x = i * 100 + 40
          const y0 = height - 20
          const barH = d.barHeight * scale
          const yStart = d.type === "total" ? y0 - barH : y0 - (d.barEnd * scale)
          const h = Math.max(barH, 2)

          const barColor = d.type === "positive" ? "#10b981" : d.type === "negative" ? "#ef4444" : "#3b82f6"
          const connectorColor = d.type === "positive" ? "#10b981" : d.type === "negative" ? "#ef4444" : "#3b82f6"

          return (
            <g key={i}>
              {d.type !== "total" && i > 0 && (
                <motion.line
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.3 }}
                  transition={{ delay: i * 0.1 + 0.3 }}
                  x1={x - 60} y1={y0 - (d.barStart * scale)}
                  x2={x} y2={y0 - (d.barStart * scale)}
                  stroke={connectorColor}
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
              )}
              <motion.rect
                initial={{ height: 0, y: y0 }}
                animate={{ height: h, y: yStart }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
                x={x} y={yStart}
                width="60" height={h}
                rx="3"
                fill={barColor}
                opacity={d.type === "total" ? 1 : 0.8}
              />
              <text x={x + 30} y={yStart - 6} textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="JetBrains Mono, monospace">
                {(d.format ?? defaultFormat)(d.value)}
              </text>
              <text x={x + 30} y={y0 + 16} textAnchor="middle" fill="#64748b" fontSize="10">
                {d.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
