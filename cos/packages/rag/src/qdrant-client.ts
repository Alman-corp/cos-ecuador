import { QdrantClient } from "@qdrant/js-client-rest"
import type { Schemas } from "@qdrant/js-client-rest"

export interface DocumentPayload {
  document_id: string
  client_id: string
  company_id: string
  chunk_id: string
  chunk_index: number
  text: string
  page?: number
  section?: string
  heading_path?: string[]
  doc_type: string
  filename: string
  uploaded_at: string
  metadata?: Record<string, unknown>
}

export interface SearchResult {
  id: string
  score: number
  payload: DocumentPayload
}

export class VectorStore {
  private client: QdrantClient
  private readonly collectionName: string
  private readonly vectorSize: number

  constructor(opts?: {
    url?: string
    apiKey?: string
    collectionName?: string
    vectorSize?: number
  }) {
    this.client = new QdrantClient({
      url: opts?.url ?? process.env.QDRANT_URL ?? "http://localhost:6333",
      apiKey: opts?.apiKey,
    })
    this.collectionName = opts?.collectionName ?? "cos_documents"
    this.vectorSize = opts?.vectorSize ?? 3072
  }

  async ensureCollection(): Promise<void> {
    const collections = await this.client.getCollections()
    const exists = collections.collections.some((c) => c.name === this.collectionName)
    if (exists) return

    await this.client.createCollection(this.collectionName, {
      vectors: { size: this.vectorSize, distance: "Cosine" },
      hnsw_config: { m: 16, ef_construct: 100 },
    })

    for (const field of ["company_id", "client_id", "document_id", "doc_type"]) {
      await this.client.createPayloadIndex(this.collectionName, {
        field_name: field,
        field_schema: "keyword",
      })
    }
  }

  async upsert(points: Array<{ id: string; vector: number[]; payload: Record<string, unknown> }>): Promise<void> {
    await this.ensureCollection()
    const BATCH = 100
    for (let i = 0; i < points.length; i += BATCH) {
      await this.client.upsert(this.collectionName, {
        wait: true,
        points: points.slice(i, i + BATCH).map((p) => ({
          id: p.id,
          vector: p.vector,
          payload: p.payload,
        })),
      })
    }
  }

  async search(opts: {
    query: number[]
    companyId: string
    clientId?: string
    documentId?: string
    docTypes?: string[]
    limit?: number
    scoreThreshold?: number
  }): Promise<SearchResult[]> {
    const must: Schemas["FieldCondition"][] = [{ key: "company_id", match: { value: opts.companyId } }]
    if (opts.clientId) must.push({ key: "client_id", match: { value: opts.clientId } })
    if (opts.documentId) must.push({ key: "document_id", match: { value: opts.documentId } })
    if (opts.docTypes?.length) must.push({ key: "doc_type", match: { any: opts.docTypes } })

    const results = await this.client.search(this.collectionName, {
      vector: opts.query,
      limit: opts.limit ?? 20,
      score_threshold: opts.scoreThreshold ?? 0.5,
      filter: { must },
      with_payload: true,
    })

    return results.map((r) => ({
      id: r.id as string,
      score: r.score,
      payload: r.payload as unknown as DocumentPayload,
    }))
  }

  async deleteByDocument(documentId: string, companyId: string): Promise<void> {
    await this.client.delete(this.collectionName, {
      wait: true,
      filter: {
        must: [
          { key: "document_id", match: { value: documentId } },
          { key: "company_id", match: { value: companyId } },
        ],
      },
    })
  }

  async getCollectionStats(): Promise<{ pointsCount: number; vectorsCount: number; status: string }> {
    const info = await this.client.getCollection(this.collectionName)
    return {
      pointsCount: info.points_count ?? 0,
      vectorsCount: info.vectors_count ?? 0,
      status: info.status,
    }
  }
}