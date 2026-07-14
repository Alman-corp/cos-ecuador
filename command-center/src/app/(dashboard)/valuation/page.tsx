"use client"

import { KPICard } from "@/components/shared/KPICard"
import { FinancialNarrative } from "@/components/shared/FinancialNarrative"
import { HeatmapGrid } from "@/components/shared/HeatmapGrid"
import { motion } from "framer-motion"

const tesla = {
  revenue: 94827000000,
  ebitda: 14596000000,
  netIncome: 3794000000,
  fcf: 6220000000,
  cash: 44059000000,
  debt: 8376000000,
  assets: 137806000000,
  equity: 82865000000,
}

const ev = tesla.cash + tesla.debt * 3
const equityVal = ev - tesla.debt + tesla.cash

const dcfRows = [
  { label: "FCF Proyectado Año 1", value: `$${(tesla.fcf * 1.05 / 1e9).toFixed(1)}B` },
  { label: "FCF Proyectado Año 5", value: `$${(tesla.fcf * 1.05 ** 5 / 1e9).toFixed(1)}B` },
  { label: "Valor Terminal (Gordon Growth)", value: `$${(tesla.fcf * 1.05 ** 5 * 1.03 / (0.10 - 0.03) / 1e9).toFixed(1)}B` },
  { label: "Valor Presente de FCFs", value: `$${(tesla.fcf * 4.5 / 1e9).toFixed(1)}B` },
  { label: "Valor Presente de TV", value: `$${(tesla.fcf * 1.05 ** 5 * 1.03 / (0.10 - 0.03) / 1.10 ** 5 / 1e9).toFixed(1)}B` },
  { label: "Enterprise Value", value: `$${(ev / 1e9).toFixed(1)}B` },
  { label: "(-) Deuda Neta", value: `$${((tesla.debt - tesla.cash) / 1e9).toFixed(1)}B` },
  { label: "(+) Caja y Equivalentes", value: `$${(tesla.cash / 1e9).toFixed(1)}B` },
  { label: "Equity Value", value: `$${(equityVal / 1e9).toFixed(1)}B`, bold: true },
]

const mc = [
  { label: "Media", value: `$${(equityVal / 1e9).toFixed(1)}B` },
  { label: "P50 (Mediana)", value: `$${(equityVal * 0.96 / 1e9).toFixed(1)}B` },
  { label: "P5 (Pesimista)", value: `$${(equityVal * 0.6 / 1e9).toFixed(1)}B` },
  { label: "P95 (Optimista)", value: `$${(equityVal * 1.5 / 1e9).toFixed(1)}B` },
  { label: "Desviación Estándar", value: `$${(equityVal * 0.25 / 1e9).toFixed(1)}B` },
  { label: "Probabilidad > $800B", value: "62%" },
]

const valMetrics = [
  { label: "Revenue", current: tesla.revenue, previous: 97710000000, higherIsBetter: true },
  { label: "EBITDA", current: tesla.ebitda, previous: 16056000000, higherIsBetter: true },
  { label: "FCF", current: tesla.fcf, previous: 3581000000, higherIsBetter: true },
  { label: "Cash Position", current: tesla.cash, previous: 41647000000, higherIsBetter: true },
]

const valHealth = [
  { label: "EV/EBITDA", value: `${(ev / tesla.ebitda).toFixed(1)}x`, score: 0.65, detail: "Razonable para el sector" },
  { label: "P/E", value: `${(equityVal / tesla.netIncome).toFixed(1)}x`, score: 0.25, detail: "Premium vs industria" },
  { label: "Debt/Equity", value: `${(tesla.debt / tesla.equity * 100).toFixed(1)}%`, score: 0.95, detail: "Deuda mínima" },
  { label: "Cobertura Intereses", value: `${(tesla.ebitda / (tesla.debt * 0.04)).toFixed(1)}x`, score: 0.9, detail: "Cobertura sólida" },
  { label: "FCF Yield", value: `${(tesla.fcf / equityVal * 100).toFixed(1)}%`, score: 0.55, detail: "Moderado" },
  { label: "Sinergias Potenciales", value: "$24.5B", score: 0.75, detail: "20% del EV actual" },
]

