export type ChunkLevel = "summary" | "section" | "paragraph" | "verbatim" | "cell"

export interface AdvancedChunk {
  id: string
  document_id: string
  chunk_index: number
  text: string
  level: ChunkLevel
  page?: number
  section?: string
  heading_path: string[]
  tokens: number
  entities: string[]
  metadata: Record<string, unknown>
}

export type EntityType = "PERSON" | "ORG" | "MONEY" | "DATE" | "METRIC" | "PRODUCT" | "LOCATION"

export interface Entity {
  id: string
  name: string
  canonical_name: string
  type: EntityType
  properties: Record<string, string>
}

export interface Relation {
  id: string
  source: string
  target: string
  relation: string
  weight: number
  evidence?: string
}

export interface SearchCandidate {
  id: string
  chunk: AdvancedChunk
  score: number
  components: {
    bm25: number
    vector: number
    graph: number
  }
}

export interface RerankedResult extends SearchCandidate {
  rerank_score: number
  combined_score: number
}

export interface QueryInterpretation {
  original: string
  hyde: string
  multi_queries: string[]
  step_back: string
  intent: "factual" | "analytical" | "comparative" | "exploratory"
  language: string
}

export interface GranularCitation {
  text: string
  document_id: string
  page?: number
  paragraph?: number
  cell?: string
  section?: string
  heading_path: string[]
  source: string
  confidence: number
}

export interface AdvancedRAGResponse {
  answer: string
  citations: GranularCitation[]
  confidence: number
  latency_ms: number
  contexts: string[]
  interpretation: QueryInterpretation | null
  follow_up_questions: string[]
}

export interface RAGQueryOptions {
  companyId: string
  clientId?: string
  docTypes?: string[]
  languages?: string[]
  maxTokens?: number
  temperature?: number
}
