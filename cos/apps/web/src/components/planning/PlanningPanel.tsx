"use client"

import { useState } from "react"
import type { BusinessPlan, PlanPhase, PlanProject } from "@/core/planning"

export function PlanningPanel({ companyId = "demo-company" }: { companyId?: string }) {
  const [objective, setObjective] = useState("")
  const [category, setCategory] = useState("")
  const [targetValue, setTargetValue] = useState("")
  const [unit, setUnit] = useState("")
  const [timeframeMonths, setTimeframeMonths] = useState(6)
  const [plan, setPlan] = useState<BusinessPlan | null>(null)
  const [plans, setPlans] = useState<BusinessPlan[]>([])
  const [loading, setLoading] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [error, setError] = useState("")
  const [tab, setTab] = useState<"new" | "list">("new")

  const generate = async () => {
    if (!objective.trim()) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/planning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          companyId,
          objective: objective.trim(),
          category: category || undefined,
          targetValue: targetValue ? Number(targetValue) : undefined,
          unit: unit || undefined,
          timeframeMonths,
        }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      const newPlan = await res.json()
      setPlan(newPlan)
      setObjective("")
      setTab("list")
      loadPlans()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const execute = async () => {
    if (!plan) return
    setExecuting(true)
    setError("")
    try {
      const res = await fetch("/api/planning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "execute", planId: plan.id }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      const result = await res.json()
      if (result.success) {
        setPlan((p) => p ? { ...p, status: "active", startedAt: new Date().toISOString() } : p)
        loadPlans()
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setExecuting(false)
    }
  }

  const loadPlans = async () => {
    try {
      const res = await fetch(`/api/planning?companyId=${companyId}`)
      if (res.ok) setPlans(await res.json())
    } catch {}
  }

  const statusColor: Record<string, string> = {
    draft: "bg-yellow-100 text-yellow-800",
    active: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  }

  const phaseStatusColor: Record<string, string> = {
    pending: "bg-gray-100 text-gray-600",
    in_progress: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    blocked: "bg-red-100 text-red-800",
  }

  const priorityColors: Record<string, string> = {
    low: "bg-gray-200 text-gray-600",
    medium: "bg-yellow-200 text-yellow-800",
    high: "bg-orange-200 text-orange-800",
    critical: "bg-red-200 text-red-800",
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Planificación Estratégica</h2>
          <div className="flex gap-2">
            <button onClick={() => setTab("new")} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === "new" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>Nuevo Plan</button>
            <button onClick={() => { setTab("list"); loadPlans() }} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === "list" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>Planes Activos</button>
          </div>
        </div>

        {tab === "new" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo Estratégico</label>
              <textarea value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="Ej: Mejorar la liquidez de la empresa en los próximos 6 meses" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none resize-none h-24" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none">
                  <option value="">Automática</option>
                  <option value="liquidez">Liquidez / Financiero</option>
                  <option value="rentabilidad">Rentabilidad</option>
                  <option value="crecimiento">Crecimiento / Ventas</option>
                  <option value="transformacion">Transformación Digital</option>
                  <option value="cumplimiento">Cumplimiento / Legal</option>
                  <option value="eficiencia">Eficiencia Operativa</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Horizonte (meses)</label>
                <input type="number" min={1} max={36} value={timeframeMonths} onChange={(e) => setTimeframeMonths(Number(e.target.value))} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor objetivo (opcional)</label>
                <input type="number" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} placeholder="Ej: 1.5" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidad (opcional)</label>
                <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Ej: ratio, %, COP" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none" />
              </div>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button onClick={generate} disabled={loading || !objective.trim()} className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {loading ? "Generando plan..." : "Generar Plan Estratégico"}
            </button>
          </div>
        )}

        {tab === "list" && plans.length === 0 && (
          <p className="text-gray-500 text-center py-8">No hay planes generados. Crea tu primer plan estratégico.</p>
        )}

        {tab === "list" && plans.length > 0 && (
          <div className="space-y-3">
            {plans.map((p) => (
              <div key={p.id} onClick={() => setPlan(p)} className={`p-4 rounded-xl border cursor-pointer transition-colors ${plan?.id === p.id ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-400"}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{p.objective.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[p.status]}`}>{p.status}</span>
                </div>
                <div className="flex gap-4 text-sm text-gray-500">
                  <span>${p.totalBudget.toLocaleString()}</span>
                  <span>{p.estimatedDurationMonths} meses</span>
                  <span>{p.phases.length} fases</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {plan && (
        <div className="p-6 border-t border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{plan.objective.title}</h3>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor[plan.status]}`}>{plan.status}</span>
              {plan.status === "draft" && (
                <button onClick={execute} disabled={executing} className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors">
                  {executing ? "Ejecutando..." : "Ejecutar Plan"}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Presupuesto</p>
              <p className="text-lg font-semibold text-gray-900">${plan.totalBudget.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Duración</p>
              <p className="text-lg font-semibold text-gray-900">{plan.estimatedDurationMonths} meses</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Fases</p>
              <p className="text-lg font-semibold text-gray-900">{plan.phases.length}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Categoría</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">{plan.objective.category}</p>
            </div>
          </div>

          {plan.startedAt && (
            <p className="text-sm text-gray-500 mb-4">Iniciado: {new Date(plan.startedAt).toLocaleDateString()}</p>
          )}

          <div className="space-y-4">
            {plan.phases.map((phase) => (
              <div key={phase.id} className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-4 bg-gray-50">
                  <div>
                    <h4 className="font-medium text-gray-900">{phase.name}</h4>
                    <p className="text-sm text-gray-500">{phase.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{phase.durationWeeks} semanas</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${phaseStatusColor[phase.status]}`}>{phase.status.replace("_", " ")}</span>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {phase.kpis.length > 0 && (
                    <div className="flex gap-4">
                      {phase.kpis.map((kpi, i) => (
                        <div key={i} className="bg-blue-50 rounded-lg px-3 py-2 text-sm">
                          <span className="text-blue-800 font-medium">{kpi.targetValue} {kpi.unit}</span>
                          <span className="text-blue-600 ml-1">{kpi.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {phase.projects.map((proj) => (
                    <div key={proj.id} className="bg-white border border-gray-100 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-800 text-sm">{proj.name}</h5>
                        <span className="text-xs text-gray-500">{proj.assignedRole}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{proj.description}</p>
                      <div className="space-y-1">
                        {proj.tasks.map((task) => (
                          <div key={task.id} className="flex items-center justify-between text-xs px-2 py-1 bg-gray-50 rounded">
                            <span className="text-gray-700">{task.title}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400">{task.estimatedHours}h</span>
                              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${priorityColors[task.priority]}`}>{task.priority}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {phase.dependsOn.length > 0 && (
                    <p className="text-xs text-gray-400">Depende de: {phase.dependsOn.join(", ")}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
