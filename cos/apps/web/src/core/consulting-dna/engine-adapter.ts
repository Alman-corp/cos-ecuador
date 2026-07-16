import { ConsultingDNACalculator } from "./rules-engine/calculator"
import { YamlRulesRepository } from "./rules-engine/yaml-repository"
import type { DeclarativeRule, ClientFacts, EvaluationResult } from "./rules-engine/types"
import { evaluationRules } from "./evaluation-rules"
import { riskThresholds } from "./risk-criteria"
import { recommendationPatterns } from "./recommendation-patterns"
import { maturityScales } from "./maturity-scales"
import { knowledgeBase } from "./knowledge-base"
import type { DnaRule, RiskThreshold, RecommendationPattern, MaturityScale, KnowledgeEntry, RiskLevel, DnaCategory, MaturityLevel } from "./types"

export class ConsultingDnaAdapterEngine {
  private calculator: ConsultingDNACalculator | null = null
  private loadedRules: DeclarativeRule[] = []

  constructor() {
    const repo = new YamlRulesRepository()
    this.calculator = new ConsultingDNACalculator(repo)
  }

  async initialize(): Promise<void> {
    if (!this.calculator) return
    await this.calculator.initialize()
    this.loadedRules = this.calculator.getLoadedRules()
  }

  async reload(): Promise<void> {
    if (!this.calculator) return
    await this.calculator.reloadRules()
    this.loadedRules = this.calculator.getLoadedRules()
  }

  async evaluateClient(facts: ClientFacts): Promise<EvaluationResult> {
    if (!this.calculator) throw new Error("Adapter not initialized")
    return this.calculator.evaluateClient(facts)
  }

  // --- Backward-compatible API ---

  getRules(category?: DnaCategory): DnaRule[] {
    return category
      ? evaluationRules.filter((r) => r.category === category && r.enabled)
      : evaluationRules.filter((r) => r.enabled)
  }

  getThresholds(category?: DnaCategory): RiskThreshold[] {
    return category
      ? riskThresholds.filter((t) => t.category === category)
      : riskThresholds
  }

  getPatterns(category?: DnaCategory): RecommendationPattern[] {
    return category
      ? recommendationPatterns.filter((p) => p.category === category)
      : recommendationPatterns
  }

  getScales(category?: DnaCategory): MaturityScale[] {
    return category
      ? maturityScales.filter((s) => s.category === category)
      : maturityScales
  }

  getKnowledge(type?: KnowledgeEntry["type"], category?: DnaCategory): KnowledgeEntry[] {
    let entries = knowledgeBase
    if (type) entries = entries.filter((e) => e.type === type)
    if (category) entries = entries.filter((e) => e.category === category)
    return entries
  }

  searchKnowledge(query: string): KnowledgeEntry[] {
    const q = query.toLowerCase()
    return knowledgeBase.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q)) ||
        e.content.toLowerCase().includes(q),
    )
  }

  evaluateRisk(indicator: string, value: number): { level: RiskLevel; threshold: RiskThreshold | null } {
    const threshold = riskThresholds.find((t) => t.indicator === indicator)
    if (!threshold) return { level: "medium", threshold: null }

    let level: RiskLevel = "low"
    if (threshold.inverse) {
      if (value <= threshold.critical) level = "critical"
      else if (value <= threshold.high) level = "high"
      else if (value <= threshold.medium) level = "medium"
      else level = "low"
    } else {
      if (value >= threshold.critical) level = "critical"
      else if (value >= threshold.high) level = "high"
      else if (value >= threshold.medium) level = "medium"
      else level = "low"
    }
    return { level, threshold }
  }

  evaluateMaturity(
    scaleId: string,
    score: number,
  ): {
    currentLevel: MaturityLevel
    scale: MaturityScale | null
    nextLevel: MaturityScale["levels"][0] | null
    progress: number
  } {
    const scale = maturityScales.find((s) => s.id === scaleId)
    if (!scale) return { currentLevel: 1, scale: null, nextLevel: null, progress: 0 }

    const scorePerLevel = 100 / scale.levels.length
    const currentIndex = Math.min(Math.floor(score / scorePerLevel), scale.levels.length - 1)
    const currentLevel = scale.levels[currentIndex].level as MaturityLevel
    const nextLevel = currentIndex < scale.levels.length - 1 ? scale.levels[currentIndex + 1] : null
    const progress = (score % scorePerLevel) / scorePerLevel

    return { currentLevel, scale, nextLevel, progress }
  }

  getMatchingPatterns(
    evaluations: { ruleId: string; triggered: boolean; value: number }[],
  ): RecommendationPattern[] {
    const triggered = this.getRules().filter((r) =>
      evaluations.find((e) => e.ruleId === r.id && e.triggered),
    )
    const patterns: RecommendationPattern[] = []

    for (const rule of triggered) {
      const matching = recommendationPatterns.filter((p) => p.category === rule.category)
      patterns.push(...matching)
    }

    return [...new Map(patterns.map((p) => [p.id, p])).values()].sort((a, b) => {
      const priority = { urgent: 0, high: 1, medium: 2, low: 3 }
      return priority[a.priority] - priority[b.priority]
    })
  }

  getDnaSummary() {
    return {
      version: "1.0.0",
      lastUpdated: "2026-06-28",
      totalRules: evaluationRules.length,
      enabledRules: evaluationRules.filter((r) => r.enabled).length,
      totalThresholds: riskThresholds.length,
      totalPatterns: recommendationPatterns.length,
      totalScales: maturityScales.length,
      totalKnowledge: knowledgeBase.length,
      categories: [
        ...new Set([
          ...evaluationRules.map((r) => r.category),
          ...riskThresholds.map((t) => t.category),
          ...recommendationPatterns.map((p) => p.category),
          ...maturityScales.map((s) => s.category),
        ]),
      ] as DnaCategory[],
    }
  }

  getLoadedDeclarativeRules(): DeclarativeRule[] {
    return this.loadedRules
  }
}

export const consultingDnaAdapter = new ConsultingDnaAdapterEngine()
