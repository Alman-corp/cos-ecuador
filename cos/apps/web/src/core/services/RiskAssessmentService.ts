export interface RiskFactor {
  name: string
  weight: number
  score: number
  description: string
}

export interface RiskAssessment {
  overallScore: number
  level: "low" | "moderate" | "high" | "critical"
  factors: RiskFactor[]
  recommendations: string[]
}

export class RiskAssessmentService {
  assess(factors: Partial<RiskFactor>[]): RiskAssessment {
    const evaluated: RiskFactor[] = factors.map((f) => ({
      name: f.name || "unknown",
      weight: f.weight || 1,
      score: Math.min(100, Math.max(0, f.score || 0)),
      description: f.description || "",
    }))

    const totalWeight = evaluated.reduce((sum, f) => sum + f.weight, 0)
    const overallScore = totalWeight > 0
      ? Math.round(evaluated.reduce((sum, f) => sum + f.score * f.weight, 0) / totalWeight)
      : 0

    const level = overallScore >= 70 ? "low" : overallScore >= 50 ? "moderate" : overallScore >= 30 ? "high" : "critical"

    const recommendations: string[] = []
    evaluated.filter((f) => f.score < 50).forEach((f) => {
      recommendations.push(`Mitigar riesgo en "${f.name}": ${f.description}`)
    })

    return { overallScore, level, factors: evaluated, recommendations }
  }
}

export const riskAssessmentService = new RiskAssessmentService()
