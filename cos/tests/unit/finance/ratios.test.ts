import { describe, it, expect } from "vitest"
import { RatiosEngine } from "../../../services/finance/src/finance/ratios-engine"

describe("RatiosEngine", () => {
  const engine = new RatiosEngine()
  const healthy = {
    currentAssets: 5_355_000, currentLiabilities: 2_327_000, totalAssets: 13_980_000,
    totalLiabilities: 5_542_000, equity: 8_908_000, revenue: 12_450_000, netIncome: 1_579_000,
    ebit: 2_100_000, inventory: 2_125_000, accountsReceivable: 1_890_000, cogs: 7_470_000,
    ebitda: 2_800_000, interestExpense: 158_000, cash: 1_180_000, accountsPayable: 1_200_000,
    workingCapital: 3_028_000,
  }

  it("calcula current ratio", () => {
    const result = engine.calculate(healthy)
    expect(result.ratios.liquidity.currentRatio).toBeCloseTo(2.3, 1)
  })

  it("calcula margen neto en porcentaje", () => {
    const result = engine.calculate(healthy)
    expect(result.ratios.profitability.netMargin).toBeCloseTo(12.7, 1)
  })

  it("detecta senales de riesgo en crisis de liquidez", () => {
    const crisis = { ...healthy, currentAssets: 1_000_000, currentLiabilities: 2_000_000 }
    const result = engine.calculate(crisis)
    expect(result.signals.length).toBeGreaterThan(0)
    expect(result.signals.some((s) => s.metric === "current_ratio")).toBe(true)
  })
})
