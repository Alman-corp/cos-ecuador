import OpenAI from "openai"

interface RAGDecision {
  action: "skip" | "retrieve" | "decompose"
  confidence: number
  reason: string
  depth: "quick" | "deep" | "exhaustive"
  domain: string
}

export class SelfRAG {
  private llm: OpenAI

  constructor(opts?: { openAiKey?: string }) {
    this.llm = new OpenAI({ apiKey: opts?.openAiKey ?? process.env.OPENAI_API_KEY })
  }

  async decide(query: string, conversationHistory: string[] = []): Promise<RAGDecision> {
    const needsSearch = this.heuristicCheck(query)
    if (!needsSearch) {
      return {
        action: "skip",
        confidence: 0.8,
        reason: "Query appears to be a greeting or conversational — no retrieval needed",
        depth: "quick",
        domain: "general",
      }
    }

    const hasComparisonKeywords = /\b(compare|vs|versus|diferencia|vs\.)\b/i.test(query)
    if (hasComparisonKeywords) {
      return {
        action: "decompose",
        confidence: 0.7,
        reason: "Query requires comparison — will decompose into sub-queries",
        depth: "deep",
        domain: this.detectDomain(query),
      }
    }

    const domain = this.detectDomain(query)
    const depth = this.detectDepth(query)
    return {
      action: "retrieve",
      confidence: 0.9,
      reason: `Financial query detected in domain: ${domain}`,
      depth,
      domain,
    }
  }

  async evaluateSufficiency(query: string, contexts: string[]): Promise<{
    sufficient: boolean
    gaps: string[]
    reformulation?: string
  }> {
    if (contexts.length === 0) {
      return { sufficient: false, gaps: ["No relevant context found"], reformulation: query }
    }
    try {
      const resp = await this.llm.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: 'Evaluate if the provided contexts are sufficient to answer the query. Respond in JSON: {"sufficient": true/false, "gaps": ["gap1"], "reformulation": "optional reformulated query"}' },
          { role: "user", content: `Query: ${query}\n\nContexts:\n${contexts.join("\n---\n")}` },
        ],
      })
      return JSON.parse(resp.choices[0]?.message?.content ?? '{"sufficient":true,"gaps":[]}')
    } catch {
      return { sufficient: true, gaps: [] }
    }
  }

  private heuristicCheck(query: string): boolean {
    const greetings = ["hola", "hello", "hi", "buenas", "gracias", "thanks", "hey", "ok", "okay"]
    const q = query.toLowerCase().trim()
    if (greetings.includes(q)) return false
    if (q.length < 5) return false
    return true
  }

  private detectDomain(query: string): string {
    const domains: Array<{ keywords: string[]; domain: string }> = [
      { keywords: ["ebitda", "margen", "gross", "profit", "revenue", "income", "net", "operating"], domain: "financial" },
      { keywords: ["factory", "gigafactory", "production", "deliver", "vehicle", "manufacturing"], domain: "operations" },
      { keywords: ["strategy", "growth", "market", "compet", "fsd", "autopilot", "robot"], domain: "strategic" },
      { keywords: ["esg", "regulatory", "compliance", "carbon", "emission", "environmental"], domain: "compliance" },
      { keywords: ["energy", "storage", "solar", "battery", "megapack", "powerwall"], domain: "energy" },
    ]
    const q = query.toLowerCase()
    for (const d of domains) if (d.keywords.some((k) => q.includes(k))) return d.domain
    return "general"
  }

  private detectDepth(query: string): "quick" | "deep" | "exhaustive" {
    const complexMarkers = ["why", "how", "explain", "compare", "analyze", "por qué", "cómo", "explica"]
    const q = query.toLowerCase()
    const matchCount = complexMarkers.filter((m) => q.includes(m)).length
    if (matchCount >= 2) return "exhaustive"
    if (matchCount >= 1) return "deep"
    return "quick"
  }
}
