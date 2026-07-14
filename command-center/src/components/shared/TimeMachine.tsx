"use client"

import { motion } from "framer-motion"
import { useMemo } from "react"

export interface PeriodData {
  label: string
  data: Record<string, number>
}

interface Props {
  periods: PeriodData[]
  currentPeriod: string
  onPeriodChange: (label: string) => void
  metricKeys: string[]
}

export function TimeMachine({ periods, currentPeriod, onPeriodChange, metricKeys }: Props) {
  const currentIdx = useMemo(() => periods.findIndex((p) => p.label === currentPeriod), [periods, currentPeriod])

  const prevPeriod = currentIdx > 0 ? periods[currentIdx - 1] : null

  return (
    <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">⏳</span>
          <h3 className="text-sm font-semibold text-surface-200">Máquina del Tiempo</h3>
        </div>
        <div className="flex gap-1">
          {periods.map((p, i) => (
            <button
              key={p.label}
              onClick={() => onPeriodChange(p.label)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                p.label === currentPeriod
                  ? "bg-accent-600/20 text-accent-400 ring-1 ring-accent-500/30"
                  : "text-surface-500 hover:text-surface-300 hover:bg-surface-700/50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <input
          type="range"
          min={0}
          max={periods.length - 1}
          value={currentIdx}
          onChange={(e) => onPeriodChange(periods[parseInt(e.target.value)].label)}
          className="w-full accent-accent-500"
        />
        <div className="mt-1 flex justify-between text-[10px] text-surface-500">
          <span>{periods[0]?.label}</span>
          <span>{periods[periods.length - 1]?.label}</span>
        </div>
      </div>

      {prevPeriod && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3"
        >
          {metricKeys.map((key) => {
            const curr = periods[currentIdx]?.data[key] ?? 0
            const prev = prevPeriod.data[key] ?? 0
            const diff = curr - prev
            const pct = prev !== 0 ? ((diff / prev) * 100).toFixed(1) : "—"
            return (
              <div key={key} className="rounded-lg bg-surface-900/50 px-2.5 py-2">
                <p className="text-[10px] uppercase tracking-wider text-surface-500 truncate">{key}</p>
                <p className="text-sm font-bold text-surface-100">
                  {curr >= 1e9 ? `$${(curr / 1e9).toFixed(1)}B` : curr >= 1e6 ? `$${(curr / 1e6).toFixed(0)}M` : curr.toLocaleString()}
                </p>
                <p className={`text-[10px] font-mono ${diff >= 0 ? "text-success" : "text-danger"}`}>
                  {diff >= 0 ? "+" : ""}{pct}% vs {prevPeriod.label}
                </p>
              </div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
