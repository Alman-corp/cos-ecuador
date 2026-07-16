import { v4 as uuid } from "uuid"

export interface Chunk {
  id: string
  document_id: string
  chunk_index: number
  text: string
  page?: number
  section?: string
  heading_path: string[]
  metadata: {
    char_count: number
    token_estimate: number
    has_table: boolean
    has_numbers: boolean
  }
}

export interface ChunkerOptions {
  strategy: "fixed" | "semantic" | "hierarchical"
  maxChunkSize?: number
  chunkOverlap?: number
  respectSentences?: boolean
}

const DEFAULTS: Required<Omit<ChunkerOptions, "strategy">> = {
  maxChunkSize: 1500,
  chunkOverlap: 200,
  respectSentences: true,
}

export function chunkDocument(text: string, documentId: string, options: ChunkerOptions): Chunk[] {
  const opts = { ...DEFAULTS, ...options }
  switch (opts.strategy) {
    case "hierarchical":
      return hierarchicalChunk(text, documentId, opts)
    case "semantic":
      return semanticChunk(text, documentId, opts)
    default:
      return fixedChunk(text, documentId, opts)
  }
}

function fixedChunk(text: string, documentId: string, opts: Required<Omit<ChunkerOptions, "strategy">>): Chunk[] {
  const chunks: Chunk[] = []
  const sentences = splitSentences(text)
  let currentChunk: string[] = []
  let currentLength = 0
  let chunkIndex = 0

  for (const sentence of sentences) {
    const sentenceLen = sentence.length
    if (currentLength + sentenceLen > opts.maxChunkSize && currentChunk.length > 0) {
      chunks.push(buildChunk(currentChunk, documentId, chunkIndex++))
      const overlap: string[] = []
      let overlapLen = 0
      for (let i = currentChunk.length - 1; i >= 0; i--) {
        if (overlapLen + currentChunk[i].length > opts.chunkOverlap) break
        overlap.unshift(currentChunk[i])
        overlapLen += currentChunk[i].length
      }
      currentChunk = overlap
      currentLength = overlapLen
    }
    currentChunk.push(sentence)
    currentLength += sentenceLen
  }
  if (currentChunk.length > 0) chunks.push(buildChunk(currentChunk, documentId, chunkIndex))
  return chunks
}

function hierarchicalChunk(text: string, documentId: string, opts: Required<Omit<ChunkerOptions, "strategy">>): Chunk[] {
  const sections = detectSections(text)
  const chunks: Chunk[] = []
  let chunkIndex = 0

  for (const section of sections) {
    if (section.content.length <= opts.maxChunkSize) {
      chunks.push({
        id: uuid(),
        document_id: documentId,
        chunk_index: chunkIndex++,
        text: section.content,
        section: section.title,
        heading_path: section.headingPath,
        page: section.page,
        metadata: buildMetadata(section.content),
      })
    } else {
      const subChunks = fixedChunk(section.content, documentId, opts)
      for (const sc of subChunks) {
        chunks.push({ ...sc, chunk_index: chunkIndex++, section: section.title, heading_path: section.headingPath, page: section.page })
      }
    }
  }
  return chunks
}

function semanticChunk(text: string, documentId: string, opts: Required<Omit<ChunkerOptions, "strategy">>): Chunk[] {
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0)
  const chunks: Chunk[] = []
  let currentParagraphs: string[] = []
  let currentLength = 0
  let chunkIndex = 0

  for (const paragraph of paragraphs) {
    if (currentLength + paragraph.length > opts.maxChunkSize && currentParagraphs.length > 0) {
      chunks.push(buildChunk(currentParagraphs, documentId, chunkIndex++))
      currentParagraphs = []
      currentLength = 0
    }
    currentParagraphs.push(paragraph)
    currentLength += paragraph.length
  }
  if (currentParagraphs.length > 0) chunks.push(buildChunk(currentParagraphs, documentId, chunkIndex))
  return chunks
}

function buildChunk(parts: string[], documentId: string, index: number): Chunk {
  const text = parts.join(" ").trim()
  return {
    id: uuid(),
    document_id: documentId,
    chunk_index: index,
    text,
    heading_path: [],
    metadata: buildMetadata(text),
  }
}

function buildMetadata(text: string) {
  return {
    char_count: text.length,
    token_estimate: Math.ceil(text.length / 4),
    has_table: /\|.*\|/.test(text) || /[\t]{2,}/.test(text),
    has_numbers: /\$[\d,]+|\d+%/.test(text),
  }
}

function splitSentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿¡])/).map((s) => s.trim()).filter((s) => s.length > 0)
}

interface Section {
  title: string
  content: string
  headingPath: string[]
  page?: number
}

function detectSections(text: string): Section[] {
  const headingRegex = /^(#+\s+.*$|\d+\.\s+[A-ZÁÉÍÓÚÑ].*$|[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]{5,50}$)/gm
  const matches = [...text.matchAll(headingRegex)]
  if (matches.length === 0) return [{ title: "Untitled", content: text, headingPath: [] }]

  const sections: Section[] = []
  let lastEnd = 0
  const headingPath: string[] = []

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const start = match.index ?? 0
    const title = match[0].replace(/^#+\s*|\d+\.\s*/, "").trim()
    if (start > lastEnd) {
      const content = text.slice(lastEnd, start).trim()
      if (content.length > 0) {
        sections.push({ title: headingPath[headingPath.length - 1] ?? "Preamble", content, headingPath: [...headingPath] })
      }
    }
    headingPath.push(title)
    lastEnd = start + match[0].length
  }
  if (lastEnd < text.length) {
    sections.push({ title: headingPath[headingPath.length - 1] ?? "Final", content: text.slice(lastEnd).trim(), headingPath: [...headingPath] })
  }
  return sections
}