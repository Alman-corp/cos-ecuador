import type { SearchResult } from "./qdrant-client"

export interface Citation {
  id: string
  text: string
  document_id: string
  chunk_id: string
  page?: number
  section?: string
  heading_path?: string[]
  filename: string
  relevance_score: number
}

export interface ISDResponse {
  answer: string
  citations: Citation[]
  confidence: number
  sources_used: number
  follow_up_questions?: string[]
}

export interface ISDOptions {
  maxCitations?: number
  requireCitations?: boolean
}

export const ISD_SYSTEM_PROMPT = `Eres un asistente experto en consultoría financiera con acceso a documentos del cliente.

REGLAS ESTRICTAS DE CITACIÓN:
1. DEBES citar CUALQUIER afirmación factual usando [cite:N] donde N es el número del fragmento.
2. Si la información NO está en los documentos proporcionados, di explícitamente: "La información proporcionada no contiene datos sobre [tema]."
3. NO inventes números, fechas, nombres ni hechos. Si no estás seguro, usa [uncertain] y cita la fuente más cercana.
4. Para cada cita, el número N debe corresponder al índice del fragmento en la lista proporcionada.
5. Puedes usar múltiples citas para una afirmación: [cite:1][cite:3]

FORMATO DE RESPUESTA:
- Responde en el idioma de la pregunta del usuario
- Usa markdown para formato (tablas, listas, negritas)
- Incluye citations inline, no al final
- Al final, sugiere 2-3 preguntas de seguimiento relevantes

FRAGMENTOS DISPONIBLES:
{context}

PREGUNTA DEL USUARIO: {query}`

export function buildISDContext(results: SearchResult[]): string {
  return results
    .map((r, idx) => {
      const meta = r.payload
      const header = [meta.filename, meta.page ? `p.${meta.page}` : null, meta.section ? `§${meta.section}` : null].filter(Boolean).join(" | ")
      return `[${idx + 1}] (${header})\n${meta.text}\n`
    })
    .join("\n---\n\n")
}

export function parseCitations(answer: string, results: SearchResult[]): { cleanAnswer: string; citations: Citation[] } {
  const citationRegex = /\[cite:(\d+)\]/g
  const seen = new Set<number>()
  const citations: Citation[] = []

  let match
  while ((match = citationRegex.exec(answer)) !== null) {
    const idx = parseInt(match[1], 10) - 1
    if (idx >= 0 && idx < results.length && !seen.has(idx)) {
      seen.add(idx)
      const r = results[idx]
      citations.push({
        id: String(idx + 1),
        text: r.payload.text,
        document_id: r.payload.document_id,
        chunk_id: r.payload.chunk_id,
        page: r.payload.page,
        section: r.payload.section,
        heading_path: r.payload.heading_path,
        filename: r.payload.filename,
        relevance_score: r.score,
      })
    }
  }

  const renumberMap = new Map<number, number>()
  Array.from(seen).sort((a, b) => a - b).forEach((oldIdx, newIdx) => renumberMap.set(oldIdx, newIdx))
  const cleanAnswer = answer.replace(/\[cite:(\d+)\]/g, (_, num) => {
    const oldIdx = parseInt(num, 10) - 1
    const newIdx = renumberMap.get(oldIdx)
    return newIdx !== undefined ? `[cite:${newIdx + 1}]` : ""
  })

  return { cleanAnswer, citations }
}

export function calculateConfidence(answer: string, citations: Citation[], opts: ISDOptions = {}): number {
  if (citations.length === 0 && opts.requireCitations) return 0
  const hasCitations = citations.length > 0
  const avgRelevance = citations.reduce((sum, c) => sum + c.relevance_score, 0) / Math.max(1, citations.length)
  const density = (answer.match(/\[cite:\d+\]/g) || []).length / Math.max(1, answer.length / 100)
  const hasUncertain = /\[uncertain\]/i.test(answer)

  let confidence = 0
  if (hasCitations) confidence += 0.4
  confidence += avgRelevance * 0.4
  confidence += Math.min(density * 5, 1) * 0.2
  if (hasUncertain) confidence -= 0.2
  return Math.max(0, Math.min(1, confidence))
}