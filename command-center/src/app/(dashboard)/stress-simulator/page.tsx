"use client"

import { useState, useMemo, useEffect } from "react"
import { KPICard } from "@/components/shared/KPICard"
import { TornadoChart } from "@/components/shared/TornadoChart"
import { FinancialNarrative } from "@/components/shared/FinancialNarrative"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import { useSimulationsQuery, useSaveSimulationMutation } from "@/lib/hooks/use-simulations-query"

const initial = {
  revenueGrowth: 2.0,
  cogsRatio: 82.0,
  opexRatio: 13.4,
  interestRate: 3.5,
  taxRate: 21.0,
  capexRatio: 9.0,
}

const monthlyKPI = {
  revenue: 7900000000,
  cogs: 6480000000,
  opex: 1060000000,
  ebitda: 1216000000,
  interest: 28000000,
  tax: 250000000,
  netIncome: 940000000,
}

function project(sliders: typeof initial, months: number) {
  let rev = monthlyKPI.revenue
  const projections = []
  for (let m = 0; m < months; m++) {
    const g = rev * (sliders.revenueGrowth / 100)
    const cogs = rev * (sliders.cogsRatio / 100)
    const opex = rev * (sliders.opexRatio / 100)
    const ebitda = rev - cogs - opex
    const interest = rev * (sliders.interestRate / 100) * 0.01
    const ebt = ebitda - interest
    const tax = ebt * (sliders.taxRate / 100)
    const ni = ebt - tax
    projections.push({ month: m + 1, revenue: rev, grossProfit: rev - cogs, ebitda, netIncome: ni })
    rev += g
  }
  return projections
}

const scenarioLabels = ["Base", "Optimista", "Pesimista"] as const
const scenarioSliders: Array<typeof initial> = [
  initial,
  { ...initial, revenueGrowth: 8.0, cogsRatio: 78.0, opexRatio: 11.0 },
  { ...initial, revenueGrowth: -3.0, cogsRatio: 86.0, opexRatio: 16.0 },
]

const narrativeMetrics = [
  { label: "Revenue Mensual", current: monthlyKPI.revenue, previous: monthlyKPI.revenue, higherIsBetter: true },
  { label: "EBITDA Mensual", current: monthlyKPI.ebitda, previous: monthlyKPI.ebitda, higherIsBetter: true },
  { label: "Margen Neto", current: (monthlyKPI.netIncome / monthlyKPI.revenue) * 100, previous: 6.5, higherIsBetter: true },
]

