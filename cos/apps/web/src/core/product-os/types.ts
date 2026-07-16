export type ProductStage = "vision" | "alpha" | "beta" | "ga" | "growth" | "scale"

export type CustomerSegment = "consultora" | "firma_contable" | "auditora" | "cfo_externo" | "empresa_mediana"

export type PlanTier = "starter" | "professional" | "enterprise"

export type MetricCategory = "adopcion" | "activacion" | "retencion" | "monetizacion" | "ia" | "calidad"

export interface Vision {
  title: string
  statement: string
  timeframe: string
  pillars: { title: string; description: string }[]
}

export interface ProductStrategy {
  problem: string
  solution: string
  valueProposition: string
  buyer: string
  user: string
  budgetApprover: string
  differentiators: string[]
  targetSegments: CustomerSegment[]
}

export interface ICP {
  segment: CustomerSegment
  label: string
  description: string
  companySize: string
  annualRevenue: string
  painPoints: string[]
  useCases: string[]
  decisionCriteria: string[]
  objections: string[]
}

export interface PlanLimit {
  feature: string
  starter: number | string | boolean
  professional: number | string | boolean
  enterprise: number | string | boolean
  unit: string
}

export interface PricingPlan {
  tier: PlanTier
  name: string
  price: number
  priceLabel: string
  description: string
  highlighted: boolean
  limits: PlanLimit[]
  addons: AddOn[]
}

export interface AddOn {
  name: string
  description: string
  price: number
  unit: string
}

export interface SuccessMetric {
  id: string
  name: string
  category: MetricCategory
  description: string
  formula: string
  target: string
  current: number | null
  unit: string
  frequency: string
}

export interface RoadmapItem {
  id: string
  title: string
  description: string
  quarter: string
  priority: "p0" | "p1" | "p2" | "p3"
  status: "planned" | "in_progress" | "completed" | "cancelled"
  category: "platform" | "ia" | "crm" | "analisis" | "workflow" | "monetizacion"
  impact: "high" | "medium" | "low"
  effort: "small" | "medium" | "large"
  dependencies: string[]
}

export interface Risk {
  id: string
  title: string
  description: string
  category: "tecnico" | "legal" | "comercial" | "operacional" | "financiero"
  probability: 1 | 2 | 3 | 4 | 5
  impact: 1 | 2 | 3 | 4 | 5
  mitigation: string
  owner: string
  status: "identified" | "mitigated" | "accepted" | "realized"
}

export interface CompetitiveEntry {
  competitor: string
  category: string
  ourStrength: number
  theirStrength: number
  notes: string
}

export interface BetaProgram {
  status: "draft" | "active" | "closed"
  maxParticipants: number
  currentParticipants: number
  duration: string
  requirements: string[]
  incentives: string[]
  feedbackChannels: string[]
  successCriteria: string[]
}

export interface Investment {
  estimatedMonthlyRunway: number
  currentMRR: number
  breakEvenMRR: number
  projectedBreakEven: string
  costBreakdown: { category: string; amount: number; percentage: number }[]
  fundingStrategy: string
}

export type VerticalPackStatus = "active" | "planned" | "coming_soon"

export interface VerticalPack {
  id: string
  name: string
  tagline: string
  audience: string
  objective: string
  modules: string[]
  dnaModules: string[]
  status: VerticalPackStatus
  price: number
}

export interface AiStrategy {
  current: string
  next: string
  vision: string
  models: { name: string; useCase: string; priority: "primary" | "secondary" | "experimental" }[]
  knowledgeSources: string[]
  evaluationFramework: string
}

export interface ProductOS {
  version: string
  lastUpdated: string
  stage: ProductStage
  vision: Vision
  strategy: ProductStrategy
  icps: ICP[]
  pricing: PricingPlan[]
  metrics: SuccessMetric[]
  roadmap: RoadmapItem[]
  risks: Risk[]
  competitiveMatrix: CompetitiveEntry[]
  betaProgram: BetaProgram
  investment: Investment
  aiStrategy: AiStrategy
  biOSArchitecture: {
    name: string
    tagline: string
    kernel: {
      name: string
      description: string
      layers: { name: string; description: string; status: string; components: string[] }[]
    }
  }
  verticalPacks: VerticalPack[]
}
