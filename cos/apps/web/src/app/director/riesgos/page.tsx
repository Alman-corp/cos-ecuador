export default function RiesgosPage() {
  const risks = [
    { cliente: "Exportadora Guayaquil S.A.", tipo: "Liquidez", nivel: "Crítico", probabilidad: 85, impacto: "$180,000", estado: "Monitoreo" },
    { cliente: "Constructora del Pacífico", tipo: "Cartera", nivel: "Alto", probabilidad: 65, impacto: "$95,000", estado: "Plan acción" },
    { cliente: "Manufacturas del Sur", tipo: "Tributario", nivel: "Medio", probabilidad: 45, impacto: "$45,000", estado: "En revisión" },
    { cliente: "AgroExport S.A.", tipo: "Cambiario", nivel: "Bajo", probabilidad: 25, impacto: "$22,000", estado: "Monitoreo" },
    { cliente: "TechSolutions EC", tipo: "Operativo", nivel: "Bajo", probabilidad: 15, impacto: "$12,000", estado: "Mitigado" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-surface-50">Riesgos Globales</h1>
        <p className="text-sm text-surface-400">Matriz de riesgos consolidada de todos los clientes</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-4">
          <p className="text-xs text-surface-400">Riesgos Críticos</p>
          <p className="mt-1 text-lg font-bold text-rose-500">1</p>
        </div>
        <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-4">
          <p className="text-xs text-surface-400">Riesgos Altos</p>
          <p className="mt-1 text-lg font-bold text-amber-500">1</p>
        </div>
        <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-4">
          <p className="text-xs text-surface-400">Exp.Total en Riesgo</p>
          <p className="mt-1 text-lg font-bold text-surface-50">$354,000</p>
        </div>
        <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-4">
          <p className="text-xs text-surface-400">Clientes en Alerta</p>
          <p className="mt-1 text-lg font-bold text-warning">2</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-surface-700/50">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-700/50 bg-surface-950">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-surface-400">Cliente</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-surface-400">Tipo</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-surface-400">Nivel</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-surface-400">Probabilidad</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-surface-400">Impacto</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-surface-400">Estado</th>
            </tr>
          </thead>
          <tbody>
            {risks.map((r) => (
              <tr key={`${r.cliente}-${r.tipo}`} className="border-b border-surface-700/30 hover:bg-surface-800/50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-surface-200">{r.cliente}</td>
                <td className="px-4 py-3 text-sm text-surface-400">{r.tipo}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs font-medium ${
                    r.nivel === "Crítico" ? "text-rose-500" : r.nivel === "Alto" ? "text-amber-500" : r.nivel === "Medio" ? "text-warning" : "text-success"
                  }`}>{r.nivel}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-1.5 w-12 overflow-hidden rounded-full bg-surface-700">
                      <div className={`h-full rounded-full ${r.probabilidad >= 70 ? "bg-rose-500" : r.probabilidad >= 40 ? "bg-amber-500" : "bg-success"}`}
                        style={{ width: `${r.probabilidad}%` }} />
                    </div>
                    <span className="text-xs text-surface-400">{r.probabilidad}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm text-surface-300">{r.impacto}</td>
                <td className="px-4 py-3 text-center text-xs text-surface-400">{r.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
