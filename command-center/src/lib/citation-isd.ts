// @llm-engineer — DO NOT MODIFY WITHOUT APPROVAL
export interface IsdCitation {
  file: string
  page: number
  paragraph: number
  cell?: string
  section?: string
  exactText: string
  confidence: number
  source: "filing" | "report" | "transcript" | "news"
  score?: number
}

const CITATION_DB: IsdCitation[] = [
  { file: "10-K_FY2025.pdf", page: 12, paragraph: 3, section: "Management Discussion", exactText: "Revenue for the fiscal year 2025 was $94.8 billion, an increase of 12.3% year-over-year.", confidence: 0.98, source: "filing" },
  { file: "10-K_FY2025.pdf", page: 15, paragraph: 1, section: "Results of Operations", exactText: "EBITDA for the year was $14.6 billion, representing a margin of 15.4%.", confidence: 0.97, source: "filing" },
  { file: "10-K_FY2025.pdf", page: 18, paragraph: 2, cell: "Table 3.2", exactText: "Free cash flow of $6.2 billion was generated in FY2025, compared to $4.8 billion in FY2024.", confidence: 0.96, source: "filing" },
  { file: "Earnings_Transcript_Q4_2025.pdf", page: 3, paragraph: 5, exactText: "Our automotive margin improved to 19.8% this quarter, driven by lower material costs and OpEx leverage.", confidence: 0.94, source: "transcript" },
  { file: "Valuation_Report_v3.pdf", page: 8, paragraph: 2, section: "DCF Assumptions", exactText: "WACC of 12% reflects risk-free rate of 4.5% and equity risk premium of 6.5%.", confidence: 0.93, source: "report" },
  { file: "Valuation_Report_v3.pdf", page: 12, paragraph: 4, cell: "Sensitivity Analysis", exactText: "Enterprise Value ranges from $1.8M to $3.1M under different terminal growth assumptions.", confidence: 0.91, source: "report" },
  { file: "Industry_Benchmark_Q4_2025.pdf", page: 6, paragraph: 1, exactText: "Tesla's EBITDA margin of 16.5% places it in the 65th percentile of the automotive sector.", confidence: 0.92, source: "report" },
  { file: "Industry_Benchmark_Q4_2025.pdf", page: 8, paragraph: 3, cell: "Table 4.1", exactText: "Sector average EV/EBITDA multiple is 9.5x; Tesla trades at 8.2x.", confidence: 0.90, source: "report" },
  { file: "Financial_Statements_Q4_2025.pdf", page: 4, paragraph: 1, section: "Balance Sheet", exactText: "Cash and cash equivalents: $44.1 billion as of December 31, 2025.", confidence: 0.99, source: "filing" },
  { file: "Analyst_Report_Goldman.pdf", page: 7, paragraph: 2, exactText: "We rate TSLA as Outperform with a 12-month price target of $380.", confidence: 0.85, source: "news" },
]

export function findCitations(query: string, topK: number = 3): IsdCitation[] {
  const q = query.toLowerCase()
  const scored = CITATION_DB.map((c) => {
    let score = 0
    const qTokens = q.split(/\W+/).filter(Boolean)
    const cTokens = c.exactText.toLowerCase().split(/\W+/).filter(Boolean)
    const matchCount = qTokens.filter((t) => cTokens.includes(t)).length
    score = (matchCount / Math.max(qTokens.length, 1)) * c.confidence
    return { ...c, score }
  })
  return scored.sort((a, b) => b.score - a.score).slice(0, topK)
}

export function formatCitation(c: IsdCitation): string {
  const parts = [`${c.file}`, `Page ${c.page}`, `¶${c.paragraph}`]
  if (c.cell) parts.push(c.cell)
  if (c.section) parts.push(c.section)
  return `[${c.source.toUpperCase()}] ${parts.join(" · ")}`
}

export function getCitationStats(): { total: number; sources: Record<string, number>; avgConfidence: number } {
  const sources: Record<string, number> = {}
  for (const c of CITATION_DB) {
    sources[c.source] = (sources[c.source] || 0) + 1
  }
  return {
    total: CITATION_DB.length,
    sources,
    avgConfidence: parseFloat((CITATION_DB.reduce((a, c) => a + c.confidence, 0) / CITATION_DB.length).toFixed(2)),
  }
}
