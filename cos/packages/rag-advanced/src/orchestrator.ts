import { HybridSearch } from "./search/hybrid-search"
import { CrossEncoderReranker } from "./rerank/reranker"
import { SemanticChunker } from "./chunking/semantic-chunker"
import { HierarchicalIndexer } from "./indexing/hierarchical"
import { QueryUnderstanding } from "./query/understanding"
import { SelfRAG } from "./query/self-rag"
import { EntityExtractor } from "./graph/entity-extractor"
import { GraphRAG } from "./graph/graphrag"
import { GranularISD } from "./citations/granular-isd"
import { NegativeCache } from "./cache/negative-cache"
import { MultilingualEmbedder } from "./embeddings/multilingual"
import type { AdvancedChunk, GranularCitation, AdvancedRAGResponse, Entity, Relation, RAGQueryOptions } from "./types"
import OpenAI from "openai"

export class AdvancedRAGOrchestrator {
  private hybridSearch: HybridSearch
  private reranker: CrossEncoderReranker
  private chunker: SemanticChunker
  private hierarchical: HierarchicalIndexer
  private queryUnderstanding: QueryUnderstanding
  private selfRAG: SelfRAG
  private entityExtractor: EntityExtractor
  private graphRAG: GraphRAG
  private isd: GranularISD
  private cache: NegativeCache<AdvancedRAGResponse>
  private embedder: MultilingualEmbedder
  private llm: OpenAI

  private chunks: AdvancedChunk[] = []
  private chunkVectors: number[][] = []
  private entities: Entity[] = []
  private relations: Relation[] = []

  constructor(opts?: {
    openAiKey?: string
    cohereApiKey?: string
    bgeRerankerUrl?: string
    bgeEmbedderUrl?: string
  }) {
    this.hybridSearch = new HybridSearch()
    this.reranker = new CrossEncoderReranker({ cohereApiKey: opts?.cohereApiKey })
    this.chunker = new SemanticChunker()
    this.hierarchical = new HierarchicalIndexer()
    this.queryUnderstanding = new QueryUnderstanding({ openAiKey: opts?.openAiKey })
    this.selfRAG = new SelfRAG({ openAiKey: opts?.openAiKey })
    this.entityExtractor = new EntityExtractor({ openAiKey: opts?.openAiKey })
    this.graphRAG = new GraphRAG()
    this.isd = new GranularISD()
    this.cache = new NegativeCache<AdvancedRAGResponse>({ ttlMs: 300000, maxSize: 1000 })
    this.embedder = new MultilingualEmbedder()
    this.llm = new OpenAI({ apiKey: opts?.openAiKey ?? process.env.OPENAI_API_KEY })
  }

  async initialize(texts: string[]): Promise<void> {
    this.chunks = []
    this.chunkVectors = []
    this.entities = []
    this.relations = []

    for (let i = 0; i < texts.length; i++) {
      const docChunks = this.chunker.chunk(texts[i], `doc-${i}`)
      this.chunks.push(...docChunks)
    }

    const textsToEmbed = this.chunks.map((c) => c.text)
    this.chunkVectors = await this.embedder.embed(textsToEmbed)

    for (const c of this.chunks) {
      const { entities, relations } = await this.entityExtractor.extract(c.text)
      const entityIds = entities.map((e) => e.id)
      this.entities.push(...entities)
      this.relations.push(...relations)
      c.entities = entityIds
    }

    this.hybridSearch.index(this.chunks, this.chunkVectors)
    this.graphRAG.index(this.chunks, this.entities, this.relations)
  }

  async query(userQuery: string, options: RAGQueryOptions): Promise<AdvancedRAGResponse> {
    const start = performance.now()

    const cached = this.cache.get(userQuery)
    if (cached) return cached

    const decision = await this.selfRAG.decide(userQuery)
    if (decision.action === "skip") {
      const response: AdvancedRAGResponse = {
        answer: "I don't need to search for this. It appears to be a conversational message.",
        citations: [],
        confidence: 1,
        latency_ms: Math.round(performance.now() - start),
        contexts: [],
        interpretation: null,
        follow_up_questions: [],
      }
      return response
    }

    const interpretation = await this.queryUnderstanding.understand(userQuery)

    const queryLang = interpretation.language !== "en" ? interpretation.language : undefined
    const queryVector = (await this.embedder.embed([userQuery], queryLang))[0]

    const graphResults = this.graphRAG.search(userQuery, 2)

    const hybridCandidates = this.hybridSearch.search(userQuery, queryVector, 20, {
      docTypes: options.docTypes,
      graphBoost: 0.1,
    })

    const hierarchicalTree = this.hierarchical.build(this.chunks)
    const chunkMap = new Map(this.chunks.map((c) => [c.id, c]))

    const reranked = await this.reranker.rerank(userQuery, hybridCandidates, 5)

    const contexts = reranked.map((r) => r.chunk.text)
    const sufficiency = await this.selfRAG.evaluateSufficiency(userQuery, contexts)

    let finalContexts = contexts
    if (!sufficiency.sufficient && sufficiency.reformulation) {
      const reformVector = (await this.embedder.embed([sufficiency.reformulation]))[0]
      const reformResults = this.hybridSearch.search(sufficiency.reformulation, reformVector, 5)
      finalContexts = [...contexts, ...reformResults.map((r) => r.chunk.text)]
    }

    const isdCitations = this.isd.find(userQuery)
    const citationContext = finalContexts.length > 0
      ? finalContexts.map((c, i) => `[${i + 1}] ${c}`).join("\n\n")
      : "No relevant documents found."

    const graphContext = graphResults.context ? `\n\nKnowledge Graph context:\n${graphResults.context}` : ""

    const systemPrompt = `You are a financial analysis AI with access to documents and a knowledge graph.
Use the provided context to answer the user's question accurately.

Rules:
- Cite sources using [cite:N] where N is the context number
- If context doesn't contain the answer, say so
- Include specific numbers and data when available
- Be concise but thorough
- Use the knowledge graph context for entity relationships${graphContext}

Available context:
${citationContext}

User query: ${userQuery}`

    const completion = await this.llm.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: options.temperature ?? 0.1,
      max_tokens: options.maxTokens ?? 1024,
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userQuery }],
    })

    const answer = completion.choices[0]?.message?.content ?? ""

    const citations: GranularCitation[] = isdCitations.map((ic) => ({
      ...ic,
      heading_path: [ic.section ?? ""],
    }))

    let followUpQuestions: string[] = []
    try {
      const fu = await this.llm.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: 'Generate 2-3 follow-up questions. JSON: {"questions": ["q1", "q2", "q3"]}' },
          { role: "user", content: `Query: ${userQuery}\nAnswer: ${answer.slice(0, 500)}` },
        ],
      })
      const parsed = JSON.parse(fu.choices[0]?.message?.content ?? "{}")
      followUpQuestions = parsed.questions ?? []
    } catch {}

    const confidence = finalContexts.length > 0
      ? Math.min(1, 0.3 + 0.3 * (finalContexts.length / 5) + 0.4 * (citations.length / 5))
      : 0.1

    const response: AdvancedRAGResponse = {
      answer,
      citations,
      confidence,
      latency_ms: Math.round(performance.now() - start),
      contexts: finalContexts,
      interpretation,
      follow_up_questions: followUpQuestions,
    }

    this.cache.set(userQuery, response)
    return response
  }

  getStats() {
    return {
      chunks: this.chunks.length,
      entities: this.entities.length,
      relations: this.relations.length,
      cacheStats: this.cache.getStats(),
      graphStats: this.graphRAG.getStats(),
      isdStats: this.isd.getStats(),
    }
  }
}
