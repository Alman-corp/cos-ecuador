import { describe, it, expect } from "vitest"
import { ProjectionsEngine } from "../../../services/finance/src/finance/projections-engine"

describe("ProjectionsEngine", () => {
  const engine = new ProjectionsEngine()

  it("calcula DCF con valor positivo", () => {
    const result = engine.projectDcf({
      freeCashFlows: [1_000_000, 1_100_000, 1_200_000, 1_300_000, 1_400_000],
      terminalGrowthRate: 2.5,
      discountRate: 12,
      sharesOutstanding: 1000,
      netDebt: 2_000_000,
    })
    expect(result.enterpriseValue).toBeGreaterThan(0)
    expect(result.equityValue).toBe(result.enterpriseValue - 2_000_000)
    expect(result.fairPrice).toBeCloseTo(result.equityValue / 1000, 0)
  })

  it("proyecta estados financieros", () => {
    const result = engine.projectFinancialStatements(
      { revenue: 10_000_000, cogs: 6_000_000, sgaExpenses: 2_000_000, depreciation: 500_000, interestExpense: 200_000, taxRate: 0.25, capex: 800_000, deltaWorkingCapital: 100_000 },
      { revenueGrowth: [0.1, 0.08, 0.06], cogsPctOfRevenue: 0.6, sgaPctOfRevenue: 0.2, depreciationPctOfCapex: 0.5, taxRate: 0.25, capexPctOfRevenue: 0.08, workingCapitalPctOfRevenue: 0.01 },
    )
    expect(result).toHaveLength(3)
    expect(result[0].revenue).toBeGreaterThan(10_000_000)
  })
})
