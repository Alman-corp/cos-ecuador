"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { generateInsightReport, type MetricInput, type Finding } from "@/lib/insight-engine"

interface Props {
  metrics: MetricInput[]
  companyName?: string
  showDriverAnalysis?: boolean
  maxFindings?: number
}

function findingIcon(type: Finding["type"]): string {
  switch (type) {
    case "positive": return "▲"
    case "negative": return "▼"
    case "alert": return "⚠"
    case "recommendation": return "◆"
    default: return "●"
  }
}

function findingColor(type: Finding["type"], severity?: string): string {
  if (severity === "critical") return "border-danger/40 bg-danger/5 text-danger"
  if (type === "alert") return "border-warning/30 bg-warning/5 text-warning"
  if (type === "positive") return "border-success/30 bg-success/5 text-success"
  if (type === "negative") return "border-danger/20 bg-danger/5 text-danger"
  if (type === "recommendation") return "border-accent-500/30 bg-accent-600/5 text-accent-400"
  return "border-surface-600/30 bg-surface-800/50 text-surface-300"
}

function findingLabel(type: Finding["type"]): string {
  switch (type) {
    case "positive": return "Hallazgo Positivo"
    case "negative": return "Hallazgo Negativo"
    case "alert": return "Alerta"
    case "recommendation": return "Recomendación"
    default: return "Insight"
  }
}

function severityBadge(severity?: string): string {
  switch (severity) {
    case "critical": return "🔴 Crítico"
    case "high": return "🟠 Alto"
    case "medium": return "🟡 Medio"
    case "low": return "🟢 Bajo"
    default: return ""
  }
}

export function FinancialNarrative({
  metrics,
  companyName = "La compañía",
  showDriverAnalysis = true,
  maxFindings = 8,
}: Props) {
  const [expanded, setExpanded] = useState(false)

  const report = useMemo(() => generateInsightReport(metrics, companyName), [metrics, companyName])
  const displayed = expanded ? report.findings : report.findings.slice(0, maxFindings)
  const hasMore = report.findings.length > maxFindings

  const alertCount = report.findings.filter((f) => f.type === "alert" || f.severity === "critical").length
  const positiveCount = report.findings.filter((f) => f.type === "positive").length
  const negativeCount = report.findings.filter((f) => f.type === "negative" || f.severity === "critical").length

  if (report.findings.length === 0) return null

  return (
    <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">📋</span>
          <h3 className="text-sm font-semibold text-surface-200">
            Insight Engine
          </h3>
          <div className="flex gap-1.5">
            <span className="rounded bg-surface-700/50 px-1.5 py-0.5 text-[10px] font-mono text-surface-400">
              {metrics.length} métricas
            </span>
            {alertCount > 0 && (
              <span className="rounded bg-danger/10 px-1.5 py-0.5 text-[10px] font-mono text-danger">
                {alertCount} alerta(s)
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 text-[10px]">
          {positiveCount > 0 && <span className="text-success">▲ {positiveCount}</span>}
          {negativeCount > 0 && <span className="text-danger">▼ {negativeCount}</span>}
        </div>
      </div>

      {showDriverAnalysis && report.drivers.length > 0 && (
        <div className="mb-4 rounded-lg bg-accent-600/5 border border-accent-500/20 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-accent-400 mb-1">
            🔍 Análisis de Drivers
          </p>
          <div className="space-y-1">
            {report.drivers.slice(0, 3).map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-surface-400">{d.metric}</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-24 rounded-full bg-surface-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${d.direction === "up" ? "bg-success" : "bg-danger"}`}
                      style={{ width: `${Math.min(Math.abs(d.percentageImpact), 100)}%` }}
                    />
                  </div>
                  <span className={`font-mono ${d.direction === "up" ? "text-success" : "text-danger"}`}>
                    {d.percentageImpact >= 0 ? "+" : ""}{d.percentageImpact.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2.5">
        <AnimatePresence>
          {displayed.map((finding, i) => (
            <motion.div
              key={`${finding.type}-${i}`}
              initial={{ opacity: 0, x: -16, height: 0 }}
              animate={{ opacity: 1, x: 0, height: "auto" }}
              exit={{ opacity: 0, x: -16, height: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
              className={`rounded-lg border px-3.5 py-2.5 ${findingColor(finding.type, finding.severity)}`}
            >
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 text-sm shrink-0">{findingIcon(finding.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
                      {findingLabel(finding.type)}
                    </p>
                    {finding.severity && finding.severity !== "low" && (
                      <span className="text-[9px] font-mono opacity-60">{severityBadge(finding.severity)}</span>
                    )}
                  </div>
                  <p className="text-xs font-medium mt-0.5">{finding.title}</p>
                  <p className="text-xs leading-relaxed mt-0.5 opacity-80">{finding.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 w-full rounded-lg bg-surface-700/30 py-1.5 text-xs font-medium text-surface-400 hover:text-surface-200 hover:bg-surface-700/50 transition-colors"
        >
          {expanded ? "Mostrar menos" : `Ver todos (${report.findings.length})`}
        </button>
      )}
    </div>
  )
}
