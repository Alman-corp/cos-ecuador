"use client"

import type { SimulationResult } from "@/types/simulation"

interface ScenarioRow {
  label: string
  color: string
  border: string
  result: SimulationResult
}

interface ScenarioComparisonProps {
  scenarios: ScenarioRow[]
}

export function ScenarioComparison({ scenarios }: ScenarioComparisonProps) {
  return (
    <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-5">
      <h3 className="mb-4 text-sm font-semibold text-surface-200">
        Comparativa de Escenarios
      </h3>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {scenarios.map((s) => {
          const runwayVariant =
            s.result.runway >= 99 || s.result.runway > 6
              ? "text-success"
              : s.result.runway > 3
              ? "text-warning"
              : "text-danger"

          return (
            <div
              key={s.label}
              className={`rounded-lg border ${s.border} bg-surface-900/50 p-4 transition-all duration-300 hover:bg-surface-900/80`}
            >
              <p className={`text-xs font-semibold ${s.color}`}>{s.label}</p>

              <div className="mt-3 space-y-2">
                <div>
                  <p className={`text-2xl font-bold ${runwayVariant}`}>
                    {s.result.runway >= 99 ? "∞" : `${s.result.runway.toFixed(1)}m`}
                  </p>
                  <p className="text-[10px] text-surface-500">Cash Runway</p>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-surface-500">Saldo final</span>
                  <span
                    className={`font-mono font-semibold ${
                      s.result.finalBalance > 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    ${(s.result.finalBalance / 1000).toFixed(0)}k
                  </span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-surface-500">Prob. positiva</span>
                  <span className="font-mono text-surface-200">
                    {(s.result.probPositiveCash * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-surface-500">Flujo neto</span>
                  <span
                    className={`font-mono ${
                      s.result.netCash > 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    ${(s.result.netCash / 1000).toFixed(0)}k/mes
                  </span>
                </div>
              </div>

              {/* Mini sparkline bar chart */}
              <div className="mt-3 flex items-end gap-0.5">
                {s.result.timeline.map((m, i) => {
                  const maxB = Math.max(...s.result.timeline.map((t) => t.balance), 1)
                  const h = (m.balance / maxB) * 100
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm"
                      style={{
                        height: `${Math.max(h, 2)}%`,
                        backgroundColor:
                          m.balance > 0
                            ? runwayVariant === "text-danger"
                              ? "oklch(0.637 0.237 25.331 / 0.7)"
                              : "oklch(0.627 0.194 149.214 / 0.7)"
                            : "oklch(0.577 0.245 27.325 / 0.7)",
                        transition: "height 0.3s ease",
                      }}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
