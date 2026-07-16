import { ExecutionMonitor } from "@/components/execution/ExecutionMonitor"

export default function EjecucionPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-50">Monitor de Ejecución</h1>
        <p className="text-surface-400 mt-1">Seguimiento automático de planes activos. Detecta desviaciones, genera alertas y propone correcciones en tiempo real.</p>
      </div>
      <ExecutionMonitor />
    </div>
  )
}
