import type { SearchCandidate, RerankedResult } from "../types"

export class CrossEncoderReranker {
  private cohereApiKey?: string

  constructor(opts?: { cohereApiKey?: string }) {
    this.cohereApiKey = opts?.cohereApiKey ?? process.env.COHERE_API_KEY
  }

  async rerank(query: string, candidates: SearchCandidate[], topK = 5): Promise<RerankedResult[]> {
    if (candidates.length === 0) return []

    let rerankScores: number[]

    if (this.cohereApiKey) {
      rerankScores = await this.cohereRerank(query, candidates)
    } else if (process.env.BGE_RERANKER_URL) {
      rerankScores = await this.bgeRerank(query, candidates)
    } else {
      rerankScores = this.fallbackRerank(query, candidates)
    }

    return candidates.map((c, i) => ({
      ...c,
      rerank_score: rerankScores[i],
      combined_score: 0.6 * rerankScores[i] + 0.4 * c.score,
    })).sort((a, b) => b.combined_score - a.combined_score).slice(0, topK)
  }

  private async cohereRerank(query: string, candidates: SearchCandidate[]): Promise<number[]> {
    try {
      const { CohereClient } = await import("cohere-ai")
      const client = new CohereClient({ token: this.cohereApiKey })
      const response = await client.v2.rerank({
        model: "rerank-v3.5",
        query,
        documents: candidates.map((c) => c.chunk.text),
        topN: candidates.length,
        returnDocuments: false,
      })
      const scores = new Array(candidates.length).fill(0)
      for (const r of response.results) scores[r.index] = r.relevanceScore
      return scores
    } catch {
      return this.fallbackRerank(query, candidates)
    }
  }

  private async bgeRerank(query: string, candidates: SearchCandidate[]): Promise<number[]> {
    try {
      const resp = await fetch(`${process.env.BGE_RERANKER_URL}/rerank`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, texts: candidates.map((c) => c.chunk.text) }),
      })
      const data = await resp.json()
      return data.scores ?? this.fallbackRerank(query, candidates)
    } catch {
      return this.fallbackRerank(query, candidates)
    }
  }

  private fallbackRerank(query: string, candidates: SearchCandidate[]): number[] {
    const qTokens = query.toLowerCase().split(/\W+/).filter((t) => t.length > 2)
    return candidates.map((c) => {
      const text = c.chunk.text.toLowerCase()
      const tokenOverlap = qTokens.filter((t) => text.includes(t)).length / Math.max(1, qTokens.length)
      const entityBoost = c.chunk.entities.length > 0 ? 0.05 : 0
      const proximity = this.proximityScore(query, c.chunk.text)
      return 0.5 * tokenOverlap + 0.3 * proximity + 0.2 * entityBoost
    })
  }

  explain(query: string, candidate: SearchCandidate): string {
    const qTokens = query.toLowerCase().split(/\W+/).filter((t) => t.length > 2)
    const text = candidate.chunk.text.toLowerCase()
    const matched = qTokens.filter((t) => text.includes(t))
    return `tokens: ${matched.join(",")} | overlap: ${matched.length}/${qTokens.length} | entities: ${candidate.chunk.entities.length}`
  }

  private proximityScore(query: string, text: string): number {
    const qWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
    const tWords = text.toLowerCase().split(/\s+/)
    let score = 0
    for (let i = 0; i < qWords.length - 1; i++) {
      const pair = `${qWords[i]} ${qWords[i + 1]}`
      const idx = tWords.findIndex((w) => w === qWords[i])
      if (idx >= 0 && idx + 1 < tWords.length && tWords[idx + 1] === qWords[i + 1]) score += 0.3
    }
    return score
  }
}
