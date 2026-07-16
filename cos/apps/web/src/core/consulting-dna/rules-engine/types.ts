export type RuleActionType = "alert" | "score" | "recommend" | "block"
export type RuleCategory = "risk" | "opportunity" | "maturity" | "recommendation"
export type RuleSeverity = "info" | "warning" | "critical"

export interface DeclarativeRule {
  id: string
  name: string
  description?: string
  category: RuleCategory
  condition: string
  priority: number
  then: {
    action: RuleActionType
    severity?: RuleSeverity
    message: string
    recommendationId?: string
    score?: number
    dimension?: string
    potentialValue?: number
  }
  enabled: boolean
  validFrom?: string
  validTo?: string
  tags?: string[]
  metadata?: Record<string, unknown>
}

export interface ClientFacts {
  clientId: string
  financials: {
    revenue: { total: number; growth: number; recurring: number }
    expenses: { total: number; fixed: number; variable: number }
    balanceSheet: {
      assets: number
      liabilities: { total: number; shortTerm: number; longTerm: number }
      equity: number
    }
    cashflow: { operating: number; investing: number; financing: number; runway: number }
    ratios: {
      debtToEquity: number; currentRatio: number; quickRatio: number
      grossMargin: number; netMargin: number; operatingMargin: number
      roe: number; roa: number; assetTurnover: number; interestCoverage: number
    }
  }
  operational: {
    employees: number; digitalMaturity: number
    processAutomation: number; customerRetention: number
  }
  industry: {
    sector: string; benchmarkDebtRatio: number; benchmarkMargin: number
  }
}

export interface EvaluationResult {
  clientId: string
  evaluatedAt: string
  risks: Array<{
    ruleId: string; severity: RuleSeverity; message: string
    priority: number; recommendationId?: string
  }>
  opportunities: Array<{
    ruleId: string; message: string
    potentialValue?: number; recommendationId?: string
  }>
  maturity: {
    score: number
    level: "initial" | "developing" | "defined" | "managed" | "optimized"
    dimensions: Array<{ name: string; score: number; level: string }>
  }
  recommendations: Array<{
    ruleId: string; message: string; priority: number
  }>
}
