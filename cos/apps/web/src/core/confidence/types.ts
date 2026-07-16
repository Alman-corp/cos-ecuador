export type ConfidenceContext = "prediction" | "recommendation" | "diagnosis" | "hypothesis" | "forecast"

export interface ConfidenceFactor {
  name: string
  status: "positive" | "negative" | "neutral"
  detail: string
  weight: number  // 0-100: how much this factor contributes
  score: number   // 0-100: the score for this specific factor
}

export interface ConfidenceResult {
  overall: number  // 0-100 final confidence
  context: ConfidenceContext
  label: string    // "Muy alta" | "Alta" | "Media" | "Baja" | "Muy baja"
  factors: ConfidenceFactor[]
  summary: string  // One-line human-readable explanation
  timestamp: string
}

export interface ConfidenceInput {
  context: ConfidenceContext
  dataPoints: number
  dataCompleteness: number  // 0-100
  dataRecencyDays: number
  historicalMatches: number
  kpiConsistency: number     // 0-100: how aligned the KPIs are
  benchmarkAvailable: boolean
  businessCasesAvailable: number
  industryKnown: boolean
  previousAccuracy?: number  // 0-100: how accurate previous predictions in this context were
}
