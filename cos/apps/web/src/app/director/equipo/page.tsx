export default function EquipoPage() {
  const team = [
    { name: "Carlos Andrade", rol: "Consultor Líder", clientes: 5, proyectos: 4, facturacion: "$12,500", eficiencia: 94 },
    { name: "María Fernanda", rol: "Analista Financiero", clientes: 4, proyectos: 3, facturacion: "$9,800", eficiencia: 88 },
    { name: "Juan Pablo", rol: "Consultor Senior", clientes: 3, proyectos: 2, facturacion: "$7,200", eficiencia: 82 },
    { name: "Ana Lucía", rol: "Analista Tributario", clientes: 3, proyectos: 2, facturacion: "$6,900", eficiencia: 79 },
    { name: "Pedro Gómez", rol: "Consultor Junior", clientes: 3, proyectos: 1, facturacion: "$6,100", eficiencia: 71 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-surface-50">Equipo</h1>
        <p className="text-sm text-surface-400">Rendimiento y carga laboral de consultores</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-surface-700/50">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-700/50 bg-surface-950">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-surface-400">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-surface-400">Rol</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-surface-400">Clientes</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-surface-400">Proyectos</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-surface-400">Facturación</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-surface-400">Eficiencia</th>
            </tr>
          </thead>
          <tbody>
            {team.map((m) => (
              <tr key={m.name} className="border-b border-surface-700/30 hover:bg-surface-800/50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-surface-200">{m.name}</td>
                <td className="px-4 py-3 text-sm text-surface-400">{m.rol}</td>
                <td className="px-4 py-3 text-center text-sm text-surface-400">{m.clientes}</td>
                <td className="px-4 py-3 text-center text-sm text-surface-400">{m.proyectos}</td>
                <td className="px-4 py-3 text-right font-mono text-sm text-success">{m.facturacion}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-700">
                      <div className={`h-full rounded-full ${m.eficiencia >= 90 ? "bg-success" : m.eficiencia >= 80 ? "bg-amber-500" : "bg-rose-500"}`}
                        style={{ width: `${m.eficiencia}%` }} />
                    </div>
                    <span className="text-xs text-surface-400">{m.eficiencia}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
