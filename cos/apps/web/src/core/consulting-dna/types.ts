export type DnaCategory =
  | "liquidity" | "solvency" | "profitability" | "efficiency"
  | "compliance" | "strategic" | "operational" | "digital"
  | "tax" | "legal" | "market" | "management"

export type RiskLevel = "low" | "medium" | "high" | "critical"
export type MaturityLevel = 1 | 2 | 3 | 4 | 5
export type Priority = "low" | "medium" | "high" | "urgent"

export interface DnaRule {
  id: string
  name: string
  description: string
  category: DnaCategory
  version: string
  source: string
  lastUpdated: string
  enabled: boolean
  tags: string[]
  condition: string
  action: string
  weight: number
}

export interface RiskThreshold {
  id: string
  name: string
  category: DnaCategory
  indicator: string
  low: number
  medium: number
  high: number
  critical: number
  unit: string
  inverse: boolean
}

export interface RecommendationPattern {
  id: string
  name: string
  trigger: string
  priority: Priority
  category: DnaCategory
  template: string
  conditions: string[]
  examples: string[]
}

export interface MaturityScale {
  id: string
  name: string
  category: DnaCategory
  levels: {
    level: MaturityLevel
    label: string
    description: string
    criteria: string[]
  }[]
}

export interface KnowledgeEntry {
  id: string
  type: "regulation" | "methodology" | "benchmark" | "best_practice" | "reference"
  title: string
  description: string
  category: DnaCategory
  jurisdiction?: string
  source?: string
  url?: string
  tags: string[]
  content: string
}

export interface ConsultingDna {
  version: string
  lastUpdated: string
  rules: DnaRule[]
  riskThresholds: RiskThreshold[]
  recommendationPatterns: RecommendationPattern[]
  maturityScales: MaturityScale[]
  knowledgeBase: KnowledgeEntry[]
}
