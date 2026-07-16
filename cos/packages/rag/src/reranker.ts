import { CohereClient } from "cohere-ai"
import type { SearchResult } from "./qdrant-client"

export interface Reranker {
  rerank(query: string, results: SearchResult[], topK: number): Promise<SearchResult[]>
}

export class CohereReranker implements Reranker {
  private client: CohereClient
  private readonly model: string

  constructor(opts?: { apiKey?: string; model?: string }) {
    this.client = new CohereClient({ token: opts?.apiKey ?? process.env.COHERE_API_KEY })
    this.model = opts?.model ?? "rerank-english-v3.0"
  }

  async rerank(query: string, results: SearchResult[], topK: number): Promise<SearchResult[]> {
    if (results.length === 0) return []
    const documents = results.map((r) => r.payload.text)
    const response = await this.client.v2.rerank({
      model: this.model,
      query,
      documents,
      topN: Math.min(topK, results.length),
      returnDocuments: false,
    })
    return response.results.map((r) => ({
      ...results[r.index],
      score: r.relevanceScore,
    }))
  }
}

export class SimpleReranker implements Reranker {
  async rerank(query: string, results: SearchResult[], topK: number): Promise<SearchResult[]> {
    const queryTerms = query.toLowerCase().split(/\s+/)
    const scored = results.map((r) => {
      const text = r.payload.text.toLowerCase()
      const termMatches = queryTerms.filter((t) => text.includes(t)).length
      const termScore = termMatches / queryTerms.length
      return { ...r, score: r.score * 0.6 + termScore * 0.4 }
    })
    return scored.sort((a, b) => b.score - a.score).slice(0, topK)
  }
}