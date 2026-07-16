export async function contextRecall(retrievedContexts: string[], groundTruthContexts: string[]): Promise<number> {
  if (!groundTruthContexts.length || !retrievedContexts.length) return 0
  const simScores: number[] = []
  for (const gt of groundTruthContexts) {
    let bestScore = 0
    for (const rc of retrievedContexts) {
      const score = cosineSimilarity(tokenize(gt), tokenize(rc))
      if (score > bestScore) bestScore = score
    }
    simScores.push(bestScore)
  }
  return simScores.reduce((a, b) => a + b, 0) / simScores.length
}

function tokenize(text: string): Map<string, number> {
  const map = new Map<string, number>()
  const words = text.toLowerCase().split(/\W+/).filter((w) => w.length > 2)
  for (const w of words) map.set(w, (map.get(w) ?? 0) + 1)
  return map
}

function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0, magA = 0, magB = 0
  for (const [k, v] of a) {
    magA += v * v
    const bv = b.get(k) ?? 0
    dot += v * bv
  }
  for (const v of b.values()) magB += v * v
  const denom = Math.sqrt(magA) * Math.sqrt(magB)
  return denom === 0 ? 0 : dot / denom
}
