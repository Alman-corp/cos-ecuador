import { z } from "zod"

// ── Financial ────────────────────────────────────────────

export const FinancialRatiosSchema = z.object({
  current_ratio: z.number(),
  quick_ratio: z.number(),
  debt_to_equity: z.number(),
  interest_coverage: z.number().optional(),
  gross_margin_pct: z.number().optional(),
  ebitda_margin_pct: z.number().optional(),
  net_margin_pct: z.number().optional(),
  return_on_assets_pct: z.number().optional(),
  return_on_equity_pct: z.number().optional(),
})

export type FinancialRatios = z.infer<typeof FinancialRatiosSchema>

// ── Dashboard ────────────────────────────────────────────

export const DashboardDataSchema = z.object({
  revenue: z.number(),
  revenueChange: z.number(),
  ebitda: z.number(),
  ebitdaChange: z.number(),
  netIncome: z.number(),
  netIncomeChange: z.number(),
  cashRunway: z.number(),
  cashRunwayChange: z.number(),
  currentRatio: z.number(),
  debtToEquity: z.number(),
  profitMargins: z.array(
    z.object({ month: z.string(), gross: z.number(), ebitda: z.number(), net: z.number() })
  ),
  topExpenses: z.array(
    z.object({ category: z.string(), amount: z.number(), percentage: z.number() })
  ),
  revenueBreakdown: z.array(
    z.object({ source: z.string(), amount: z.number(), change: z.number() })
  ),
})

export type DashboardData = z.infer<typeof DashboardDataSchema>

// ── Margins / P&L ────────────────────────────────────────

export const MarginsDataSchema = z.object({
  periods: z.array(
    z.object({
      month: z.string(),
      revenue: z.number(),
      cogs: z.number(),
      grossProfit: z.number(),
      grossMargin: z.number(),
      opex: z.number(),
      ebitda: z.number(),
      ebitdaMargin: z.number(),
      depreciation: z.number(),
      ebit: z.number(),
      interest: z.number(),
      tax: z.number(),
      netIncome: z.number(),
      netMargin: z.number(),
    })
  ),
  budgetComparison: z
    .array(
      z.object({
        month: z.string(),
        actual: z.number(),
        budget: z.number(),
        variance: z.number(),
      })
    )
    .optional(),
  benchmarks: z
    .object({
      grossMargin: z.number(),
      ebitdaMargin: z.number(),
      netMargin: z.number(),
    })
    .optional(),
})

export type MarginsData = z.infer<typeof MarginsDataSchema>

// ── Valuation ────────────────────────────────────────────

export const ValuationDataSchema = z.object({
  enterpriseValue: z.number(),
  equityValue: z.number(),
  wacc: z.number(),
  terminalGrowth: z.number(),
  dcfResult: z.object({
    pvCashFlows: z.number(),
    pvTerminalValue: z.number(),
    terminalValue: z.number(),
  }),
  monteCarlo: z
    .object({
      medianRunway: z.number(),
      probSurvive6m: z.number(),
      cashP50: z.number(),
      cashP10: z.number(),
      cashP90: z.number(),
    })
    .optional(),
  sensitivity: z
    .array(
      z.object({
        wacc: z.number(),
        growth: z.number(),
        value: z.number(),
      })
    )
    .optional(),
})

export type ValuationData = z.infer<typeof ValuationDataSchema>
