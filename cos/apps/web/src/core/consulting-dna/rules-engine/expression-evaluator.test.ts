import { describe, it, expect } from "vitest"
import { evaluateExpression } from "./expression-evaluator"

const sampleFacts = {
  financials: {
    revenue: { total: 10_000_000, growth: 25, recurring: 65 },
    expenses: { total: 8_000_000, fixed: 3_000_000, variable: 5_000_000 },
    balanceSheet: { assets: 20_000_000, liabilities: { total: 12_000_000, shortTerm: 4_000_000, longTerm: 8_000_000 }, equity: 8_000_000 },
    cashflow: { operating: 1_200_000, investing: -500_000, financing: -200_000, runway: 14 },
    ratios: {
      debtToEquity: 1.5, currentRatio: 1.8, quickRatio: 1.2,
      grossMargin: 0.45, netMargin: 0.2, roe: 0.25, roa: 0.1,
    },
  },
  operational: {
    employees: 250, digitalMaturity: 2.5, processAutomation: 25, customerRetention: 85,
  },
  industry: { sector: "manufacturing", benchmarkDebtRatio: 2.0, benchmarkMargin: 0.15 },
}

describe("evaluateExpression", () => {
  it("evaluates > comparison", () => {
    expect(evaluateExpression("financials.ratios.debtToEquity > 1.0", sampleFacts)).toBe(true)
    expect(evaluateExpression("financials.ratios.debtToEquity > 2.0", sampleFacts)).toBe(false)
  })

  it("evaluates < comparison", () => {
    expect(evaluateExpression("financials.ratios.currentRatio < 2.0", sampleFacts)).toBe(true)
    expect(evaluateExpression("financials.ratios.currentRatio < 1.0", sampleFacts)).toBe(false)
  })

  it("evaluates >= comparison", () => {
    expect(evaluateExpression("financials.ratios.currentRatio >= 1.8", sampleFacts)).toBe(true)
    expect(evaluateExpression("financials.ratios.currentRatio >= 1.9", sampleFacts)).toBe(false)
  })

  it("evaluates <= comparison", () => {
    expect(evaluateExpression("financials.ratios.currentRatio <= 1.8", sampleFacts)).toBe(true)
    expect(evaluateExpression("financials.ratios.currentRatio <= 1.7", sampleFacts)).toBe(false)
  })

  it("evaluates = comparison", () => {
    expect(evaluateExpression("financials.ratios.currentRatio = 1.8", sampleFacts)).toBe(true)
  })

  it("evaluates != comparison", () => {
    expect(evaluateExpression("financials.ratios.currentRatio != 1.5", sampleFacts)).toBe(true)
  })

  it("handles and logic", () => {
    const expr = "financials.ratios.debtToEquity > 1 and financials.revenue.growth > 20"
    expect(evaluateExpression(expr, sampleFacts)).toBe(true)
  })

  it("handles or logic", () => {
    const expr = "financials.ratios.debtToEquity > 5 or financials.revenue.growth > 20"
    expect(evaluateExpression(expr, sampleFacts)).toBe(true)
  })

  it("handles and with false result", () => {
    const expr = "financials.ratios.debtToEquity > 1 and financials.revenue.growth < 10"
    expect(evaluateExpression(expr, sampleFacts)).toBe(false)
  })

  it("handles nested paths", () => {
    expect(evaluateExpression("financials.balanceSheet.liabilities.shortTerm > 1000000", sampleFacts)).toBe(true)
  })

  it("handles not() wrapping", () => {
    const expr = "not(financials.ratios.debtToEquity > 5)"
    expect(evaluateExpression(expr, sampleFacts)).toBe(true)
  })

  it("handles literal true/false", () => {
    expect(evaluateExpression("true", sampleFacts)).toBe(true)
    expect(evaluateExpression("false", sampleFacts)).toBe(false)
  })

  it("handles undefined path", () => {
    expect(evaluateExpression("financials.nonexistent.path > 1", sampleFacts)).toBe(false)
    expect(evaluateExpression("totally.fake.path = 1", sampleFacts)).toBe(false)
  })

  it("handles string comparison", () => {
    const facts = { name: "test" }
    expect(evaluateExpression("name = test", facts)).toBe(true)
    expect(evaluateExpression("name = other", facts)).toBe(false)
  })

  it("handles boolean field truthiness", () => {
    const facts = { flag: true, noFlag: false }
    expect(evaluateExpression("flag", facts)).toBe(true)
    expect(evaluateExpression("noFlag", facts)).toBe(false)
  })
})
