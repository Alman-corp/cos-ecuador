export type CaseStatus = "completed" | "partial" | "failed"
export type CaseImpact = "transformational" | "significant" | "moderate" | "minimal" | "negative"
export type CaseCategory = "liquidez" | "rentabilidad" | "crecimiento" | "transformacion_digital" | "cumplimiento" | "eficiencia_operativa" | "reestructuracion" | "expansion" | "crisis" | "otros"

export interface BusinessCase {
  id: string
  companyId: string
  clientId?: string
  clientName?: string
  industry?: string
  companySize?: string
  
  // Core: problema → diagnóstico → plan → resultado
  problem: string
  problemCategory: CaseCategory
  diagnosis: string
  planSummary: string
  planId?: string
  planDurationMonths: number
  
  // Resultados
  result: string
  resultadoCuantitativo?: {
    revenueImpact?: number
    costReduction?: number
    marginImprovement?: number
    liquidityImprovement?: number
    otherMetrics?: Record<string, number>
  }
  status: CaseStatus
  impact: CaseImpact
  
  // Métricas del proyecto
  tiempoMeses: number
  costTotal: number
  rentabilidad: number  // ROI percentage
  
  // Aprendizaje
  lecciones: string[]
  errores: string[]
  aciertos: string[]
  
  // Metadata
  effectivenessScore: number  // 0-100
  tags: string[]
  createdAt: string
  completedAt: string
}

export interface CaseSearchRequest {
  problem?: string
  category?: CaseCategory
  industry?: string
  companySize?: string
  minEffectiveness?: number
  tags?: string[]
  limit?: number
}

export interface CaseSimilarityResult {
  case: BusinessCase
  similarity: number  // 0-100
  matchingFactors: string[]
}

export interface CaseStat {
  total: number
  byCategory: Record<string, number>
  byImpact: Record<string, number>
  byStatus: Record<string, number>
  averageEffectiveness: number
  averageROI: number
  totalCostSaved: number
  totalRevenueImpact: number
  topLessons: { lesson: string; count: number }[]
  topErrors: { lesson: string; count: number }[]
}
