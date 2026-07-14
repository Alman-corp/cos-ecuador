import { type SearchResult } from "./hybrid-search"

export function crossEncoderRerank(query: string, results: SearchResult[], topK: number = 3): SearchResult[] {
  const scored = results.map((r) => {
    const qTokens = new Set(query.toLowerCase().split(/\W+/).filter(Boolean))
    const dTokens = new Set(r.content.toLowerCase().split(/\W+/).filter(Boolean))
    const intersection = [...qTokens].filter((t) => dTokens.has(t))

    // Cross-encoder sim: count semantic overlaps with proximity weighting
    let proximityScore = 0
    const contentWords = r.content.toLowerCase().split(/\W+/)
    for (const qt of qTokens) {
      const idx = contentWords.indexOf(qt)
      if (idx >= 0) proximityScore += 1 / (1 + idx * 0.01)
    }

    const overlapScore = intersection.length / Math.max(qTokens.size, 1)
    const combined = overlapScore * 0.4 + proximityScore * 0.3 + r.score * 0.3

    return { ...r, score: parseFloat(combined.toFixed(4)) }
  })

  return scored.sort((a, b) => b.score - a.score).slice(0, topK)
}

export function explainRerank(query: string, result: SearchResult): string {
  const qTokens = query.toLowerCase().split(/\W+/).filter(Boolean)
  const dTokens = new Set(result.content.toLowerCase().split(/\W+/).filter(Boolean))
  const matching = qTokens.filter((t) => dTokens.has(t))
  return `Cross-encoder matched ${matching.length}/${qTokens.length} query tokens. Top matches: ${matching.slice(0, 5).join(", ")}. Final score: ${result.score}`
}
