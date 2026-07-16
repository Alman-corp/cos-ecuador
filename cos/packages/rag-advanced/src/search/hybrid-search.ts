import { BM25Okapi } from "./bm25"
import type { AdvancedChunk, SearchCandidate } from "../types"

export class HybridSearch {
  private bm25: BM25Okapi
  private chunks: AdvancedChunk[] = []
  private vectors: number[][] = []

  constructor() {
    this.bm25 = new BM25Okapi()
  }

  index(chunks: AdvancedChunk[], vectors: number[][]): void {
    this.chunks = chunks
    this.vectors = vectors
    this.bm25.index(chunks.map((c) => c.text))
  }

  search(query: string, queryVector: number[], topK = 10, options?: {
    alpha?: number
    graphBoost?: number
    docTypes?: string[]
    languages?: string[]
  }): SearchCandidate[] {
    const alpha = options?.alpha ?? 0.5
    const graphBoost = options?.graphBoost ?? 0.1

    const bm25Results = this.bm25.search(query, this.chunks.length)
    const bm25Map = new Map(bm25Results.map((r) => [r.index, r.score]))
    const maxBM25 = Math.max(...bm25Results.map((r) => r.score), 1)

    const vectorScores = this.vectors.map((v) => cosineSimilarity(queryVector, v))
    const maxVector = Math.max(...vectorScores, 1)

    const candidates: SearchCandidate[] = []
    for (let i = 0; i < this.chunks.length; i++) {
      const bm25Score = (bm25Map.get(i) ?? 0) / maxBM25
      const vecScore = vectorScores[i] / maxVector
      const graphScore = this.chunks[i].entities.length > 0 ? graphBoost : 0

      const score = alpha * bm25Score + (1 - alpha) * vecScore + graphScore

      if (options?.docTypes || options?.languages) {
        const meta = this.chunks[i].metadata
        if (options.docTypes && meta.docType && !options.docTypes.includes(meta.docType as string)) continue
      }

      candidates.push({
        id: this.chunks[i].id,
        chunk: this.chunks[i],
        score,
        components: { bm25: bm25Score, vector: vecScore, graph: graphScore },
      })
    }

    return candidates.sort((a, b) => b.score - a.score).slice(0, topK)
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB)
  return denom === 0 ? 0 : dot / denom
}
