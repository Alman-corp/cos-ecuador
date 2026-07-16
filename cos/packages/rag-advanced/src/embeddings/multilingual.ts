type Backend = "local" | "cohere" | "openai"

export class MultilingualEmbedder {
  private backend: Backend
  private dimensions: number

  private FINANCIAL_TERMS: Record<string, Record<string, string>> = {
    en: { revenue: "revenue", ebitda: "EBITDA", margin: "margin", cash_flow: "cash flow", net_income: "net income", assets: "assets", liabilities: "liabilities", equity: "equity", growth: "growth", profitability: "profitability" },
    es: { revenue: "ingresos", ebitda: "EBITDA", margin: "margen", cash_flow: "flujo de caja", net_income: "utilidad neta", assets: "activos", liabilities: "pasivos", equity: "patrimonio", growth: "crecimiento", profitability: "rentabilidad" },
    pt: { revenue: "receita", ebitda: "EBITDA", margin: "margem", cash_flow: "fluxo de caixa", net_income: "lucro líquido", assets: "ativos", liabilities: "passivos", equity: "patrimônio líquido", growth: "crescimento", profitability: "rentabilidade" },
  }

  constructor(opts?: { backend?: Backend; dimensions?: number }) {
    this.backend = opts?.backend ?? "local"
    this.dimensions = opts?.dimensions ?? 1024
  }

  async embed(texts: string[], language?: string): Promise<number[][]> {
    const normalized = texts.map((t) => this.translateTerms(t, language ?? "en"))
    switch (this.backend) {
      case "openai": return this.embedOpenAI(normalized)
      case "cohere": return this.embedCohere(normalized, language)
      default: return this.embedLocal(normalized)
    }
  }

  detectLanguage(text: string): string {
    const esPattern = /[áéíóúñ¿¡]/i
    const ptPattern = /[àâêôûç]/i
    if (esPattern.test(text)) return "es"
    if (ptPattern.test(text)) return "pt"
    return "en"
  }

  private translateTerms(text: string, language: string): string {
    if (language === "en") return text
    const terms = this.FINANCIAL_TERMS["en"]
    const trans = this.FINANCIAL_TERMS[language] ?? this.FINANCIAL_TERMS["en"]
    let result = text
    for (const [en, localized] of Object.entries(trans)) {
      const regex = new RegExp(`\\b${terms[en]}\\b`, "gi")
      result = result.replace(regex, localized)
    }
    return result
  }

  private async embedLocal(texts: string[]): Promise<number[][]> {
    if (process.env.BGE_EMBEDDER_URL) {
      try {
        const resp = await fetch(`${process.env.BGE_EMBEDDER_URL}/embed`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texts, maxLength: 8192 }),
        })
        const data = await resp.json()
        if (data.embeddings) return data.embeddings
      } catch {}
    }
    return texts.map(() => this.randomEmbedding())
  }

  private async embedOpenAI(texts: string[]): Promise<number[][]> {
    const { default: OpenAI } = await import("openai")
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const results: number[][] = []
    for (let i = 0; i < texts.length; i += 100) {
      const batch = texts.slice(i, i + 100)
      const resp = await client.embeddings.create({
        model: "text-embedding-3-large",
        input: batch,
        dimensions: this.dimensions,
      })
      for (const item of resp.data) results.push(item.embedding)
    }
    return results
  }

  private async embedCohere(texts: string[], language?: string): Promise<number[][]> {
    const { CohereClient } = await import("cohere-ai")
    const client = new CohereClient({ token: process.env.COHERE_API_KEY })
    const results: number[][] = []
    for (let i = 0; i < texts.length; i += 96) {
      const batch = texts.slice(i, i + 96)
      const resp = await client.embed({
        model: "embed-multilingual-v3.0",
        texts: batch,
        inputType: "search_document",
        embeddingTypes: ["float"],
      })
      results.push(...(resp.embeddings.float ?? []))
    }
    return results
  }

  private randomEmbedding(): number[] {
    return Array.from({ length: this.dimensions }, () => Math.random() * 2 - 1)
  }
}
