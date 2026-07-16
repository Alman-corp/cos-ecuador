import { planningEngine } from "@/core/planning"
import { learningEngine } from "@/core/learning"
import { memoryStore } from "@/core/memory"
import type { OptimizationInput, OptimizationResult, PlanVariant, WhatIfRequest } from "./types"

const resultStore = new Map<string, OptimizationResult>()

class OptimizationEngine {
  async analyzePlan(input: OptimizationInput): Promise<OptimizationResult> {
    const plan = planningEngine.getPlan(input.planId)

    const actualRoi = input.actualBudget > 0
      ? ((input.actualRevenueImpact || 0) / input.actualBudget) * 100
      : 0

    const variants = this.generateVariants(input)

    // Determine the best variant
    const bestVariant = variants.reduce<PlanVariant | null>((best, v) => {
      if (!best) return v
      const bestScore = best.simulatedRevenueImpact + best.simulatedCostReduction + (best.simulatedKpiAchievement * 1000)
      const vScore = v.simulatedRevenueImpact + v.simulatedCostReduction + (v.simulatedKpiAchievement * 1000)
      return vScore > bestScore ? v : best
    }, null)

    // Calculate improvement potential
    const improvementPotential = this.calculateImprovement(input, bestVariant)

    // Generate lessons
    const lessonsForFuture = this.generateLessons(input, bestVariant, variants)

    const result: OptimizationResult = {
      planId: input.planId,
      companyId: input.companyId,
      actualMetrics: {
        budget: input.actualBudget,
        durationDays: input.actualDurationDays,
        kpiAchievement: input.actualKpiAchievement,
        costReduction: input.actualCostReduction || 0,
        revenueImpact: input.actualRevenueImpact || 0,
        roi: Math.round(actualRoi * 100) / 100,
      },
      variants,
      bestVariant,
      improvementPotential,
      lessonsForFuture,
      simulatedAt: new Date().toISOString(),
    }

    resultStore.set(input.planId, result)

    // Store insights in memory
    if (bestVariant && (improvementPotential.roi !== "0%" || improvementPotential.revenueImpact !== "$0")) {
      memoryStore.store({
        companyId: input.companyId,
        type: "event",
        title: `Optimización post-ejecución: ${plan?.objective.title || input.planId}`,
        description: `Análisis comparativo completado. Mejor variante: ${bestVariant.name}. Potencial de mejora ROI: ${improvementPotential.roi}`,
        entities: [],
        tags: ["optimization", "improvement", input.planId],
        metadata: {
          planId: input.planId,
          bestVariant: bestVariant.name,
          roiImprovement: improvementPotential.roi,
        },
        userId: "system",
        userName: "Optimization Engine",
        importance: "high",
      })
    }

    return result
  }

  async simulateWhatIf(req: WhatIfRequest): Promise<OptimizationResult> {
    const plan = planningEngine.getPlan(req.planId)
    if (!plan) throw new Error("Plan not found")

    const input: OptimizationInput = {
      planId: req.planId,
      companyId: req.companyId,
      actualBudget: plan.totalBudget,
      actualDurationDays: plan.estimatedDurationMonths * 30,
      actualPhases: plan.phases.length,
      actualTasks: plan.phases.reduce((s, p) => s + p.projects.reduce((s2, pr) => s2 + pr.tasks.length, 0), 0),
      actualKpiAchievement: 0,
    }

    return this.analyzePlan(input)
  }

  getResult(planId: string): OptimizationResult | undefined {
    return resultStore.get(planId)
  }

  getAllResults(companyId: string): OptimizationResult[] {
    return Array.from(resultStore.values()).filter((r) => r.companyId === companyId)
  }

  // ── Private: generate alternative plan configurations ──

  private generateVariants(input: OptimizationInput): PlanVariant[] {
    const similarCases = learningEngine.search({
      limit: 5,
      minEffectiveness: 70,
    })

    const avgSimilarRoi = similarCases.length > 0
      ? similarCases.reduce((s, c) => s + c.rentabilidad, 0) / similarCases.length
      : 0

    return [
      this.makeVariant(
        "Presupuesto optimizado",
        "Redistribuir presupuesto: 60% a fases críticas, 40% al resto",
        ["Asignación priorizada de recursos", "Reducción de gastos administrativos"],
        input.actualBudget * 0.85,    // 15% less budget
        input.actualDurationDays * 0.9,
        Math.min(100, input.actualKpiAchievement * 1.15),
        (input.actualCostReduction || 0) * 1.2,
        (input.actualRevenueImpact || 0) * 1.1,
        70 + (avgSimilarRoi > 0 ? 10 : 0),
      ),
      this.makeVariant(
        "Cronograma acelerado",
        "Compresión del cronograma con equipos paralelos",
        ["Fases en paralelo donde sea posible", "Dedicación full-time del equipo"],
        input.actualBudget * 1.1,     // 10% more budget (overtime)
        input.actualDurationDays * 0.7,  // 30% faster
        Math.min(100, input.actualKpiAchievement * 1.2),
        (input.actualCostReduction || 0) * 1.15,
        (input.actualRevenueImpact || 0) * 1.3,
        60 + (avgSimilarRoi > 0 ? 10 : 0),
      ),
      this.makeVariant(
        "Enfoque selectivo",
        "Concentrar recursos en las fases de mayor impacto",
        ["Eliminar fases de bajo impacto", "Externalizar actividades no críticas"],
        input.actualBudget * 0.75,    // 25% less budget
        input.actualDurationDays * 0.8,
        Math.min(100, input.actualKpiAchievement * 1.1),
        (input.actualCostReduction || 0) * 1.3,
        (input.actualRevenueImpact || 0) * 0.95,
        75 + (avgSimilarRoi > 0 ? 10 : 0),
      ),
      this.makeVariant(
        "Con base en casos similares",
        "Estrategia basada en casos exitosos de la biblioteca",
        ["Metodología probada en casos similares", "Evitar errores documentados"],
        input.actualBudget * 0.95,
        input.actualDurationDays * 0.85,
        Math.min(100, similarCases.length > 0
          ? input.actualKpiAchievement * 1.25 + similarCases.length * 2
          : input.actualKpiAchievement * 1.05),
        similarCases.length > 0
          ? (input.actualCostReduction || 0) * (1 + similarCases.length * 0.05)
          : (input.actualCostReduction || 0),
        similarCases.length > 0
          ? (input.actualRevenueImpact || 0) * (1 + similarCases.length * 0.07)
          : (input.actualRevenueImpact || 0),
        80,
      ),
      this.makeVariant(
        "Máximo rendimiento",
        "Combinación óptima de todas las estrategias",
        ["Presupuesto optimizado + cronograma acelerado + enfoque selectivo + lecciones aprendidas"],
        input.actualBudget * 0.9,
        input.actualDurationDays * 0.65,
        Math.min(100, input.actualKpiAchievement * 1.3),
        (input.actualCostReduction || 0) * 1.4,
        (input.actualRevenueImpact || 0) * 1.4,
        65,
      ),
    ]
  }

