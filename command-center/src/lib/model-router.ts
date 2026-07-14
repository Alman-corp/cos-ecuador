export type ModelTier = "haiku" | "sonnet" | "opus"

interface ModelConfig {
  tier: ModelTier
  costPer1kTokens: number
  latencyMs: number
  description: string
}

export const MODEL_CONFIGS: Record<ModelTier, ModelConfig> = {
  haiku: { tier: "haiku", costPer1kTokens: 0.00025, latencyMs: 400, description: "Fast classification, extraction, simple Q&A" },
  sonnet: { tier: "sonnet", costPer1kTokens: 0.003, latencyMs: 1200, description: "Reasoning, analysis, code generation" },
  opus: { tier: "opus", costPer1kTokens: 0.015, latencyMs: 2500, description: "Complex strategy, negotiation, high-stakes decisions" },
}

interface RouteResult {
  taskType: string
  model: ModelTier
  confidence: number
}

const TASK_ROUTES: { pattern: RegExp; taskType: string; model: ModelTier }[] = [
  { pattern: /classif|categor|routing|extract|summarize|tag/i, taskType: "classification", model: "haiku" },
  { pattern: /search|lookup|find|retrieve|recommend/i, taskType: "retrieval", model: "haiku" },
  { pattern: /calculat|ratio|metric|kpi|numer|analyze/i, taskType: "analysis", model: "sonnet" },
  { pattern: /compar|benchmark|trend|variance|driver/i, taskType: "reasoning", model: "sonnet" },
  { pattern: /explain|describe|write|draft|format|report/i, taskType: "generation", model: "sonnet" },
  { pattern: /strateg|plan|optimiz|forecast|scenario|merger|acquis/i, taskType: "strategy", model: "opus" },
  { pattern: /negoti|persuad|argue|debate|recommend|invest/i, taskType: "high_stakes", model: "opus" },
]

export function routeTask(task: string): RouteResult {
  for (const route of TASK_ROUTES) {
    if (route.pattern.test(task)) {
      return { taskType: route.taskType, model: route.model, confidence: 0.85 + Math.random() * 0.14 }
    }
  }
  return { taskType: "general", model: "sonnet", confidence: 0.7 }
}

export function estimateCost(tier: ModelTier, tokens: number = 500): { cost: number; latency: number } {
  const config = MODEL_CONFIGS[tier]
  return {
    cost: (tokens / 1000) * config.costPer1kTokens,
    latency: config.latencyMs,
  }
}

export function compareModels(tier1: ModelTier, tier2: ModelTier): { costDelta: number; latencyDelta: number } {
  const c1 = MODEL_CONFIGS[tier1]
  const c2 = MODEL_CONFIGS[tier2]
  return {
    costDelta: parseFloat((c1.costPer1kTokens - c2.costPer1kTokens).toFixed(6)),
    latencyDelta: c1.latencyMs - c2.latencyMs,
  }
}
