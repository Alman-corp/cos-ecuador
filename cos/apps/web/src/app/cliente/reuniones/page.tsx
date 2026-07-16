export default function ReunionesPage() {
  const meetings = [
    { title: "Revisión Mensual de Resultados", date: "30 Jun 2026", time: "10:00 - 11:30", with: "Carlos Andrade", type: "Zoom" },
    { title: "Presentación Informe Trimestral", date: "15 Jul 2026", time: "09:00 - 10:00", with: "Equipo COS", type: "Presencial" },
    { title: "Auditoría Forense - Sesión 1", date: "25 Jul 2026", time: "09:00 - 12:00", with: "María Fernanda", type: "Zoom" },
    { title: "Revisión Estrategia Fiscal", date: "05 Ago 2026", time: "11:00 - 12:00", with: "Carlos Andrade", type: "Zoom" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-50">Reuniones</h1>
          <p className="text-sm text-surface-400">Agenda y seguimiento de sesiones</p>
        </div>
        <button className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-500 transition-colors">
          + Agendar
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {meetings.map((m) => (
          <div key={m.title} className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-5 transition-colors hover:bg-surface-800">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-surface-200">{m.title}</h3>
                <p className="mt-1 text-xs text-surface-500">{m.date} · {m.time}</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-xs text-surface-400">Con: {m.with}</span>
                  <span className="rounded-md bg-surface-700/50 px-2 py-0.5 text-[10px] font-medium text-surface-400">{m.type}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="rounded-lg bg-accent-600/10 px-3 py-1.5 text-xs font-medium text-accent-400 hover:bg-accent-600/20 transition-colors">
                  Confirmar
                </button>
                <button className="rounded-lg bg-surface-700/50 px-3 py-1.5 text-xs font-medium text-surface-400 hover:bg-surface-700 transition-colors">
                  Detalle
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
