"use client"

import { useAppStore } from "@/lib/store"
import { useDashboard } from "@/lib/queries"

export default function DashboardPage() {
  const tenantId = useAppStore((s) => s.tenantId)
  const { data, isLoading, error } = useDashboard(tenantId)

  if (isLoading) return <DashboardSkeleton />
  if (error)
    return (
      <div className="flex items-center justify-center rounded-xl border border-danger/30 bg-danger/5 p-12">
        <p className="text-sm text-danger">Error al cargar dashboard: {error.message}</p>
      </div>
    )
  if (!data)
    return (
      <div className="flex items-center justify-center rounded-xl border border-surface-700/50 p-12">
        <p className="text-sm text-surface-500">No hay datos disponibles</p>
      </div>
    )

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiBlock label="Cash Runway" value={`${data.cashRunway} meses`} change={data.cashRunwayChange} trend={data.cashRunwayChange >= 0 ? "up" : "down"} />
        <KpiBlock label="EBITDA" value={`$${(data.ebitda / 1000).toFixed(0)}k`} change={data.ebitdaChange} trend={data.ebitdaChange >= 0 ? "up" : "down"} />
        <KpiBlock label="Liquidez Corriente" value={data.currentRatio.toFixed(2)} change={data.currentRatio - 1.5} trend={data.currentRatio >= 1.5 ? "up" : "down"} />
        <KpiBlock label="Deuda / Equity" value={data.debtToEquity.toFixed(2)} change={data.debtToEquity - 0.5} trend={data.debtToEquity <= 1.0 ? "up" : "down"} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
          <h3 className="mb-4 text-sm font-semibold text-surface-200">Márgenes (6 meses)</h3>
          <div className="h-64">
            <div className="flex h-full items-end gap-2">
              {data.profitMargins.map((m) => {
                const h = (m.ebitda / 30) * 100
                return (
                  <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] text-surface-400">{m.ebitda}%</span>
                    <div className="w-full rounded-t-sm bg-accent-500/70 transition-all" style={{ height: `${Math.min(h, 100)}%` }} />
                    <span className="text-[10px] text-surface-500">{m.month}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
          <h3 className="mb-4 text-sm font-semibold text-surface-200">Ingresos por Servicio</h3>
          <div className="space-y-3">
            {data.revenueBreakdown.map((item) => (
              <div key={item.source}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-surface-300">{item.source}</span>
                  <span className="font-mono text-surface-400">
                    ${(item.amount / 1000).toFixed(0)}k
                    <span className={item.change >= 0 ? "text-success ml-1" : "text-danger ml-1"}>
                      {item.change >= 0 ? "+" : ""}{item.change}%
                    </span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-700">
                  <div
                    className="h-full rounded-full bg-accent-500"
                    style={{ width: `${(item.amount / data.revenue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Expenses */}
      <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
        <h3 className="mb-4 text-sm font-semibold text-surface-200">Top Gastos</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-700/50 text-left text-xs font-medium uppercase tracking-wider text-surface-500">
                <th className="pb-3 pr-4">Categoría</th>
                <th className="pb-3 pr-4 text-right">Monto</th>
                <th className="pb-3 text-right">% del Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-700/50">
              {data.topExpenses.map((row) => (
                <tr key={row.category} className="hover:bg-surface-800">
                  <td className="py-3 pr-4 font-medium text-surface-200">{row.category}</td>
                  <td className="py-3 pr-4 text-right font-mono text-surface-300">${(row.amount / 1000).toFixed(0)}k</td>
                  <td className="py-3 text-right font-mono text-surface-400">{row.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function KpiBlock({
  label,
  value,
  change,
  trend,
}: {
  label: string
  value: string
  change: number
  trend: "up" | "down"
}) {
  return (
    <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-surface-500">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-surface-50">{value}</span>
        <span className={`flex items-center gap-0.5 text-xs font-medium ${trend === "up" ? "text-success" : "text-danger"}`}>
          {trend === "up" ? "↑" : "↓"} {change >= 0 ? "+" : ""}{change.toFixed(1)}
        </span>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl bg-surface-800/50 p-5">
            <div className="h-3 w-20 rounded bg-surface-700" />
            <div className="mt-3 h-7 w-24 rounded bg-surface-700" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="animate-pulse rounded-xl bg-surface-800/50 p-6">
          <div className="mb-4 h-4 w-32 rounded bg-surface-700" />
          <div className="h-56 rounded bg-surface-700/50" />
        </div>
        <div className="animate-pulse rounded-xl bg-surface-800/50 p-6">
          <div className="mb-4 h-4 w-32 rounded bg-surface-700" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="h-3 w-full rounded bg-surface-700" />
                <div className="h-1.5 w-full rounded bg-surface-700/50" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
