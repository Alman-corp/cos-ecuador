export interface CompactionResult {
  compacted: string
  stats: { originalTokens: number; compactedTokens: number; compressionRatio: number; summarizedSegments: number }
}

const TOKEN_ESTIMATE_RATIO = 4

function estimateTokens(text: string): number {
  return Math.ceil(text.length / TOKEN_ESTIMATE_RATIO)
}

function summarizeText(text: string, maxTokens: number): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
  const words = text.split(/\s+/)
  const totalTokens = estimateTokens(text)

  if (totalTokens <= maxTokens) return text

  if (sentences.length <= 2) {
    return words.slice(0, maxTokens * TOKEN_ESTIMATE_RATIO).join(" ") + "..."
  }

  const midpoint = Math.floor(sentences.length / 2)
  const firstPart = sentences.slice(0, Math.ceil(midpoint * 0.3)).join(" ")
  const lastPart = sentences.slice(Math.floor(midpoint * 1.7)).join(" ")
  const summary = `${firstPart} [...] ${lastPart}`

  if (estimateTokens(summary) > maxTokens) {
    return words.slice(0, maxTokens * TOKEN_ESTIMATE_RATIO).join(" ") + "..."
  }

  return summary
}

export function compactContext(conversation: string, maxTokens: number = 2000): string {
  const originalTokens = estimateTokens(conversation)

  if (originalTokens <= maxTokens) {
    return conversation
  }

  const segments = conversation.split(/\n{2,}/)
  let compacted = ""
  let remaining = maxTokens
  const summarizedSegments: number[] = []

  for (let i = 0; i < segments.length; i++) {
    const segTokens = estimateTokens(segments[i])
    if (segTokens <= remaining * 0.3) {
      compacted += segments[i] + "\n\n"
      remaining -= segTokens
    } else {
      const summary = summarizeText(segments[i], Math.min(segTokens, Math.floor(remaining * 0.8)))
      compacted += summary + "\n\n"
      remaining -= estimateTokens(summary)
      summarizedSegments.push(i)
      if (remaining < 50) break
    }
  }

  return compacted.trim()
}

export function summarizeMessages(messages: { role: string; content: string }[], keepLast: number = 10): string[] {
  if (messages.length <= keepLast) return messages.map((m) => `${m.role}: ${m.content}`)

  const old = messages.slice(0, messages.length - keepLast)
  const recent = messages.slice(messages.length - keepLast)

  const oldText = old.map((m) => `${m.role}: ${m.content}`).join("\n")
  const summary = summarizeText(oldText, 500)

  return [summary, ...recent.map((m) => `${m.role}: ${m.content}`)]
}
