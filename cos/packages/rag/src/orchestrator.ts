import { VectorStore } from "./qdrant-client"
import { OpenAIEmbedder, type Embedder } from "./embedder"
import { CohereReranker, SimpleReranker, type Reranker } from "./reranker"
import { chunkDocument, type ChunkerOptions } from "./chunker"
import { buildISDContext, parseCitations, calculateConfidence, ISD_SYSTEM_PROMPT, type ISDResponse, type ISDOptions } from "./isd"
import OpenAI from "openai"

export interface RAGQuery {
  query: string
  companyId: string
  clientId?: string
  documentId?: string
  docTypes?: string[]
  options?: ISDOptions & { topK?: number; rerankTopK?: number }
}

export class RAGOrchestrator {
  private vectorStore: VectorStore
  private embedder: Embedder
  private reranker: Reranker
  private llm: OpenAI

  constructor(opts?: { vectorStore?: VectorStore; embedder?: Embedder; reranker?: Reranker; llm?: OpenAI }) {
    this.vectorStore = opts?.vectorStore ?? new VectorStore({})
    this.embedder = opts?.embedder ?? new OpenAIEmbedder()
    this.reranker = opts?.reranker ?? (process.env.COHERE_API_KEY ? new CohereReranker() : new SimpleReranker())
    this.llm = opts?.llm ?? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }

  async indexDocument(opts: {
    documentId: string
    companyId: string
    clientId: string
    text: string
    docType: string
    filename: string
    chunkerOptions?: ChunkerOptions
  }): Promise<{ chunksCount: number }> {
    const chunks = chunkDocument(opts.text, opts.documentId, opts.chunkerOptions ?? { strategy: "hierarchical" })
    const texts = chunks.map((c) => c.text)
    const embeddings = await this.embedder.embed(texts)

    const points = chunks.map((chunk, idx) => ({
      id: chunk.id,
      vector: embeddings[idx],
      payload: {
        document_id: opts.documentId,
        client_id: opts.clientId,
        company_id: opts.companyId,
        chunk_id: chunk.id,
        chunk_index: chunk.chunk_index,
        text: chunk.text,
        page: chunk.page,
        section: chunk.section,
        heading_path: chunk.heading_path,
        doc_type: opts.docType,
        filename: opts.filename,
        uploaded_at: new Date().toISOString(),
        metadata: chunk.metadata,
      },
    }))

    await this.vectorStore.upsert(points)
    return { chunksCount: chunks.length }
  }

  async queryWithISD(q: RAGQuery): Promise<{
    answer: string
    citations: import("./isd").Citation[]
    confidence: number
    sources_used: number
    follow_up_questions: string[]
  }> {
    const topK = q.options?.topK ?? 20
    const rerankTopK = q.options?.rerankTopK ?? 5
    const maxCitations = q.options?.maxCitations ?? 10

    const queryEmbedding = await this.embedder.embedOne(q.query)
    const candidates = await this.vectorStore.search({
      query: queryEmbedding,
      companyId: q.companyId,
      clientId: q.clientId,
      documentId: q.documentId,
      docTypes: q.docTypes,
      limit: topK,
      scoreThreshold: 0.4,
    })

    if (candidates.length === 0) {
      return { answer: "No encontré información relevante en los documentos disponibles para responder tu pregunta.", citations: [], confidence: 0, sources_used: 0, follow_up_questions: [] }
    }

    const reranked = await this.reranker.rerank(q.query, candidates, rerankTopK)
    const context = buildISDContext(reranked)
    const systemPrompt = ISD_SYSTEM_PROMPT.replace("{context}", context).replace("{query}", q.query)

    const completion = await this.llm.chat.completions.create({
      model: process.env.CHAT_MODEL ?? "gpt-4o-mini",
      temperature: 0.1,
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: q.query }],
    })

    const rawAnswer = completion.choices[0]?.message?.content ?? ""
    const { cleanAnswer, citations } = parseCitations(rawAnswer, reranked)
    const confidence = calculateConfidence(cleanAnswer, citations, { requireCitations: true, maxCitations })
    const followUpQuestions: string[] = []

    try {
      const fu = await this.llm.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: 'Genera 2-3 preguntas de seguimiento relevantes. Responde en JSON: {"questions": ["q1", "q2", "q3"]}' },
          { role: "user", content: `Pregunta: ${q.query}\nRespuesta: ${cleanAnswer.slice(0, 500)}` },
        ],
      })
      const parsed = JSON.parse(fuQ.choices[0]?.message?.content ?? "{}")
      followUps.push(...(parsed.questions ?? []))
    } catch {}

    return { answer: cleanAnswer, citations: citations.slice(0, maxCitations), confidence, sources_used: reranked.length, follow_up_questions: followUps }
  }

  async removeDocument(documentId: string, companyId: string): Promise<void> {
    await this.vectorStore.deleteByDocument(documentId, companyId)
  }
}