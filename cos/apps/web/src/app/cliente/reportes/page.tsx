export default function ReportesPage() {
  const reports = [
    { title: "Informe de Liquidez Q2 2026", date: "20 Jun 2026", type: "PDF", pages: 12 },
    { title: "Auditoría Tributaria Preventiva", date: "15 Jun 2026", type: "PDF", pages: 28 },
    { title: "Análisis de Márgenes por Línea", date: "10 Jun 2026", type: "PDF", pages: 18 },
    { title: "Proyección Financiera 12 Meses", date: "05 Jun 2026", type: "PDF", pages: 22 },
    { title: "Informe de Riesgo Cambiario", date: "01 Jun 2026", type: "PDF", pages: 15 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-50">Reportes</h1>
          <p className="text-sm text-surface-400">Informes generados por el sistema</p>
        </div>
        <button className="rounded-lg border border-surface-700 bg-surface-800 px-4 py-2 text-sm font-medium text-surface-200 hover:bg-surface-700 transition-colors">
          Generar Reporte
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {reports.map((r) => (
          <div key={r.title} className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-5 transition-colors hover:bg-surface-800">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-surface-200">{r.title}</h3>
                <p className="mt-1 text-xs text-surface-500">{r.date} · {r.pages} páginas</p>
              </div>
              <span className="rounded-md bg-surface-700/50 px-2 py-1 text-[10px] font-medium text-surface-400">{r.type}</span>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="rounded-lg bg-accent-600/10 px-3 py-1.5 text-xs font-medium text-accent-400 hover:bg-accent-600/20 transition-colors">
                Ver
              </button>
              <button className="rounded-lg bg-surface-700/50 px-3 py-1.5 text-xs font-medium text-surface-400 hover:bg-surface-700 transition-colors">
                Descargar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
