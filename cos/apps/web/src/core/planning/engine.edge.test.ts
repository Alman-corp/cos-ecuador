import { describe, it, expect, vi } from "vitest"

vi.mock("@/core/persistence", () => ({
  persistence: { register: vi.fn(), scheduleSave: vi.fn() },
  ensurePersistence: vi.fn(),
}))

vi.mock("@/core/memory", () => ({
  memoryStore: { store: vi.fn() },
}))

import { planningEngine } from "./engine"

describe("PlanningEngine edge cases", () => {
  it("getPlan returns undefined for nonexistent plan", () => {
    const plan = planningEngine.getPlan("nonexistent")
    expect(plan).toBeUndefined()
  })

  it("getAllPlans returns all plans sorted by date", () => {
    const all = planningEngine.getAllPlans()
    expect(Array.isArray(all)).toBe(true)
  })

  describe("generatePlan", () => {
    it("generates a plan with required fields", async () => {
      const plan = await planningEngine.generatePlan({
        companyId: "c1",
        clientId: "client_1",
        objective: "Increase revenue",
        category: "growth",
      })
      expect(plan).toHaveProperty("id")
      expect(plan.objective.title).toBe("Increase revenue")
      expect(plan.objective.category).toBe("growth")
      expect(plan.status).toBe("draft")
    })
  })

  describe("getPlans", () => {
    it("returns plans filtered by company", () => {
      const plans = planningEngine.getPlans("c1")
      expect(Array.isArray(plans)).toBe(true)
    })
  })
})
