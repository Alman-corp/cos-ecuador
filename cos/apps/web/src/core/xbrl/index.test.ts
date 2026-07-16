import { describe, it, expect } from "vitest"

import { parseXBRLInstance, getFinancialRatiosFromXBRL } from "./index"

describe("XBRL Parser", () => {
  describe("parseXBRLInstance", () => {
    it("handles invalid XML gracefully", () => {
      const result = parseXBRLInstance("not xml at all", "company-1")
      expect(result).toBeDefined()
    })
  })

  describe("getFinancialRatiosFromXBRL", () => {
    it("returns ratios for valid statement", () => {
      const statement = {
        id: "test", companyId: "c1", clientId: "cl1", periodStart: "2024-01-01",
        periodEnd: "2024-12-31", concepts: [], currency: "USD",
      }
      const ratios = getFinancialRatiosFromXBRL(statement, "manufactura")
      expect(ratios).toBeDefined()
    })
  })
})
