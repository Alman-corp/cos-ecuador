import type { QueryInterpretation } from "../types"
import OpenAI from "openai"

export class QueryUnderstanding {
  private llm: OpenAI

  constructor(opts?: { openAiKey?: string }) {
    this.llm = new OpenAI({ apiKey: opts?.openAiKey ?? process.env.OPENAI_API_KEY })
  }

  async understand(query: string): Promise<QueryInterpretation> {
    const [hyde, multiQueries, stepBack, intentLang] = await Promise.all([
      this.generateHyde(query),
      this.generateMultiQueries(query),
      this.generateStepBack(query),
      this.classifyIntentAndLanguage(query),
    ])

    return {
      original: query,
      hyde,
      multi_queries: multiQueries,
      step_back: stepBack,
      intent: intentLang.intent,
      language: intentLang.language,
    }
  }

  private async generateHyde(query: string): Promise<string> {
    try {
      const resp = await this.llm.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          { role: "system", content: "Write a hypothetical document paragraph that would perfectly answer the given question. Include specific numbers and facts." },
          { role: "user", content: query },
        ],
      })
      return resp.choices[0]?.message?.content ?? ""
    } catch { return "" }
  }

  private async generateMultiQueries(query: string): Promise<string[]> {
    try {
      const resp = await this.llm.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "Generate 4 different rephrasings of the given question. Each should capture different aspects. Respond in JSON: {\"queries\": [\"q1\", \"q2\", \"q3\", \"q4\"]}" },
          { role: "user", content: query },
        ],
      })
      const parsed = JSON.parse(resp.choices[0]?.message?.content ?? "{}")
      return parsed.queries ?? [query]
    } catch { return [query] }
  }

  private async generateStepBack(query: string): Promise<string> {
    try {
      const resp = await this.llm.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          { role: "system", content: "Generate a broader, more fundamental step-back question that would help answer the original question. Focus on underlying principles or context." },
          { role: "user", content: query },
        ],
      })
      return resp.choices[0]?.message?.content ?? ""
    } catch { return "" }
  }

  private async classifyIntentAndLanguage(query: string): Promise<{ intent: QueryInterpretation["intent"]; language: string }> {
    const lang = /[áéíóúñ¿¡]/i.test(query) ? "es" : /[àâêôûç]/i.test(query) ? "pt" : "en"
    const hasCompare = /\b(compare|vs|versus|versus|against|diferencia|comparación|vs\.)\b/i.test(query)
    const hasWhy = /\b(why|por qué|porque|reason|causa|explain)\b/i.test(query)
    const hasWhat = /\b(what is|what are|qué es|cuál es|describe|describe|list)\b/i.test(query)

    let intent: QueryInterpretation["intent"] = "factual"
    if (hasCompare) intent = "comparative"
    else if (hasWhy) intent = "analytical"
    else if (hasWhat) intent = "exploratory"

    return { intent, language: lang }
  }
}
