export interface OptimizationInput {
  planId: string
  companyId: string
  actualBudget: number
  actualDurationDays: number
  actualPhases: number
  actualTasks: number
  actualKpiAchievement: number  // 0-100
  actualCostReduction?: number
  actualRevenueImpact?: number
}

export interface PlanVariant {
  name: string
  description: string
  changes: string[]
  simulatedBudget: number
  simulatedDurationDays: number
  simulatedKpiAchievement: number
  simulatedCostReduction: number
  simulatedRevenueImpact: number
  confidence: number
}

export interface OptimizationResult {
  planId: string
  companyId: string
  actualMetrics: {
    budget: number
    durationDays: number
    kpiAchievement: number
    costReduction: number
    revenueImpact: number
    roi: number
  }
  variants: PlanVariant[]
  bestVariant: PlanVariant | null
  improvementPotential: {
    budget: string
    duration: string
    kpiAchievement: string
    roi: string
    revenueImpact: string
  }
  lessonsForFuture: string[]
  simulatedAt: string
}

export interface WhatIfRequest {
  planId: string
  companyId: string
  budgetMultiplier?: number
  durationMultiplier?: number
  phaseCount?: number
  taskPerPhase?: number
  kpiTarget?: number
}
