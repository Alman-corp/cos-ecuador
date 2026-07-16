import type { ReactNode } from "react"
import { AuthProvider } from "@/components/auth/AuthProvider"
import Link from "next/link"

const navLinks = [
  { href: "/cliente", label: "Dashboard", exact: true },
  { href: "/cliente/documentos", label: "Documentos" },
  { href: "/cliente/reportes", label: "Reportes" },
  { href: "/cliente/mensajes", label: "Mensajes" },
  { href: "/cliente/reuniones", label: "Reuniones" },
]

export default function ClienteLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col bg-surface-900">
        <header className="flex h-16 items-center justify-between border-b border-surface-700/50 bg-surface-950 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-600/10 ring-1 ring-accent-500/20">
              <span className="text-xs font-bold text-accent-400">CC</span>
            </div>
            <span className="text-sm font-semibold text-surface-50">Command Center</span>
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
