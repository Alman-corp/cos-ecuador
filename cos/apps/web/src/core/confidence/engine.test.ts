import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/core/learning", () => ({
  learningEngine: {
    search: vi.fn().mockReturnValue([]),
    getStats: vi.fn().mockReturnValue({ total: 5 }),
  },
}))

import { confidenceEngine } from "./engine"

describe("ConfidenceEngine", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("evaluate", () => {
    it("returns a ConfidenceResult with all required fields", () => {
      const result = confidenceEngine.evaluate({ context: "prediction" })
      expect(result).toHaveProperty("overall")
      expect(result).toHaveProperty("context")
      expect(result).toHaveProperty("label")
      expect(result).toHaveProperty("factors")
      expect(result).toHaveProperty("summary")
      expect(result).toHaveProperty("timestamp")
    })

    it("returns high confidence with complete data", () => {
      const result = confidenceEngine.evaluate({
        context: "prediction",
        dataPoints: 100,
        dataCompleteness: 95,
        dataRecencyDays: 1,
        historicalMatches: 20,
        kpiConsistency: 85,
        benchmarkAvailable: true,
        businessCasesAvailable: 50,
        industryKnown: true,
      })
      expect(result.overall).toBeGreaterThan(80)
      expect(result.label).toBe("Muy alta")
    })

    it("returns low confidence with poor data", () => {
      const result = confidenceEngine.evaluate({
        context: "prediction",
        dataPoints: 1,
        dataCompleteness: 5,
        dataRecencyDays: 365,
        historicalMatches: 0,
        kpiConsistency: 10,
        benchmarkAvailable: false,
        businessCasesAvailable: 0,
        industryKnown: false,
      })
      expect(result.overall).toBeLessThan(30)
    })
  })

  describe("evaluatePrediction", () => {
    it("returns moderate confidence for partial data", () => {
      const result = confidenceEngine.evaluatePrediction(12, 0.6, 5, "retail")
      expect(result.context).toBe("prediction")
      expect(result.overall).toBeGreaterThan(30)
      expect(result.overall).toBeLessThan(90)
    })
  })

  describe("evaluateRecommendation", () => {
    it("returns result with recommendation context", () => {
      const result = confidenceEngine.evaluateRecommendation(5, 3, true)
      expect(result.context).toBe("recommendation")
    })
  })

  describe("evaluateDiagnosis", () => {
    it("returns result with diagnosis context", () => {
      const result = confidenceEngine.evaluateDiagnosis(10, 7, true)
      expect(result.context).toBe("diagnosis")
    })
  })

  describe("factors", () => {
    it("includes all 6 factor types", () => {
      const result = confidenceEngine.evaluate()
      expect(result.factors).toHaveLength(6)
      const names = result.factors.map((f) => f.name)
      expect(names).toContain("Calidad de datos")
      expect(names).toContain("Actualidad de datos")
      expect(names).toContain("Evidencia histórica")
      expect(names).toContain("Consistencia de indicadores")
      expect(names).toContain("Benchmarks de industria")
      expect(names).toContain("Biblioteca de casos")
    })

    it("each factor has correct shape", () => {
      const result = confidenceEngine.evaluate()
      for (const factor of result.factors) {
        expect(factor).toHaveProperty("name")
        expect(factor).toHaveProperty("status")
        expect(factor).toHaveProperty("detail")
        expect(factor).toHaveProperty("weight")
        expect(factor).toHaveProperty("score")
        expect(["positive", "neutral", "negative"]).toContain(factor.status)
      }
    })
  })
})
