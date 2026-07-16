import { describe, it, expect, vi } from "vitest"

vi.mock("@/core/memory", () => ({
  memoryStore: { store: vi.fn(), getRecent: vi.fn().mockReturnValue([]) },
}))

vi.mock("@/core/planning", () => ({
  planningEngine: { getPlan: vi.fn() },
}))

vi.mock("@/core/persistence", () => ({
  persistence: { register: vi.fn(), scheduleSave: vi.fn() },
  ensurePersistence: vi.fn(),
}))

import { learningEngine } from "./engine"

describe("LearningEngine", () => {
  describe("registerCase", () => {
    it("registers a business case", () => {
      const result = learningEngine.registerCase({
        companyId: "c1",
        clientId: "client_1",
        clientName: "Test Corp",
        problem: "Liquidity crisis with 6-month cash runway",
        problemCategory: "liquidez",
        diagnosis: "Poor working capital management",
        planSummary: "Restructured debt and optimized AR",
        planDurationMonths: 12,
        result: "Improved liquidity ratio from 0.8 to 1.5",
        status: "completed",
        impact: "significant",
        tiempoMeses: 10,
        costTotal: 50000,
        rentabilidad: 250,
        lecciones: ["Early warning indicators are critical"],
        errores: ["Underestimated implementation time"],
        aciertos: ["Focus on quick wins first"],
        tags: ["liquidity", "restructuring"],
        completedAt: new Date().toISOString(),
      })
      expect(result).toHaveProperty("id")
      expect(result).toHaveProperty("effectivenessScore")
      expect(result.problem).toBe("Liquidity crisis with 6-month cash runway")
    })
  })

  describe("search", () => {
    it("finds cases by problem text", () => {
      const results = learningEngine.search({ problem: "liquidity" })
      expect(Array.isArray(results)).toBe(true)
    })
  })

  describe("findSimilar", () => {
    it("finds similar cases", () => {
      const cases = learningEngine.findSimilar("liquidity", "liquidez")
      expect(Array.isArray(cases)).toBe(true)
      if (cases.length > 0) {
        expect(cases[0]).toHaveProperty("similarity")
        expect(cases[0]).toHaveProperty("matchingFactors")
      }
    })
  })

  describe("getStats", () => {
    it("returns stats", () => {
      const stats = learningEngine.getStats()
      expect(stats).toHaveProperty("total")
      expect(stats).toHaveProperty("byCategory")
      expect(stats).toHaveProperty("byImpact")
      expect(stats).toHaveProperty("averageEffectiveness")
      expect(stats).toHaveProperty("averageROI")
    })
  })

  describe("getCase", () => {
    it("returns undefined for unknown case", () => {
      expect(learningEngine.getCase("nonexistent")).toBeUndefined()
    })
  })

  describe("getAll", () => {
    it("returns all cases", () => {
      const all = learningEngine.getAll()
      expect(Array.isArray(all)).toBe(true)
    })
  })

  describe("deleteCase", () => {
    it("deletes a case and returns true/false", () => {
      const result = learningEngine.deleteCase("nonexistent")
      expect(result).toBe(false)
    })
  })
})
