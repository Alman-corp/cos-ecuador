"use client"

const footerLinks = [
  {
    title: "Producto",
    links: [
      "Dashboard",
      "Agentes IA",
      "RAG Trazable",
      "Reportes",
      "Pricing",
    ],
  },
  {
    title: "Recursos",
    links: [
      "Documentación",
      "API Reference",
      "Blog",
      "Case Studies",
      "Webinars",
    ],
  },
  {
    title: "Compañía",
    links: ["Sobre COS", "Equipo", "Carreras", "Contacto", "Prensa"],
  },
  {
    title: "Legal",
    links: [
      "Términos",
      "Privacidad",
      "GDPR",
      "SOC 2",
      "DPA",
    ],
  },
  {
    title: "Contacto",
    links: [
      "hola@cos-platform.com",
      "+1 (555) 000-0000",
      "San Francisco, CA",
      "Ciudad de México",
      "Madrid, España",
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-surface-800 bg-surface-950">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="mb-4 text-xs font-semibold tracking-wider text-surface-400 uppercase">
                {group.title}
              </h4>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link}>
                    <span className="text-sm text-surface-500 transition-colors hover:text-surface-300 cursor-default">
                      {link}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-surface-800 pt-8 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-600/10">
              <div className="h-3 w-3 rounded bg-accent-400" />
            </div>
            <span className="text-sm font-semibold text-surface-300">
              COS Platform
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-surface-600">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Todos los sistemas operativos
            </div>
            <span>v3.2.0</span>
            <span>© 2026 COS Inc.</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
