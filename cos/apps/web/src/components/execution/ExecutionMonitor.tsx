"use client"

import { useState, useEffect, useCallback } from "react"
import type { ExecutionStatus, Deviation, Correction, ExecutionAlert } from "@/core/execution"

export function ExecutionMonitor({ companyId = "demo-company" }: { companyId?: string }) {
  const [plans, setPlans] = useState<ExecutionStatus[]>([])
  const [selectedPlan, setSelectedPlan] = useState<ExecutionStatus | null>(null)
  const [alerts, setAlerts] = useState<ExecutionAlert[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [plansRes, alertsRes] = await Promise.all([
        fetch(`/api/execution?companyId=${companyId}`),
        fetch(`/api/execution?alerts=true&companyId=${companyId}`),
      ])
      if (plansRes.ok) setPlans(await plansRes.json())
      if (alertsRes.ok) setAlerts(await alertsRes.json())
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => { loadAll() }, [loadAll])

  const detectDeviations = async (planId: string) => {
    const res = await fetch("/api/execution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "detect", planId }),
    })
    if (res.ok) {
      const devs = await res.json()
      if (devs.length > 0) loadAll()
    }
  }

  const proposeCorrection = async (deviationId: string) => {
    const res = await fetch("/api/execution", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "correct", deviationId }),
    })
    if (res.ok) { const c = await res.json(); loadAll(); return c }
  }

  const approveCorrection = async (correctionId: string) => {
    await fetch("/api/execution", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve", correctionId }),
    })
    loadAll()
  }

  const implementCorrection = async (correctionId: string) => {
    await fetch("/api/execution", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "implement", correctionId }),
    })
    loadAll()
  }

  const resolveAlert = async (alertId: string) => {
    await fetch("/api/execution", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resolve-alert", alertId }),
    })
    loadAll()
  }

  const statusColors: Record<string, string> = {
    on_track: "bg-green-100 text-green-800",
    at_risk: "bg-yellow-100 text-yellow-800",
    off_track: "bg-red-100 text-red-800",
    completed: "bg-blue-100 text-blue-800",
  }

  const severityColors: Record<string, string> = {
    minor: "bg-gray-200 text-gray-600",
    moderate: "bg-yellow-200 text-yellow-800",
    severe: "bg-orange-200 text-orange-800",
    critical: "bg-red-200 text-red-800",
  }

  const alertTypeIcons: Record<string, string> = {
    schedule: "🕐", budget: "💰", kpi: "📊", risk: "⚠️", blocker: "🚫",
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Monitor de Ejecución</h2>
          <button onClick={loadAll} disabled={loading} className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors">
            {loading ? "Analizando..." : "Actualizar"}
          </button>
        </div>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        {/* Alertas activas */}
        {alerts.filter((a) => !a.resolvedAt).length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Alertas Activas ({alerts.filter((a) => !a.resolvedAt).length})</h3>
            <div className="space-y-2">
              {alerts.filter((a) => !a.resolvedAt).slice(0, 5).map((alert) => (
                <div key={alert.id} className={`p-3 rounded-lg border ${alert.severity === "critical" || alert.severity === "severe" ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span>{alertTypeIcons[alert.type] || "📌"}</span>
                        <span className="font-medium text-sm text-gray-900">{alert.title}</span>
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${severityColors[alert.severity]}`}>{alert.severity}</span>
                      </div>
                      <p className="text-xs text-gray-600">{alert.description}</p>
                      <p className="text-xs text-gray-500 mt-1">Recomendación: {alert.recommendation}</p>
                    </div>
                    <button onClick={() => resolveAlert(alert.id)} className="ml-2 px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">Resolver</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Planes activos */}
        {plans.length === 0 && !loading && (
          <p className="text-gray-500 text-center py-8">No hay planes activos. Crea un plan en Planificación Estratégica y ejecútalo para ver su monitoreo aquí.</p>
        )}

        <div className="grid gap-4">
          {plans.map((plan) => (
            <div key={plan.planId} onClick={() => { setSelectedPlan(plan); detectDeviations(plan.planId) }} className={`p-4 rounded-xl border cursor-pointer transition-colors ${selectedPlan?.planId === plan.planId ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-400"}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">{plan.objective}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[plan.status]}`}>{plan.status.replace("_", " ")}</span>
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Progreso general</span>
                  <span>{Math.round(plan.overallProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all ${plan.status === "off_track" ? "bg-red-500" : plan.status === "at_risk" ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${plan.overallProgress}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">{plan.phasesCompleted}/{plan.phasesTotal}</p>
                  <p className="text-xs text-gray-500">Fases</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">{plan.tasksCompleted}/{plan.tasksTotal}</p>
                  <p className="text-xs text-gray-500">Tareas</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">{plan.elapsedDays}/{plan.plannedDays}</p>
                  <p className="text-xs text-gray-500">Días</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">{plan.activeAlerts}</p>
                  <p className="text-xs text-gray-500">Alertas</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected plan detail */}
      {selectedPlan && (
        <div className="p-6 border-t border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{selectedPlan.objective}</h3>
            <button onClick={() => detectDeviations(selectedPlan.planId)} className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
              Detectar Desviaciones
            </button>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs text-green-600">Presupuesto</p>
              <p className="text-lg font-semibold text-green-900">${Math.round(selectedPlan.budgetSpent).toLocaleString()} / ${selectedPlan.budgetTotal.toLocaleString()}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-blue-600">Progreso</p>
              <p className="text-lg font-semibold text-blue-900">{Math.round(selectedPlan.overallProgress)}%</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <p className="text-xs text-purple-600">Tiempo transcurrido</p>
              <p className="text-lg font-semibold text-purple-900">{selectedPlan.elapsedDays} / {selectedPlan.plannedDays} días</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
              <p className="text-xs text-orange-600">Desviaciones</p>
              <p className="text-lg font-semibold text-orange-900">{selectedPlan.deviationCount}</p>
            </div>
          </div>

          {/* Phase detail */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Detalle por Fase</h4>
            <div className="space-y-2">
              {selectedPlan.lastSnapshot.phaseDetails.map((ph) => (
                <div key={ph.phaseId} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-gray-800">{ph.phaseName}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[ph.status === "in_progress" ? "on_track" : ph.status === "completed" ? "completed" : "at_risk"]}`}>{ph.status.replace("_", " ")}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>KPIs: {ph.kpisMet}/{ph.kpisTotal}</span>
                    <span>Tareas: {ph.tasksCompleted}/{ph.tasksTotal}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Deviations */}
          {selectedPlan.deviations.filter((d) => !d.resolvedAt).length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Desviaciones Activas</h4>
              <div className="space-y-2">
                {selectedPlan.deviations.filter((d) => !d.resolvedAt).map((dev) => (
                  <div key={dev.id} className="border border-red-200 bg-red-50 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-red-800">{dev.description}</span>
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${severityColors[dev.severity]}`}>{dev.severity}</span>
                        </div>
                        <p className="text-xs text-red-600">Esperado: {dev.expectedValue}{dev.unit} | Actual: {dev.actualValue}{dev.unit}</p>
                      </div>
                      <button onClick={() => proposeCorrection(dev.id)} className="ml-2 px-2 py-1 text-xs bg-white border border-red-300 rounded hover:bg-red-50 transition-colors">
                        Proponer Corrección
                      </button>
                    </div>

                    {/* Corrections for this deviation */}
                    {selectedPlan.corrections.filter((c) => c.deviationId === dev.id).map((corr) => (
                      <div key={corr.id} className="mt-2 pt-2 border-t border-red-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-xs text-red-700">{corr.description}</p>
                            <p className="text-xs text-red-500 mt-0.5">Impacto: {corr.impact}</p>
                            <p className="text-xs text-red-400">Costo: ${corr.estimatedCost} | {corr.estimatedDays} días</p>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${corr.status === "implemented" ? "bg-green-200 text-green-800" : corr.status === "approved" ? "bg-blue-200 text-blue-800" : "bg-gray-200 text-gray-600"}`}>{corr.status}</span>
                            {corr.status === "proposed" && <button onClick={() => approveCorrection(corr.id)} className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700">Aprobar</button>}
                            {corr.status === "approved" && <button onClick={() => implementCorrection(corr.id)} className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">Implementar</button>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedPlan.deviations.filter((d) => !d.resolvedAt).length === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-green-800 font-medium">✓ Sin desviaciones activas</p>
              <p className="text-green-600 text-sm">El plan se está ejecutando según lo previsto.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
