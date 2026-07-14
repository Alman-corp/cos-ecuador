"use client"

import { useState } from "react"
import { KPICard } from "@/components/shared/KPICard"
import { FinancialNarrative } from "@/components/shared/FinancialNarrative"
import { RadarChart } from "@/components/shared/RadarChart"
import { HeatmapGrid } from "@/components/shared/HeatmapGrid"
import { WaterfallChart } from "@/components/shared/WaterfallChart"

const tesla2025 = {
  revenue: 94827000000, revenuePrev: 97710000000,
  cogs: 77733000000, cogsPrev: 80370000000,
  grossProfit: 17094000000, grossProfitPrev: 17340000000,
  opex: 12739000000, opexPrev: 10374000000,
  ebitda: 14596000000, ebitdaPrev: 16056000000,
  netIncome: 3794000000, netIncomePrev: 7091000000,
  totalAssets: 137806000000, totalEquity: 82865000000,
}

function pct(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)}M`
  return n.toFixed(0)
}

const ratios = [
  { label: "Margen Bruto", value: `${((tesla2025.grossProfit / tesla2025.revenue) * 100).toFixed(1)}%`, change: "-0.3pp", trend: "down" as const },
  { label: "Margen EBITDA", value: `${((tesla2025.ebitda / tesla2025.revenue) * 100).toFixed(1)}%`, change: "-1.0pp", trend: "down" as const },
  { label: "Margen Neto", value: `${((tesla2025.netIncome / tesla2025.revenue) * 100).toFixed(1)}%`, change: "-3.3pp", trend: "down" as const },
  { label: "OpEx / Ingresos", value: `${((tesla2025.opex / tesla2025.revenue) * 100).toFixed(1)}%`, change: "+2.6pp", trend: "up" as const },
]

const narrativeMetrics = [
  { label: "Revenue", current: tesla2025.revenue, previous: tesla2025.revenuePrev, higherIsBetter: true },
  { label: "Gross Margin", current: (tesla2025.grossProfit / tesla2025.revenue) * 100, previous: (tesla2025.grossProfitPrev / tesla2025.revenuePrev) * 100, higherIsBetter: true },
  { label: "EBITDA", current: tesla2025.ebitda, previous: tesla2025.ebitdaPrev, higherIsBetter: true },
  { label: "Net Income", current: tesla2025.netIncome, previous: tesla2025.netIncomePrev, higherIsBetter: true },
  { label: "OPEX", current: tesla2025.opex, previous: tesla2025.opexPrev, higherIsBetter: false },
]

const radarMetrics = [
  { label: "Rentabilidad", value: 55 },
  { label: "Liquidez", value: 92 },
  { label: "Crecimiento", value: 20 },
  { label: "Eficiencia", value: 45 },
  { label: "Solvencia", value: 88 },
  { label: "Innovación", value: 75 },
]

const marginHealth = [
  { label: "Margen Bruto", value: `${((tesla2025.grossProfit / tesla2025.revenue) * 100).toFixed(1)}%`, score: 0.5, detail: "Estable, pero baja para tech" },
  { label: "OpEx Ratio", value: `${((tesla2025.opex / tesla2025.revenue) * 100).toFixed(1)}%`, score: 0.2, detail: "Aumento significativo vs 2024" },
  { label: "COGS Ratio", value: `${((tesla2025.cogs / tesla2025.revenue) * 100).toFixed(1)}%`, score: 0.55, detail: "Ligera mejora en eficiencia" },
  { label: "EBITDA Margin", value: `${((tesla2025.ebitda / tesla2025.revenue) * 100).toFixed(1)}%`, score: 0.4, detail: "Presión por OPEX" },
  { label: "Net Margin", value: `${((tesla2025.netIncome / tesla2025.revenue) * 100).toFixed(1)}%`, score: 0.2, detail: "Caída severa" },
  { label: "ROE", value: `${((tesla2025.netIncome / tesla2025.totalEquity) * 100).toFixed(1)}%`, score: 0.3, detail: "Rentabilidad sobre equity baja" },
]

const pnlData = [
  { concept: "Ingresos", current: tesla2025.revenue, prev: tesla2025.revenuePrev, budget: 96000000000 },
  { concept: "COGS", current: tesla2025.cogs, prev: tesla2025.cogsPrev, budget: 78000000000 },
  { concept: "Utilidad Bruta", current: tesla2025.grossProfit, prev: tesla2025.grossProfitPrev, budget: 18000000000 },
  { concept: "OPEX", current: tesla2025.opex, prev: tesla2025.opexPrev, budget: 11000000000 },
  { concept: "EBITDA", current: tesla2025.ebitda, prev: tesla2025.ebitdaPrev, budget: 15000000000 },
  { concept: "Depreciación", current: 6148000000, prev: 5960000000, budget: 6000000000 },
  { concept: "EBIT", current: tesla2025.ebitda - 6148000000, prev: tesla2025.ebitdaPrev - 5960000000, budget: 9000000000 },
  { concept: "Intereses", current: 338000000, prev: 371000000, budget: 350000000 },
  { concept: "Utilidad Neta", current: tesla2025.netIncome, prev: tesla2025.netIncomePrev, budget: 7000000000 },
]

const isNegative = ["COGS", "OPEX", "Depreciación", "Intereses"]

const beRevenue = Math.round(tesla2025.opex / (tesla2025.grossProfit / tesla2025.revenue))
const safetyMargin = ((tesla2025.revenue - beRevenue) / tesla2025.revenue) * 100

const waterfallItems = [
  { label: "Ingresos", value: tesla2025.revenue, type: "total" as const },
  { label: "COGS", value: -tesla2025.cogs, type: "negative" as const },
  { label: "Util. Bruta", value: tesla2025.grossProfit, type: "total" as const },
  { label: "OPEX", value: -tesla2025.opex, type: "negative" as const },
  { label: "EBITDA", value: tesla2025.ebitda, type: "total" as const },
  { label: "D&A", value: -6148000000, type: "negative" as const },
  { label: "EBIT", value: tesla2025.ebitda - 6148000000, type: "total" as const },
  { label: "Int & Imp", value: -(tesla2025.ebitda - 6148000000 - tesla2025.netIncome), type: "negative" as const },
  { label: "Util. Neta", value: tesla2025.netIncome, type: "total" as const },
]

export default function MarginsPage() {
  const [view, setView] = useState<"table" | "waterfall">("table")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-surface-50">
          Análisis de Márgenes — Tesla 2025
        </h1>
        <p className="text-sm text-surface-400">
          FY 2025 vs FY 2024 · Cifras anuales consolidadas (USD)
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {ratios.map((r) => {
          const alertLvl = r.trend === "down" && parseFloat(r.change) < -1 ? "critical" : r.trend === "down" ? "warning" : "normal"
          return <KPICard key={r.label} {...r} alertLevel={alertLvl} alertMessage={alertLvl !== "normal" ? `${r.label} comprimido` : undefined} />
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FinancialNarrative metrics={narrativeMetrics} companyName="Tesla" />
        <div className="flex items-center justify-center rounded-xl border border-surface-700/50 bg-surface-800/50 p-4">
          <RadarChart metrics={radarMetrics} title="Benchmarking Multidimensional" />
        </div>
      </div>

      <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-surface-200">Salud de Márgenes</h3>
        </div>
        <HeatmapGrid cells={marginHealth} />
      </div>

      <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-surface-200">
            Estado de Resultados Detallado
          </h3>
          <div className="flex gap-1 rounded-lg bg-surface-900 p-0.5">
            <button
              onClick={() => setView("table")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${view === "table" ? "bg-accent-600/20 text-accent-400" : "text-surface-500 hover:text-surface-300"}`}
            >
              Tabla
            </button>
            <button
              onClick={() => setView("waterfall")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${view === "waterfall" ? "bg-accent-600/20 text-accent-400" : "text-surface-500 hover:text-surface-300"}`}
            >
              Waterfall
            </button>
          </div>
        </div>

        {view === "table" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-700/50 text-left text-xs uppercase tracking-wider text-surface-500">
                  <th className="pb-3 pr-6 font-medium">Concepto</th>
                  <th className="pb-3 pr-6 text-right font-medium">FY 2025</th>
                  <th className="pb-3 pr-6 text-right font-medium">FY 2024</th>
                  <th className="pb-3 pr-6 text-right font-medium">Presupuesto</th>
                  <th className="pb-3 pr-6 text-right font-medium">Vs FY 2024</th>
                  <th className="pb-3 text-right font-medium">Vs Budget</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-700/30">
                {pnlData.map((row) => {
                  const vsPrev = ((row.current - row.prev) / row.prev) * 100
                  const vsBudget = ((row.current - row.budget) / row.budget) * 100
                  const neg = isNegative.includes(row.concept)
                  return (
                    <tr key={row.concept} className={`hover:bg-surface-800/50 ${["Utilidad Bruta", "EBITDA", "Utilidad Neta"].includes(row.concept) ? "border-t-2 border-surface-600" : ""}`}>
                      <td className="py-3 pr-6 font-medium text-surface-200">{row.concept}</td>
                      <td className="py-3 pr-6 text-right font-mono text-surface-100">${(row.current / 1e9).toFixed(1)}B</td>
                      <td className="py-3 pr-6 text-right font-mono text-surface-400">${(row.prev / 1e9).toFixed(1)}B</td>
                      <td className="py-3 pr-6 text-right font-mono text-surface-400">${(row.budget / 1e9).toFixed(1)}B</td>
                      <td className="py-3 pr-6 text-right">
                        <span className={`font-mono text-xs font-medium ${neg ? vsPrev <= 0 ? "text-success" : "text-danger" : vsPrev >= 0 ? "text-success" : "text-danger"}`}>
                          {vsPrev >= 0 ? "+" : ""}{vsPrev.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <span className={`font-mono text-xs font-medium ${neg ? vsBudget <= 0 ? "text-success" : "text-danger" : vsBudget >= 0 ? "text-success" : "text-danger"}`}>
                          {vsBudget >= 0 ? "+" : ""}{vsBudget.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <WaterfallChart items={waterfallItems} height={320} />
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {[
          { label: "Break-Even Anual", value: `$${(beRevenue / 1e9).toFixed(1)}B`, sub: `${((beRevenue / tesla2025.revenue) * 100).toFixed(0)}% de ingresos actuales` },
          { label: "Margen de Seguridad", value: `${safetyMargin.toFixed(1)}%`, sub: `$${((tesla2025.revenue - beRevenue) / 1e9).toFixed(1)}B sobre el BE` },
          { label: "ROE", value: `${((tesla2025.netIncome / tesla2025.totalEquity) * 100).toFixed(1)}%`, sub: "Return on Equity" },
        ].map((b) => (
          <div key={b.label} className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-surface-500">{b.label}</p>
            <p className="mt-1 text-xl font-bold text-surface-50">{b.value}</p>
            <p className="text-xs text-surface-500">{b.sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
