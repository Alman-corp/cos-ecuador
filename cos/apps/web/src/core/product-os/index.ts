import { vision, strategy, icps } from "./strategy"
import { pricing } from "./pricing"
import { successMetrics } from "./metrics"
import { betaProgram } from "./beta"
import { roadmap, risks, competitiveMatrix, investment, aiStrategy } from "./roadmap"
import { biOSArchitecture, verticalPacks } from "./architecture"
import type { ProductOS, PlanTier, SuccessMetric, ProductStage, VerticalPack } from "./types"

export class ProductOSEngine {
  getFullOS(): ProductOS {
    return {
      version: "1.0.0",
      lastUpdated: "2026-06-28",
      stage: "beta" as ProductStage,
      vision,
      strategy,
      icps,
      pricing,
      metrics: successMetrics,
      roadmap,
      risks,
      competitiveMatrix,
      betaProgram,
      investment,
      aiStrategy,
      biOSArchitecture,
      verticalPacks,
    }
  }

  getVerticalPack(packId: string): VerticalPack | undefined {
    return verticalPacks.find((p) => p.id === packId)
  }

  getActiveVerticalPacks(): VerticalPack[] {
    return verticalPacks.filter((p) => p.status === "active")
  }

  getPricingForTier(tier: PlanTier) {
    return pricing.find((p) => p.tier === tier)
  }

  getLimitsForTier(tier: PlanTier) {
    const plan = pricing.find((p) => p.tier === tier)
    if (!plan) return null
    const limits: Record<string, any> = {}
    for (const limit of plan.limits) {
      limits[limit.feature] = limit[tier]
    }
    return limits
  }

  getMetricsByCategory(category: string) {
    return successMetrics.filter((m) => m.category === category)
  }

  getActiveMetrics() {
    return successMetrics.filter((m) => m.current !== null)
  }

  getRoadmapByStatus(status: string) {
    return roadmap.filter((r) => r.status === status)
  }

  getRisksByLevel(threshold: number = 12) {
    return risks.filter((r) => r.probability * r.impact >= threshold)
  }

  getSummary() {
    const os = this.getFullOS()
    return {
      stage: os.stage,
      totalMetrics: os.metrics.length,
      activeMetrics: os.metrics.filter((m) => m.current !== null).length,
      roadmapCompleted: os.roadmap.filter((r) => r.status === "completed").length,
      roadmapPlanned: os.roadmap.filter((r) => r.status === "planned").length,
      roadmapInProgress: os.roadmap.filter((r) => r.status === "in_progress").length,
      criticalRisks: os.risks.filter((r) => r.probability * r.impact >= 12).length,
      totalRisks: os.risks.length,
      pricingTiers: os.pricing.length,
      icpCount: os.icps.length,
      competitors: os.competitiveMatrix.length,
    }
  }
}

export const productOS = new ProductOSEngine()
export type * from "./types"
