"use client"

import { useState, useEffect, useCallback } from "react"
import type { BusinessCase, CaseStat, CaseSimilarityResult } from "@/core/learning"

export function BusinessCaseLibrary() {
  const [cases, setCases] = useState<BusinessCase[]>([])
  const [stats, setStats] = useState<CaseStat | null>(null)
  const [selectedCase, setSelectedCase] = useState<BusinessCase | null>(null)
  const [searchProblem, setSearchProblem] = useState("")
  const [searchResults, setSearchResults] = useState<CaseSimilarityResult[]>([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<"library" | "search" | "register">("library")

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [casesRes, statsRes] = await Promise.all([
        fetch("/api/learning"),
        fetch("/api/learning?stats=true"),
      ])
      if (casesRes.ok) setCases(await casesRes.json())
      if (statsRes.ok) setStats(await statsRes.json())
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const search = async () => {
    if (!searchProblem.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/learning?problem=${encodeURIComponent(searchProblem)}&limit=5`)
      if (res.ok) setSearchResults(await res.json())
    } catch {} finally { setLoading(false) }
  }

  const impactColors: Record<string, string> = {
    transformational: "bg-purple-100 text-purple-800",
    significant: "bg-blue-100 text-blue-800",
    moderate: "bg-green-100 text-green-800",
    minimal: "bg-yellow-100 text-yellow-800",
    negative: "bg-red-100 text-red-800",
  }

  const statusColors: Record<string, string> = {
    completed: "bg-green-100 text-green-800",
    partial: "bg-yellow-100 text-yellow-800",
    failed: "bg-red-100 text-red-800",
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Business Case Library</h2>
          <div className="flex gap-2">
            <button onClick={() => setTab("library")} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === "library" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>Biblioteca</button>
            <button onClick={() => setTab("search")} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === "search" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>Búsqueda Semántica</button>
          </div>
        </div>

        {/* Stats dashboard */}
        {stats && (
          <div className="grid grid-cols-5 gap-3 mb-6">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Casos</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-700">{stats.averageEffectiveness}%</p>
              <p className="text-xs text-green-600">Efectividad Promedio</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-700">{stats.averageROI}%</p>
              <p className="text-xs text-blue-600">ROI Promedio</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-purple-700">${(stats.totalCostSaved / 1000).toFixed(0)}K</p>
              <p className="text-xs text-purple-600">Costo Ahorrado</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-orange-700">${(stats.totalRevenueImpact / 1000).toFixed(0)}K</p>
              <p className="text-xs text-orange-600">Impacto en Ingresos</p>
            </div>
          </div>
        )}

        {/* Lecciones + Errores más frecuentes */}
        {stats && stats.topLessons.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Lecciones Más Frecuentes</h3>
              <div className="space-y-1">
                {stats.topLessons.map((l, i) => (
                  <div key={i} className="flex items-center justify-between text-sm bg-green-50 rounded-lg px-3 py-1.5">
                    <span className="text-green-800 truncate">{l.lesson}</span>
                    <span className="text-green-600 font-medium ml-2">{l.count}x</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Errores Más Frecuentes</h3>
              <div className="space-y-1">
                {stats.topErrors.map((e, i) => (
                  <div key={i} className="flex items-center justify-between text-sm bg-red-50 rounded-lg px-3 py-1.5">
                    <span className="text-red-800 truncate">{e.lesson}</span>
                    <span className="text-red-600 font-medium ml-2">{e.count}x</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tab: Library */}
      {tab === "library" && (
        <div className="p-6">
          {loading && <p className="text-gray-500 text-center py-4">Cargando...</p>}
          {!loading && cases.length === 0 && (
            <p className="text-gray-500 text-center py-8">No hay casos registrados. Completa un plan estratégico y registra sus resultados aquí.</p>
          )}
          <div className="grid gap-4">
            {cases.map((c) => (
              <div key={c.id} onClick={() => setSelectedCase(selectedCase?.id === c.id ? null : c)} className={`p-4 rounded-xl border cursor-pointer transition-colors ${selectedCase?.id === c.id ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-400"}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{c.problem.slice(0, 120)}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{c.clientName || c.clientId || "Anónimo"} · {c.industry || "N/A"} · {c.companySize || "N/A"}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${impactColors[c.impact]}`}>{c.impact}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[c.status]}`}>{c.status}</span>
                  </div>
                </div>
                <div className="flex gap-4 text-sm text-gray-500">
                  <span>ROI: <strong className={c.rentabilidad > 0 ? "text-green-600" : "text-red-600"}>{c.rentabilidad}%</strong></span>
                  <span>Efectividad: <strong className="text-blue-600">{c.effectivenessScore}%</strong></span>
                  <span>{c.tiempoMeses} meses</span>
                  <span>${c.costTotal.toLocaleString()}</span>
                </div>

                {selectedCase?.id === c.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                    <p className="text-sm text-gray-700"><strong>Diagnóstico:</strong> {c.diagnosis || "No registrado"}</p>
                    <p className="text-sm text-gray-700"><strong>Plan:</strong> {c.planSummary}</p>
                    <p className="text-sm text-gray-700"><strong>Resultado:</strong> {c.result}</p>
                    {c.resultadoCuantitativo && (
                      <div className="grid grid-cols-4 gap-2">
                        {c.resultadoCuantitativo.revenueImpact !== undefined && (
                          <div className="bg-green-50 rounded p-2 text-center">
                            <p className="text-xs text-green-600">Impacto Ingresos</p>
                            <p className="text-sm font-semibold text-green-800">${c.resultadoCuantitativo.revenueImpact.toLocaleString()}</p>
                          </div>
                        )}
                        {c.resultadoCuantitativo.costReduction !== undefined && (
                          <div className="bg-blue-50 rounded p-2 text-center">
                            <p className="text-xs text-blue-600">Reducción Costos</p>
                            <p className="text-sm font-semibold text-blue-800">${c.resultadoCuantitativo.costReduction.toLocaleString()}</p>
                          </div>
                        )}
                        {c.resultadoCuantitativo.marginImprovement !== undefined && (
                          <div className="bg-purple-50 rounded p-2 text-center">
                            <p className="text-xs text-purple-600">Mejora Margen</p>
                            <p className="text-sm font-semibold text-purple-800">{c.resultadoCuantitativo.marginImprovement}%</p>
                          </div>
                        )}
                        {c.resultadoCuantitativo.liquidityImprovement !== undefined && (
                          <div className="bg-orange-50 rounded p-2 text-center">
                            <p className="text-xs text-orange-600">Mejora Liquidez</p>
                            <p className="text-sm font-semibold text-orange-800">{c.resultadoCuantitativo.liquidityImprovement}%</p>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-4">
                      {c.lecciones.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-green-700 mb-1">Lecciones</p>
                          <ul className="text-xs text-gray-600 list-disc list-inside space-y-0.5">
                            {c.lecciones.map((l, i) => <li key={i}>{l}</li>)}
                          </ul>
                        </div>
                      )}
                      {c.errores.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-red-700 mb-1">Errores</p>
                          <ul className="text-xs text-gray-600 list-disc list-inside space-y-0.5">
                            {c.errores.map((e, i) => <li key={i}>{e}</li>)}
                          </ul>
                        </div>
                      )}
                      {c.aciertos.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-blue-700 mb-1">Aciertos</p>
                          <ul className="text-xs text-gray-600 list-disc list-inside space-y-0.5">
                            {c.aciertos.map((a, i) => <li key={i}>{a}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {c.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Semantic Search */}
      {tab === "search" && (
        <div className="p-6">
          <div className="flex gap-2 mb-4">
            <input type="text" value={searchProblem} onChange={(e) => setSearchProblem(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="Describe un problema: Ej: Cliente con problemas de liquidez y deuda alta" className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none" />
            <button onClick={search} disabled={loading || !searchProblem.trim()} className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors">Buscar Casos Similares</button>
          </div>

          {searchResults.length === 0 && !loading && (
            <p className="text-gray-500 text-center py-8">Describe un problema empresarial para encontrar casos similares en la biblioteca.</p>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">{searchResults.length} casos similares encontrados</p>
              {searchResults.map((r) => (
                <div key={r.case.id} className="p-4 rounded-xl border border-gray-200 hover:border-gray-400 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{r.case.problem.slice(0, 100)}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{r.case.clientName || "Anónimo"} · {r.case.industry || "N/A"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-900">{r.similarity}%</span>
                      <span className="text-xs text-gray-500">similitud</span>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-500 mb-2">
                    <span>Efectividad: <strong>{r.case.effectivenessScore}%</strong></span>
                    <span>ROI: <strong>{r.case.rentabilidad}%</strong></span>
                    <span>Impacto: <strong className="capitalize">{r.case.impact}</strong></span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {r.matchingFactors.map((f, i) => (
                      <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{f}</span>
                    ))}
                  </div>
                  {r.case.lecciones.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-600 mb-1">Lecciones aplicables:</p>
                      <ul className="text-xs text-gray-500 list-disc list-inside">
                        {r.case.lecciones.slice(0, 3).map((l, i) => <li key={i}>{l}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* By category breakdown */}
      {stats && (
        <div className="p-6 border-t border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Casos por Categoría</h3>
          <div className="grid grid-cols-5 gap-3">
            {Object.entries(stats.byCategory).map(([cat, count]) => (
              <div key={cat} className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-lg font-semibold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500 capitalize">{cat.replace(/_/g, " ")}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
