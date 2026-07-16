"use client"

import { useAppStore } from "@/lib/store"
import { useMargins } from "@/lib/queries"

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n)
}

function pct(a: number, b: number) {
  if (!b) return "+∞"
  const v = ((a - b) / b) * 100
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`
}

export default function MarginsPage() {
  const tenantId = useAppStore((s) => s.tenantId)
  const { data, isLoading, error } = useMargins(tenantId)

  if (isLoading) return <MarginsSkeleton />
  if (error) return <div className="rounded-xl border border-danger/30 bg-danger/5 p-8 text-sm text-danger">{error.message}</div>
  if (!data) return <div className="rounded-xl border border-surface-700/50 p-8 text-sm text-surface-500">Sin datos</div>

  const last = data.periods[data.periods.length - 1]
  const ratios = [
    { label: "Margen Bruto", value: `${last.grossMargin.toFixed(1)}%`, change: data.benchmarks ? (last.grossMargin - data.benchmarks.grossMargin).toFixed(1) : "0", up: last.grossMargin >= (data.benchmarks?.grossMargin ?? 0) },
    { label: "Margen EBITDA", value: `${last.ebitdaMargin.toFixed(1)}%`, change: data.benchmarks ? (last.ebitdaMargin - data.benchmarks.ebitdaMargin).toFixed(1) : "0", up: last.ebitdaMargin >= (data.benchmarks?.ebitdaMargin ?? 0) },
    { label: "Margen Neto", value: `${last.netMargin.toFixed(1)}%`, change: data.benchmarks ? (last.netMargin - data.benchmarks.netMargin).toFixed(1) : "0", up: last.netMargin >= (data.benchmarks?.netMargin ?? 0) },
    { label: "OpEx / Ingresos", value: `${((last.opex / last.revenue) * 100).toFixed(1)}%`, change: "0", up: false },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-surface-50">Análisis de Márgenes</h1>
        <p className="text-sm text-surface-400">P&L con comparativa vs presupuesto y benchmarks sectoriales</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {ratios.map((r) => (
          <div key={r.label} className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-surface-500">{r.label}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-surface-50">{r.value}</span>
              {data.benchmarks && (
                <span className={`text-xs font-medium ${r.up ? "text-success" : "text-danger"}`}>
                  {r.up ? "↑" : "↓"} {r.change}pp vs sector
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* P&L Detail Table */}
      <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
        <h3 className="mb-4 text-sm font-semibold text-surface-200">Estado de Resultados Detallado</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-700/50 text-left text-xs uppercase tracking-wider text-surface-500">
                <th className="pb-3 pr-6 font-medium">Mes</th>
                <th className="pb-3 pr-6 text-right font-medium">Ingresos</th>
                <th className="pb-3 pr-6 text-right font-medium">Margen Bruto</th>
                <th className="pb-3 pr-6 text-right font-medium">EBITDA</th>
                <th className="pb-3 pr-6 text-right font-medium">Margen EBITDA</th>
                <th className="pb-3 text-right font-medium">Utilidad Neta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-700/30">
              {data.periods.map((p) => (
                <tr key={p.month} className="hover:bg-surface-800/50">
                  <td className="py-3 pr-6 font-medium text-surface-200">{p.month}</td>
                  <td className="py-3 pr-6 text-right font-mono text-surface-100">{fmt(p.revenue)}</td>
                  <td className="py-3 pr-6 text-right font-mono text-surface-200">{fmt(p.grossProfit)} <span className="text-surface-400">({p.grossMargin.toFixed(1)}%)</span></td>
                  <td className="py-3 pr-6 text-right font-mono text-surface-200">{fmt(p.ebitda)}</td>
                  <td className="py-3 pr-6 text-right font-mono text-surface-200">{p.ebitdaMargin.toFixed(1)}%</td>
                  <td className="py-3 text-right font-mono text-surface-200">{fmt(p.netIncome)} <span className={p.netMargin >= 10 ? "text-success" : "text-danger"}>({p.netMargin.toFixed(1)}%)</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Budget Comparison */}
      {data.budgetComparison && (
        <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
          <h3 className="mb-4 text-sm font-semibold text-surface-200">Comparativa vs Presupuesto</h3>
          <div className="grid grid-cols-6 gap-2">
            {data.budgetComparison.map((b) => {
              const isOver = b.variance > 0
              return (
                <div key={b.month} className="rounded-lg bg-surface-900/50 p-3 text-center">
                  <p className="text-xs text-surface-500">{b.month}</p>
                  <p className="mt-1 text-lg font-bold text-surface-50">{fmt(b.actual)}</p>
                  <p className={`text-[10px] font-mono ${isOver ? "text-success" : "text-danger"}`}>
                    {isOver ? "+" : ""}{b.variance.toFixed(1)}%
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Benchmarks */}
      {data.benchmarks && (
        <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
          <h3 className="mb-4 text-sm font-semibold text-surface-200">Benchmarks Sectoriales</h3>
          <div className="grid grid-cols-3 gap-6">
            {[
              { label: "Margen Bruto", actual: last.grossMargin, benchmark: data.benchmarks.grossMargin },
              { label: "Margen EBITDA", actual: last.ebitdaMargin, benchmark: data.benchmarks.ebitdaMargin },
              { label: "Margen Neto", actual: last.netMargin, benchmark: data.benchmarks.netMargin },
            ].map((b) => {
              const diff = b.actual - b.benchmark
              return (
                <div key={b.label} className="rounded-lg bg-surface-900/50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-surface-500">{b.label}</p>
                  <p className="mt-1 text-2xl font-bold text-surface-50">{b.actual.toFixed(1)}%</p>
                  <p className="text-xs text-surface-400">Benchmark: {b.benchmark}%</p>
                  <p className={`text-xs font-medium ${diff >= 0 ? "text-success" : "text-danger"}`}>
                    {diff >= 0 ? "↑ Superior" : "↓ Inferior"} en {Math.abs(diff).toFixed(1)}pp
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function MarginsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl bg-surface-800/50 p-5">
            <div className="h-3 w-20 rounded bg-surface-700" />
            <div className="mt-3 h-7 w-16 rounded bg-surface-700" />
          </div>
        ))}
      </div>
      <div className="animate-pulse rounded-xl bg-surface-800/50 p-6">
        <div className="mb-4 h-4 w-32 rounded bg-surface-700" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-8 rounded bg-surface-700/50" />
          ))}
        </div>
      </div>
    </div>
  )
}
