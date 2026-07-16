"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function PipelineKanban({ projects }: { projects: any[] }) {
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const STAGES = ["lead", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"]
  const STAGE_LABELS: Record<string, string> = {
    lead: "Leads", qualified: "Calificados", proposal: "Propuesta", negotiation: "Negociacion", closed_won: "Cerrados", closed_lost: "Perdidos",
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Pipeline Comercial</h2>
      <div className="grid grid-cols-6 gap-3 overflow-x-auto">
        {STAGES.map((stage) => {
          const stageProjects = (projects ?? []).filter((p: any) => p.status === stage)
          const totalValue = stageProjects.reduce((sum: number, p: any) => sum + (p.estimatedValue ?? 0), 0)
          return (
            <div key={stage} onDragOver={(e) => e.preventDefault()} onDrop={() => setDraggedId(null)}
              className="bg-slate-100 rounded-lg p-3 min-w-[180px]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">{STAGE_LABELS[stage]}</h3>
                <span className="text-xs text-slate-500">{stageProjects.length}</span>
              </div>
              <p className="text-xs text-slate-500 mb-3">${(totalValue / 1000).toFixed(0)}K</p>
              <div className="space-y-2">
                {stageProjects.map((project: any) => (
                  <Card key={project.id} draggable onDragStart={() => setDraggedId(project.id)}
                    className="cursor-move p-3 hover:shadow-md transition-shadow">
                    <p className="font-medium text-sm">{project.clientCompany?.name ?? project.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{project.name}</p>
                    {project.estimatedValue && <p className="text-xs font-semibold text-emerald-600 mt-2">${project.estimatedValue.toLocaleString()}</p>}
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function RiskHeatmap({ risks }: { risks: any[] }) {
  const matrix = Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => [] as any[]))
  ;(risks ?? []).forEach((risk) => {
    const p = Math.min(4, Math.max(0, (risk.probability ?? 3) - 1))
    const i = Math.min(4, Math.max(0, (risk.impact ?? 3) - 1))
    matrix[p][i].push(risk)
  })

  const getColor = (count: number) => count === 0 ? "bg-slate-50" : count === 1 ? "bg-yellow-100" : count === 2 ? "bg-orange-200" : "bg-red-300"

  return (
    <Card>
      <CardHeader><CardTitle>Mapa de Calor de Riesgos</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-6 gap-1 text-xs">
          <div />
          {["Muy Bajo", "Bajo", "Medio", "Alto", "Critico"].map((l) => <div key={l} className="text-center font-semibold p-1">{l}</div>)}
          {matrix.map((row, pIdx) => (
            <>
              <div key={pIdx} className="flex items-center font-semibold p-1 text-right">{["Raro", "Improbable", "Posible", "Probable", "Casi seguro"][pIdx]}</div>
              {row.map((cell, iIdx) => (
                <div key={`${pIdx}-${iIdx}`}
                  className={`${getColor(cell.length)} aspect-square flex items-center justify-center rounded text-xs font-bold cursor-pointer hover:ring-2 hover:ring-blue-500`}>
                  {cell.length > 0 && cell.length}
                </div>
              ))}
            </>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
