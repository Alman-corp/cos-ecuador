import { describe, it, expect } from "vitest"
import { parseCitations, buildISDContext, calculateConfidence } from "../../../packages/rag/src/isd"

describe("ISD", () => {
  const mockResults = [
    { id: "c1", score: 0.9, payload: { document_id: "doc-1", chunk_id: "c1", text: "Revenue fue de $10M en 2025.", page: 1, section: "Financials", filename: "report.pdf", heading_path: [], doc_type: "report", company_id: "c1", client_id: "c1", chunk_index: 0, uploaded_at: "" } },
    { id: "c2", score: 0.85, payload: { document_id: "doc-1", chunk_id: "c2", text: "El margen neto fue 15%.", page: 2, section: "Margins", filename: "report.pdf", heading_path: [], doc_type: "report", company_id: "c1", client_id: "c1", chunk_index: 1, uploaded_at: "" } },
  ] as any

  it("parsea citations correctamente", () => {
    const answer = "Los ingresos fueron de $10M [cite:1] con margen del 15% [cite:2]."
    const { cleanAnswer, citations } = parseCitations(answer, mockResults)
    expect(citations).toHaveLength(2)
    expect(citations[0].text).toContain("$10M")
    expect(cleanAnswer).toContain("[cite:1]")
  })

  it("ignora citations invalidas", () => {
    const answer = "Dato [cite:1] y otro [cite:99] invalido."
    const { citations } = parseCitations(answer, mockResults)
    expect(citations).toHaveLength(1)
  })

  it("calcula confianza alta con buenas citas", () => {
    const answer = "Datos [cite:1] y [cite:2] son solidos."
    const { citations } = parseCitations(answer, mockResults)
    const confidence = calculateConfidence(answer, citations, { requireCitations: true })
    expect(confidence).toBeGreaterThan(0.6)
  })

  it("calcula confianza cero sin citas requeridas", () => {
    const confidence = calculateConfidence("Sin citas.", [], { requireCitations: true })
    expect(confidence).toBe(0)
  })
})
