// @llm-engineer — DO NOT MODIFY WITHOUT APPROVAL
import { routeTask, type ModelTier } from "./model-router"
import { selfCritique } from "./self-critique"
import { constitutionalCheck } from "./constitutional"
import { executeToolCalls, type ToolCall } from "./tools"
import { compactContext } from "./context-compaction"
import { hasValidKey, getOpenAIClient } from "./ai/openai-client"
import { getBasePrompt } from "./prompts"

export type AgentRole = "router" | "planner" | "analyst" | "researcher" | "writer" | "critic" | "reviser"

export interface AgentMessage {
  role: AgentRole | "user"
  content: string
  modelTier?: ModelTier
  tools?: ToolCall[]
  duration?: number
}

export interface OrchestrationPlan {
  task: string
  route: string
  specialistCalls: AgentMessage[]
  critique: AgentMessage | null
  revision: AgentMessage | null
  final: string
}

const DURATIONS: Record<AgentRole, [number, number]> = {
  router: [100, 300],
  planner: [200, 600],
  analyst: [400, 1200],
  researcher: [300, 1000],
  writer: [200, 800],
  critic: [150, 500],
  reviser: [250, 700],
}

function simulateDuration(role: AgentRole): number {
  const [min, max] = DURATIONS[role]
  return Math.floor(Math.random() * (max - min) + min)
}

function simulateResponse(role: AgentRole, task: string): string {
  const templates: Record<AgentRole, string> = {
    router: `Task classified as: financial_analysis. Routing to financial planning specialist. Confidence: 0.94`,
    planner: `Plan:
1. Extract key financial metrics from the query
2. Cross-reference with latest quarterly data
3. Calculate relevant ratios and trends
4. Generate insights with peer benchmarking
5. Format response with visual indicators`,
    analyst: `Analysis complete:
- Revenue trend: +12.3% YoY (above industry avg of 8.1%)
- EBITDA margin: 15.4% vs 14.2% prior quarter
- Key driver: Operating leverage from SG&A reduction (-210bps)
- Risk flag: Receivables turnover slowing (5.2x vs 5.8x prior)`,
    researcher: `Research findings:
1. Peer comparison: Margin in 65th percentile of sector
2. Market context: Industry tailwind from input cost moderation
3. Historical pattern: Similar expansion seen in FY2023 post-restructuring
4. Analyst consensus: 8 of 12 analysts rate as "Outperform"`,
    writer: `Based on the analysis, the company shows healthy margin expansion driven by operational efficiency. The 120bps YoY improvement in EBITDA margin to 15.4% reflects successful cost containment initiatives. However, the moderating receivables turnover warrants monitoring in subsequent quarters.`,
    critic: `Critique:
1. The analysis lacks sensitivity to FX impact (EURUSD moved -3% in period)
2. Receivables concern is valid but seasonal pattern not accounted for
3. Recommendation should include specific monitoring threshold
4. Consider adding working capital efficiency context`,
    reviser: `Revised analysis incorporating feedback:
The margin expansion to 15.4% (EBITDA) is robust, though partially aided by favorable FX translation (+40bps). The receivables turnover moderation to 5.2x is within Q3 seasonal pattern (avg 5.3x). Recommend monitoring if trend continues below 5.0x threshold. Overall, working capital efficiency remains strong at 94.2% of sector median.`,
  }
  return templates[role] || `Processing ${task} as ${role}...`
}

function simulateToolCalls(role: AgentRole): ToolCall[] {
  if (role === "analyst") return [
    { id: crypto.randomUUID(), name: "query_financials", params: { metric: "revenue", period: "Q4_2025" }, status: "done", result: "$94.8B" },
    { id: crypto.randomUUID(), name: "calculate_ratio", params: { ratio: "ebitda_margin" }, status: "done", result: "15.4%" },
  ]
  if (role === "researcher") return [
    { id: crypto.randomUUID(), name: "search_peers", params: { sector: "automotive" }, status: "done", result: "12 peers compared" },
    { id: crypto.randomUUID(), name: "market_context", params: { query: "automotive margins 2026" }, status: "done", result: "Industry avg 12.8%" },
  ]
  return []
}

export async function callAI(task: string, agentRole: AgentRole = "analyst"): Promise<string> {
  if (hasValidKey()) {
    try {
      const systemPrompt = getBasePrompt("dd-analyst")
      const client = getOpenAIClient()
      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: task },
        ],
        max_tokens: 1024,
        temperature: 0.7,
      })
      return response.choices[0]?.message?.content || simulateResponse(agentRole, task)
    } catch {
      return simulateResponse(agentRole, task)
    }
  }
  return simulateResponse(agentRole, task)
}

export async function orchestrate(task: string): Promise<OrchestrationPlan> {
  const route = routeTask(task)
  const plan: OrchestrationPlan = { task, route: `${route.taskType} → ${route.model} (${(route.confidence * 100).toFixed(0)}%)`, specialistCalls: [], critique: null, revision: null, final: "" }

  // 1. Router
  await sleep(simulateDuration("router"))
  const routerMsg: AgentMessage = { role: "router", content: simulateResponse("router", task), modelTier: "haiku" }
  plan.route = routerMsg.content

  // 2. Planner
  await sleep(simulateDuration("planner"))
  const plannerMsg: AgentMessage = { role: "planner", content: simulateResponse("planner", task), modelTier: "sonnet" }

  // 3. Specialists (parallel)
  const specialistRoles: AgentRole[] = ["analyst", "researcher"]
  for (const role of specialistRoles) {
    await sleep(simulateDuration(role))
    const content = role === "analyst" ? await callAI(task, role) : simulateResponse(role, task)
    const msg: AgentMessage = {
      role, content, modelTier: role === "analyst" ? "sonnet" : "haiku",
      tools: simulateToolCalls(role), duration: simulateDuration(role),
    }
    plan.specialistCalls.push(msg)
  }

  // 4. Writer synthesizes
  await sleep(simulateDuration("writer"))
  const draft = await callAI(task, "writer")

  // 5. Constitutional check
  const constitutionalResult = constitutionalCheck(draft)
  const safeDraft = constitutionalResult.approved ? draft : constitutionalResult.sanitized

  // 6. Self-critique
  await sleep(simulateDuration("critic"))
  const critique = selfCritique(safeDraft, task)
  plan.critique = { role: "critic", content: critique, modelTier: "sonnet" }

  // 7. Reviser
  await sleep(simulateDuration("reviser"))
  const revised = simulateResponse("reviser", task)
  plan.revision = { role: "reviser", content: revised, modelTier: "opus" }

  // 8. Context compaction
  plan.final = compactContext(revised, 500)

  return plan
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
