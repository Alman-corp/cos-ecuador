import { useQuery } from "@tanstack/react-query"
import { apiGet, apiPost, validateOrThrow } from "./api"
import {
  DashboardDataSchema,
  MarginsDataSchema,
  ValuationDataSchema,
  FinancialRatiosSchema,
  type DashboardData,
  type MarginsData,
  type ValuationData,
  type FinancialRatios,
} from "./schemas"
import type { SimParams } from "@/types/simulation"

// ── Query Keys ───────────────────────────────────────────

export const keys = {
  dashboard: (tenantId: string) => ["dashboard", tenantId] as const,
  margins: (tenantId: string) => ["margins", tenantId] as const,
  valuation: (tenantId: string) => ["valuation", tenantId] as const,
  ratios: (tenantId: string) => ["ratios", tenantId] as const,
  monteCarlo: (params: SimParams) => ["monteCarlo", params] as const,
}

// ── Dashboard ────────────────────────────────────────────

export function useDashboard(tenantId: string) {
  return useQuery({
    queryKey: keys.dashboard(tenantId),
    queryFn: async () => {
      const data = await apiGet<DashboardData>(`/api/dashboard/${tenantId}`)
      return validateOrThrow(DashboardDataSchema, data)
    },
    staleTime: 30_000,
  })
}

// ── Margins ──────────────────────────────────────────────

export function useMargins(tenantId: string) {
  return useQuery({
    queryKey: keys.margins(tenantId),
    queryFn: async () => {
      const data = await apiGet<MarginsData>(`/api/margins/${tenantId}`)
      return validateOrThrow(MarginsDataSchema, data)
    },
    staleTime: 30_000,
  })
}

// ── Valuation ────────────────────────────────────────────

export function useValuation(tenantId: string) {
  return useQuery({
    queryKey: keys.valuation(tenantId),
    queryFn: async () => {
      const data = await apiGet<ValuationData>(`/api/valuation/${tenantId}`)
      return validateOrThrow(ValuationDataSchema, data)
    },
    staleTime: 60_000,
  })
}

// ── Financial Ratios ─────────────────────────────────────

export function useFinancialRatios(tenantId: string) {
  return useQuery({
    queryKey: keys.ratios(tenantId),
    queryFn: async () => {
      const data = await apiGet<FinancialRatios>(`/api/ratios/${tenantId}`)
      return validateOrThrow(FinancialRatiosSchema, data)
    },
    staleTime: 30_000,
  })
}

// ── Monte Carlo (server-side) ────────────────────────────

export function useMonteCarlo(params: SimParams, enabled = false) {
  return useQuery({
    queryKey: keys.monteCarlo(params),
    queryFn: async () => {
      return apiPost<{
        median_runway_months: number
        probability_survive_6_months: number
        probability_default_3_months: number
        cash_at_6m_p10: number
        cash_at_6m_p50: number
        cash_at_6m_p90: number
        alert_level: string
      }>("/api/monte-carlo", {
        initial_cash: params.initialCash,
        monthly_revenue_mean: params.monthlyRevenue,
        monthly_revenue_std: params.monthlyRevenue * 0.2,
        monthly_opex_mean: params.monthlyRevenue * 0.6 * (1 + params.opexGrowth),
        monthly_opex_std: params.monthlyRevenue * 0.6 * 0.15,
        months: 6,
        simulations: 10_000,
      })
    },
    enabled,
    staleTime: 60_000,
  })
}
