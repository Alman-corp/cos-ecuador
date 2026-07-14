import { getQueryStrategy } from "./query-understanding"

export interface RagDecision {
  needsSearch: boolean
  confidence: number
  reason: string
  depth: "quick" | "deep" | "exhaustive"
}

const KNOWLEDGE_BOUNDARY: { patterns: RegExp[]; topic: string }[] = [
  { patterns: [/ebitda/i, /margin/i, /profitab/i], topic: "profitability" },
  { patterns: [/dcf/i, /valuation/i, /wacc/i, /enterprise value/i], topic: "valuation" },
  { patterns: [/revenue/i, /ingresos/i, /growth/i], topic: "revenue" },
  { patterns: [/debt/i, /deuda/i, /leverage/i], topic: "capital_structure" },
  { patterns: [/market/i, /share/i, /compet/i], topic: "market_position" },
  { patterns: [/risk/i, /riesgo/i, /scenario/i], topic: "risk_analysis" },
]

export function shouldRetrieve(query: string, conversationHistory: string[] = []): RagDecision {
  const strategy = getQueryStrategy(query)
  if (!strategy.shouldSearch) {
    return { needsSearch: false, confidence: 0.9, reason: "Query appears to be general knowledge or greeting", depth: "quick" }
  }

  // Check if already answered in conversation
  const alreadyCovered = conversationHistory.some((h) => {
    const qTokens = query.toLowerCase().split(/\W+/).filter(Boolean)
    return qTokens.filter((t) => h.toLowerCase().includes(t)).length > qTokens.length * 0.7
  })

  if (alreadyCovered) {
    return { needsSearch: true, confidence: 0.6, reason: "Similar topic seen before, shallow retrieval", depth: "quick" }
  }

  // Determine which knowledge domain
  for (const domain of KNOWLEDGE_BOUNDARY) {
    if (domain.patterns.some((p) => p.test(query))) {
      return { needsSearch: true, confidence: 0.95, reason: `Query requires ${domain.topic} knowledge`, depth: strategy.depth }
    }
  }

  return { needsSearch: true, confidence: 0.8, reason: "General financial query, retrieving relevant context", depth: strategy.depth }
}
