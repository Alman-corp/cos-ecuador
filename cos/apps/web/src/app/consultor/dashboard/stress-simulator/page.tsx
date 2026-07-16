"use client"

import { useStressSimulation } from "@/hooks/useStressSimulation"
import { StressControls } from "@/components/war-room/StressControls"
import { KpiGrid } from "@/components/war-room/KpiGrid"
import { CashProjectionChart } from "@/components/war-room/CashProjectionChart"
import { ScenarioComparison } from "@/components/war-room/ScenarioComparison"
import { Crosshair, TrendingDown } from "lucide-react"

export default function StressSimulatorPage() {
  const { params, updateParam, resetParams, analysis } = useStressSimulation()

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-surface-50">
            <Crosshair className="text-danger" size={22} />
            Sala de Guerra Financiera
          </h1>
          <p className="mt-0.5 text-sm text-surface-400">
            Simulador de estrés de liquidez — manipula las variables y visualiza el impacto
            en tiempo real sobre la caja de tu cliente.
          </p>
        </div>
        <div className="hidden rounded-lg border border-surface-700/50 bg-surface-800/50 px-4 py-2 text-xs text-surface-400 sm:block">
          Cliente: <span className="font-semibold text-surface-200">Exportadora Guayaquil S.A.</span>
        </div>
      </div>

      {/* ── KPI Dashboard ── */}
      <KpiGrid result={analysis.base} />

      {/* ── Main Grid: Controls + Chart ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <StressControls
            params={params}
            onChange={updateParam}
            onReset={resetParams}
          />
        </div>

        <div className="space-y-6 lg:col-span-9">
          <CashProjectionChart data={analysis.base.timeline} />
          <ScenarioComparison scenarios={analysis.scenarios} />
        </div>
      </div>

      {/* ── Sales Play Footer (hidden in production) ── */}
      <details className="rounded-xl border border-surface-700/30 bg-surface-800/30 p-4 text-xs text-surface-500">
        <summary className="cursor-pointer font-medium text-surface-400 hover:text-surface-200">
          🎯 Coreografía de venta — Guion para cierre
        </summary>
        <div className="mt-3 space-y-2 leading-relaxed">
          <p><strong className="text-surface-300">1. Estado base:</strong> Abre con sliders en default. Runway 6+ meses. Verde. El CEO relajado.</p>
          <p><strong className="text-surface-300">2. El golpe:</strong> <em>"Su principal cliente está estirando pagos a 60 días..."</em> → Mueve DSO a 65. La línea cae. El runway se tiñe de amarillo.</p>
          <p><strong className="text-surface-300">3. El knock-out:</strong> <em>"...y si la FED sube tasas 4% más..."</em> → Sube tasa a +5%. La línea cruza la roja en M3. Runway: 2 meses. Silencio incómodo.</p>
          <p><strong className="text-surface-300">4. El cierre:</strong> <em>"Eso pasa sin nuestro Command Center. Con nosotros, esa línea roja nunca se materializa. ¿Comenzamos el lunes?"</em></p>
        </div>
      </details>
    </div>
  )
}
