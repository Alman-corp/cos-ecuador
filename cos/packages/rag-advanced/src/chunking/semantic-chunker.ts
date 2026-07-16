import type { AdvancedChunk } from "../types"

export class SemanticChunker {
  private targetChunkSize: number
  private maxChunkSize: number
  private similarityThreshold: number

  constructor(opts?: { targetChunkSize?: number; maxChunkSize?: number; similarityThreshold?: number }) {
    this.targetChunkSize = opts?.targetChunkSize ?? 500
    this.maxChunkSize = opts?.maxChunkSize ?? 1000
    this.similarityThreshold = opts?.similarityThreshold ?? 0.7
  }

  chunk(text: string, documentId: string): AdvancedChunk[] {
    const sentences = this.splitSentences(text)
    if (sentences.length === 0) return []

    const sentenceEmbeddings = sentences.map((s) => this.simpleEmbed(s))
    const boundaries: number[] = [0]

    for (let i = 1; i < sentences.length; i++) {
      const sim = this.cosineSim(sentenceEmbeddings[i - 1], sentenceEmbeddings[i])
      if (sim < this.similarityThreshold) boundaries.push(i)
    }
    boundaries.push(sentences.length)

    const chunks: AdvancedChunk[] = []
    let chunkIndex = 0
    for (let b = 0; b < boundaries.length - 1; b++) {
      let start = boundaries[b]
      let end = boundaries[b + 1]
      let textSlice = sentences.slice(start, end).join(" ")

      if (textSlice.length > this.maxChunkSize) {
        const subSlices = this.splitBySize(textSlice, this.targetChunkSize)
        for (const sub of subSlices) {
          chunks.push(this.buildChunk(sub, documentId, chunkIndex++))
        }
      } else {
        chunks.push(this.buildChunk(textSlice, documentId, chunkIndex++))
      }
    }

    return chunks
  }

  mergeByTopic(chunks: AdvancedChunk[]): AdvancedChunk[] {
    if (chunks.length === 0) return []
    const merged: AdvancedChunk[] = []
    let current = { ...chunks[0] }
    for (let i = 1; i < chunks.length; i++) {
      const prevEmb = this.simpleEmbed(current.text)
      const currEmb = this.simpleEmbed(chunks[i].text)
      const sim = this.cosineSim(prevEmb, currEmb)
      if (sim > this.similarityThreshold && current.text.length + chunks[i].text.length < this.maxChunkSize * 1.5) {
        current.text += " " + chunks[i].text
        current.tokens = this.estimateTokens(current.text)
        current.entities = [...new Set([...current.entities, ...chunks[i].entities])]
      } else {
        merged.push(current)
        current = { ...chunks[i] }
      }
    }
    merged.push(current)
    return merged
  }

  private buildChunk(text: string, documentId: string, index: number): AdvancedChunk {
    return {
      id: `${documentId}-${index}`,
      document_id: documentId,
      chunk_index: index,
      text: text.trim(),
      level: "paragraph",
      tokens: this.estimateTokens(text),
      heading_path: [],
      entities: [],
      metadata: {},
    }
  }

  private splitSentences(text: string): string[] {
    return text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 0)
  }

  private splitBySize(text: string, targetSize: number): string[] {
    const parts: string[] = []
    const words = text.split(/\s+/)
    let current: string[] = []
    let currentLen = 0
    for (const w of words) {
      if (currentLen + w.length > targetSize && current.length > 0) {
        parts.push(current.join(" "))
        current = [w]
        currentLen = w.length
      } else {
        current.push(w)
        currentLen += w.length + 1
      }
    }
    if (current.length > 0) parts.push(current.join(" "))
    return parts
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4)
  }

  private simpleEmbed(text: string): number[] {
    const words = text.toLowerCase().split(/\W+/).filter((w) => w.length > 2)
    const freq = new Map<string, number>()
    for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1)
    const dims = 32
    const vec = new Array(dims).fill(0)
    for (const [w, f] of freq) {
      let hash = 0
      for (let i = 0; i < w.length; i++) hash = ((hash << 5) - hash + w.charCodeAt(i)) | 0
      const idx = Math.abs(hash) % dims
      vec[idx] += f
    }
    const mag = Math.sqrt(vec.reduce((a, b) => a + b * b, 0))
    return mag > 0 ? vec.map((v) => v / mag) : vec
  }

  private cosineSim(a: number[], b: number[]): number {
    let dot = 0, magA = 0, magB = 0
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i]; magA += a[i] * a[i]; magB += b[i] * b[i]
    }
    const denom = Math.sqrt(magA) * Math.sqrt(magB)
    return denom === 0 ? 0 : dot / denom
  }
}
