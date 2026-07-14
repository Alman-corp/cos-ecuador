"use client"

import { useState } from "react"
import { ArrowRight, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

interface AnalysisOption {
  id: string
  label: string
  description: string
  default: boolean
}

const OPTIONS: AnalysisOption[] = [
  { id: "dcf", label: "Valuación DCF", description: "Flujo de caja descontado con WACC y valor terminal", default: true },
  { id: "comparables", label: "Análisis de Comparables", description: "Múltiplos EV/EBITDA, P/E vs sector", default: true },
  { id: "stress", label: "Stress Testing", description: "Proyección bajo 3 escenarios (pesimista, base, optimista)", default: true },
  { id: "peers", label: "Benchmarking de Pares", description: "Posicionamiento vs competidores directos", default: false },
  { id: "margins", label: "Análisis de Márgenes", description: "Desglose de rentabilidad por línea de negocio", default: true },
  { id: "risk", label: "Matriz de Riesgos", description: "Identificación y scoring de riesgos operativos y financieros", default: false },
]

export function ConfigStep({
  onSubmit,
}: {
  data: { name?: string }
  onSubmit: (modules: string[]) => void
}) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(OPTIONS.filter((o) => o.default).map((o) => o.id))
  )
  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-surface-50 mb-2">
          Configura el análisis
        </h1>
        <p className="text-surface-400">
          Selecciona los módulos que quieres ejecutar. Puedes agregar más
          después.
        </p>
      </div>

      <div className="space-y-2">
        {OPTIONS.map((opt) => {
          const isOn = selected.has(opt.id)
          return (
            <motion.button
              key={opt.id}
              layout
              onClick={() => toggle(opt.id)}
              className={`w-full flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                isOn
                  ? "border-accent-500/30 bg-accent-500/5"
                  : "border-surface-800 bg-surface-900/30 hover:border-surface-700"
              }`}
            >
              <div
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                  isOn
                    ? "border-accent-500 bg-accent-500 text-white"
                    : "border-surface-600"
                }`}
              >
                {isOn && (
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-surface-200">
                  {opt.label}
                </p>
                <p className="text-xs text-surface-500 mt-0.5">
                  {opt.description}
                </p>
              </div>
            </motion.button>
          )
        })}
      </div>

      <div className="rounded-xl border border-surface-800 bg-surface-900/30 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-surface-400">Módulos seleccionados</span>
          <span className="font-semibold text-surface-200">
            {selected.size} de {OPTIONS.length}
          </span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-surface-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-accent-500 transition-all"
            style={{ width: `${(selected.size / OPTIONS.length) * 100}%` }}
          />
        </div>
      </div>

      <Button
        onClick={() => {
          if (selected.size === 0) return
          onSubmit(Array.from(selected))
        }}
        disabled={selected.size === 0}
        className="w-full"
      >
        <Sparkles className="h-4 w-4" />
        Iniciar Due Diligence ({selected.size} módulos)
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
