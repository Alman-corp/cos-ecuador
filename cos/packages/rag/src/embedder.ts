import OpenAI from "openai"

export interface Embedder {
  embed(texts: string[]): Promise<number[][]>
  embedOne(text: string): Promise<number[]>
  readonly model: string
  readonly dimensions: number
}

export class OpenAIEmbedder implements Embedder {
  private client: OpenAI
  readonly model: string
  readonly dimensions: number

  constructor(opts?: { apiKey?: string; model?: string; dimensions?: number }) {
    this.client = new OpenAI({ apiKey: opts?.apiKey ?? process.env.OPENAI_API_KEY })
    this.model = opts?.model ?? "text-embedding-3-large"
    this.dimensions = opts?.dimensions ?? 3072
  }

  async embed(texts: string[]): Promise<number[][]> {
    const results: number[][] = []
    const BATCH = 100
    for (let i = 0; i < texts.length; i += BATCH) {
      const batch = texts.slice(i, i + BATCH).map(normalizeText)
      const response = await this.client.embeddings.create({
        model: this.model,
        input: batch,
        dimensions: this.dimensions,
      })
      for (const item of response.data) results.push(item.embedding)
    }
    return results
  }

  async embedOne(text: string): Promise<number[]> {
    const [emb] = await this.embed([text])
    return emb
  }
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").replace(/[^\w\s.,;:!?()\-]/g, "").trim().slice(0, 8000)
}