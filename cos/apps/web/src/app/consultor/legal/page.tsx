export default function LegalPage() {
  const contracts = [
    { id: "1", title: "Contrato de Servicios Profesionales", client: "Exportadora Guayaquil", type: "Retainer", status: "Vigente", expiry: "31 Dic 2026", risk: "Bajo" },
    { id: "2", title: "Acuerdo de Confidencialidad", client: "TechSolutions EC", type: "NDA", status: "Vigente", expiry: "Indefinido", risk: "Bajo" },
    { id: "3", title: "Contrato de Arrendamiento Oficina", client: "COS Propio", type: "Arrendamiento", status: "Vigente", expiry: "30 Jun 2027", risk: "Medio" },
    { id: "4", title: "Prestación Servicios Auditoría", client: "Manufacturas del Sur", type: "Servicios", status: "Por Firmar", expiry: "-", risk: "Bajo" },
    { id: "5", title: "Crédito Bancario - Línea Revolvente", client: "Exportadora Guayaquil", type: "Financiero", status: "Vigente", expiry: "15 Mar 2027", risk: "Alto" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-50">Módulo Legal</h1>
          <p className="text-sm text-surface-400">Gestión de contratos y obligaciones legales</p>
        </div>
        <button className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-500 transition-colors">
          + Nuevo Contrato
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-4">
          <p className="text-xs text-surface-400">Contratos Vigentes</p>
          <p className="mt-1 text-lg font-bold text-surface-50">4</p>
        </div>
        <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-4">
          <p className="text-xs text-surface-400">Por Firmar</p>
          <p className="mt-1 text-lg font-bold text-warning">1</p>
        </div>
        <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-4">
          <p className="text-xs text-surface-400">Próximo a Vencer</p>
          <p className="mt-1 text-lg font-bold text-amber-500">0</p>
        </div>
        <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-4">
          <p className="text-xs text-surface-400">Cláusulas Riesgosas</p>
          <p className="mt-1 text-lg font-bold text-rose-500">2</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-surface-700/50">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-700/50 bg-surface-950">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-surface-400">Contrato</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-surface-400">Cliente</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-surface-400">Tipo</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-surface-400">Estado</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-surface-400">Vencimiento</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-surface-400">Riesgo</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((c) => (
              <tr key={c.id} className="border-b border-surface-700/30 hover:bg-surface-800/50 transition-colors cursor-pointer">
                <td className="px-4 py-3 text-sm font-medium text-surface-200">{c.title}</td>
                <td className="px-4 py-3 text-sm text-surface-400">{c.client}</td>
                <td className="px-4 py-3 text-sm text-surface-400">{c.type}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs font-medium ${
                    c.status === "Vigente" ? "text-success" : c.status === "Por Firmar" ? "text-warning" : "text-surface-500"
                  }`}>{c.status}</span>
                </td>
                <td className="px-4 py-3 text-right text-sm text-surface-400">{c.expiry}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs font-medium ${
                    c.risk === "Alto" ? "text-rose-500" : c.risk === "Medio" ? "text-amber-500" : "text-success"
                  }`}>{c.risk}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
