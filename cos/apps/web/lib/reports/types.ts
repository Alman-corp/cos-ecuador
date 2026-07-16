export interface CIMData {
  company: {
    name: string
    industry: string
    foundedYear: number
    country: string
    employees: number
    description: string
  }
  consultingFirm: {
    name: string
    logo?: string
  }
  financials: {
    years: Array<{
      year: number
      revenue: number
      ebitda: number
      netIncome: number
      totalAssets: number
      totalEquity: number
    }>
  }
  valuation: {
    enterpriseValue: number
    equityValue: number
    dcf: { wacc: number; terminalGrowth: number }
    multiples: { evEbitda: number; peRatio: number }
  }
  investment: {
    thesis: string
    highlights: string[]
    risks: Array<{ title: string; description: string; severity: string }>
    opportunities: Array<{ title: string; value: number; description: string }>
  }
  reference: string
  preparedAt: string
}

export interface AuditReportData {
  companyName: string
  auditDate: string
  framework: "CAF" | "OECD" | "BVQ"
  dimensions: Array<{
    name: string
    score: number
    findings: Array<{
      title: string
      severity: "critical" | "high" | "medium" | "low"
      description: string
      recommendation: string
    }>
  }>
  overallScore: number
  maturityLevel: string
}
