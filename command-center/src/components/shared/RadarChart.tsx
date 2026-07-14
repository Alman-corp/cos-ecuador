"use client"

import { motion } from "framer-motion"

interface RadarMetric {
  label: string
  value: number
  max?: number
}

interface Props {
  metrics: RadarMetric[]
  size?: number
  title?: string
}

export function RadarChart({ metrics, size = 220, title }: Props) {
  if (metrics.length < 3) return null
  const cx = size / 2
  const cy = size / 2
  const radius = size / 2 - 30
  const angleStep = (2 * Math.PI) / metrics.length

  const gridLevels = [0.25, 0.5, 0.75, 1]

  const polygonPoints = metrics
    .map((m, i) => {
      const a = angleStep * i - Math.PI / 2
      const r = radius * Math.min(m.value / (m.max ?? 100), 1)
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`
    })
    .join(" ")

  const gridPolygons = gridLevels.map((level) =>
    metrics
      .map((_, i) => {
        const a = angleStep * i - Math.PI / 2
        const r = radius * level
        return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`
      })
      .join(" ")
  )

  return (
    <div className="flex flex-col items-center">
      {title && <p className="mb-2 text-xs font-semibold text-surface-400 uppercase tracking-wider">{title}</p>}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {gridPolygons.map((pts, i) => (
          <polygon key={i} points={pts} fill="none" stroke="#1e293b" strokeWidth="1" opacity={0.6} />
        ))}
        {metrics.map((_, i) => {
          const a = angleStep * i - Math.PI / 2
          return (
            <line
              key={i}
              x1={cx} y1={cy}
              x2={cx + radius * Math.cos(a)} y2={cy + radius * Math.sin(a)}
              stroke="#1e293b" strokeWidth="1" opacity={0.4}
            />
          )
        })}
        <motion.polygon
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.3, scale: 1 }}
          transition={{ duration: 0.6 }}
          points={polygonPoints}
          fill="#818cf8"
          opacity={0.3}
        />
        <motion.polygon
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          points={polygonPoints}
          fill="none"
          stroke="#818cf8"
          strokeWidth="2"
        />
        {metrics.map((m, i) => {
          const a = angleStep * i - Math.PI / 2
          const r = radius * Math.min(m.value / (m.max ?? 100), 1)
          const labelR = radius + 18
          return (
            <g key={i}>
              <circle cx={cx + r * Math.cos(a)} cy={cy + r * Math.sin(a)} r="3" fill="#818cf8" />
              <text
                x={cx + labelR * Math.cos(a)}
                y={cy + labelR * Math.sin(a)}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#94a3b8"
                fontSize="9"
                fontFamily="system-ui"
              >
                {m.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
