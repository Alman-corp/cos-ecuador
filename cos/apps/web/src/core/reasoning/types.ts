export type ReasoningLevel = "observation" | "correlation" | "causation" | "prediction"

export interface ReasoningRequest {
  companyId: string
  clientId?: string
  query: string
  context?: Record<string, any>
}

export interface ReasoningResponse {
  query: string
  observations: Observation[]
  diagnosis: Diagnosis | null
  hypotheses: Hypothesis[]
  confidence: number
  reasoning: string
  timestamp: string
}

export interface Observation {
  id: string
  type: string
  indicator: string
  currentValue: number
  previousValue: number
  change: number
  changePercent: number
  direction: "up" | "down" | "stable"
  severity: "low" | "medium" | "high" | "critical"
  description: string
}

export interface Diagnosis {
  summary: string
  factors: Factor[]
  overallHealth: "healthy" | "attention" | "risk" | "critical"
  confidence: number
}

export interface Factor {
  name: string
  impact: "positive" | "negative" | "neutral"
  weight: number
  evidence: string[]
  explanation: string
}

export interface Hypothesis {
  id: string
  title: string
  description: string
  probability: number
  evidence: string[]
  supportingFactors: string[]
  counterFactors: string[]
  recommendedAction: string
}

export interface Explanation {
  what: string
  why: string
  how: string
  impact: string
  probability: number
  timeHorizon: string
}