export default function StressSimulatorPage() {
  const { data: simResult, isLoading: simLoading, isError: simError } = useSimulationsQuery()
  const saveMutation = useSaveSimulationMutation()

  const [sliders, setSliders] = useState(initial)
  const [whatIf, setWhatIf] = useState(false)

  useEffect(() => {
    if (simResult?.data) {
      setSliders(simResult.data.sliders)
    }
  }, [simResult])

  const months = 12
  const proj = project(sliders, months)
  const last = proj[proj.length - 1]
  const first = proj[0]

  const tornadoBars = useMemo(() => [
    {
      label: "COGS Ratio",
      baseValue: sliders.cogsRatio,
      lowValue: sliders.cogsRatio - 5,
      highValue: sliders.cogsRatio + 5,
      unit: "%",
    },
    {
      label: "Crecimiento Rev",
      baseValue: sliders.revenueGrowth,
      lowValue: sliders.revenueGrowth - 4,
      highValue: sliders.revenueGrowth + 4,
      unit: "% mensual",
    },
    {
      label: "OPEX Ratio",
      baseValue: sliders.opexRatio,
      lowValue: sliders.opexRatio - 3,
      highValue: sliders.opexRatio + 3,
      unit: "%",
    },
    {
      label: "Tasa de Interés",
      baseValue: sliders.interestRate,
      lowValue: sliders.interestRate - 2,
      highValue: sliders.interestRate + 2,
      unit: "%",
    },
    {
      label: "Tasa Impositiva",
      baseValue: sliders.taxRate,
      lowValue: sliders.taxRate - 5,
      highValue: sliders.taxRate + 5,
      unit: "%",
    },
  ], [sliders])

  if (simLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-7 w-64" />
            <Skeleton className="mt-2 h-4 w-96" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="lg:col-span-2 h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-50">
            Simulador de Estrés — Tesla 2025
          </h1>
          <p className="text-sm text-surface-400">
            Ajusta parámetros clave y proyecta el impacto en márgenes y caja
          </p>
          {simError && (
            <p className="mt-1 text-xs text-danger">
              Error al cargar parámetros guardados. Usando valores por defecto.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {whatIf && (
            <button
              onClick={() => saveMutation.mutate({ sliders, simulationParams: { months: 12, scenarios: [] } })}
              disabled={saveMutation.isPending}
              className="rounded-lg bg-accent-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-500 disabled:opacity-50"
            >
              {saveMutation.isPending ? "Guardando…" : "Guardar"}
            </button>
          )}
          <button
            onClick={() => setWhatIf(!whatIf)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              whatIf ? "bg-warning/20 text-warning ring-1 ring-warning/30" : "bg-surface-800 text-surface-400 hover:text-surface-200"
            }`}
          >
            {whatIf ? "✏️ What-If Activo" : "What-If"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KPICard label="Revenue Proyectado" value={`$${Math.round(last.revenue / 1e6)}M`} change={`${((last.revenue - first.revenue) / first.revenue * 100).toFixed(1)}%`} trend={last.revenue >= first.revenue ? "up" : "down"} alertLevel={last.revenue < first.revenue ? "critical" : "normal"} alertMessage={last.revenue < first.revenue ? "Trayectoria decreciente" : undefined} />
        <KPICard label="EBITDA (mes 12)" value={`$${Math.round(last.ebitda / 1e6)}M`} change={`${((last.ebitda - first.ebitda) / first.ebitda * 100).toFixed(1)}%`} trend={last.ebitda >= first.ebitda ? "up" : "down"} alertLevel={last.ebitda < first.ebitda * 0.8 ? "critical" : last.ebitda < first.ebitda ? "warning" : "normal"} />
        <KPICard label="Margen Neto" value={`${((last.netIncome / last.revenue) * 100).toFixed(1)}%`} change={`${(((last.netIncome / last.revenue) - (first.netIncome / first.revenue)) * 100).toFixed(1)}pp`} trend={last.netIncome >= first.netIncome ? "up" : "down"} alertLevel={((last.netIncome / last.revenue) * 100) < 3 ? "critical" : ((last.netIncome / last.revenue) * 100) < 5 ? "warning" : "normal"} />
        <KPICard label="Margen Bruto" value={`${(100 - sliders.cogsRatio).toFixed(1)}%`} change={`${sliders.cogsRatio <= 80 ? "Sólido" : sliders.cogsRatio <= 83 ? "Estable" : "Presionado"}`} trend={sliders.cogsRatio <= 80 ? "up" : "down"} alertLevel={sliders.cogsRatio > 85 ? "critical" : sliders.cogsRatio > 82 ? "warning" : "normal"} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
          <h3 className="mb-4 text-sm font-semibold text-surface-200">
            Parámetros ({whatIf ? "Modo What-If — edita libremente" : "Tesla 2025"})
          </h3>
          <div className="space-y-4">
            {[
              { key: "revenueGrowth" as const, label: "Crecimiento Revenue", val: sliders.revenueGrowth, unit: "% mensual", min: -5, max: 15 },
              { key: "cogsRatio" as const, label: "COGS / Ingresos", val: sliders.cogsRatio, unit: "%", min: 60, max: 95 },
              { key: "opexRatio" as const, label: "OPEX / Ingresos", val: sliders.opexRatio, unit: "%", min: 5, max: 30 },
              { key: "interestRate" as const, label: "Tasa de Interés", val: sliders.interestRate, unit: "% efectiva", min: 0, max: 15 },
              { key: "taxRate" as const, label: "Tasa Impositiva", val: sliders.taxRate, unit: "%", min: 0, max: 40 },
              { key: "capexRatio" as const, label: "CAPEX / Ingresos", val: sliders.capexRatio, unit: "%", min: 0, max: 20 },
            ].map((s) => (
              <div key={s.key}>
                <div className="flex items-center justify-between text-sm">
                  <label className="text-surface-300">{s.label}</label>
                  <input
                    type="number"
                    value={s.val}
                    onChange={(e) => setSliders({ ...sliders, [s.key]: parseFloat(e.target.value) || 0 })}
                    className={`w-20 rounded-md bg-surface-900 px-2 py-0.5 text-right font-mono text-sm outline-none transition-colors ${whatIf ? "text-warning border border-warning/30" : "text-accent-400 border border-transparent"}`}
                    step={0.1}
                    disabled={!whatIf}
                  />
                </div>
                <input
                  type="range"
                  min={s.min}
                  max={s.max}
                  step={0.1}
                  value={s.val}
                  onChange={(e) => setSliders({ ...sliders, [s.key]: parseFloat(e.target.value) })}
                  className="mt-1 w-full accent-accent-500"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
          <h3 className="mb-4 text-sm font-semibold text-surface-200">
            🌪️ Sensibilidad (Tornado)
          </h3>
          <p className="mb-3 text-[10px] text-surface-500">Impacto de cada variable en EBITDA</p>
          <TornadoChart bars={tornadoBars} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
          <h3 className="mb-4 text-sm font-semibold text-surface-200">
            Proyección a {months} meses
          </h3>
          <div className="flex h-64 items-end gap-[2px]">
            {proj.map((p, i) => {
              const maxR = Math.max(...proj.map((x) => x.revenue), 1)
              const maxE = Math.max(...proj.map((x) => x.ebitda), 1)
              const hR = (p.revenue / maxR) * 100
              const hE = (p.ebitda / maxE) * 100
              return (
                <div key={i} className="group relative flex flex-1 flex-col items-center justify-end" style={{ height: "100%" }}>
                  <div className="absolute -top-6 hidden group-hover:block text-[10px] font-mono text-surface-300 bg-surface-900 px-1 rounded">
                    {p.ebitda >= 0 ? `+$${Math.round(p.ebitda / 1e6)}M` : `-$${Math.round(Math.abs(p.ebitda) / 1e6)}M`}
                  </div>
                  <div
                    className="w-full rounded-t transition-all duration-300"
                    style={{ height: `${hE}%`, backgroundColor: p.ebitda >= 0 ? "#10b981" : "#ef4444", opacity: 0.8 }}
                  />
                  <div className="w-full border-l border-surface-700" style={{ height: `${(hR - hE) * 0.3}%` }} />
                </div>
              )
            })}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-surface-500">
            <span>Mes 1</span>
            <span>EBITDA (verde) · Revenue (altura total)</span>
            <span>Mes {months}</span>
          </div>
        </div>
        <FinancialNarrative metrics={narrativeMetrics} companyName="Tesla (Simulación)" />
      </div>

      <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
        <h3 className="mb-4 text-sm font-semibold text-surface-200">
          Escenarios Comparativos
        </h3>
        <div className="flex gap-4">
          {scenarioSliders.map((sc, idx) => {
            const p = project(sc, months)
            const l = p[p.length - 1]
            const f = p[0]
            return (
              <motion.div
                key={scenarioLabels[idx]}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex-1 rounded-lg bg-surface-900/50 p-4 hover:bg-surface-900/80 transition-colors"
              >
                <p className={`text-xs font-bold uppercase ${idx === 0 ? "text-accent-400" : idx === 1 ? "text-success" : "text-danger"}`}>
                  {scenarioLabels[idx]}
                </p>
                <p className="mt-2 text-lg font-bold text-surface-50">${Math.round(l.revenue / 1e6)}M</p>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-surface-400">EBITDA: ${Math.round(l.ebitda / 1e6)}M</p>
                  <p className="text-xs text-surface-400">Margen Neto: {((l.netIncome / l.revenue) * 100).toFixed(1)}%</p>
                  <p className="text-xs text-surface-400">Var: {((l.revenue - f.revenue) / f.revenue * 100).toFixed(1)}% vs base</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
