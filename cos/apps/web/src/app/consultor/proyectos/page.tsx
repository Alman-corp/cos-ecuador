export default function ProyectosPage() {
  const projects = [
    { id: "1", name: "Auditoría Financiera Completa", client: "Exportadora Guayaquil S.A.", type: "Auditoría", status: "active", priority: "high", progress: 65, dueDate: "30 Jul 2026" },
    { id: "2", name: "Reestructuración de Pasivos", client: "Exportadora Guayaquil S.A.", type: "Consultoría", status: "active", priority: "high", progress: 40, dueDate: "15 Sep 2026" },
    { id: "3", name: "Optimización Tributaria 2026", client: "Manufacturas del Sur", type: "Tributario", status: "planning", priority: "medium", progress: 15, dueDate: "30 Oct 2026" },
    { id: "4", name: "Implementación Command Center", client: "TechSolutions EC", type: "Implementación", status: "active", priority: "high", progress: 80, dueDate: "15 Jul 2026" },
    { id: "5", name: "Due Diligence Financiero", client: "AgroExport S.A.", type: "Auditoría", status: "planning", priority: "medium", progress: 5, dueDate: "30 Nov 2026" },
    { id: "6", name: "Diagnóstico de Liquidez", client: "Constructora del Pacífico", type: "Consultoría", status: "completed", priority: "high", progress: 100, dueDate: "01 Jun 2026" },
  ]

  const statusColors: Record<string, string> = {
    active: "text-success",
    planning: "text-warning",
    completed: "text-surface-500",
  }

  const priorityDots: Record<string, string> = {
    high: "bg-rose-500",
    medium: "bg-amber-500",
    low: "bg-surface-500",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-50">Proyectos</h1>
          <p className="text-sm text-surface-400">{projects.length} proyectos en total</p>
        </div>
        <button className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-500 transition-colors">
          + Nuevo Proyecto
        </button>
      </div>

      <div className="space-y-3">
        {projects.map((p) => (
          <div key={p.id} className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-5 transition-colors hover:bg-surface-800">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${priorityDots[p.priority]}`} />
                  <h3 className="text-sm font-semibold text-surface-200">{p.name}</h3>
                  <span className={`text-xs font-medium ${statusColors[p.status]}`}>{p.status}</span>
                </div>
                <p className="mt-1 text-xs text-surface-500">{p.client} · {p.type}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-surface-400">{p.dueDate}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-700">
                  <div
                    className={`h-full rounded-full transition-all ${
                      p.progress === 100 ? "bg-success" : "bg-accent-600"
                    }`}
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
              </div>
              <span className="text-xs font-medium text-surface-400">{p.progress}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
