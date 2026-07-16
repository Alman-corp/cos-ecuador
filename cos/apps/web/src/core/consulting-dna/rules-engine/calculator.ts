import { RuleEngine } from "./rule-engine"
import type { RuleEngineEvent } from "./rule-engine"
import type { DeclarativeRule, ClientFacts, EvaluationResult } from "./types"

export interface RulesRepository {
  loadAll(): Promise<DeclarativeRule[]>
}

const MATURITY_LEVELS = ["initial", "developing", "defined", "managed", "optimized"] as const

export class ConsultingDNACalculator {
  private engine: RuleEngine | null = null

  constructor(private repository: RulesRepository) {}

  async initialize(): Promise<void> {
    const rules = await this.repository.loadAll()
    this.engine = new RuleEngine(rules)
  }

  async reloadRules(): Promise<void> {
    const rules = await this.repository.loadAll()
    if (this.engine) {
      this.engine.reload(rules)
    } else {
      this.engine = new RuleEngine(rules)
    }
  }

  async evaluateClient(facts: ClientFacts): Promise<EvaluationResult> {
    if (!this.engine) throw new Error("Calculator not initialized. Call initialize() first.")

    const events = await this.engine.evaluate(facts)
    return this.buildResult(facts.clientId, events)
  }

  private buildResult(clientId: string, events: RuleEngineEvent[]): EvaluationResult {
    const result: EvaluationResult = {
      clientId,
      evaluatedAt: new Date().toISOString(),
      risks: [],
      opportunities: [],
      maturity: { score: 50, level: "defined", dimensions: [] },
      recommendations: [],
    }

    for (const ev of events) {
      switch (ev.type) {
        case "alert":
          result.risks.push({
            ruleId: ev.ruleId,
            severity: (ev.params.severity as EvaluationResult["risks"][0]["severity"]) ?? "warning",
            message: ev.params.message,
            priority: ev.priority,
            recommendationId: ev.params.recommendationId,
          })
          break
        case "score":
          if (ev.params.dimension && ev.params.score !== undefined) {
            result.maturity.dimensions.push({
              name: ev.params.dimension,
              score: ev.params.score,
              level: this.toMaturityLevel(ev.params.score),
            })
          }
          break
        case "recommend":
          result.recommendations.push({
            ruleId: ev.ruleId,
            message: ev.params.message,
            priority: ev.priority,
          })
          break
        case "opportunity":
          result.opportunities.push({
            ruleId: ev.ruleId,
            message: ev.params.message,
            potentialValue: ev.params.potentialValue,
            recommendationId: ev.params.recommendationId,
          })
          break
      }
    }

    if (result.maturity.dimensions.length > 0) {
      const avg =
        result.maturity.dimensions.reduce((s, d) => s + d.score, 0) /
        result.maturity.dimensions.length
      result.maturity.score = Math.round(avg)
      result.maturity.level = this.toMaturityLevel(avg)
    }

    result.risks.sort((a, b) => b.priority - a.priority)
    result.recommendations.sort((a, b) => b.priority - a.priority)
    return result
  }

  private toMaturityLevel(score: number): (typeof MATURITY_LEVELS)[number] {
    if (score < 20) return "initial"
    if (score < 40) return "developing"
    if (score < 60) return "defined"
    if (score < 80) return "managed"
    return "optimized"
  }

  getLoadedRules(): DeclarativeRule[] {
    return this.engine?.getRules() ?? []
  }
}
