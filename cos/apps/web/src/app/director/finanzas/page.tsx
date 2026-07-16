export default function FinanzasPage() {
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun"]
  const revenueData = [28500, 31200, 33800, 36500, 41200, 48500]
  const costsData = [18200, 19500, 20100, 21800, 23400, 26200]
  const maxVal = Math.max(...revenueData)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-surface-50">Finanzas</h1>
        <p className="text-sm text-surface-400">Evolución de ingresos y costos de la consultora</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-4">
          <p className="text-xs text-surface-400">MRR</p>
          <p className="mt-1 text-lg font-bold text-surface-50">$48,500</p>
          <p className="text-xs text-success">+17.7% vs mes ant.</p>
        </div>
        <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-4">
          <p className="text-xs text-surface-400">ARR</p>
          <p className="mt-1 text-lg font-bold text-surface-50">$582,000</p>
          <p className="text-xs text-success">proyectado anual</p>
        </div>
        <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-4">
          <p className="text-xs text-surface-400">Margen Neto</p>
          <p className="mt-1 text-lg font-bold text-surface-50">46.2%</p>
          <p className="text-xs text-success">+2.1 pp</p>
        </div>
        <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-4">
          <p className="text-xs text-surface-400">Clientes Nuevos</p>
          <p className="mt-1 text-lg font-bold text-surface-50">+3</p>
          <p className="text-xs text-success">este mes</p>
        </div>
      </div>

      <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
        <h3 className="mb-6 text-sm font-semibold text-surface-200">Ingresos vs Costos (YTD)</h3>
        <div className="flex items-end gap-3" style={{ height: 180 }}>
          {months.map((m, i) => (
            <div key={m} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full flex-col items-center justify-end" style={{ height: 160 }}>
                <div
                  className="w-full max-w-[32px] rounded-t-sm bg-accent-600 transition-all"
                  style={{ height: `${(revenueData[i] / maxVal) * 140}px` }}
                />
                <div
                  className="mt-0.5 w-full max-w-[32px] rounded-t-sm bg-rose-500/60 transition-all"
                  style={{ height: `${(costsData[i] / maxVal) * 140}px` }}
                />
              </div>
              <span className="text-[10px] text-surface-500">{m}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-center gap-6 text-xs text-surface-400">
          <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-sm bg-accent-600" /> Ingresos</div>
          <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-sm bg-rose-500/60" /> Costos</div>
        </div>
      </div>
    </div>
  )
}
