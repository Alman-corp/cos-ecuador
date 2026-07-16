export interface TimeSeriesPoint {
  date: string
  value: number
  label?: string
}

export interface Trend {
  direction: "up" | "down" | "stable"
  strength: number
  slope: number
  intercept: number
  rSquared: number
  description: string
}

export interface Projection {
  points: TimeSeriesPoint[]
  confidence: number
  upperBound: number[]
  lowerBound: number[]
}

export interface Scenario {
  name: string
  label: string
  probability: number
  projections: Record<string, Projection>
  summary: string
}

export interface EarlyWarning {
  indicator: string
  currentValue: number
  threshold: number
  estimatedDaysToThreshold: number
  estimatedDate: string
  severity: "low" | "medium" | "high" | "critical"
  recommendation: string
}

export interface PredictionResult {
  companyId: string
  clientId?: string
  generatedAt: string
  indicators: {
    name: string
    currentValue: number
    trend: Trend
    projection30d: Projection
    projection90d: Projection
  }[]
  scenarios: Scenario[]
  earlyWarnings: EarlyWarning[]
  summary: string
  confidence: number
  confidenceFactors?: {
    name: string
    status: "positive" | "negative" | "neutral"
    detail: string
    score: number
  }[]
}

export interface KPIDataPoint {
  date: string
  value: number
}
