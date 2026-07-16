import Link from "next/link"

const EXECUTIVE_BRAIN = [
  { name: "Memory Engine", desc: "Memoria empresarial estructurada con 11 tipos de eventos" },
  { name: "Reasoning Engine", desc: "Diagnóstico causal con hipótesis y confianza" },
  { name: "Prediction Engine", desc: "Proyecciones con 4 escenarios y alertas tempranas" },
  { name: "Planning Engine", desc: "Planes ejecutables con fases, tareas, presupuesto y KPIs" },
  { name: "Execution Engine", desc: "Monitoreo en vivo, desviaciones y correcciones automáticas" },
  { name: "Learning Engine", desc: "Business Case Library — aprendizaje basado en resultados reales" },
  { name: "Confidence Engine", desc: "Confianza explicable con 6 factores transparentes" },
  { name: "Optimization Engine", desc: "Mejora continua post-ejecución con simulación what-if" },
]

const DIMENSIONS = [
  "Finanzas", "Operaciones", "Talento", "Digitalización", "Clientes",
  "Comercial", "Tributario", "Legal", "Tecnología", "Cultura",
  "Innovación", "Gobierno", "ESG", "Madurez Empresarial",
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Nav */}
      <header className="flex h-16 items-center justify-between border-b border-white/10 px-6 lg:px-12">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600/20">
            <span className="text-xs font-bold text-amber-400">B</span>
          </div>
          <span className="text-sm font-semibold">BIOS Platform</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-white/60">
          <a href="#platform" className="hover:text-white transition-colors">Plataforma</a>
          <a href="#brain" className="hover:text-white transition-colors">Executive Brain</a>
          <a href="#genome" className="hover:text-white transition-colors">Enterprise Genome</a>
          <a href="#casos" className="hover:text-white transition-colors">Casos</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/director" className="px-4 py-2 text-sm text-white/80 hover:text-white transition-colors">Iniciar Sesión</Link>
          <Link href="/director" className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors">Beta Gratis</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 lg:px-12 pt-24 pb-32 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-600/10 border border-amber-600/20 rounded-full text-xs text-amber-400 mb-6">
          🚀 Beta disponible
        </div>
        <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6">
          Inteligencia Empresarial
          <span className="block text-amber-400">para Pymes y Consultoras</span>
        </h1>
        <p className="text-lg text-white/60 max-w-2xl mx-auto mb-10">
          Ocho motores cognitivos que diagnostican, predicen, planifican, ejecutan y aprenden.
          Una plataforma que convierte datos empresariales en inteligencia accionable.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/director" className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-medium transition-colors text-lg">
            Comenzar Beta Gratis
          </Link>
          <a href="#brain" className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium transition-colors text-lg">
            Ver Executive Brain
          </a>
        </div>
        <div className="mt-12 grid grid-cols-4 gap-6 max-w-3xl mx-auto">
          {[{ n: "84", l: "API Routes" }, { n: "14", l: "Dimensiones Genome" }, { n: "8", l: "Motores Cognitivos" }, { n: "100%", l: "Arquitectura Validada" }].map((s) => (
            <div key={s.l} className="text-center">
              <p className="text-3xl font-bold text-amber-400">{s.n}</p>
              <p className="text-xs text-white/40">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Platform Overview */}
      <section id="platform" className="px-6 lg:px-12 py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Arquitectura de Plataforma</h2>
          <p className="text-white/50 mb-12 max-w-2xl">No es un CRM ni un ERP. Es una plataforma de inteligencia empresarial con un Executive Brain de 8 motores, un sistema de memoria, un genoma empresarial y un marketplace de productos verticales.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Executive Brain", items: ["8 motores cognitivos", "Diagnóstico causal", "Predicción con escenarios", "Planes ejecutables", "Aprendizaje continuo"] },
              { title: "Enterprise Genome", items: ["14 dimensiones", "Puntaje 0-100 por dimensión", "Comparación entre empresas", "Recomendaciones dirigidas", "Detección de fortalezas/debilidades"] },
              { title: "Ecosistema", items: ["Marketplace de productos", "5 verticales preinstalados", "SDK de extensiones", "Certificación automatizada", "Desktop app (Windows)"] },
            ].map((col) => (
              <div key={col.title} className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-amber-400 mb-4">{col.title}</h3>
                <ul className="space-y-2">
                  {col.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-white/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Executive Brain */}
      <section id="brain" className="px-6 lg:px-12 py-24 border-t border-white/5 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Executive Brain</h2>
          <p className="text-white/50 mb-12 max-w-2xl">Ocho motores especializados que trabajan en conjunto para transformar datos en inteligencia.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {EXECUTIVE_BRAIN.map((engine) => (
              <div key={engine.name} className="bg-white/5 rounded-xl p-5 border border-white/10 hover:border-amber-500/30 transition-colors group">
                <h3 className="text-sm font-semibold text-amber-400 group-hover:text-amber-300 transition-colors">{engine.name}</h3>
                <p className="text-xs text-white/50 mt-1">{engine.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise Genome */}
      <section id="genome" className="px-6 lg:px-12 py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">Enterprise Genome</h2>
              <p className="text-white/50 mb-6">Cada empresa tiene un ADN único. Catorce dimensiones evaluadas en tiempo real que permiten comparaciones precisas y recomendaciones personalizadas.</p>
              <div className="flex flex-wrap gap-2">
                {DIMENSIONS.map((d) => (
                  <span key={d} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/60">{d}</span>
                ))}
              </div>
              <Link href="/director/genoma" className="inline-block mt-8 px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors">
                Ver Genoma Demo →
              </Link>
            </div>
            <div className="bg-white/5 rounded-xl p-8 border border-white/10">
              <div className="space-y-4">
                {DIMENSIONS.slice(0, 7).map((d, i) => {
                  const score = [82, 65, 71, 58, 78, 63, 91][i]
                  return (
                    <div key={d}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-white/70">{d}</span>
                        <span className="text-amber-400 font-mono">{score}</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-400" style={{ width: `${score}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Casos de Uso */}
      <section id="casos" className="px-6 lg:px-12 py-24 border-t border-white/5 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Casos de Uso</h2>
          <p className="text-white/50 mb-12 max-w-2xl">Industrias donde el Executive Brain genera valor medible.</p>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { sector: "Consultoría", caso: "Diagnóstico financiero + plan de acción en 24h" },
              { sector: "Manufactura", caso: "Optimización de costos operativos con predicción" },
              { sector: "Retail", caso: "Transformación digital omnicanal con métricas" },
              { sector: "Salud", caso: "Cumplimiento normativo y eficiencia operativa" },
              { sector: "Construcción", caso: "Reestructuración financiera con monitoreo" },
              { sector: "Logística", caso: "Automatización de procesos con ROI medido" },
              { sector: "Servicios", caso: "Plan de crecimiento con Business Case Library" },
              { sector: "Educación", caso: "Digitalización y análisis de matrícula" },
            ].map((item) => (
              <div key={item.sector} className="bg-white/5 rounded-xl p-5 border border-white/10 hover:border-amber-500/30 transition-colors">
                <p className="text-xs text-amber-400 mb-1">{item.sector}</p>
                <p className="text-sm text-white/70">{item.caso}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="px-6 lg:px-12 py-24 border-t border-white/5 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">Listo para probar</h2>
          <p className="text-white/50 mb-8 max-w-xl mx-auto">Sin instalación. Sin compromiso. Datos demo precargados para explorar todas las capacidades.</p>
          <Link href="/director" className="inline-block px-10 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-medium text-lg transition-colors">
            Abrir Beta →
          </Link>
          <p className="text-xs text-white/30 mt-4">84 API Routes · TypeScript · Next.js 16 · Electron</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 lg:px-12 py-8 border-t border-white/5 text-center text-xs text-white/30">
        Business Intelligence Platform · Executive Brain v2 · Enterprise Genome
      </footer>
    </div>
  )
}
