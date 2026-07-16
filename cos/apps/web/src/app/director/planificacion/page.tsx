import { PlanningPanel } from "@/components/planning/PlanningPanel"

export default function PlanificacionPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-50">Planificación Estratégica</h1>
        <p className="text-surface-400 mt-1">Define objetivos estratégicos y la plataforma genera automáticamente el plan de acción con fases, proyectos, tareas, presupuesto y KPIs.</p>
      </div>
      <PlanningPanel />
    </div>
  )
}
