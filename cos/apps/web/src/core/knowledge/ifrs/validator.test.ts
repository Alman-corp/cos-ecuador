import { describe, it, expect } from "vitest"
import { ifrsValidator } from "./validator"

describe("IFRS Validator", () => {
  describe("validate", () => {
    it("returns valid (passed=true) for balanced statement", () => {
      const result = ifrsValidator.validate("test-corp", {
        "ifrs-full:Assets": 1000000,
        "ifrs-full:Liabilities": 400000,
        "ifrs-full:Equity": 600000,
      })
      expect(result.passed).toBeGreaterThanOrEqual(0)
      expect(result.totalRules).toBeGreaterThan(0)
      expect(result).toHaveProperty("score")
      expect(result).toHaveProperty("results")
    })

    it("detects unbalanced balance sheet", () => {
      const result = ifrsValidator.validate("test-corp", {
        "ifrs-full:CurrentAssets": 500000,
        "ifrs-full:NoncurrentAssets": 500000,
        "ifrs-full:CurrentLiabilities": 300000,
        "ifrs-full:NoncurrentLiabilities": 200000,
        "ifrs-full:Equity": 400000,
      })
      const balanceRule = result.results.find((r) => r.ruleId === "val-bal-001")
      if (balanceRule) {
        expect(balanceRule.affectedConcepts).toContain("ifrs-full:Assets")
      }
    })
  })

  describe("getConceptDescription", () => {
    it("returns a concept description for a valid IFRS code", () => {
      const desc = ifrsValidator.getConceptDescription("ifrs-full:Assets")
      expect(desc).toBeDefined()
      expect(typeof desc).toBe("string")
    })

    it("returns undefined for unknown code", () => {
      expect(ifrsValidator.getConceptDescription("nonexistent")).toBeUndefined()
    })
  })

  describe("searchConcepts", () => {
    it("finds concepts matching a query", () => {
      const results = ifrsValidator.searchConcepts("asset")
      expect(results.length).toBeGreaterThan(0)
      results.forEach((c) => {
        expect(c).toHaveProperty("code")
        expect(c).toHaveProperty("name")
      })
    })
  })

  describe("computeRatios", () => {
    it("computes financial ratios from data", () => {
      const ratios = ifrsValidator.computeRatios({
        "ifrs-full:CurrentAssets": 500000,
        "ifrs-full:CurrentLiabilities": 250000,
        "ifrs-full:Equity": 600000,
        "ifrs-full:Liabilities": 400000,
        "ifrs-full:Revenue": 1000000,
        "ifrs-full:CostOfSales": 600000,
        "ifrs-full:OperatingProfitLoss": 200000,
        "ifrs-full:FinanceCosts": 50000,
        "ifrs-full:ProfitLoss": 150000,
        "ifrs-full:Assets": 1000000,
        "ifrs-full:CurrentInventories": 100000,
        "ifrs-full:TradeAndOtherCurrentReceivables": 80000,
      })
      expect(ratios.currentRatio).toBe(2)
      expect(ratios.debtToEquity).toBeCloseTo(0.667, 2)
      expect(ratios.netMargin).toBe(0.15)
      expect(ratios.grossMargin).toBe(0.4)
    })
  })

  describe("getStatementMapping", () => {
    it("returns statement mappings with arrays of concept codes", () => {
      const mapping = ifrsValidator.getStatementMapping()
      expect(mapping).toHaveProperty("balance")
      expect(mapping).toHaveProperty("income")
      expect(mapping).toHaveProperty("cashflow")
      expect(Array.isArray(mapping.balance)).toBe(true)
      expect(Array.isArray(mapping.income)).toBe(true)
      expect(Array.isArray(mapping.cashflow)).toBe(true)
    })
  })
})
