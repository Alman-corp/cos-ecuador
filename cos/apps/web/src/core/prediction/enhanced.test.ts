import { describe, it, expect } from "vitest"
import { enhancedPredictionEngine } from "./enhanced"

describe("EnhancedPredictionEngine", () => {
  describe("detectSeasonality", () => {
    it("detects seasonality in periodic data", () => {
      const points = Array.from({ length: 24 }, (_, i) => ({
        date: `2024-${String(i + 1).padStart(2, "0")}-01`,
        value: 100 + Math.sin(i * Math.PI / 3) * 50,
      }))
      const result = enhancedPredictionEngine.detectSeasonality(points)
      expect(result).toHaveProperty("hasSeasonality")
      expect(result).toHaveProperty("period")
    })
  })

  describe("detectAnomalies", () => {
    it("detects anomalies with outliers", () => {
      const points = [
        { date: "2024-01-01", value: 10 },
        { date: "2024-02-01", value: 12 },
        { date: "2024-03-01", value: 11 },
        { date: "2024-04-01", value: 13 },
        { date: "2024-05-01", value: 100 },
        { date: "2024-06-01", value: 12 },
      ]
      const anomalies = enhancedPredictionEngine.detectAnomalies(points)
      expect(anomalies.length).toBeGreaterThan(0)
    })
  })
})
