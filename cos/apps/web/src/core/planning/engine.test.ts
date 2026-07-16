import { describe, it, expect, vi } from "vitest"

vi.mock("@/core/memory", () => ({
  memoryStore: {
    store: vi.fn(),
    getAll: vi.fn().mockReturnValue([]),
    getRecent: vi.fn().mockReturnValue([]),
    getByEntity: vi.fn().mockReturnValue([]),
  },
}))

vi.mock("@/core/confidence", () => ({
  confidenceEngine: {
    evaluate: vi.fn().mockReturnValue({
      overall: 70, label: "Alta", factors: [], summary: "OK",
      context: "recommendation", timestamp: new Date().toISOString(),
    }),
  },
}))

import { planningEngine } from "./engine"

describe("PlanningEngine", () => {
  describe("generatePlan", () => {
    it("generates a plan with required structure", async () => {
      const plan = await planningEngine.generatePlan({
        companyId: "company-1",
        clientId: "client-1",
        focus: "financial_health",
        scope: "comprehensive",
        objective: "Improve financial health",
      })
      expect(plan).toHaveProperty("id")
      expect(plan).toHaveProperty("companyId")
      expect(plan).toHaveProperty("clientId")
      expect(plan).toHaveProperty("status")
      expect(plan.companyId).toBe("company-1")
      expect(plan.clientId).toBe("client-1")
    })
  })

  describe("getPlans", () => {
    it("returns an array of plans", () => {
      const plans = planningEngine.getPlans("company-1")
      expect(Array.isArray(plans)).toBe(true)
    })
  })
})
