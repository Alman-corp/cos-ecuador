"use client"

import { useState, useEffect, useCallback } from "react"
import type { EnterpriseGenome, DimensionScore } from "@/core/genome"

export function GenomeViewer({ companyId = "demo-company", companyName = "Corporación Demo" }: { companyId?: string; companyName?: string }) {
  const [genome, setGenome] = useState<EnterpriseGenome | null>(null)
  const [analysis, setAnalysis] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedDim, setSelectedDim] = useState<string | null>(null)

  const analyze = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/genome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyze",
          companyId,
          companyName,
          industry: "consultoria",
          size: "pyme",
        }),
      })
      if (res.ok) setGenome(await res.json())
    } catch {} finally { setLoading(false); setAnalysis(true) }
  }, [companyId, companyName])

  useEffect(() => { if (!analysis) analyze() }, [analysis, analyze])

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-green-400"
    if (score >= 60) return "text-blue-400"
    if (score >= 40) return "text-yellow-400"
    return "text-red-400"
  }

  const barColor = (score: number) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 60) return "bg-blue-500"
    if (score >= 40) return "bg-yellow-500"
    return "bg-red-500"
  }

  const trendIcon = (trend: string) => {
    if (trend === "up") return "↑"
    if (trend === "down") return "↓"
    return "→"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface-900 border border-surface-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-surface-50">Enterprise Genome</h2>
            <p className="text-sm text-surface-400">{companyName} · {genome?.industry || "N/A"} · {genome?.size || "N/A"}</p>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${scoreColor(genome?.overallScore || 0)}`}>
              {genome?.overallScore || "--"}
            </div>
            <p className="text-xs text-surface-500">Puntaje Global</p>
          </div>
        </div>

        {loading && <p className="text-center text-surface-400 py-8">Analizando genoma empresarial...</p>}

        {genome && (
          <>
            {/* Overall confidence bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs text-surface-500 mb-1">
                <span>Confianza del análisis</span>
                <span>{genome.overallConfidence}%</span>
              </div>
              <div className="w-full bg-surface-800 rounded-full h-1.5">
                <div className="h-1.5 rounded-full bg-purple-500 transition-all" style={{ width: `${genome.overallConfidence}%` }} />
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="text-xs font-semibold text-green-400 mb-2">✅ Fortalezas</h3>
                {genome.strengths.length === 0 && <p className="text-xs text-surface-500">Sin datos suficientes</p>}
                {genome.strengths.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-surface-300 mb-1">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="font-medium">{s.dimension}:</span>
                    <span>{s.factor}</span>
                    <span className="text-green-400 ml-auto">{s.score}</span>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="text-xs font-semibold text-red-400 mb-2">⚠️ Debilidades</h3>
                {genome.weaknesses.length === 0 && <p className="text-xs text-surface-500">Sin datos suficientes</p>}
                {genome.weaknesses.map((w, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-surface-300 mb-1">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="font-medium">{w.dimension}:</span>
                    <span>{w.factor}</span>
                    <span className="text-red-400 ml-auto">{w.score}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dimension Grid */}
            <div className="grid grid-cols-2 gap-3">
              {genome.dimensions.map((dim) => (
                <div
                  key={dim.dimension}
                  onClick={() => setSelectedDim(selectedDim === dim.dimension ? null : dim.dimension)}
                  className="bg-surface-800/50 rounded-lg p-3 border border-surface-700/30 cursor-pointer hover:border-surface-600 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-surface-200">{dim.label}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${scoreColor(dim.score)}`}>{dim.score}</span>
                      <span className="text-xs text-surface-500">{trendIcon(dim.trend)}</span>
                    </div>
                  </div>

                  <div className="w-full bg-surface-800 rounded-full h-1.5 mb-2">
                    <div className={`h-1.5 rounded-full transition-all ${barColor(dim.score)}`} style={{ width: `${dim.score}%` }} />
                  </div>

                  <p className="text-[10px] text-surface-500">{dim.description}</p>

                  {/* Expanded factors */}
                  {selectedDim === dim.dimension && (
                    <div className="mt-3 pt-3 border-t border-surface-700/30 space-y-1.5">
                      {dim.factors.map((f, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-surface-400">{f.name}</span>
                              <span className={`text-[10px] font-medium ${scoreColor(f.value)}`}>{f.value}</span>
                            </div>
                            <div className="w-full bg-surface-800 rounded-full h-1">
                              <div className={`h-1 rounded-full ${barColor(f.value)}`} style={{ width: `${f.value}%` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                      <p className="text-[9px] text-surface-600 mt-1">
                        Confianza: {dim.confidence}% · Fuente: {dim.factors[0]?.source || "Sin datos"}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Recommendations */}
            {genome.recommendations.length > 0 && (
              <div className="mt-6 bg-blue-600/5 border border-blue-600/20 rounded-lg p-4">
                <h3 className="text-xs font-semibold text-blue-300 mb-2">🎯 Recomendaciones</h3>
                <ul className="space-y-1">
                  {genome.recommendations.map((r, i) => (
                    <li key={i} className="text-xs text-surface-300 flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
