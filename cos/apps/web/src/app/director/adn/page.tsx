"use client"

import { useEffect, useState } from "react"

interface DnaSummary {
  version: string
  lastUpdated: string
  totalRules: number
  enabledRules: number
  totalThresholds: number
  totalPatterns: number
  totalScales: number
  totalKnowledge: number
  categories: string[]
}

type Tab = "summary" | "rules" | "thresholds" | "patterns" | "scales" | "knowledge"

export default function AdnPage() {
  const [summary, setSummary] = useState<DnaSummary | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>("summary")
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSection = async (tab: Tab) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/consulting-dna?section=${tab}`)
      if (tab === "summary") {
        setSummary(await res.json())
        setData([])
      } else {
        setData(await res.json())
        setSummary(null)
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchSection("summary") }, [])

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "summary", label: "Resumen", icon: "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" },
    { key: "rules", label: "Reglas", icon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" },
    { key: "thresholds", label: "Riesgos", icon: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" },
    { key: "patterns", label: "Recomendaciones", icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" },
    { key: "scales", label: "Madurez", icon: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" },
    { key: "knowledge", label: "Conocimiento", icon: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-50">ADN de Consultoría</h1>
          <p className="text-sm text-surface-400">Base de conocimiento, reglas, criterios y patrones del sistema</p>
        </div>
        {summary && (
          <div className="flex items-center gap-3 text-xs text-surface-500">
            <span>v{summary.version}</span>
            <span>·</span>
            <span>Actualizado: {summary.lastUpdated}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-surface-800/50 p-1">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); fetchSection(tab.key) }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-accent-600 text-white shadow-sm"
                : "text-surface-400 hover:text-surface-200"
            }`}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Summary */}
      {activeTab === "summary" && summary && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 lg:grid-cols-6">
            {[
              { label: "Reglas", value: summary.totalRules, sub: `${summary.enabledRules} activas`, color: "text-accent-400" },
              { label: "Umbrales Riesgo", value: summary.totalThresholds, sub: "14 indicadores", color: "text-rose-400" },
              { label: "Patrones", value: summary.totalPatterns, sub: "recomendaciones", color: "text-emerald-400" },
              { label: "Escalas Madurez", value: summary.totalScales, sub: "5 dimensiones", color: "text-amber-400" },
              { label: "Knowledge Base", value: summary.totalKnowledge, sub: "entradas", color: "text-violet-400" },
              { label: "Categorías", value: summary.categories.length, sub: "dominios", color: "text-sky-400" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-sm font-medium text-surface-200">{s.label}</p>
                <p className="text-xs text-surface-500">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Categories */}
          <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
            <h3 className="mb-4 text-sm font-semibold text-surface-200">Categorías del Sistema</h3>
            <div className="flex flex-wrap gap-2">
              {summary.categories.map((cat) => (
                <span key={cat} className="rounded-full bg-surface-700/50 px-3 py-1.5 text-xs capitalize text-surface-300">
                  {cat}
                </span>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
            <h3 className="mb-2 text-sm font-semibold text-surface-200">¿Qué es el ADN de Consultoría?</h3>
            <p className="text-sm text-surface-400 leading-relaxed">
              Es la base de conocimiento del sistema que define cómo la plataforma piensa, evalúa y recomienda.
              Contiene las reglas de evaluación financiera, criterios de riesgo, patrones de recomendación,
              escalas de madurez y una base de conocimiento normativa y metodológica.
              Todo el sistema (Copilot, análisis, estrategia) referencia este ADN para tomar decisiones consistentes.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-5">
              {[
                { title: "Reglas", desc: "Condiciones y acciones para evaluar cada indicador financiero y operativo" },
                { title: "Umbrales de Riesgo", desc: "Valores críticos que determinan nivel de riesgo por indicador" },
                { title: "Patrones", desc: "Plantillas de recomendación activadas por condiciones específicas" },
                { title: "Escalas", desc: "Niveles de madurez en 5 dimensiones con criterios por nivel" },
                { title: "Knowledge", desc: "Normativa, metodologías, benchmarks y mejores prácticas" },
              ].map((item) => (
                <div key={item.title} className="rounded-lg bg-surface-900/30 p-3">
                  <p className="text-xs font-semibold text-surface-200 mb-1">{item.title}</p>
                  <p className="text-xs text-surface-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Rules / Thresholds / Patterns List */}
      {activeTab !== "summary" && activeTab !== "knowledge" && (
        <div className="space-y-3">
          {loading ? (
            <p className="text-sm text-surface-500">Cargando...</p>
          ) : data.length === 0 ? (
            <p className="text-sm text-surface-500">Sin datos en esta sección</p>
          ) : (
            data.map((item: any, i) => (
              <div key={item.id || i} className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-surface-200">{item.name || item.title}</p>
                    <p className="text-xs text-surface-500 mt-0.5 capitalize">
                      {item.category} · v{item.version || "1.0"}
                      {item.priority && <span> · {item.priority}</span>}
                    </p>
                  </div>
                  {item.enabled !== undefined && (
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      item.enabled ? "bg-emerald-500/10 text-emerald-400" : "bg-surface-700/30 text-surface-500"
                    }`}>{item.enabled ? "Activa" : "Inactiva"}</span>
                  )}
                </div>
                <p className="text-xs text-surface-400 mb-3">{item.description}</p>
                {item.condition && (
                  <div className="mb-2">
                    <span className="text-xs font-medium text-amber-400">Condición:</span>
                    <code className="ml-2 rounded bg-surface-900/50 px-2 py-0.5 text-xs text-amber-300">{item.condition}</code>
                  </div>
                )}
                {item.action && (
                  <div className="mb-2">
                    <span className="text-xs font-medium text-emerald-400">Acción:</span>
                    <p className="mt-0.5 text-xs text-surface-400">{item.action}</p>
                  </div>
                )}
                {item.template && (
                  <div className="mb-2">
                    <span className="text-xs font-medium text-accent-400">Template:</span>
                    <p className="mt-0.5 text-xs text-surface-400">{item.template}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {item.tags?.map((tag: string) => (
                    <span key={tag} className="rounded-full bg-surface-700/30 px-2 py-0.5 text-[10px] text-surface-500">
                      {tag}
                    </span>
                  ))}
                  {(item.low !== undefined) && (
                    <span className="text-[10px] text-surface-500">
                      Rangos: Bajo &lt;{item.low} · Medio &lt;{item.medium} · Alto &lt;{item.high} · Crítico &lt;{item.critical}
                    </span>
                  )}
                </div>
                {item.examples && item.examples.length > 0 && (
                  <details className="mt-3">
                    <summary className="text-xs text-surface-500 cursor-pointer hover:text-surface-300">Ejemplos</summary>
                    <ul className="mt-2 space-y-1">
                      {item.examples.map((ex: string, j: number) => (
                        <li key={j} className="rounded bg-surface-900/30 p-2 text-xs text-surface-400">• {ex}</li>
                      ))}
                    </ul>
                  </details>
                )}
                {item.levels && (
                  <div className="mt-3 space-y-2">
                    {item.levels.map((lvl: any) => (
                      <div key={lvl.level} className="rounded-lg bg-surface-900/30 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                            lvl.level <= 2 ? "bg-rose-500/20 text-rose-400" :
                            lvl.level <= 3 ? "bg-amber-500/20 text-amber-400" :
                            "bg-emerald-500/20 text-emerald-400"
                          }`}>{lvl.level}</span>
                          <span className="text-xs font-semibold text-surface-200">{lvl.label}</span>
                        </div>
                        <p className="text-xs text-surface-400 mb-1">{lvl.description}</p>
                        <ul className="space-y-0.5">
                          {lvl.criteria?.map((c: string, k: number) => (
                            <li key={k} className="text-[10px] text-surface-500">· {c}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Knowledge Base */}
      {activeTab === "knowledge" && (
        <div className="space-y-3">
          {loading ? (
            <p className="text-sm text-surface-500">Cargando...</p>
          ) : data.length === 0 ? (
            <p className="text-sm text-surface-500">Sin entradas de conocimiento</p>
          ) : (
            data.map((entry: any, i) => (
              <div key={entry.id || i} className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-surface-200">{entry.title}</p>
                    <p className="text-xs text-surface-500 mt-0.5 capitalize">{entry.type.replace(/_/g, " ")} · {entry.category} {entry.jurisdiction ? `· ${entry.jurisdiction}` : ""}</p>
                  </div>
                  <span className="rounded-full bg-surface-700/30 px-2.5 py-0.5 text-[10px] capitalize text-surface-400">{entry.type.replace(/_/g, " ")}</span>
                </div>
                <p className="text-xs text-surface-400 mb-2">{entry.description}</p>
                <div className="rounded-lg bg-surface-900/30 p-3">
                  <p className="text-xs text-surface-300 leading-relaxed">{entry.content}</p>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {entry.tags?.map((tag: string) => (
                    <span key={tag} className="rounded-full bg-surface-700/30 px-2 py-0.5 text-[10px] text-surface-500">{tag}</span>
                  ))}
                </div>
                {entry.url && (
                  <p className="mt-2 text-xs text-accent-400">{entry.url}</p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
