"use client"

import { useMutation } from "@tanstack/react-query"

interface StressParams {
  initialRevenue?: number
  monthlyRevenue?: number
  monthlyCogs?: number
  monthlyOpex?: number
  revenueGrowth?: number
  cogsPctOfRevenue?: number
  opexGrowth?: number
  months?: number
  shockScenario?: number
  revenueShock?: number
  cogsIncrease?: number
  interestRateHike?: number
}

export function useStressSimulation() {
  return useMutation({
    mutationFn: async (params: StressParams) => {
      const res = await fetch("/api/stress-simulator/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      })
      if (!res.ok) throw new Error("Stress simulation failed")
      return res.json()
    },
  })
}