import { describe, it, expect, vi } from "vitest"

vi.mock("@/core/memory", () => ({
  memoryStore: {
    getByEntity: vi.fn().mockReturnValue([]),
    getRecent: vi.fn().mockReturnValue([]),
  },
}))

vi.mock("@/core/consulting-dna", () => ({
  consultingDna: {
    getThresholds: vi.fn().mockReturnValue({}),
  },
}))

vi.mock("@/core/confidence", () => ({
  confidenceEngine: {
    evaluatePrediction: vi.fn().mockReturnValue({
      overall: 75, label: "Alta", factors: [], summary: "OK",
      context: "prediction", timestamp: new Date().toISOString(),
    }),
  },
}))

import { predictionEngine } from "./engine"

describe("PredictionEngine", () => {
  describe("predict", () => {
    it("returns a PredictionResult structure", async () => {
      const result = await predictionEngine.predict("company-1")
      expect(result).toHaveProperty("companyId")
      expect(result).toHaveProperty("generatedAt")
      expect(result).toHaveProperty("indicators")
      expect(result).toHaveProperty("scenarios")
      expect(result).toHaveProperty("earlyWarnings")
      expect(result).toHaveProperty("summary")
      expect(result).toHaveProperty("confidence")
    })

    it("includes companyId in result", async () => {
      const result = await predictionEngine.predict("company-123")
      expect(result.companyId).toBe("company-123")
    })
  })

  describe("predictKPI", () => {
    it("returns trend and projection for historical data", async () => {
      const historical = [
        { date: "2024-01-01", value: 100 },
        { date: "2024-02-01", value: 110 },
        { date: "2024-03-01", value: 120 },
        { date: "2024-04-01", value: 130 },
        { date: "2024-05-01", value: 140 },
      ]
      const result = await predictionEngine.predictKPI("revenue", historical, 30)
      expect(result).toHaveProperty("trend")
      expect(result).toHaveProperty("projection")
      expect(result).toHaveProperty("estimatedValue")
      expect(result).toHaveProperty("confidence")
    })
  })
})