  private makeVariant(
    name: string, description: string, changes: string[],
    budget: number, duration: number, kpi: number,
    costReduction: number, revenueImpact: number,
    confidence: number,
  ): PlanVariant {
    return {
      name, description, changes,
      simulatedBudget: Math.round(budget),
      simulatedDurationDays: Math.round(duration),
      simulatedKpiAchievement: Math.round(kpi),
      simulatedCostReduction: Math.round(costReduction),
      simulatedRevenueImpact: Math.round(revenueImpact),
      confidence: Math.min(95, Math.round(confidence)),
    }
  }

  private calculateImprovement(input: OptimizationInput, best: PlanVariant | null): OptimizationResult["improvementPotential"] {
    if (!best) {
      return { budget: "0%", duration: "0%", kpiAchievement: "0%", roi: "0%", revenueImpact: "$0" }
    }

    const budgetDiff = ((input.actualBudget - best.simulatedBudget) / input.actualBudget) * 100
    const durationDiff = ((input.actualDurationDays - best.simulatedDurationDays) / input.actualDurationDays) * 100
    const kpiDiff = best.simulatedKpiAchievement - input.actualKpiAchievement

    const actualRoi = input.actualBudget > 0
      ? ((input.actualRevenueImpact || 0) - (input.actualCostReduction || 0)) / input.actualBudget * 100
      : 0
    const bestRoi = best.simulatedBudget > 0
      ? (best.simulatedRevenueImpact - best.simulatedCostReduction) / best.simulatedBudget * 100
      : 0
    const roiDiff = bestRoi - actualRoi
    const revenueDiff = best.simulatedRevenueImpact - (input.actualRevenueImpact || 0)

    return {
      budget: `${budgetDiff > 0 ? "-" : "+"}${Math.abs(Math.round(budgetDiff))}%`,
      duration: `${durationDiff > 0 ? "-" : "+"}${Math.abs(Math.round(durationDiff))}%`,
      kpiAchievement: `${kpiDiff > 0 ? "+" : ""}${Math.round(kpiDiff)}%`,
      roi: `${roiDiff > 0 ? "+" : ""}${Math.round(roiDiff)}%`,
      revenueImpact: `${revenueDiff > 0 ? "+" : ""}$${Math.abs(revenueDiff).toLocaleString()}`,
    }
  }

  private generateLessons(input: OptimizationInput, best: PlanVariant | null, variants: PlanVariant[]): string[] {
    const lessons: string[] = []

    if (!best) {
      lessons.push("Registra resultados cuantitativos completos para permitir el análisis de optimización.")
      return lessons
    }

    if (best.simulatedBudget < input.actualBudget * 0.9) {
      lessons.push("Se podría haber reducido el presupuesto sin afectar significativamente los resultados.")
    }
    if (best.simulatedDurationDays < input.actualDurationDays * 0.8) {
      lessons.push("Un cronograma más agresivo con equipos paralelos podría haber acelerado la entrega.")
    }
    if (best.simulatedKpiAchievement > input.actualKpiAchievement * 1.2) {
      lessons.push("La concentración de recursos en fases críticas mejora el logro de KPIs.")
    }
    if (best.simulatedCostReduction > (input.actualCostReduction || 0) * 1.3) {
      lessons.push("Externalizar actividades no críticas libera recursos para tareas de mayor impacto.")
    }

    const caseCount = learningEngine.getStats().total
    if (caseCount > 0) {
      lessons.push(`La Business Case Library (${caseCount} casos) permite calibrar mejor los planes futuros.`)
    }

    if (lessons.length === 0) {
      lessons.push("El plan ejecutado fue cercano al óptimo. Pequeños ajustes en la asignación de recursos podrían mejorar resultados.")
    }

    return lessons
  }
}

export const optimizationEngine = new OptimizationEngine()
