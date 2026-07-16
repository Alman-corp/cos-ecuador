import { memoryStore } from "@/core/memory"
import { planningEngine } from "@/core/planning"
import { persistence, ensurePersistence } from "@/core/persistence"
import type { BusinessCase, CaseSearchRequest, CaseSimilarityResult, CaseStat, CaseImpact, CaseCategory } from "./types"

const caseStore = new Map<string, BusinessCase>()

class LearningEngine {
  getAllCasesRaw(): BusinessCase[] { return Array.from(caseStore.values()) }
  restoreAllCases(data: BusinessCase[]): void {
    caseStore.clear()
    for (const c of data) caseStore.set(c.id, c)
  }
  // ── Register a completed plan as a business case ──

  registerCase(input: Omit<BusinessCase, "id" | "createdAt" | "effectivenessScore">): BusinessCase {
    ensurePersistence()
    const score = this.calculateEffectiveness(input)

    const businessCase: BusinessCase = {
      ...input,
      id: `case_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
      effectivenessScore: score,
    }

    caseStore.set(businessCase.id, businessCase)
    persistence.scheduleSave()

    // Store in Business Memory
    memoryStore.store({
      companyId: input.companyId,
      clientId: input.clientId,
      type: "decision",
      title: `Caso completado: ${input.problem.slice(0, 80)}`,
      description: `Impacto: ${input.impact} | ROI: ${input.rentabilidad}% | Lecciones: ${input.lecciones.length}`,
      entities: [input.clientId].filter((x): x is string => !!x),
      tags: ["business-case", input.problemCategory, input.status],
      metadata: {
        caseId: businessCase.id,
        impact: input.impact,
        effectiveness: score,
        roi: input.rentabilidad,
      },
      userId: "system",
      userName: "Learning Engine",
      importance: score > 80 ? "critical" : score > 50 ? "high" : "medium",
    })

    return businessCase
  }

  // ── Auto-register from a completed plan ──

  autoRegisterFromPlan(planId: string, results: {
    result: string
    revenueImpact?: number
    costReduction?: number
    marginImprovement?: number
    liquidityImprovement?: number
    lecciones: string[]
    errores: string[]
    aciertos: string[]
    costTotal: number
    tiempoMeses: number
  }): BusinessCase | null {
    const plan = planningEngine.getPlan(planId)
    if (!plan || plan.status !== "completed") return null

    const rentabilidad = results.costTotal > 0
      ? ((results.revenueImpact || 0) / results.costTotal) * 100
      : 0

    return this.registerCase({
      companyId: plan.companyId,
      clientId: plan.clientId,
      clientName: plan.clientId,
      problem: plan.objective.title,
      problemCategory: this.mapCategory(plan.objective.category),
      diagnosis: "",
      planSummary: `Plan de ${plan.phases.length} fases con ${plan.totalBudget} presupuesto`,
      planId: plan.id,
      planDurationMonths: plan.estimatedDurationMonths,
      result: results.result,
      resultadoCuantitativo: {
        revenueImpact: results.revenueImpact,
        costReduction: results.costReduction,
        marginImprovement: results.marginImprovement,
        liquidityImprovement: results.liquidityImprovement,
      },
      status: "completed",
      impact: this.calculateImpact(results, rentabilidad),
      tiempoMeses: results.tiempoMeses,
      costTotal: results.costTotal,
      rentabilidad: Math.round(rentabilidad * 100) / 100,
      lecciones: results.lecciones,
      errores: results.errores,
      aciertos: results.aciertos,
      tags: [plan.objective.category, ...plan.phases.map((p: any) => p.name.toLowerCase().replace(/\s+/g, "_"))],
      completedAt: new Date().toISOString(),
    })
  }

  // ── Search / Query ──

  search(req: CaseSearchRequest): BusinessCase[] {
    let results = Array.from(caseStore.values())

    if (req.problem) {
      const q = req.problem.toLowerCase()
      results = results.filter(
        (c) => c.problem.toLowerCase().includes(q) || c.diagnosis.toLowerCase().includes(q) || c.lecciones.some((l) => l.toLowerCase().includes(q))
      )
    }

    if (req.category) results = results.filter((c) => c.problemCategory === req.category)
    if (req.industry) results = results.filter((c) => c.industry?.toLowerCase() === req.industry?.toLowerCase())
    if (req.companySize) results = results.filter((c) => c.companySize === req.companySize)
    if (req.minEffectiveness) results = results.filter((c) => c.effectivenessScore >= req.minEffectiveness!)
    if (req.tags && req.tags.length > 0) results = results.filter((c) => req.tags!.some((t) => c.tags.includes(t)))

    results.sort((a, b) => b.effectivenessScore - a.effectivenessScore)

    if (req.limit) results = results.slice(0, req.limit)
    return results
  }

  findSimilar(problem: string, category?: string, limit = 5): CaseSimilarityResult[] {
    const all = Array.from(caseStore.values())
    const q = problem.toLowerCase()
    const qWords = q.split(/\s+/).filter((w) => w.length > 3)

    const scored = all.map((c) => {
      let score = 0
      const factors: string[] = []

      // Keyword matching
      const caseText = `${c.problem} ${c.diagnosis} ${c.planSummary} ${c.lecciones.join(" ")}`.toLowerCase()
      const matches = qWords.filter((w) => caseText.includes(w))
      score += (matches.length / Math.max(1, qWords.length)) * 50
      if (matches.length > 0) factors.push(`${matches.length} palabras clave coincidentes`)

      // Category match
      if (category && c.problemCategory === category) {
        score += 20
        factors.push("Misma categoría de problema")
      }

      // Same industry
      if (c.industry && q.includes(c.industry.toLowerCase())) {
        score += 10
        factors.push("Misma industria")
      }

      // High effectiveness bonus
      if (c.effectivenessScore > 80) {
        score += 10
        factors.push("Caso de alta efectividad")
      }

      // Recent cases score higher
      const ageMonths = (Date.now() - new Date(c.createdAt).getTime()) / (30 * 86400000)
      if (ageMonths < 6) {
        score += 10
        factors.push("Caso reciente (< 6 meses)")
      }

      return { case: c, similarity: Math.min(100, Math.round(score)), matchingFactors: factors }
    })

    scored.sort((a, b) => b.similarity - a.similarity)
    return scored.slice(0, limit)
  }

  // ── Stats ──

  getStats(): CaseStat {
    const all = Array.from(caseStore.values())

    const byCategory: Record<string, number> = {}
    const byImpact: Record<string, number> = {}
    const byStatus: Record<string, number> = {}

    for (const c of all) {
      byCategory[c.problemCategory] = (byCategory[c.problemCategory] || 0) + 1
      byImpact[c.impact] = (byImpact[c.impact] || 0) + 1
      byStatus[c.status] = (byStatus[c.status] || 0) + 1
    }

    const allLesions = all.flatMap((c) => c.lecciones)
    const allErrors = all.flatMap((c) => c.errores)

    const topLessons = this.topFrequent(allLesions, 5)
    const topErrors = this.topFrequent(allErrors, 5)

    return {
      total: all.length,
      byCategory,
      byImpact,
      byStatus,
      averageEffectiveness: all.length > 0 ? Math.round(all.reduce((s, c) => s + c.effectivenessScore, 0) / all.length) : 0,
      averageROI: all.length > 0 ? Math.round(all.reduce((s, c) => s + c.rentabilidad, 0) / all.length) : 0,
      totalCostSaved: all.reduce((s, c) => s + (c.resultadoCuantitativo?.costReduction || 0), 0),
      totalRevenueImpact: all.reduce((s, c) => s + (c.resultadoCuantitativo?.revenueImpact || 0), 0),
      topLessons,
      topErrors,
    }
  }

  getCase(id: string): BusinessCase | undefined {
    return caseStore.get(id)
  }

  getAll(companyId?: string): BusinessCase[] {
    const all = Array.from(caseStore.values())
    if (companyId) return all.filter((c) => c.companyId === companyId)
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  deleteCase(id: string): boolean {
    const result = caseStore.delete(id)
    if (result) persistence.scheduleSave()
    return result
  }

  // ── Private helpers ──

  private calculateEffectiveness(c: {
    impact: string; rentabilidad: number; status: string; planDurationMonths: number; tiempoMeses: number
  }): number {
    let score = 50  // base

    // Impact score
    const impactScores: Record<string, number> = {
      transformational: 30, significant: 20, moderate: 10, minimal: 0, negative: -20,
    }
    score += impactScores[c.impact] || 0

    // ROI score
    if (c.rentabilidad > 200) score += 20
    else if (c.rentabilidad > 100) score += 15
    else if (c.rentabilidad > 50) score += 10
    else if (c.rentabilidad > 0) score += 5

    // Time efficiency
    if (c.tiempoMeses > 0 && c.planDurationMonths > 0) {
      const ratio = c.tiempoMeses / c.planDurationMonths
      if (ratio < 0.8) score += 15
      else if (ratio < 1.0) score += 10
      else if (ratio < 1.2) score += 5
      else score -= 10
    }

    return Math.max(0, Math.min(100, score))
  }

  private calculateImpact(results: {
    revenueImpact?: number; costReduction?: number; marginImprovement?: number; liquidityImprovement?: number
  }, rentabilidad: number): CaseImpact {
    const totalImpact = (results.revenueImpact || 0) + (results.costReduction || 0)
    if (totalImpact > 1000000 || rentabilidad > 300) return "transformational"
    if (totalImpact > 500000 || rentabilidad > 150) return "significant"
    if (totalImpact > 100000 || rentabilidad > 50) return "moderate"
    if (totalImpact > 0 || rentabilidad > 0) return "minimal"
    return "negative"
  }

  private mapCategory(category: string): CaseCategory {
    const cat = category.toLowerCase()
    if (cat.includes("liquidez") || cat.includes("financiero")) return "liquidez"
    if (cat.includes("rentabilidad")) return "rentabilidad"
    if (cat.includes("crecimiento") || cat.includes("venta")) return "crecimiento"
    if (cat.includes("digital") || cat.includes("transformación")) return "transformacion_digital"
    if (cat.includes("cumplimiento") || cat.includes("legal")) return "cumplimiento"
    if (cat.includes("eficiencia") || cat.includes("operativo")) return "eficiencia_operativa"
    return "otros"
  }

  private topFrequent(items: string[], limit: number): { lesson: string; count: number }[] {
    const freq: Record<string, number> = {}
    for (const item of items) {
      const key = item.toLowerCase().trim()
      freq[key] = (freq[key] || 0) + 1
    }
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([lesson, count]) => ({ lesson, count }))
  }
}

export const learningEngine = new LearningEngine()
