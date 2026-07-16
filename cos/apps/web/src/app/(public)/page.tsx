import Link from "next/link"

const modules = [
  { name: "Auditoría Financiera", desc: "DCF, WACC, Monte Carlo, ratios, estrés de liquidez en tiempo real", icon: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { name: "Cumplimiento Tributario", desc: "Cruza Anexos SRI, detecta glosas, optimiza retenciones y calendario fiscal", icon: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" },
  { name: "Análisis Legal", desc: "Contratos, cláusulas de riesgo, cumplimiento normativo y versionado", icon: "M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" },
  { name: "Sala de Guerra", desc: "Simulador de estrés con sliders en tiempo real — liquidez, tasas, DSO, EBITDA", icon: "M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" },
  { name: "Agentes IA", desc: "Especialistas en finanzas, tributario y legal coordinados por un orquestador", icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" },
  { name: "Portal Cliente", desc: "Dashboard personalizado, documentos, reportes, mensajes y reuniones en un solo lugar", icon: "M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" },
]

const metrics = [
  { value: "45s", label: "Procesamiento promedio de un balance completo" },
  { value: "24/7", label: "Monitoreo continuo de variables financieras" },
  { value: "40+", label: "Ratios financieros calculados automáticamente" },
  { value: "10k", label: "Simulaciones Monte Carlo por escenario" },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-surface-900 text-surface-100">
      {/* Nav */}
      <header className="fixed top-0 z-50 w-full border-b border-surface-800 bg-surface-950/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-600/10 ring-1 ring-accent-500/20">
              <svg className="h-4 w-4 text-accent-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-surface-50">Consulting OS</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/auth/login" className="text-sm text-surface-400 hover:text-surface-200 transition-colors">
              Iniciar Sesión
            </Link>
            <a href="#demo" className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-500 transition-colors">
              Solicitar Demo
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent-600/5 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-surface-700 bg-surface-800/50 px-4 py-1.5 text-xs font-medium text-surface-400">
            Infraestructura de Inteligencia Financiera
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-surface-50 sm:text-5xl lg:text-6xl">
            Tu consultoría financiera
            <br />
            <span className="bg-gradient-to-r from-accent-400 to-accent-300 bg-clip-text text-transparent">
              funcionando 24/7 sin fatiga
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-surface-400">
            Reemplaza el trabajo operativo de analistas, contadores y consultores con un sistema
            multi-agente de IA que audita, calcula, proyecta y genera estrategias en tiempo real.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <a href="#demo" className="rounded-lg bg-accent-600 px-6 py-3 text-sm font-semibold text-white hover:bg-accent-500 transition-colors">
              Ver Plataforma
            </a>
            <Link href="/auth/login" className="rounded-lg border border-surface-700 bg-surface-800/50 px-6 py-3 text-sm font-semibold text-surface-200 hover:bg-surface-800 transition-colors">
              Acceder
            </Link>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="border-y border-surface-800 py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {metrics.map((m) => (
              <div key={m.value} className="text-center">
                <p className="text-3xl font-bold text-surface-50">{m.value}</p>
                <p className="mt-1 text-xs text-surface-500">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-surface-50">Un sistema, seis módulos, cero fricción</h2>
            <p className="mt-4 text-surface-400">Cada módulo reemplaza un área operativa completa de tu consultora</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((m) => (
              <div key={m.name} className="group rounded-xl border border-surface-800 bg-surface-900 p-6 transition-all hover:border-surface-700 hover:bg-surface-800/50">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent-600/10 ring-1 ring-accent-500/20">
                  <svg className="h-5 w-5 text-accent-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={m.icon} />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-surface-200">{m.name}</h3>
                <p className="mt-2 text-xs leading-5 text-surface-500">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-surface-800 py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-surface-50">Cómo funciona</h2>
            <p className="mt-4 text-surface-400">Tres pasos para transformar tu operación</p>
          </div>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {[
              { step: "01", title: "Conecta tus datos", desc: "API, PDF, XML o Excel. El sistema ingiere y normaliza balances, declaraciones SRI, contratos y más." },
              { step: "02", title: "Los agentes analizan", desc: "El orquestador IA despierta a los especialistas: financiero, tributario y legal. Cada uno ejecuta modelos econométricos." },
              { step: "03", title: "Recibe inteligencia", desc: "Reportes ejecutivos, alertas predictivas, simulaciones de estrés y recomendaciones estratégicas en tu portal." },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-600/10 text-lg font-bold text-accent-400 ring-1 ring-accent-500/20">
                  {s.step}
                </div>
                <h3 className="text-sm font-semibold text-surface-200">{s.title}</h3>
                <p className="mt-2 text-xs leading-5 text-surface-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / Demo */}
      <section id="demo" className="border-t border-surface-800 py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold text-surface-50">
          ¿Listo para automatizar tu consultora?
          </h2>
          <p className="mt-4 text-surface-400">
            Agenda una demo de 30 minutos. Te mostraremos cómo tu primer balance
            se procesa, analiza y convierte en estrategia en menos de 60 segundos.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <a
              href="mailto:demo@consultingos.io"
              className="rounded-lg bg-accent-600 px-8 py-3 text-sm font-semibold text-white hover:bg-accent-500 transition-colors"
            >
              Solicitar Demo
            </a>
            <Link
              href="/auth/login"
              className="rounded-lg border border-surface-700 bg-surface-800/50 px-8 py-3 text-sm font-semibold text-surface-200 hover:bg-surface-800 transition-colors"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-800 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-xs text-surface-600">
          <p>&copy; 2026 Consulting OS. Todos los derechos reservados.</p>
          <div className="flex items-center gap-6">
            <span>Ecuador</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
