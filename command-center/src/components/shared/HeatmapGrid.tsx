"use client"

import { motion } from "framer-motion"

interface HeatmapCell {
  label: string
  value: string
  score: number
  detail?: string
}

interface Props {
  cells: HeatmapCell[]
}

function scoreColor(score: number): string {
  if (score >= 0.8) return "bg-success/20 text-success border-success/30"
  if (score >= 0.6) return "bg-success/10 text-success border-success/20"
  if (score >= 0.4) return "bg-warning/10 text-warning border-warning/20"
  if (score >= 0.2) return "bg-danger/10 text-danger border-danger/20"
  return "bg-danger/20 text-danger border-danger/30"
}

function scoreIcon(score: number): string {
  if (score >= 0.8) return "🟢"
  if (score >= 0.6) return "🟡"
  if (score >= 0.4) return "🟠"
  return "🔴"
}

export function HeatmapGrid({ cells }: Props) {
  if (cells.length === 0) return null

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {cells.map((cell, i) => (
        <motion.div
          key={cell.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.04 }}
          className={`rounded-lg border px-3 py-2.5 ${scoreColor(cell.score)}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
              {cell.label}
            </span>
            <span className="text-xs">{scoreIcon(cell.score)}</span>
          </div>
          <p className="mt-1 text-sm font-bold">{cell.value}</p>
          {cell.detail && <p className="mt-0.5 text-[10px] opacity-60">{cell.detail}</p>}
        </motion.div>
      ))}
    </div>
  )
}