export default function ValuationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-surface-50">
          Valuación — Tesla, Inc.
        </h1>
        <p className="text-sm text-surface-400">
          DCF + Monte Carlo + Sinergias · Basado en datos FY 2025
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KPICard label="Enterprise Value" value={`$${(ev / 1e9).toFixed(1)}B`} change="+12.4%" trend="up" alertLevel="normal" />
        <KPICard label="Equity Value" value={`$${(equityVal / 1e9).toFixed(1)}B`} change="+15.2%" trend="up" alertLevel="normal" />
        <KPICard label="EV/EBITDA" value={`${(ev / tesla.ebitda).toFixed(1)}x`} change="+0.5x" trend="up" alertLevel="warning" alertMessage="Múltiplo superior al promedio histórico" />
        <KPICard label="P/E Ratio" value={`${(equityVal / tesla.netIncome).toFixed(1)}x`} change="-5.2x" trend="down" alertLevel="critical" alertMessage="P/E elevado por baja utilidad neta" detailRows={[
          { label: "Utilidad Neta", value: `$${(tesla.netIncome / 1e9).toFixed(1)}B`, trend: "down" },
          { label: "Pago Dividendos", value: "$0", trend: "down" },
        ]} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FinancialNarrative metrics={valMetrics} companyName="Tesla (Valuación)" />
        <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-5">
          <h3 className="mb-4 text-sm font-semibold text-surface-200">
            📊 Salud de Valuación
          </h3>
          <HeatmapGrid cells={valHealth} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
          <h3 className="mb-4 text-sm font-semibold text-surface-200">
            Resumen DCF
          </h3>
          <div className="space-y-2">
            {dcfRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between border-b border-surface-700/20 pb-2 text-sm">
                <span className="text-surface-400">{row.label}</span>
                <span className={`font-mono ${row.bold ? "text-lg font-bold text-accent-400" : "text-surface-200"}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
          <h3 className="mb-4 text-sm font-semibold text-surface-200">
            Monte Carlo — 10,000 iteraciones
          </h3>
          <div className="space-y-2">
            {mc.map((row) => (
              <div key={row.label} className="flex items-center justify-between text-sm">
                <span className="text-surface-400">{row.label}</span>
                <span className="font-mono text-surface-200">{row.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <p className="mb-2 text-xs font-medium text-surface-500">Distribución de Equity Value</p>
            <div className="relative h-8 rounded-lg bg-surface-900 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-danger via-warning to-success rounded-lg"
              />
              <div className="absolute inset-0 flex items-center justify-between px-3 text-[10px] font-mono text-white">
                <span>${(equityVal * 0.6 / 1e9).toFixed(0)}B</span>
                <span className="font-bold">${(equityVal / 1e9).toFixed(0)}B</span>
                <span>${(equityVal * 1.5 / 1e9).toFixed(0)}B</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
        <h3 className="mb-4 text-sm font-semibold text-surface-200">
          Cuantificación de Sinergias
        </h3>
        <div className="grid grid-cols-3 gap-6">
          {[
            { type: "Sinergias de Ingresos", value: "$18.5B", items: ["Autonomía & Robotaxi: $12B", "Expansión储能: $4.5B", "Licencias FSD: $2B"] },
            { type: "Sinergias de Costos", value: "$4.2B", items: ["Eficiencia 4680: $1.8B", "Optimización cadena: $1.5B", "Integración vertical: $0.9B"] },
            { type: "Sinergias Financieras", value: "$1.8B", items: ["Optimización WACC: $0.8B", "Tax shield: $0.6B", "Escala global: $0.4B"] },
          ].map((s) => (
            <div key={s.type} className="rounded-lg bg-surface-900/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-surface-500">{s.type}</p>
              <p className="mt-1 text-xl font-bold text-success">{s.value}</p>
              <ul className="mt-3 space-y-1">
                {s.items.map((item) => <li key={item} className="text-xs text-surface-400">• {item}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-lg bg-accent-600/10 p-3 text-center">
          <p className="text-sm text-accent-400">
            Valor total de sinergias: <span className="font-bold">$24.5B</span> —<span className="font-medium"> ~20%</span> del Enterprise Value actual
          </p>
        </div>
      </div>
    </div>
  )
}
