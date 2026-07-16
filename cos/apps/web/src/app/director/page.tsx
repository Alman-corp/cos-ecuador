export default async function DirectorPortalPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold">Panel del Director</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[{ label: "Clientes Activos", value: "0" }, { label: "Proyectos", value: "0" }, { label: "DD Completados", value: "0" }, { label: "Equipo", value: "0" }].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-xl p-6 shadow-sm border">
              <p className="text-3xl font-bold">{kpi.value}</p>
              <p className="text-sm text-slate-500">{kpi.label}</p>
            </div>
          ))}
        </div>
        <p className="text-slate-500 text-center py-12">Panel del Director — requiere autenticacion con rol &quot;director&quot;.</p>
      </main>
    </div>
  )
}
