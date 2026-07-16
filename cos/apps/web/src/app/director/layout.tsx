import type { ReactNode } from "react"
import { AuthProvider } from "@/components/auth/AuthProvider"
import Link from "next/link"
import { BetaWelcome } from "@/components/beta/BetaWelcome"

const navLinks = [
  { href: "/director", label: "Dashboard", exact: true },
  { href: "/director/equipo", label: "Equipo" },
  { href: "/director/finanzas", label: "Finanzas" },
  { href: "/director/clientes-global", label: "Clientes" },
  { href: "/director/riesgos", label: "Riesgos" },
  { href: "/director/telemetria", label: "Telemetria" },
  { href: "/director/adn", label: "ADN" },
  { href: "/director/product-os", label: "Product OS" },
  { href: "/director/planificacion", label: "Planificación" },
  { href: "/director/ejecucion", label: "Ejecución" },
  { href: "/director/biblioteca", label: "Biblioteca" },
  { href: "/director/genoma", label: "Genoma" },
  { href: "/director/productos", label: "Productos" },
  { href: "/director/platform", label: "Platform" },
]

export default function DirectorLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <BetaWelcome />
      <div className="flex min-h-screen flex-col bg-surface-900">
        <header className="flex h-16 items-center justify-between border-b border-surface-700/50 bg-surface-950 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600/10 ring-1 ring-amber-500/20">
              <span className="text-xs font-bold text-amber-400">CD</span>
            </div>
            <span className="text-sm font-semibold text-surface-50">Directorio</span>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-surface-400 transition-colors hover:text-surface-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </AuthProvider>
  )
}
