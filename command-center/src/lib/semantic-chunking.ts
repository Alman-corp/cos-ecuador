export interface SemanticChunk {
  id: string
  text: string
  topic: string
  startChar: number
  endChar: number
  tokens: number
}

const TOPIC_MARKERS: { pattern: RegExp; topic: string }[] = [
  { pattern: /\b(revenue|income|sales|ingresos)\b/i, topic: "revenue" },
  { pattern: /\b(ebitda|margin|margen|profitability)\b/i, topic: "profitability" },
  { pattern: /\b(cash|flow|fcf|liquidez|liquidity)\b/i, topic: "cash_flow" },
  { pattern: /\b(debt|deuda|leverage|apalancamiento)\b/i, topic: "debt" },
  { pattern: /\b(risk|riesgo|volatility|volatilidad)\b/i, topic: "risk" },
  { pattern: /\b(growth|crecimiento|expansion)\b/i, topic: "growth" },
  { pattern: /\b(macro|gdp|pib|inflation|inflación|rate|tasa)\b/i, topic: "macro" },
  { pattern: /\b(compet|benchmark|share|cuota)\b/i, topic: "competitive" },
  { pattern: /\b(valuation|valuación|dcf|multiple|múltiplo)\b/i, topic: "valuation" },
]

function detectTopic(text: string): string {
  for (const marker of TOPIC_MARKERS) {
    if (marker.pattern.test(text)) return marker.topic
  }
  return "general"
}

export function semanticChunk(text: string, maxTokens: number = 200): SemanticChunk[] {
  const paragraphs = text.split(/\n{2,}/).filter(Boolean)
  const chunks: SemanticChunk[] = []
  let charOffset = 0

  for (const para of paragraphs) {
    const tokens = Math.ceil(para.length / 4)
    if (tokens <= maxTokens) {
      chunks.push({
        id: crypto.randomUUID(), text: para.trim(),
        topic: detectTopic(para),
        startChar: charOffset, endChar: charOffset + para.length, tokens,
      })
    } else {
      // Split long paragraphs by sentence boundaries
      const sentences = para.match(/[^.!?]+[.!?]+/g) || [para]
      let currentChunk = ""
      let currentTokens = 0
      let chunkStart = charOffset

      for (const sentence of sentences) {
        const sentTokens = Math.ceil(sentence.length / 4)
        if (currentTokens + sentTokens > maxTokens && currentChunk) {
          chunks.push({
            id: crypto.randomUUID(), text: currentChunk.trim(),
            topic: detectTopic(currentChunk),
            startChar: chunkStart, endChar: chunkStart + currentChunk.length, tokens: currentTokens,
          })
          chunkStart += currentChunk.length
          currentChunk = ""
          currentTokens = 0
        }
        currentChunk += sentence
        currentTokens += sentTokens
      }
      if (currentChunk.trim()) {
        chunks.push({
          id: crypto.randomUUID(), text: currentChunk.trim(),
          topic: detectTopic(currentChunk),
          startChar: chunkStart, endChar: chunkStart + currentChunk.length, tokens: currentTokens,
        })
      }
    }
    charOffset += para.length + 2
  }

  return chunks
}

export function mergeChunksByTopic(chunks: SemanticChunk[]): SemanticChunk[] {
  const merged: SemanticChunk[] = []
  let current: SemanticChunk | null = null

  for (const chunk of chunks) {
    if (current && current.topic === chunk.topic) {
      current.text += "\n" + chunk.text
      current.endChar = chunk.endChar
      current.tokens += chunk.tokens
    } else {
      if (current) merged.push(current)
      current = { ...chunk }
    }
  }
  if (current) merged.push(current)
  return merged
}
