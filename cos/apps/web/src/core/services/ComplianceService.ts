export interface ComplianceCheck {
  id: string
  name: string
  category: "tax" | "labor" | "corporate" | "regulatory"
  required: boolean
  passed: boolean
  notes?: string
}

export interface ComplianceResult {
  overallScore: number
  status: "compliant" | "partial" | "non_compliant"
  checks: ComplianceCheck[]
  gaps: string[]
  recommendations: string[]
}

export class ComplianceService {
  evaluate(checks: ComplianceCheck[]): ComplianceResult {
    const passed = checks.filter((c) => c.passed).length
    const total = checks.length
    const overallScore = total > 0 ? Math.round((passed / total) * 100) : 0

    const status = overallScore >= 90 ? "compliant" : overallScore >= 60 ? "partial" : "non_compliant"

    const gaps = checks.filter((c) => !c.passed && c.required).map((c) => c.name)

    return {
      overallScore,
      status,
      checks,
      gaps,
      recommendations: gaps.map((g) => `Regularizar: ${g}`),
    }
  }
}

export const complianceService = new ComplianceService()
