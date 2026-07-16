"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

export function BetaWelcome() {
  const [status, setStatus] = useState<"loading" | "ready" | "seeding" | "seeded" | "error">("loading")
  const [stats, setStats] = useState<any>(null)
  const [show, setShow] = useState(true)

  useEffect(() => {
    fetch("/api/beta")
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats)
        if (data.seeded) setStatus("seeded")
        else setStatus("ready")
      })
      .catch(() => setStatus("error"))
  }, [])

  const handleSeed = async () => {
    setStatus("seeding")
    const res = await fetch("/api/beta", { method: "POST" })
    if (res.ok) {
      const data = await res.json()
      setStatus("seeded")
      setStats(data.stats)
      window.location.reload()
    } else {
      setStatus("error")
    }
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="w-full max-w-lg mx-4 bg-surface-900 border border-surface-700/50 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-amber-600/10 to-purple-600/10 border-b border-surface-700/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600/20 ring-1 ring-amber-500/30">
              <span className="text-sm font-bold text-amber-400">B</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-surface-50">Beta Platform</h2>
              <p className="text-xs text-surface-400">Enterprise Cognitive System · v1.0.0</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {status === "loading" && (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm text-surface-400">Inicializando plataforma...</p>
            </div>
          )}

          {status === "ready" && (
            <>
              <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-300 mb-1">Bienvenido a la Beta</h3>
                <p className="text-xs text-surface-400">La plataforma está lista pero vacía. Presiona "Cargar Datos Demo" para poblar la plataforma con datos de ejemplo y explorar todas las capacidades del Executive Brain.</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-surface-800/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-surface-400">14</p>
                  <p className="text-[10px] text-surface-500">Dimensiones Genome</p>
                </div>
                <div className="bg-surface-800/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-surface-400">8</p>
                  <p className="text-[10px] text-surface-500">Motores Executive Brain</p>
                </div>
              </div>

              <button onClick={handleSeed} className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-medium transition-colors">
                🚀 Cargar Datos Demo
              </button>

              <div className="flex justify-center gap-4 text-xs text-surface-500">
                <span>✓ Executive Brain</span>
                <span>✓ Enterprise Genome</span>
                <span>✓ Business Cases</span>
              </div>
            </>
          )}

          {status === "seeding" && (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm text-surface-400">Poblando plataforma con datos demo...</p>
              <p className="text-xs text-surface-500 mt-1">Memoria, Planes, Casos, Genoma</p>
            </div>
          )}

          {status === "seeded" && stats && (
            <>
              <div className="bg-green-600/10 border border-green-600/20 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-green-300 mb-1">✓ Plataforma Inicializada</h3>
                <p className="text-xs text-surface-400">Datos demo cargados exitosamente. Explora las capacidades del sistema.</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-surface-800/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-amber-400">{stats.memoryEntries}</p>
                  <p className="text-[10px] text-surface-500">Eventos en Memoria</p>
                </div>
                <div className="bg-surface-800/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-amber-400">{stats.plans}</p>
                  <p className="text-[10px] text-surface-500">Planes Estratégicos</p>
                </div>
                <div className="bg-surface-800/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-amber-400">{stats.businessCases}</p>
                  <p className="text-[10px] text-surface-500">Casos de Negocio</p>
                </div>
                <div className="bg-surface-800/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-amber-400">{stats.genomeAnalyzed ? "✓" : "—"}</p>
                  <p className="text-[10px] text-surface-500">Genoma Empresarial</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-surface-400">Navegación rápida:</p>
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/director" className="px-3 py-2 bg-surface-800/50 rounded-lg text-xs text-surface-300 hover:bg-surface-700/50 transition-colors text-center">
                    📊 Dashboard Ejecutivo
                  </Link>
                  <Link href="/director/planificacion" className="px-3 py-2 bg-surface-800/50 rounded-lg text-xs text-surface-300 hover:bg-surface-700/50 transition-colors text-center">
                    🎯 Planificación
                  </Link>
                  <Link href="/director/ejecucion" className="px-3 py-2 bg-surface-800/50 rounded-lg text-xs text-surface-300 hover:bg-surface-700/50 transition-colors text-center">
                    📈 Monitor de Ejecución
                  </Link>
                  <Link href="/director/biblioteca" className="px-3 py-2 bg-surface-800/50 rounded-lg text-xs text-surface-300 hover:bg-surface-700/50 transition-colors text-center">
                    📚 Business Case Library
                  </Link>
                  <Link href="/director/genoma" className="px-3 py-2 bg-surface-800/50 rounded-lg text-xs text-surface-300 hover:bg-surface-700/50 transition-colors text-center">
                    🧬 Enterprise Genome
                  </Link>
                  <Link href="/director/productos" className="px-3 py-2 bg-surface-800/50 rounded-lg text-xs text-surface-300 hover:bg-surface-700/50 transition-colors text-center">
                    🏪 Platform Products
                  </Link>
                </div>
              </div>

              <button onClick={() => setShow(false)} className="w-full py-2.5 bg-surface-800 hover:bg-surface-700 text-surface-200 rounded-xl text-sm font-medium transition-colors">
                Comenzar a Explorar →
              </button>
            </>
          )}

          {status === "error" && (
            <div className="bg-red-600/10 border border-red-600/20 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-red-300 mb-1">Error de inicialización</h3>
              <p className="text-xs text-surface-400">No se pudo conectar con la API. Asegúrate de que el servidor esté corriendo.</p>
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-surface-800/30 border-t border-surface-700/30">
          <p className="text-[10px] text-surface-600 text-center">
            Business Intelligence Platform · Executive Brain v2 · 83 API Routes
          </p>
        </div>
      </div>
    </div>
  )
}
