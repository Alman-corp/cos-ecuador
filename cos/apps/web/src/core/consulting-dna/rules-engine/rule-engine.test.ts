import { describe, it, expect } from "vitest"
import { RuleEngine } from "./rule-engine"
import type { DeclarativeRule, ClientFacts } from "./types"

const sampleRule: DeclarativeRule = {
  id: "test_risk_1",
  name: "Test High Debt Risk",
  description: "Test rule for high debt",
  category: "risk",
  condition: "financials.ratios.debtToEquity > 2.0",
  priority: 90,
  then: {
    action: "alert",
    severity: "critical",
    message: "High debt risk detected",
    recommendationId: "rec_test",
  },
  enabled: true,
}

const sampleFacts: ClientFacts = {
  clientId: "test-client",
  financials: {
    revenue: { total: 10_000_000, growth: 15, recurring: 50 },
    expenses: { total: 8_000_000, fixed: 3_000_000, variable: 5_000_000 },
    balanceSheet: { assets: 20_000_000, liabilities: { total: 15_000_000, shortTerm: 5_000_000, longTerm: 10_000_000 }, equity: 5_000_000 },
    cashflow: { operating: 500_000, investing: -200_000, financing: -100_000, runway: 6 },
    ratios: { debtToEquity: 3.0, currentRatio: 1.0, quickRatio: 0.7, grossMargin: 0.3, netMargin: 0.1, operatingMargin: 0.12, roe: 0.15, roa: 0.05, assetTurnover: 0.5, interestCoverage: 3 },
  },
  operational: { employees: 100, digitalMaturity: 2, processAutomation: 20, customerRetention: 80 },
  industry: { sector: "manufacturing", benchmarkDebtRatio: 2.0, benchmarkMargin: 0.15 },
}

describe("RuleEngine", () => {
  it("loads and evaluates matching rule", async () => {
    const engine = new RuleEngine([sampleRule])
    const events = await engine.evaluate(sampleFacts)
    expect(events).toHaveLength(1)
    expect(events[0].ruleId).toBe("test_risk_1")
    expect(events[0].params.severity).toBe("critical")
  })

  it("does not fire rule when condition is false", async () => {
    const safeFacts: ClientFacts = {
      ...sampleFacts,
      financials: { ...sampleFacts.financials, ratios: { ...sampleFacts.financials.ratios, debtToEquity: 1.0 } },
    }
    const engine = new RuleEngine([sampleRule])
    const events = await engine.evaluate(safeFacts)
    expect(events).toHaveLength(0)
  })

  it("filters disabled rules", async () => {
    const disabled = { ...sampleRule, enabled: false, id: "disabled_rule" }
    const engine = new RuleEngine([sampleRule, disabled])
    expect(engine.getRules()).toHaveLength(1)
  })

  it("filters expired rules", async () => {
    const expired = { ...sampleRule, id: "expired", validFrom: "2020-01-01T00:00:00Z", validTo: "2021-01-01T00:00:00Z" }
    const engine = new RuleEngine([expired])
    expect(engine.getRules()).toHaveLength(0)
  })

  it("sorts events by priority descending", async () => {
    const low = { ...sampleRule, id: "low", priority: 10, condition: "financials.ratios.debtToEquity > 0" }
    const high = { ...sampleRule, id: "high", priority: 100, condition: "financials.ratios.debtToEquity > 0" }
    const medium = { ...sampleRule, id: "medium", priority: 50, condition: "financials.ratios.debtToEquity > 0" }
    const engine = new RuleEngine([low, high, medium])
    const events = await engine.evaluate(sampleFacts)
    expect(events.map((e) => e.ruleId)).toEqual(["high", "medium", "low"])
  })

  it("reloads rules", async () => {
    const engine = new RuleEngine([sampleRule])
    expect(engine.getRules()).toHaveLength(1)
    engine.reload([])
    expect(engine.getRules()).toHaveLength(0)
  })

  it("skips rule on evaluation error", async () => {
    const broken = { ...sampleRule, id: "broken", condition: "invalid{{{syntax" }
    const engine = new RuleEngine([sampleRule, broken])
    const events = await engine.evaluate(sampleFacts)
    expect(events).toHaveLength(1)
    expect(events[0].ruleId).toBe("test_risk_1")
  })
})
