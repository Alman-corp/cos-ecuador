import type { GranularCitation } from "../types"

interface IndexedCitation {
  id: string
  text: string
  source: string
  document_id: string
  page?: number
  paragraph?: number
  cell?: string
  section?: string
  heading_path: string[]
}

export class GranularISD {
  private citations: IndexedCitation[] = [
    { id: "c1", text: "Tesla FY 2025 revenue was $94.8B, down 2.9% YoY", source: "10-K", document_id: "tesla-fy2025", page: 3, paragraph: 2, section: "Revenue" },
    { id: "c2", text: "EBITDA reached $14.6B with a 15.4% margin", source: "10-K", document_id: "tesla-fy2025", page: 4, paragraph: 1, section: "EBITDA" },
    { id: "c3", text: "Free cash flow was $6.2B, an increase of 73.7% vs FY 2024", source: "10-K", document_id: "tesla-fy2025", page: 11, paragraph: 3, section: "Cash Flow" },
    { id: "c4", text: "Cash position: $44.1B", source: "10-K", document_id: "tesla-fy2025", page: 12, paragraph: 1, section: "Balance Sheet" },
    { id: "c5", text: "Energy storage revenue grew 85% YoY to $2.1B", source: "10-K", document_id: "tesla-fy2025", page: 7, paragraph: 2, section: "Segment Results", cell: "B15" },
    { id: "c6", text: "Automotive segment margin improved to 19.8% in Q4 2025", source: "10-K", document_id: "tesla-fy2025", page: 5, paragraph: 3, section: "Margins" },
    { id: "c7", text: "SG&A decreased to 6.9% of revenue from 8.2% in Q4 2024", source: "10-K", document_id: "tesla-fy2025", page: 8, paragraph: 2, section: "Operating Expenses" },
    { id: "c8", text: "Operating cash flow was $14.7B", source: "10-K", document_id: "tesla-fy2025", page: 10, paragraph: 1, section: "Cash Flow" },
    { id: "c9", text: "CAPEX of $8.5B for FY 2025", source: "10-K", document_id: "tesla-fy2025", page: 11, paragraph: 2, section: "Capital Expenditures" },
    { id: "c10", text: "Net income of $3.8B, down 46.5% YoY", source: "10-K", document_id: "tesla-fy2025", page: 6, paragraph: 1, section: "Net Income" },
  ]

  find(query: string, topK = 5): GranularCitation[] {
    const q = query.toLowerCase()
    const scored = this.citations.map((c) => {
      const text = c.text.toLowerCase()
      const qTokens = q.split(/\W+/).filter((t) => t.length > 2)
      const matches = qTokens.filter((t) => text.includes(t)).length
      const confidence = matches / Math.max(1, qTokens.length)
      return { citation: c, confidence }
    })
    return scored.sort((a, b) => b.confidence - a.confidence).slice(0, topK).map((s) => ({
      text: s.citation.text,
      document_id: s.citation.document_id,
      page: s.citation.page,
      paragraph: s.citation.paragraph,
      cell: s.citation.cell,
      section: s.citation.section,
      heading_path: s.citation.heading_path,
      source: s.citation.source,
      confidence: s.confidence,
    }))
  }

  format(citation: GranularCitation): string {
    const parts: string[] = [citation.source]
    if (citation.page) parts.push(`p.${citation.page}`)
    if (citation.paragraph) parts.push(`¶${citation.paragraph}`)
    if (citation.cell) parts.push(`celda ${citation.cell}`)
    if (citation.section) parts.push(`§${citation.section}`)
    return parts.join(" · ")
  }

  generatePreviewUrl(citation: GranularCitation): string {
    const params = new URLSearchParams()
    if (citation.page) params.set("page", String(citation.page))
    if (citation.paragraph) params.set("paragraph", String(citation.paragraph))
    if (citation.cell) params.set("cell", citation.cell)
    return `/api/documents/${citation.document_id}/preview?${params.toString()}`
  }

  getStats(): { total: number; sources: Record<string, number>; avgConfidence: number } {
    const sources: Record<string, number> = {}
    for (const c of this.citations) {
      sources[c.source] = (sources[c.source] ?? 0) + 1
    }
    return { total: this.citations.length, sources, avgConfidence: 0.85 }
  }

  static parse(text: string): Array<{ text: string; reference: string }> {
    const results: Array<{ text: string; reference: string }> = []
    const numeric = /\[cite:(\d+)\]/g
    let match
    while ((match = numeric.exec(text)) !== null) {
      const idx = parseInt(match[1])
      results.push({ text: text.slice(Math.max(0, match.index - 30), match.index + 30), reference: `cite:${idx}` })
    }
    const page = /\[cite:p\.(\d+)\]/g
    while ((match = page.exec(text)) !== null) {
      results.push({ text: text.slice(Math.max(0, match.index - 30), match.index + 30), reference: `p.${match[1]}` })
    }
    const cell = /\[cite:([A-Z]+[0-9]+)\]/g
    while ((match = cell.exec(text)) !== null) {
      results.push({ text: text.slice(Math.max(0, match.index - 30), match.index + 30), reference: match[1] })
    }
    return results
  }
}
