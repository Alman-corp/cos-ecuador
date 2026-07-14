// @llm-engineer — DO NOT MODIFY WITHOUT APPROVAL
export type SearchStrategy = "bm25" | "vector" | "graph" | "hybrid"

export interface IndexedDocument {
  id: string
  title: string
  content: string
  tokens: string[]
  metadata: Record<string, string>
}

export interface SearchResult {
  documentId: string
  title: string
  content: string
  score: number
  strategy: SearchStrategy
  metadata: Record<string, string>
}

const DOCUMENTS: IndexedDocument[] = [
  { id: "doc-1", title: "Tesla Q4 2025 Financial Report", content: "Tesla reported Q4 2025 revenue of $25.4B, EBITDA of $4.2B, and net income of $2.5B. Free cash flow reached $2.1B. Automotive segment margin improved to 19.8%. Energy storage deployments grew 85% YoY.", tokens: [], metadata: { period: "Q4_2025", type: "financial" } },
  { id: "doc-2", title: "Valuation DCF Model Assumptions", content: "WACC: 12%, Terminal growth: 3.5%, Projection period: 5 years. Enterprise Value: $2.4M. Revenue growth decays from 15% to 3.5%. CAPEX as % of revenue: 8%. Target debt/EBITDA: 1.5x.", tokens: [], metadata: { type: "valuation" } },
  { id: "doc-3", title: "Industry Benchmarking Report", content: "Automotive sector average EBITDA margin: 14.2%. Tesla at 16.5% (Q4 2025) outperforms. Top quartile margin: 18.5%. Sector EV/EBITDA multiple range: 6x-12x. Tesla trades at 8.2x, below sector median of 9.5x.", tokens: [], metadata: { type: "benchmark" } },
  { id: "doc-4", title: "Macroeconomic Outlook 2026", content: "GDP growth forecast: 2.3% ± 0.8%. Inflation projected at 3.1%. Central bank rate at 10.5%. USD/COP exchange rate range: 3800-4200. Recession probability: 25%. Credit contraction expected: 4.2%.", tokens: [], metadata: { type: "macro" } },
  { id: "doc-5", title: "Competitive Landscape Analysis", content: "Share of voice: 12.3% (+2.1pp QoQ). Top competitors: BYD (18.5%), VW (15.2%), GM (11.8%). Consumer preference: delivery time (35.2%), price (28.1%), after-sales support (22.4%). NPS score: 72.", tokens: [], metadata: { type: "competitive" } },
]

for (const doc of DOCUMENTS) {
  doc.tokens = doc.content.toLowerCase().split(/\W+/).filter(Boolean)
}

function bm25(query: string, doc: IndexedDocument): number {
  const queryTokens = query.toLowerCase().split(/\W+/).filter(Boolean)
  const avgDocLen = DOCUMENTS.reduce((a, d) => a + d.tokens.length, 0) / DOCUMENTS.length
  const k1 = 1.5, b = 0.75
  let score = 0

  for (const qt of queryTokens) {
    const docCount = DOCUMENTS.filter((d) => d.tokens.includes(qt)).length
    const idf = Math.log((DOCUMENTS.length - docCount + 0.5) / (docCount + 0.5) + 1)
    const tf = doc.tokens.filter((t) => t === qt).length
    const numerator = tf * (k1 + 1)
    const denominator = tf + k1 * (1 - b + b * doc.tokens.length / avgDocLen)
    score += idf * (numerator / denominator)
  }
  return score
}

function vectorScore(query: string, doc: IndexedDocument): number {
  const queryTokens = query.toLowerCase().split(/\W+/).filter(Boolean)
  const qtSet = new Set(queryTokens)
  const docSet = new Set(doc.tokens)
  const intersection = [...qtSet].filter((t) => docSet.has(t))
  const union = new Set([...qtSet, ...docSet])
  return intersection.length / union.size
}

export function hybridSearch(query: string, filters?: Record<string, string>, topK: number = 3): SearchResult[] {
  let results: SearchResult[] = []

  // BM25 pass
  const bm25Results = DOCUMENTS
    .map((d) => ({ ...d, score: bm25(query, d), strategy: "bm25" as SearchStrategy }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)

  // Vector (cosine sim) pass
  const vectorResults = DOCUMENTS
    .map((d) => ({ ...d, score: vectorScore(query, d), strategy: "vector" as SearchStrategy }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)

  // Merge & deduplicate
  const seen = new Set<string>()
  const hybrid: SearchResult[] = []

  for (const r of [...bm25Results, ...vectorResults]) {
    if (seen.has(r.id)) {
      const existing = hybrid.find((h) => h.documentId === r.id)
      if (existing) existing.score = Math.max(existing.score, r.score)
      continue
    }
    seen.add(r.id)
    const score = (bm25Results.find((b) => b.id === r.id)?.score || 0) * 0.5 +
                  (vectorResults.find((v) => v.id === r.id)?.score || 0) * 0.5
    hybrid.push({ documentId: r.id, title: r.title, content: r.content, score, strategy: "hybrid", metadata: r.metadata })
  }

  // Apply filters
  let filtered = hybrid
  if (filters) {
    filtered = hybrid.filter((r) => {
      for (const [k, v] of Object.entries(filters)) {
        if (r.metadata[k] !== v) return false
      }
      return true
    })
  }

  return filtered.sort((a, b) => b.score - a.score).slice(0, topK)
}

export function addDocument(title: string, content: string, metadata: Record<string, string> = {}): IndexedDocument {
  const doc: IndexedDocument = {
    id: `doc-${DOCUMENTS.length + 1}`, title, content,
    tokens: content.toLowerCase().split(/\W+/).filter(Boolean), metadata,
  }
  DOCUMENTS.push(doc)
  return doc
}

export function getDocuments(): IndexedDocument[] {
  return [...DOCUMENTS]
}
