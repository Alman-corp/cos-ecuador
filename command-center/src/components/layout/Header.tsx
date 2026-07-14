"use client"

import { useAuth } from "@/components/auth/AuthProvider"
import { NotificationCenter } from "@/components/shared/NotificationCenter"

export function Header() {
  const { user } = useAuth()

  return (
    <header className="flex h-16 items-center justify-between border-b border-surface-700/50 bg-surface-900/80 px-6 backdrop-blur-sm">
      <div>
        <h2 className="text-base font-semibold text-surface-50">
          Panel de Control
        </h2>
        <p className="text-xs text-surface-500">
          Resumen ejecutivo en tiempo real
        </p>
      </div>

      <div className="flex items-center gap-4">
        <NotificationCenter />

        <div className="flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success ring-1 ring-success/20">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Sistema operativo
        </div>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-700 text-xs font-semibold text-surface-300">
            {user?.email?.charAt(0).toUpperCase() ?? "U"}
          </div>
        </div>
      </div>
    </header>
  )
}
