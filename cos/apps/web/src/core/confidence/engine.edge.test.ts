import { describe, it, expect } from "vitest"
import { confidenceEngine } from "./engine"

describe("ConfidenceEngine edge cases", () => {
  it("evaluate with empty data returns overall and label", () => {
    const result = confidenceEngine.evaluate({})
    expect(result).toHaveProperty("overall")
    expect(result).toHaveProperty("label")
    expect(result).toHaveProperty("factors")
    expect(typeof result.overall).toBe("number")
  })

  it("evaluatePrediction with zero data points", () => {
    const result = confidenceEngine.evaluatePrediction([], 0, 0)
    expect(result).toHaveProperty("overall")
  })

  it("evaluateRecommendation returns result", () => {
    const result = confidenceEngine.evaluateRecommendation("high", "verified")
    expect(result).toHaveProperty("overall")
  })

  it("evaluateDiagnosis handles unknown patterns", () => {
    const result = confidenceEngine.evaluateDiagnosis(0, 0, "unknown")
    expect(result).toHaveProperty("overall")
  })

  it("evaluatePrediction handles perfect fit with data", () => {
    const points = [
      { date: "2024-01", actual: 100, predicted: 100 },
      { date: "2024-02", actual: 110, predicted: 110 },
    ]
    const result = confidenceEngine.evaluatePrediction(points, 1, 5, "manufactura")
    expect(result).toHaveProperty("overall")
  })
})
