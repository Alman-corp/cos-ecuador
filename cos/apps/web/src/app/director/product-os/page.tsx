"use client"

import { useEffect, useState } from "react"

type Tab = "dashboard" | "architecture" | "pricing" | "roadmap" | "risks" | "competitive" | "investment" | "ai" | "icps" | "beta"

export default function ProductOSPage() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard")
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchTab = async (tab: Tab) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/product-os?section=${tab === "dashboard" ? "summary" : tab === "ai" ? "ai-strategy" : tab === "icps" ? "icps" : tab}`)
      setData(await res.json())
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchTab("dashboard") }, [])

  const tabs: { key: Tab; label: string }[] = [
    { key: "dashboard", label: "Dashboard" },
    { key: "architecture", label: "Arquitectura" },
    { key: "pricing", label: "Pricing" },
    { key: "roadmap", label: "Roadmap" },
    { key: "risks", label: "Riesgos" },
    { key: "competitive", label: "Competitivo" },
    { key: "investment", label: "Inversión" },
    { key: "ai", label: "Estrategia IA" },
    { key: "icps", label: "ICP" },
    { key: "beta", label: "Beta Program" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-50">Product Operating System</h1>
          <p className="text-sm text-surface-400">Estrategia, métricas, roadmap y decisiones de producto</p>
        </div>
        {data?.stage && <span className="rounded-full bg-accent-500/10 px-3 py-1 text-xs font-medium capitalize text-accent-400">Fase: {data.stage}</span>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-surface-800/50 p-1">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => { setActiveTab(t.key); fetchTab(t.key) }}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === t.key ? "bg-accent-600 text-white shadow-sm" : "text-surface-400 hover:text-surface-200"
            }`}>{t.label}</button>
        ))}
      </div>

      {/* DASHBOARD */}
      {activeTab === "dashboard" && data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {[
              { label: "Métricas definidas", value: data.totalMetrics, color: "text-sky-400" },
              { label: "Métricas activas", value: data.activeMetrics, color: "text-emerald-400" },
              { label: "Roadmap completado", value: data.roadmapCompleted, color: "text-emerald-400" },
              { label: "En progreso", value: data.roadmapInProgress, color: "text-amber-400" },
              { label: "Planificados", value: data.roadmapPlanned, color: "text-surface-400" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-surface-500">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: "Riesgos críticos", value: data.criticalRisks, total: data.totalRisks, color: "text-rose-400" },
              { label: "Planes de pricing", value: data.pricingTiers, unit: "tiers", color: "text-accent-400" },
              { label: "Segmentos ICP", value: data.icpCount, unit: "definidos", color: "text-emerald-400" },
              { label: "Competidores", value: data.competitors, unit: "analizados", color: "text-amber-400" },
            ].map((s: any) => (
              <div key={s.label} className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-4">
                <p className={`text-lg font-bold ${s.color}`}>
                  {s.value}{s.total !== undefined ? `/${s.total}` : ""}{s.unit ? ` ${s.unit}` : ""}
                </p>
                <p className="text-xs text-surface-500">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
            <h3 className="mb-4 text-sm font-semibold text-surface-200">North Star Metric</h3>
            <div className="rounded-lg border border-accent-600/30 bg-accent-600/5 p-4">
              <p className="text-sm font-medium text-accent-400">Empresas con Análisis Activo</p>
              <p className="mt-1 text-xs text-surface-400">Empresas que generaron al menos un análisis completo en los últimos 30 días. Todo el producto optimiza esta métrica.</p>
            </div>
          </div>

          <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
            <h3 className="mb-4 text-sm font-semibold text-surface-200">Métricas de Producto</h3>
            <div className="grid gap-3 lg:grid-cols-2">
              {[
                { cat: "adopcion", label: "Adopción", color: "text-sky-400" },
                { cat: "activacion", label: "Activación", color: "text-emerald-400" },
                { cat: "retencion", label: "Retención", color: "text-accent-400" },
                { cat: "monetizacion", label: "Monetización", color: "text-amber-400" },
                { cat: "ia", label: "Inteligencia Artificial", color: "text-violet-400" },
                { cat: "calidad", label: "Calidad", color: "text-rose-400" },
              ].map((cat) => (
                <div key={cat.cat} className="rounded-lg bg-surface-900/30 p-3">
                  <p className={`text-xs font-semibold ${cat.color} mb-2 uppercase tracking-wider`}>{cat.label}</p>
                  {data.metrics?.filter?.((m: any) => m.category === cat.cat).map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between py-1">
                      <span className="text-xs text-surface-400">{m.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-surface-500">{m.target}</span>
                        {m.current !== null ? (
                          <span className="text-xs font-medium text-emerald-400">{m.current}{m.unit === "porcentaje" ? "%" : ""}</span>
                        ) : (
                          <span className="text-xs text-surface-600">—</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ARCHITECTURE */}
      {activeTab === "architecture" && data && (
        <div className="space-y-6">
          {/* Kernel Layers */}
          <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
            <h3 className="text-sm font-semibold text-surface-200 mb-4">Business Intelligence Kernel</h3>
            <p className="text-xs text-surface-400 mb-4">Núcleo compartido que todos los verticales reutilizan. Cada capa tiene estado: implementado, parcial o planificado.</p>
            <div className="grid gap-3 lg:grid-cols-2">
              {data.kernel?.layers?.map((layer: any) => (
                <div key={layer.name} className="rounded-lg bg-surface-900/30 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-surface-200">{layer.name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      layer.status === "implemented" ? "bg-emerald-500/10 text-emerald-400" :
                      layer.status === "partial" ? "bg-amber-500/10 text-amber-400" :
                      "bg-surface-700/30 text-surface-500"
                    }`}>{layer.status}</span>
                  </div>
                  <p className="text-xs text-surface-400 mb-2">{layer.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {layer.components?.map((c: string) => (
                      <span key={c} className="rounded bg-surface-800 px-1.5 py-0.5 text-[10px] text-surface-500">{c}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vertical Intelligence Packs */}
          <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
            <h3 className="text-sm font-semibold text-surface-200 mb-4">Vertical Intelligence Platforms (VIPs)</h3>
            <p className="text-xs text-surface-400 mb-4">Productos verticales que corren sobre el mismo kernel. Cada uno tiene su propio DNA especializado.</p>
            <div className="grid gap-4 lg:grid-cols-2">
              {data.verticalPacks?.map((pack: any) => (
                <div key={pack.id} className={`rounded-xl border p-5 ${
                  pack.status === "active" ? "border-accent-600/30 bg-accent-600/5" : "border-surface-700/30 bg-surface-900/30"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-surface-200">{pack.name}</p>
                      <p className="text-xs text-surface-500 italic">{pack.tagline}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                      pack.status === "active" ? "bg-emerald-500/10 text-emerald-400" :
                      pack.status === "planned" ? "bg-amber-500/10 text-amber-400" :
                      "bg-surface-700/30 text-surface-500"
                    }`}>{pack.status === "active" ? "Activo" : pack.status === "planned" ? "Planificado" : "Próximamente"}</span>
                  </div>
                  <p className="text-xs text-surface-400 mb-2"><strong className="text-surface-300">Audiencia:</strong> {pack.audience}</p>
                  <p className="text-xs text-surface-400 mb-2"><strong className="text-surface-300">Objetivo:</strong> {pack.objective}</p>
                  <details className="group mt-2">
                    <summary className="cursor-pointer text-xs font-medium text-surface-500 hover:text-surface-300">Módulos ({pack.modules?.length})</summary>
                    <ul className="mt-2 space-y-1">
                      {pack.modules?.map((m: string) => (
                        <li key={m} className="flex items-center gap-2 text-xs text-surface-400">
                          <span className="h-1 w-1 rounded-full bg-accent-500" />
                          {m}
                        </li>
                      ))}
                    </ul>
                  </details>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-surface-200">${pack.price}/mes</span>
                    {pack.status === "planned" && <span className="text-[10px] text-surface-500">Por definir en roadmap</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vertical DNA */}
          <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
            <h3 className="text-sm font-semibold text-surface-200 mb-4">Vertical DNA Modules</h3>
            <p className="text-xs text-surface-400 mb-4">Cada vertical tiene un DNA especializado que define reglas, modelos, benchmarks y metodologías propias de su dominio.</p>
            <div className="grid gap-3 lg:grid-cols-2">
              {data.verticalPacks?.map((pack: any) => (
                <div key={`dna-${pack.id}`} className="rounded-lg bg-surface-900/30 p-4">
                  <p className="text-sm font-medium text-surface-200 mb-2">{pack.dnaModules?.[0] || `${pack.name} DNA`}</p>
                  <a href={`/api/product-os?section=vertical-dna&packId=${pack.id}`}
                    className="text-xs text-accent-400 hover:text-accent-300">Ver DNA completo →</a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PRICING */}
      {activeTab === "pricing" && data && (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            {data.map((plan: any) => (
              <div key={plan.tier} className={`rounded-xl border p-6 ${plan.highlighted ? "border-accent-600 bg-accent-600/5 ring-1 ring-accent-600/30" : "border-surface-700/50 bg-surface-800/50"}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-lg font-bold text-surface-50">{plan.name}</p>
                    <p className="text-xs text-surface-400">{plan.description}</p>
                  </div>
                  {plan.highlighted && <span className="rounded-full bg-accent-500/10 px-2.5 py-0.5 text-xs font-medium text-accent-400">Recomendado</span>}
                </div>
                <p className="text-3xl font-bold text-surface-50 mb-4">{plan.priceLabel}</p>
                <div className="space-y-2">
                  {plan.limits?.map((lim: any) => (
                    <div key={lim.feature} className="flex items-center justify-between text-xs">
                      <span className="text-surface-400">{lim.feature}</span>
                      <span className={typeof lim[plan.tier] === "boolean" ? (lim[plan.tier] ? "text-emerald-400" : "text-surface-600") : "text-surface-200"}>
                        {typeof lim[plan.tier] === "boolean" ? (lim[plan.tier] ? "✓" : "—") : lim[plan.tier] === -1 ? "Ilimitado" : lim[plan.tier]}
                        {lim.unit && typeof lim[plan.tier] !== "boolean" && lim[plan.tier] !== -1 ? ` ${lim.unit}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
                {plan.addons?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-surface-700/30">
                    <p className="text-xs font-semibold text-surface-400 mb-2">Add-ons</p>
                    {plan.addons.map((a: any) => (
                      <div key={a.name} className="flex justify-between text-xs text-surface-500 py-1">
                        <span>{a.name}</span>
                        <span>{a.price}{a.unit ? `/${a.unit}` : ""}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
            <h3 className="text-sm font-semibold text-surface-200 mb-2">Estrategia de Precios</h3>
            <p className="text-xs text-surface-400 mb-2">El upgrade de Starter a Professional se activa cuando: (1) el equipo supera 1 usuario, (2) necesitan más de 10 análisis/mes, (3) requieren informes PDF o planes estratégicos.</p>
            <p className="text-xs text-surface-400">El upgrade a Enterprise se activa cuando: (1) necesitan simulación de escenarios, (2) requieren API access, (3) superan 25 clientes o 500 conversaciones AI.</p>
          </div>
        </div>
      )}

      {/* ROADMAP */}
      {activeTab === "roadmap" && data && (
        <div className="space-y-3">
          {["p0", "p1", "p2", "p3"].map((priority) => {
            const items = data.filter((i: any) => i.priority === priority)
            if (items.length === 0) return null
            return (
              <div key={priority}>
                <p className="text-xs font-semibold uppercase tracking-wider text-surface-500 mb-2">
                  Prioridad {priority.toUpperCase()} ({items.length})
                </p>
                <div className="space-y-2">
                  {items.map((item: any) => (
                    <div key={item.id} className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-4">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${
                            item.status === "completed" ? "bg-emerald-500/20 text-emerald-400" :
                            item.status === "in_progress" ? "bg-amber-500/20 text-amber-400" :
                            "bg-surface-700/30 text-surface-500"
                          }`}>{item.id.split("-")[1]}</span>
                          <p className="text-sm font-medium text-surface-200">{item.title}</p>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
                          item.status === "completed" ? "bg-emerald-500/10 text-emerald-400" :
                          item.status === "in_progress" ? "bg-amber-500/10 text-amber-400" :
                          "bg-surface-700/30 text-surface-500"
                        }`}>{item.status.replace("_", " ")}</span>
                      </div>
                      <p className="text-xs text-surface-400 mb-2">{item.description}</p>
                      <div className="flex items-center gap-3 text-[10px] text-surface-500">
                        <span>{item.quarter}</span>
                        <span className="capitalize">· {item.category}</span>
                        <span className="capitalize">· Impacto: {item.impact}</span>
                        <span className="capitalize">· Esfuerzo: {item.effort}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* RISKS */}
      {activeTab === "risks" && data && (
        <div className="space-y-3">
          {data.sort((a: any, b: any) => b.probability * b.impact - a.probability * a.impact).map((risk: any) => (
            <div key={risk.id} className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-surface-200">{risk.title}</p>
                  <p className="text-xs text-surface-500 capitalize mt-0.5">{risk.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    risk.probability * risk.impact >= 12 ? "bg-rose-500/10 text-rose-400" :
                    risk.probability * risk.impact >= 6 ? "bg-amber-500/10 text-amber-400" :
                    "bg-emerald-500/10 text-emerald-400"
                  }`}>
                    Score: {risk.probability * risk.impact}/25
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                    risk.status === "mitigated" ? "bg-emerald-500/10 text-emerald-400" :
                    risk.status === "identified" ? "bg-amber-500/10 text-amber-400" :
                    risk.status === "realized" ? "bg-rose-500/10 text-rose-400" :
                    "bg-surface-700/30 text-surface-400"
                  }`}>{risk.status}</span>
                </div>
              </div>
              <p className="text-xs text-surface-400 mb-2">{risk.description}</p>
              <div className="flex items-center gap-4 text-[10px] text-surface-500 mb-2">
                <span>Probabilidad: {risk.probability}/5</span>
                <span>Impacto: {risk.impact}/5</span>
              </div>
              <div className="rounded-lg bg-surface-900/30 p-3">
                <p className="text-xs font-medium text-emerald-400 mb-1">Mitigación:</p>
                <p className="text-xs text-surface-400">{risk.mitigation}</p>
              </div>
              <p className="mt-2 text-[10px] text-surface-500">Owner: {risk.owner}</p>
            </div>
          ))}
        </div>
      )}

      {/* COMPETITIVE */}
      {activeTab === "competitive" && data && (
        <div className="space-y-3">
          <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 overflow-hidden">
            <div className="grid grid-cols-5 gap-4 bg-surface-700/30 px-5 py-3 text-xs font-semibold text-surface-400 uppercase tracking-wider">
              <span className="col-span-2">Competidor</span>
              <span className="text-center">Nosotros</span>
              <span className="text-center">Ellos</span>
              <span className="text-center">Diferencia</span>
            </div>
            {data.map((entry: any, i: number) => (
              <div key={i} className="grid grid-cols-5 gap-4 border-t border-surface-700/30 px-5 py-4">
                <div className="col-span-2">
                  <p className="text-sm font-medium text-surface-200">{entry.competitor}</p>
                  <p className="text-xs text-surface-500 capitalize">{entry.category}</p>
                </div>
                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <div key={j} className={`h-2 w-2 rounded-full ${j < entry.ourStrength ? "bg-accent-500" : "bg-surface-700"}`} />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <div key={j} className={`h-2 w-2 rounded-full ${j < entry.theirStrength ? "bg-surface-500" : "bg-surface-700"}`} />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <span className={`text-xs font-bold ${entry.ourStrength > entry.theirStrength ? "text-emerald-400" : entry.ourStrength < entry.theirStrength ? "text-rose-400" : "text-amber-400"}`}>
                    {entry.ourStrength > entry.theirStrength ? `+${entry.ourStrength - entry.theirStrength}` : entry.ourStrength < entry.theirStrength ? `-${entry.theirStrength - entry.ourStrength}` : "="}
                  </span>
                </div>
                <div className="col-span-5 mt-1">
                  <p className="text-xs text-surface-500">{entry.notes}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INVESTMENT */}
      {activeTab === "investment" && data && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: "Runway mensual", value: `$${data.estimatedMonthlyRunway.toLocaleString()}`, color: "text-rose-400" },
              { label: "MRR actual", value: `$${data.currentMRR}`, color: "text-surface-400" },
              { label: "Break-even MRR", value: `$${data.breakEvenMRR.toLocaleString()}`, color: "text-emerald-400" },
              { label: "Proyección break-even", value: data.projectedBreakEven, color: "text-amber-400" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-4 text-center">
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-surface-500">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
            <h3 className="text-sm font-semibold text-surface-200 mb-4">Desglose de Costos</h3>
            <div className="space-y-3">
              {data.costBreakdown?.map((c: any) => (
                <div key={c.category}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-surface-300">{c.category}</span>
                    <div className="flex gap-3">
                      <span className="text-surface-400">${c.amount.toLocaleString()}</span>
                      <span className="text-surface-500">{c.percentage}%</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-surface-700 overflow-hidden">
                    <div className="h-full rounded-full bg-accent-500" style={{ width: `${c.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
            <h3 className="text-sm font-semibold text-surface-200 mb-2">Estrategia de Funding</h3>
            <p className="text-xs text-surface-400">{data.fundingStrategy}</p>
          </div>
        </div>
      )}

      {/* AI STRATEGY */}
      {activeTab === "ai" && data && (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {[
              { title: "Estado Actual", content: data.current, border: "border-amber-500/30" },
              { title: "Siguiente Paso", content: data.next, border: "border-accent-500/30" },
              { title: "Visión", content: data.vision, border: "border-emerald-500/30" },
            ].map((s) => (
              <div key={s.title} className={`rounded-xl border ${s.border} bg-surface-800/50 p-5`}>
                <p className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-2">{s.title}</p>
                <p className="text-sm text-surface-200">{s.content}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
            <h3 className="text-sm font-semibold text-surface-200 mb-4">Modelos</h3>
            <div className="grid gap-3 lg:grid-cols-2">
              {data.models?.map((m: any) => (
                <div key={m.name} className="rounded-lg bg-surface-900/30 p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-surface-200">{m.name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
                      m.priority === "primary" ? "bg-emerald-500/10 text-emerald-400" :
                      m.priority === "secondary" ? "bg-amber-500/10 text-amber-400" :
                      "bg-surface-700/30 text-surface-400"
                    }`}>{m.priority}</span>
                  </div>
                  <p className="text-xs text-surface-400">{m.useCase}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
            <h3 className="text-sm font-semibold text-surface-200 mb-2">Fuentes de Conocimiento</h3>
            <ul className="space-y-1">
              {data.knowledgeSources?.map((s: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-xs text-surface-400">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
            <h3 className="text-sm font-semibold text-surface-200 mb-2">Evaluation Framework</h3>
            <p className="text-xs text-surface-400">{data.evaluationFramework}</p>
          </div>
        </div>
      )}

      {/* ICPs */}
      {activeTab === "icps" && data && (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.map((icp: any) => (
            <div key={icp.segment} className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-surface-200">{icp.label}</p>
                  <p className="text-xs text-surface-500">{icp.description}</p>
                </div>
                <span className="rounded-full bg-surface-700/30 px-2.5 py-0.5 text-xs text-surface-400">{icp.companySize}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                <div className="rounded-lg bg-surface-900/30 p-2">
                  <p className="text-surface-500 mb-1">Revenue</p>
                  <p className="text-surface-200 font-medium">{icp.annualRevenue}</p>
                </div>
              </div>
              <details className="group">
                <summary className="cursor-pointer text-xs font-medium text-surface-400 hover:text-surface-200">Pain Points ({icp.painPoints.length})</summary>
                <ul className="mt-2 space-y-1">
                  {icp.painPoints.map((p: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-rose-400">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                      {p}
                    </li>
                  ))}
                </ul>
              </details>
              <details className="group mt-2">
                <summary className="cursor-pointer text-xs font-medium text-surface-400 hover:text-surface-200">Use Cases ({icp.useCases.length})</summary>
                <ul className="mt-2 space-y-1">
                  {icp.useCases.map((u: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-emerald-400">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      {u}
                    </li>
                  ))}
                </ul>
              </details>
              <details className="group mt-2">
                <summary className="cursor-pointer text-xs font-medium text-surface-400 hover:text-surface-200">Objeciones ({icp.objections.length})</summary>
                <ul className="mt-2 space-y-1">
                  {icp.objections.map((o: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-amber-400">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                      {o}
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          ))}
        </div>
      )}

      {/* BETA */}
      {activeTab === "beta" && data && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: "Estado", value: data.status, color: data.status === "active" ? "text-emerald-400" : "text-amber-400" },
              { label: "Participantes", value: `${data.currentParticipants}/${data.maxParticipants}`, color: "text-accent-400" },
              { label: "Duración", value: data.duration, color: "text-surface-200" },
              { label: "Canales feedback", value: data.feedbackChannels?.length || 0, unit: "canales", color: "text-emerald-400" },
            ].map((s: any) => (
              <div key={s.label} className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-4 text-center">
                <p className={`text-lg font-bold ${s.color}`}>{s.value}{s.unit ? ` ${s.unit}` : ""}</p>
                <p className="text-xs text-surface-500">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
              <h3 className="text-sm font-semibold text-surface-200 mb-3">Requisitos</h3>
              <ul className="space-y-2">
                {data.requirements?.map((r: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-surface-400">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
              <h3 className="text-sm font-semibold text-surface-200 mb-3">Incentivos</h3>
              <ul className="space-y-2">
                {data.incentives?.map((inc: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-surface-400">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    {inc}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
            <h3 className="text-sm font-semibold text-surface-200 mb-3">Criterios de Éxito</h3>
            <div className="grid gap-3 lg:grid-cols-2">
              {data.successCriteria?.map((sc: string, i: number) => (
                <div key={i} className="flex items-center gap-3 rounded-lg bg-surface-900/30 p-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-600/20 text-xs font-bold text-accent-400">{i + 1}</span>
                  <p className="text-xs text-surface-300">{sc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
            <h3 className="text-sm font-semibold text-surface-200 mb-3">Canales de Feedback</h3>
            <div className="flex flex-wrap gap-2">
              {data.feedbackChannels?.map((ch: string, i: number) => (
                <span key={i} className="rounded-full bg-surface-700/30 px-3 py-1.5 text-xs text-surface-300">{ch}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
