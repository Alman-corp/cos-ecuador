"use client"

import { useEffect, useState } from "react"

interface StrategicPlanData {
  objectives: any[]
  projects: any[]
  summary: { totalObjectives: number; completedObjectives: number; totalTasks: number; completedTasks: number }
}

interface Props {
  clientId: string
  clientName: string
}

export default function StrategicPlanView({ clientId, clientName }: Props) {
  const [data, setData] = useState<StrategicPlanData | null>(null)
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchPlan = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/strategic-plan`)
      if (res.ok) setData(await res.json())
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchPlan() }, [clientId])

  const createPlan = async () => {
    setCreating(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/strategic-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objectives: [] }),
      })
      if (res.ok) await fetchPlan()
    } finally { setCreating(false) }
  }

  const updateTaskStatus = async (taskId: string, status: string) => {
    await fetch("/api/system/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, status }),
    })
    await fetchPlan()
  }

  if (loading) return <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6"><p className="text-sm text-surface-400">Cargando plan estratégico...</p></div>

  return (
    <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-surface-200">Plan Estratégico</h3>
        {!data?.projects.length ? (
          <button onClick={createPlan} disabled={creating}
            className="rounded-lg bg-accent-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-accent-500 disabled:opacity-50">
            {creating ? "Creando..." : "Generar Plan"}
          </button>
        ) : null}
      </div>

      {!data?.projects.length ? (
        <p className="text-center text-sm text-surface-500">No hay plan estratégico. Genéralo desde el análisis financiero.</p>
      ) : (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Objetivos", value: data?.summary.totalObjectives || 0, color: "text-accent-400" },
              { label: "Completados", value: data?.summary.completedObjectives || 0, color: "text-emerald-400" },
              { label: "Tareas", value: data?.summary.totalTasks || 0, color: "text-amber-400" },
              { label: "Tareas Done", value: data?.summary.completedTasks || 0, color: "text-emerald-400" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg bg-surface-900/50 p-3 text-center">
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-surface-500">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Objectives */}
          {data?.objectives.map((obj) => (
            <div key={obj.id} className="rounded-lg border border-surface-700/30 bg-surface-900/30 p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-surface-200">{obj.title}</p>
                  <p className="text-xs text-surface-500 capitalize">{obj.objectiveType} · {obj.status}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  obj.status === "completed" ? "bg-emerald-500/10 text-emerald-400" :
                  obj.status === "active" ? "bg-accent-500/10 text-accent-400" :
                  "bg-surface-700/30 text-surface-400"
                }`}>{obj.status}</span>
              </div>
              {obj.keyResults?.map((kr: any) => (
                <div key={kr.id} className="mt-2">
                  <div className="flex justify-between text-xs text-surface-400 mb-1">
                    <span>{kr.title}</span>
                    <span>{Number(kr.currentValue).toFixed(0)} / {Number(kr.targetValue).toFixed(0)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-700 overflow-hidden">
                    <div className="h-full rounded-full bg-accent-500 transition-all"
                      style={{ width: `${Math.min((Number(kr.currentValue) / Number(kr.targetValue)) * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
              {obj.targetDate && (
                <p className="mt-2 text-xs text-surface-500">Meta: {new Date(obj.targetDate).toLocaleDateString()}</p>
              )}
            </div>
          ))}

          {/* Tasks from projects */}
          {data?.projects.map((proj) => (
            <div key={proj.id}>
              <p className="mb-2 text-xs font-semibold text-surface-400">{proj.name}</p>
              <div className="space-y-1">
                {proj.tasks?.map((task: any) => (
                  <div key={task.id} className="flex items-center justify-between rounded-lg bg-surface-900/20 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={task.status === "done" || task.status === "completed"}
                        onChange={() => updateTaskStatus(task.id, task.status === "done" ? "todo" : "done")}
                        className="h-4 w-4 rounded border-surface-600 bg-surface-700 accent-accent-600" />
                      <span className={`text-xs ${task.status === "done" ? "line-through text-surface-500" : "text-surface-300"}`}>{task.title}</span>
                    </div>
                    <span className={`rounded px-2 py-0.5 text-[10px] font-medium capitalize ${
                      task.priority === "high" ? "bg-rose-500/10 text-rose-400" :
                      task.priority === "medium" ? "bg-amber-500/10 text-amber-400" :
                      "bg-surface-700/30 text-surface-400"
                    }`}>{task.priority}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
