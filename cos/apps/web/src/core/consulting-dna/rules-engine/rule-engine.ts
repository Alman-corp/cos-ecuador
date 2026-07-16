import type { DeclarativeRule, ClientFacts } from "./types"
import { evaluateExpression } from "./expression-evaluator"

export interface RuleEngineEvent {
  type: string
  ruleId: string
  priority: number
  params: {
    severity?: string
    message: string
    recommendationId?: string
    score?: number
    dimension?: string
    potentialValue?: number
  }
}

export class RuleEngine {
  private rules: DeclarativeRule[] = []

  constructor(rules: DeclarativeRule[]) {
    this.load(rules)
  }

  load(rules: DeclarativeRule[]): void {
    const now = Date.now()
    this.rules = rules.filter((r) => {
      if (!r.enabled) return false
      if (r.validFrom && new Date(r.validFrom).getTime() > now) return false
      if (r.validTo && new Date(r.validTo).getTime() < now) return false
      return true
    })
  }

  reload(rules: DeclarativeRule[]): void {
    this.load(rules)
  }

  getRules(): DeclarativeRule[] {
    return [...this.rules]
  }

  async evaluate(facts: ClientFacts): Promise<RuleEngineEvent[]> {
    const events: RuleEngineEvent[] = []

    for (const rule of this.rules) {
      try {
        const matched = evaluateExpression(rule.condition, facts as unknown as Record<string, unknown>)
        if (matched) {
          events.push({
            type: rule.then.action,
            ruleId: rule.id,
            priority: rule.priority,
            params: {
              severity: rule.then.severity,
              message: rule.then.message,
              recommendationId: rule.then.recommendationId,
              score: rule.then.score,
              dimension: rule.then.dimension,
              potentialValue: rule.then.potentialValue,
            },
          })
        }
      } catch (e) {
        console.warn(`Rule evaluation error [${rule.id}]:`, e)
      }
    }

    events.sort((a, b) => b.priority - a.priority)
    return events
  }
}
