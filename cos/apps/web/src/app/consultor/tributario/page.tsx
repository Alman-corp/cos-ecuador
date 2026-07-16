export default function TributarioPage() {
  const clients = [
    { name: "Exportadora Guayaquil S.A.", ruc: "1791234567001", iva: "Al día", renta: "Pendiente", retenciones: "Discrepancias", riesgo: "Alto" },
    { name: "Manufacturas del Sur", ruc: "1792345678001", iva: "Al día", renta: "Al día", retenciones: "Correcto", riesgo: "Bajo" },
    { name: "TechSolutions EC", ruc: "1793456789001", iva: "Pendiente", renta: "Al día", retenciones: "Correcto", riesgo: "Medio" },
    { name: "AgroExport S.A.", ruc: "1794567890001", iva: "Al día", renta: "Al día", retenciones: "Correcto", riesgo: "Bajo" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-50">Módulo Tributario</h1>
          <p className="text-sm text-surface-400">Monitoreo de obligaciones fiscales por cliente</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-4">
          <p className="text-xs text-surface-400">Clientes Monitoreados</p>
          <p className="mt-1 text-lg font-bold text-surface-50">4</p>
        </div>
        <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-4">
          <p className="text-xs text-surface-400">Discrepancias Activas</p>
          <p className="mt-1 text-lg font-bold text-rose-500">2</p>
        </div>
        <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-4">
          <p className="text-xs text-surface-400">Próximo Vencimiento</p>
          <p className="mt-1 text-lg font-bold text-amber-500">15 Jul</p>
          <p className="text-xs text-surface-500">Declaración IVA</p>
        </div>
        <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-4">
          <p className="text-xs text-surface-400">Riesgo de Glosa</p>
          <p className="mt-1 text-lg font-bold text-rose-500">$45,000</p>
          <p className="text-xs text-surface-500">Exportadora G.</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-surface-700/50">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-700/50 bg-surface-950">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-surface-400">Cliente</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-surface-400">RUC</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-surface-400">IVA</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-surface-400">Renta</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-surface-400">Retenciones</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-surface-400">Riesgo</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.ruc} className="border-b border-surface-700/30 hover:bg-surface-800/50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-surface-200">{c.name}</td>
                <td className="px-4 py-3 text-sm text-surface-400 font-mono">{c.ruc}</td>
                <td className="px-4 py-3 text-center text-sm">
                  <span className={c.iva === "Al día" ? "text-success" : "text-rose-500"}>{c.iva}</span>
                </td>
                <td className="px-4 py-3 text-center text-sm">
                  <span className={c.renta === "Al día" ? "text-success" : "text-amber-500"}>{c.renta}</span>
                </td>
                <td className="px-4 py-3 text-center text-sm">
                  <span className={c.retenciones === "Correcto" ? "text-success" : "text-rose-500"}>{c.retenciones}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs font-medium ${
                    c.riesgo === "Alto" ? "text-rose-500" : c.riesgo === "Medio" ? "text-amber-500" : "text-success"
                  }`}>{c.riesgo}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-5">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 shrink-0 rounded-lg bg-rose-500/10 flex items-center justify-center">
            <span className="text-sm text-rose-500 font-bold">!</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-rose-400">Alerta: Discrepancia en Retenciones</h3>
            <p className="mt-1 text-xs text-surface-400">
              Exportadora Guayaquil S.A. presenta diferencias en retenciones aplicadas a proveedores de servicios vs. bienes.
              Posible glosa estimada: $45,000. Se recomienda revisión de Anexos Transaccionales.
            </p>
            <button className="mt-3 rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/20 transition-colors">
              Revisar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
