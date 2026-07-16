"use client"

import { useQuery, useMutation } from "@tanstack/react-query"

export function useRatios(data: Record<string, number>, prevData?: Record<string, number>) {
  return useQuery({
    queryKey: ["finance", "ratios", data, prevData],
    queryFn: async () => {
      const res = await fetch("/api/v1/finance/ratios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, prevData }),
      })
      if (!res.ok) throw new Error("Failed to calculate ratios")
      return res.json()
    },
    enabled: false,
  })
}

export function useDcf() {
  return useMutation({
    mutationFn: async (params: {
      freeCashFlows: number[]
      terminalGrowthRate: number
      discountRate: number
      sharesOutstanding: number
      netDebt: number
    }) => {
      const res = await fetch("/api/v1/finance/dcf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      })
      if (!res.ok) throw new Error("DCF calculation failed")
      return res.json()
    },
  })
}

export function useMonteCarlo() {
  return useMutation({
    mutationFn: async (params: {
      historicalReturns: number[]
      initialValue: number
      horizon: number
      iterations: number
      confidenceLevel: number
    }) => {
      const res = await fetch("/api/v1/finance/monte-carlo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      })
      if (!res.ok) throw new Error("Monte Carlo simulation failed")
      return res.json()
    },
  })
}

export function useProjectStatements() {
  return useMutation({
    mutationFn: async (params: { baseYear: Record<string, number>; assumptions: Record<string, unknown> }) => {
      const res = await fetch("/api/v1/finance/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      })
      if (!res.ok) throw new Error("Projection failed")
      return res.json()
    },
  })
}
