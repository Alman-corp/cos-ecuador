"use client"

import { useAppStore } from "@/lib/store"
import { useValuation } from "@/lib/queries"

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`
  return `$${n.toFixed(0)}`
}

export default function ValuationPage() {
  const tenantId = useAppStore((s) => s.tenantId)
  const { data, isLoading, error } = useValuation(tenantId)

  if (isLoading) return <ValuationSkeleton />
  if (error) return <div className="rounded-xl border border-danger/30 bg-danger/5 p-8 text-sm text-danger">{error.message}</div>
  if (!data) return <div className="rounded-xl border border-surface-700/50 p-8 text-sm text-surface-500">Sin datos de valuación</div>

  const { dcfResult } = data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-surface-50">Valuación & M&A</h1>
        <p className="text-sm text-surface-400">
          DCF · WACC {data.wacc}% · Crecimiento terminal {data.terminalGrowth}%
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiBlock label="Enterprise Value" value={fmt(data.enterpriseValue)} />
        <KpiBlock label="Equity Value" value={fmt(data.equityValue)} />
        <KpiBlock label="EV / EBITDA" value={`${(data.enterpriseValue / (dcfResult.pvCashFlows / 5)).toFixed(1)}x`} />
        <KpiBlock label="WACC" value={`${data.wacc}%`} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* DCF Summary */}
        <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
          <h3 className="mb-4 text-sm font-semibold text-surface-200">Resumen DCF</h3>
          <div className="space-y-3">
            <DcfRow label="VP de FCFs Proyectados" value={fmt(dcfResult.pvCashFlows)} />
            <DcfRow label="VP de Valor Terminal" value={fmt(dcfResult.pvTerminalValue)} />
            <DcfRow label="Valor Terminal (Gordon Growth)" value={fmt(dcfResult.terminalValue)} />
            <div className="border-t border-surface-700/30 pt-3">
              <DcfRow label="Enterprise Value" value={fmt(data.enterpriseValue)} bold />
            </div>
            <DcfRow label="(-) Deuda Neta" value={`-${fmt(data.enterpriseValue - data.equityValue)}`} />
            <DcfRow label="(=) Equity Value" value={fmt(data.equityValue)} bold accent />
          </div>
        </div>

        {/* Monte Carlo */}
        {data.monteCarlo && (
          <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
            <h3 className="mb-4 text-sm font-semibold text-surface-200">
              Monte Carlo — 10,000 iteraciones
            </h3>
            <div className="space-y-3">
              <DcfRow label="Mediana (P50)" value={fmt(data.monteCarlo.cashP50)} />
              <DcfRow label="P10 (Pesimista)" value={fmt(data.monteCarlo.cashP10)} />
              <DcfRow label="P90 (Optimista)" value={fmt(data.monteCarlo.cashP90)} />
              <DcfRow label="Prob. > 6 meses" value={`${(data.monteCarlo.probSurvive6m * 100).toFixed(0)}%`} />
            </div>

            <div className="mt-6">
              <p className="mb-2 text-xs font-medium text-surface-500">Distribución de Equity Value</p>
              <div className="relative h-8 rounded-lg bg-surface-900 overflow-hidden">
                <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-danger via-warning to-success rounded-lg w-full" />
                <div className="absolute inset-0 flex items-center justify-between px-3 text-[10px] font-mono text-white">
                  <span>{fmt(data.monteCarlo.cashP10)}</span>
                  <span>{fmt(data.monteCarlo.cashP50)}</span>
                  <span>{fmt(data.monteCarlo.cashP90)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sensitivity Table */}
      {data.sensitivity && data.sensitivity.length > 0 && (
        <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
          <h3 className="mb-4 text-sm font-semibold text-surface-200">Análisis de Sensibilidad</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-700/50 text-left text-xs uppercase tracking-wider text-surface-500">
                  <th className="pb-3 pr-6">WACC \ Crecimiento</th>
                  {Array.from(new Set(data.sensitivity.map((s) => s.growth))).map((g) => (
                    <th key={g} className="pb-3 pr-6 text-right">{g}%</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-700/30">
                {Array.from(new Set(data.sensitivity.map((s) => s.wacc))).map((wacc) => (
                  <tr key={wacc} className="hover:bg-surface-800/50">
                    <td className="py-3 pr-6 font-medium text-surface-300">{wacc}%</td>
                    {data.sensitivity!.filter((s) => s.wacc === wacc).map((s) => (
                      <td key={`${s.wacc}-${s.growth}`} className={`py-3 pr-6 text-right font-mono ${s.value >= data.enterpriseValue ? "text-success" : "text-danger"}`}>
                        {fmt(s.value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Synergies */}
      <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-6">
        <h3 className="mb-4 text-sm font-semibold text-surface-200">Cuantificación de Sinergias</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { type: "Sinergias de Ingresos", value: "$320,000", items: ["Cross-selling: $180k", "Market expansion: $90k", "Pricing power: $50k"] },
            { type: "Sinergias de Costos", value: "$210,000", items: ["Duplicidades: $120k", "Economías escala: $60k", "Integración: $30k"] },
            { type: "Sinergias Financieras", value: "$95,000", items: ["Optimización WACC: $45k", "Tax shield: $35k", "Estructura capital: $15k"] },
          ].map((s) => (
            <div key={s.type} className="rounded-lg bg-surface-900/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-surface-500">{s.type}</p>
              <p className="mt-1 text-xl font-bold text-success">{s.value}</p>
              <ul className="mt-3 space-y-1">
                {s.items.map((item) => (
                  <li key={item} className="text-xs text-surface-400">• {item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-lg bg-accent-600/10 p-3 text-center">
          <p className="text-sm text-accent-400">
            Valor total de sinergias: <span className="font-bold">$625,000</span> —{" "}
            <span className="font-medium">{((625_000 / data.enterpriseValue) * 100).toFixed(1)}%</span> del Enterprise Value
          </p>
        </div>
      </div>
    </div>
  )
}

function KpiBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-surface-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-surface-50">{value}</p>
    </div>
  )
}

function DcfRow({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-surface-400">{label}</span>
      <span className={`font-mono ${bold && accent ? "text-lg font-bold text-accent-400" : bold ? "text-lg font-bold text-surface-50" : "text-surface-200"}`}>
        {value}
      </span>
    </div>
  )
}

function ValuationSkeleton() {
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
      <div className="grid grid-cols-2 gap-6">
        <div className="animate-pulse rounded-xl bg-surface-800/50 p-6">
          <div className="mb-4 h-4 w-24 rounded bg-surface-700" />
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-5 rounded bg-surface-700/50" />
            ))}
          </div>
        </div>
        <div className="animate-pulse rounded-xl bg-surface-800/50 p-6">
          <div className="mb-4 h-4 w-24 rounded bg-surface-700" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-5 rounded bg-surface-700/50" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
