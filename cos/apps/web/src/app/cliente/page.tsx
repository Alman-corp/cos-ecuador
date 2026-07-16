export default async function ClientePortalPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Portal del Cliente</h1>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <p className="text-slate-500 text-center py-12">Portal del Cliente — requiere autenticacion. Implementar login con portal_token JWT.</p>
      </main>
    </div>
  )
}
