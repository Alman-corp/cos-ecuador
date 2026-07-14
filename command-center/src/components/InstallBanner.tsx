"use client"

import { usePWA } from "@/lib/hooks/use-pwa"
import { useEffect } from "react"

export function InstallBanner() {
  const { isInstallable, isInstalled, install, registerServiceWorker } = usePWA()

  useEffect(() => {
    registerServiceWorker()
  }, [registerServiceWorker])

  if (!isInstallable || isInstalled) return null

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl border border-blue-500/20 bg-blue-900/90 p-4 shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/20">
          <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">Instalar COS Ecuador</p>
          <p className="text-xs text-blue-200">Accede rápido desde tu pantalla de inicio</p>
        </div>
        <button
          onClick={install}
          className="shrink-0 rounded-lg bg-blue-500 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-400"
        >
          Instalar
        </button>
        <button
          onClick={() => {
            const banner = document.getElementById("install-banner")
            if (banner) banner.style.display = "none"
          }}
          id="install-banner-close"
          className="shrink-0 text-blue-300 hover:text-white"
          aria-label="Cerrar"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
