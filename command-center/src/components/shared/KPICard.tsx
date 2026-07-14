"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"

interface KPICardProps {
  label: string
  value: string
  change?: string
  trend?: "up" | "down" | "neutral"
  alertLevel?: "critical" | "warning" | "normal"
  alertMessage?: string
  sparklineData?: number[]
  detailRows?: { label: string; value: string; trend?: "up" | "down" | "neutral" }[]
  onClick?: () => void
}

const alertConfig = {
  critical: { border: "border-danger/40", bg: "bg-danger/5", dot: "bg-danger", pulse: true },
  warning: { border: "border-warning/40", bg: "bg-warning/5", dot: "bg-warning", pulse: false },
  normal: { border: "border-surface-700/50", bg: "bg-surface-800/50", dot: "bg-success", pulse: false },
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = 80
  const h = 24
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 4) - 2
    return `${x},${y}`
  })
  const pathD = `M${points.join(" L")}`
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function AlertDot({ level: l }: { level: "critical" | "warning" | "normal" }) {
  const cfg = alertConfig[l]
  return (
    <span className={`relative flex h-2 w-2 ${cfg.pulse ? "animate-ping" : ""}`}>
      <span className={`absolute inline-flex h-full w-full rounded-full ${cfg.dot} opacity-75`} />
      <span className={`relative inline-flex h-2 w-2 rounded-full ${cfg.dot}`} />
    </span>
  )
}

export function KPICard({
  label, value, change, trend,
  alertLevel = "normal", alertMessage,
  sparklineData, detailRows, onClick,
}: KPICardProps) {
  const [expanded, setExpanded] = useState(false)
  const cfg = alertConfig[alertLevel]

  return (
    <motion.div
      layout
      onClick={() => {
        if (detailRows || onClick) {
          if (!onClick) setExpanded(!expanded)
          else onClick()
        }
      }}
      className={`rounded-xl border transition-all duration-200 cursor-${detailRows || onClick ? "pointer" : "default"} ${cfg.border} ${cfg.bg} p-5 hover:border-surface-500/50`}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-surface-500">
          {label}
        </p>
        <div className="flex items-center gap-1.5">
          {alertLevel !== "normal" && <AlertDot level={alertLevel} />}
          {sparklineData && <Sparkline data={sparklineData} color={trend === "up" ? "#10b981" : trend === "down" ? "#ef4444" : "#64748b"} />}
        </div>
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-surface-50">{value}</span>
        {change && trend && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${
            trend === "up" ? "text-success" : trend === "down" ? "text-danger" : "text-surface-400"
          }`}>
            {trend === "up" ? (
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
              </svg>
            ) : trend === "down" ? (
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            ) : null}
            {change}
          </span>
        )}
      </div>

      {alertMessage && alertLevel !== "normal" && (
        <p className={`mt-2 text-[11px] leading-tight ${alertLevel === "critical" ? "text-danger" : "text-warning"}`}>
          {alertMessage}
        </p>
      )}

      <AnimatePresence>
        {expanded && detailRows && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3 space-y-1.5 overflow-hidden border-t border-surface-700/30 pt-3"
          >
            {detailRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between text-xs">
                <span className="text-surface-400">{row.label}</span>
                <span className={`font-mono font-medium ${
                  row.trend === "up" ? "text-success" : row.trend === "down" ? "text-danger" : "text-surface-200"
                }`}>{row.value}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
