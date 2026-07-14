"use client"

import { motion } from "framer-motion"

interface TornadoBar {
  label: string
  baseValue: number
  lowValue: number
  highValue: number
  format?: (n: number) => string
  unit?: string
}

interface Props {
  bars: TornadoBar[]
  height?: number
}

function defaultFormat(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`
  return n.toFixed(1)
}

export function TornadoChart({ bars, height = 40 }: Props) {
  if (bars.length === 0) return null
  const sorted = [...bars].sort((a, b) => Math.abs(b.highValue - b.lowValue) - Math.abs(a.highValue - a.lowValue))
  const maxRange = Math.max(...sorted.map((b) => Math.max(Math.abs(b.highValue - b.baseValue), Math.abs(b.baseValue - b.lowValue))), 1)

  return (
    <div className="space-y-2">
      {sorted.map((bar, i) => {
        const leftPct = ((bar.baseValue - bar.lowValue) / maxRange) * 50
        const rightPct = ((bar.highValue - bar.baseValue) / maxRange) * 50
        return (
          <motion.div
            key={bar.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="w-32 text-xs text-surface-400 truncate">{bar.label}</span>
              <span className="text-[10px] font-mono text-surface-500">{bar.unit ?? "%"}</span>
            </div>
            <div className="relative" style={{ height }}>
              <div className="absolute inset-0 flex">
                <div className="flex-1 flex justify-end">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${leftPct}%` }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                    className="h-full rounded-l-sm"
                    style={{ background: "linear-gradient(90deg, #ef4444, #f87171)" }}
                  />
                </div>
                <div className="flex-shrink-0 w-0.5 bg-surface-500" />
                <div className="flex-1 flex justify-start">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${rightPct}%` }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                    className="h-full rounded-r-sm"
                    style={{ background: "linear-gradient(90deg, #34d399, #10b981)" }}
                  />
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-mono font-bold text-surface-100 bg-surface-900/60 px-1.5 rounded">
                  {(bar.format ?? defaultFormat)(bar.baseValue)}
                </span>
              </div>
            </div>
            <div className="flex justify-between text-[10px] font-mono mt-0.5">
              <span className="text-danger">{(bar.format ?? defaultFormat)(bar.lowValue)}</span>
              <span className="text-success">{(bar.format ?? defaultFormat)(bar.highValue)}</span>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
