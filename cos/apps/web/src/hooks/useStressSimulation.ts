"use client"

import { useState, useMemo, useCallback } from "react"
import type { SimParams, SimulationResult, Scenario, StressAnalysis, MonthProjection } from "@/types/simulation"

const DEFAULTS: SimParams = {
  daysReceivable: 45,
  daysPayable: 30,
  interestRate: 0.12,
  revenueGrowth: 0,
  opexGrowth: 0,
  initialCash: 500_000,
  monthlyRevenue: 200_000,
}

const PRESET_SCENARIOS: Scenario[] = [
  {
    label: "Actual",
    description: "Parámetros actuales",
    color: "text-accent-400",
    border: "border-accent-500/20",
    params: {},
  },
  {
    label: "Pesimista",
    description: "Cobro lento + caída de ingresos",
    color: "text-warning",
    border: "border-warning/20",
    params: { revenueGrowth: -0.1, daysReceivable: 60 },
  },
  {
    label: "Optimista",
    description: "Cobro rápido + crecimiento",
    color: "text-success",
    border: "border-success/20",
    params: { revenueGrowth: 0.1, daysReceivable: 30 },
  },
]

function computeProjection(params: SimParams): SimulationResult {
  const daysInMonth = 30

  const cashIn =
    params.monthlyRevenue *
    (1 + params.revenueGrowth) *
    (params.daysReceivable > 30 ? 30 / params.daysReceivable : 1)

  const cashOut =
    params.monthlyRevenue *
    0.6 *
    (1 + params.opexGrowth) *
    (params.daysPayable < 30 ? 30 / params.daysPayable : 1)

  const interestCost = params.initialCash * (params.interestRate / 12)
  const netCash = cashIn - cashOut - interestCost

  const timeline: MonthProjection[] = Array.from({ length: 6 }, (_, i) => {
    const balance = params.initialCash + netCash * (i + 1)
    return {
      month: `M${i + 1}`,
      balance: Math.max(0, balance),
      inflow: cashIn,
      outflow: cashOut + interestCost,
      netCash,
    }
  })

  const finalBalance = timeline[timeline.length - 1].balance
  const monthlyBurn = cashOut + interestCost - cashIn
  const runway = monthlyBurn > 0 ? finalBalance / monthlyBurn : 99

  // Monte Carlo: approximate probability of positive cash at M6
  // Uses a simplified analytical approach: ~N(netCash * 6, sqrt(6) * σ)
  // Assumes σ ≈ 30% of monthly net cash flow
  const monthlySigma = Math.abs(netCash) * 0.3
  const meanEnding = params.initialCash + netCash * 6
  const sigmaEnding = monthlySigma * Math.sqrt(6)
  const probPositiveCash = sigmaEnding > 0
    ? 0.5 * (1 + erf(meanEnding / (sigmaEnding * Math.sqrt(2))))
    : meanEnding > 0 ? 1 : 0

  // Expected runway (months until median cash = 0)
  const avgRunwayMonths = netCash < 0
    ? Math.min(12, Math.abs(params.initialCash / netCash))
    : 12

  return {
    timeline,
    cashIn,
    cashOut,
    interestCost,
    netCash,
    finalBalance,
    runway,
    isHealthy: finalBalance > params.initialCash * 0.5,
    avgRunwayMonths,
    probPositiveCash,
  }
}

function erf(x: number): number {
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911

  const sign = x < 0 ? -1 : 1
  x = Math.abs(x)
  const t = 1 / (1 + p * x)
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)
  return sign * y
}

export function useStressSimulation(initialParams?: Partial<SimParams>) {
  const [params, setParams] = useState<SimParams>({ ...DEFAULTS, ...initialParams })

  const updateParam = useCallback(
    (key: keyof SimParams, value: number) => {
      setParams((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const resetParams = useCallback(() => {
    setParams({ ...DEFAULTS, ...initialParams })
  }, [initialParams])

  const base = useMemo(() => computeProjection(params), [params])

  const analysis: StressAnalysis = useMemo(() => {
    const scenarios = PRESET_SCENARIOS.map((s) => ({
      label: s.label,
      color: s.color,
      border: s.border,
      result: computeProjection({ ...params, ...s.params }),
    }))
    return { base, scenarios }
  }, [params, base])

  return { params, updateParam, resetParams, analysis }
}
