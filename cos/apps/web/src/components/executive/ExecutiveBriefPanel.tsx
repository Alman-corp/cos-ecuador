"use client"

import { useEffect, useState } from "react"

type ExecutiveBrief = {
  greeting: string
  date: string
  criticalCount: number
  opportunitiesCount: number
  riskCount: number
  overdueTasks: number
  metrics: { name: string; value: string; change: number; direction: string; status: string }[]
  criticalItems: { id: string; title: string; description: string; clientName?: string; priority: string; type: string; timestamp: string }[]
  opportunities: { id: string; title: string; description: string; clientName?: string; priority: string; type: string; timestamp: string }[]
  risks: { id: string; title: string; description: string; clientName?: string; priority: string; type: string; timestamp: string }[]
  recommendations: string[]
  memorySummary: string
  reasoning?: {
    observations: string[]
    diagnosis: string
    hypotheses: { title: string; probability: number; action: string }[]
  }
  predictions?: {
    summary: string
    confidence: number
    confidenceLabel?: string
    confidenceFactors?: { name: string; status: string; detail: string; score: number }[]
    warnings: { indicator: string; daysToThreshold: number; severity: string; recommendation: string }[]
    scenarios: { name: string; label: string; probability: number; summary: string }[]
  }
}

export function ExecutiveBriefPanel() {
  const [brief, setBrief] = useState<ExecutiveBrief | null>(null)
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [asking, setAsking] = useState(false)
  const [showReasoning, setShowReasoning] = useState(false)
  const [showPredictions, setShowPredictions] = useState(false)

  useEffect(() => {
    fetch("/api/executive?companyId=default&companyName=Directorio").then((r) => r.json()).then(setBrief)
  }, [])

  const ask = async () => {
    if (!question.trim()) return
    setAsking(true)
    const res = await fetch(`/api/executive?companyId=default&question=${encodeURIComponent(question)}`)
    const data = await res.json()
    setAnswer(data.answer)
    setAsking(false)
  }

  if (!brief) return <div className="animate-pulse rounded-xl bg-surface-800/50 p-6"><div className="h-4 w-48 rounded bg-surface-700/50" /></div>

  return (
    <div className="rounded-xl border border-surface-700/50 bg-gradient-to-br from-surface-800 to-surface-900 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-surface-100">{brief.greeting}</h2>
          <p className="text-xs text-surface-400">{brief.date}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">Executive AI</span>
          {brief.reasoning && (
            <button onClick={() => setShowReasoning(!showReasoning)}
              className="rounded-full bg-surface-700/50 px-2 py-0.5 text-[10px] text-surface-300 hover:bg-surface-600">
              {showReasoning ? "Ocultar análisis" : "Ver análisis"}
            </button>
          )}
          {brief.predictions && (
            <button onClick={() => setShowPredictions(!showPredictions)}
              className="rounded-full bg-surface-700/50 px-2 py-0.5 text-[10px] text-surface-300 hover:bg-surface-600">
              {showPredictions ? "Ocultar pronóstico" : "Ver pronóstico"}
            </button>
          )}
        </div>
      </div>

      {/* Alert Bar */}
      {brief.criticalCount > 0 && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-300">
            🔴 <strong>{brief.criticalCount}</strong> {brief.criticalCount === 1 ? "alerta crítica requiere" : "alertas críticas requieren"} atención inmediata
          </p>
        </div>
      )}

      {/* Predictions Panel */}
      {showPredictions && brief.predictions && (
        <div className="mb-4 rounded-lg border border-blue-600/20 bg-blue-600/5 p-4">
          <h3 className="mb-2 text-xs font-semibold text-blue-300">🔮 Pronóstico del Executive Brain</h3>
          <div className="mb-2 flex items-baseline gap-2">
            <span className="text-lg font-bold text-blue-300">{brief.predictions.confidence}%</span>
            <span className="text-[10px] text-blue-400">{brief.predictions.confidenceLabel}</span>
          </div>
          {brief.predictions.confidenceFactors && (
            <div className="mb-3 grid grid-cols-2 gap-1">
              {brief.predictions.confidenceFactors.map((f, i) => (
                <div key={i} className="flex items-center gap-1 rounded bg-surface-900/30 px-2 py-1">
                  <span className="text-[10px]">{f.status === "positive" ? "✅" : f.status === "negative" ? "⚠️" : "➖"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-surface-300 truncate">{f.name}</p>
                    <div className="h-1 w-full rounded-full bg-surface-800">
                      <div className={`h-1 rounded-full ${f.score >= 70 ? "bg-green-500" : f.score >= 40 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${f.score}%` }} />
                    </div>
                  </div>
                  <span className="text-[9px] text-surface-500">{f.score}%</span>
                </div>
              ))}
            </div>
          )}
          <p className="mb-3 text-xs text-surface-300">{brief.predictions.summary}</p>

          {brief.predictions.warnings.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] font-medium text-surface-500 mb-1">Alertas tempranas</p>
              {brief.predictions.warnings.map((w, i) => (
                <div key={i} className="mb-1 rounded bg-surface-900/50 p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-surface-200">{w.indicator}</span>
                    <span className={`text-[10px] ${w.severity === "critical" ? "text-red-400" : w.severity === "high" ? "text-amber-400" : "text-surface-400"}`}>
                      {w.daysToThreshold} días
                    </span>
                  </div>
                  <p className="text-[10px] text-surface-400">{w.recommendation}</p>
                </div>
              ))}
            </div>
          )}

          {brief.predictions.scenarios.length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-surface-500 mb-1">Escenarios</p>
              {brief.predictions.scenarios.map((s, i) => (
                <div key={i} className="mb-1 flex items-center justify-between rounded bg-surface-900/50 p-2">
                  <div>
                    <span className="text-xs text-surface-200">{s.label}</span>
                    <p className="text-[10px] text-surface-400">{s.summary.slice(0, 80)}...</p>
                  </div>
                  <span className="text-[10px] text-surface-500">{s.probability}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reasoning Panel */}
      {showReasoning && brief.reasoning && (
        <div className="mb-4 rounded-lg border border-accent-600/20 bg-accent-600/5 p-4">
          <h3 className="mb-2 text-xs font-semibold text-accent-300">🧠 Razonamiento del Executive Brain</h3>

          {brief.reasoning.observations.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] font-medium text-surface-500 mb-1">Observaciones</p>
              {brief.reasoning.observations.map((o, i) => (
                <p key={i} className="text-xs text-surface-300">{o}</p>
              ))}
            </div>
          )}

          <div className="mb-3">
            <p className="text-[10px] font-medium text-surface-500 mb-1">Diagnóstico</p>
            <p className="text-xs text-surface-300">{brief.reasoning.diagnosis}</p>
          </div>

          {brief.reasoning.hypotheses.length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-surface-500 mb-1">Hipótesis</p>
              {brief.reasoning.hypotheses.map((h, i) => (
                <div key={i} className="mb-2 rounded-lg bg-surface-900/50 p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-surface-200">{h.title}</span>
                    <span className="text-[10px] text-accent-400">{h.probability}%</span>
                  </div>
                  <p className="text-[10px] text-surface-400">{h.action}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Metrics */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {brief.metrics.map((m) => (
          <div key={m.name} className="rounded-lg bg-surface-900/50 p-3">
            <p className="text-2xl font-bold text-surface-100">{m.value}</p>
            <p className="text-xs text-surface-400">{m.name}</p>
            <span className={`text-[10px] ${m.status === "critical" ? "text-red-400" : m.status === "warning" ? "text-amber-400" : "text-emerald-400"}`}>
              {m.direction === "up" ? "↑" : m.direction === "down" ? "↓" : "→"}
            </span>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {brief.criticalItems.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-red-300">🔴 Requiere atención</h3>
            <div className="space-y-2">
              {brief.criticalItems.map((item) => (
                <div key={item.id} className="rounded-lg border border-red-500/10 bg-red-500/5 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-surface-200">{item.title}</p>
                    {item.clientName && <span className="text-[10px] text-surface-500">{item.clientName}</span>}
                  </div>
                  <p className="text-xs text-surface-400">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="mb-3 text-sm font-semibold text-accent-300">💡 Recomendaciones</h3>
          <div className="space-y-2">
            {brief.recommendations.map((r, i) => (
              <div key={i} className="rounded-lg bg-surface-900/50 p-3">
                <p className="text-sm text-surface-300">{i + 1}. {r}</p>
              </div>
            ))}
          </div>
        </div>

        {brief.risks.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-amber-300">⚠️ Riesgos activos</h3>
            <div className="space-y-2">
              {brief.risks.map((r) => (
                <div key={r.id} className="rounded-lg border border-amber-500/10 bg-amber-500/5 p-3">
                  <p className="text-sm font-medium text-surface-200">{r.title}</p>
                  <p className="text-xs text-surface-400">{r.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {brief.opportunities.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-emerald-300">✅ Oportunidades</h3>
            <div className="space-y-2">
              {brief.opportunities.map((o) => (
                <div key={o.id} className="rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-3">
                  <p className="text-sm font-medium text-surface-200">{o.title}</p>
                  <p className="text-xs text-surface-400">{o.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Memory Summary */}
      <div className="mt-4 rounded-lg bg-surface-900/30 p-3">
        <p className="mb-1 text-xs font-medium text-surface-400">🧠 Memoria reciente</p>
        <pre className="whitespace-pre-wrap text-[11px] text-surface-500 font-mono">{brief.memorySummary}</pre>
      </div>

      {/* Question Input */}
      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          placeholder="Pregunta al Executive AI (ej: ¿por qué cayó la liquidez?, ¿qué va a pasar?, ¿qué recomiendas?)..."
          className="flex-1 rounded-lg border border-surface-600/50 bg-surface-800 px-3 py-2 text-xs text-surface-200 placeholder:text-surface-500"
        />
        <button onClick={ask} disabled={asking}
          className="rounded-lg bg-accent-600 px-4 py-2 text-xs font-medium text-white hover:bg-accent-500 disabled:opacity-50">
          {asking ? "..." : "Consultar"}
        </button>
      </div>
      {answer && (
        <div className="mt-3 rounded-lg border border-accent-600/20 bg-surface-800/80 p-3">
          <p className="text-xs text-surface-300 whitespace-pre-wrap">{answer}</p>
        </div>
      )}
    </div>
  )
}
