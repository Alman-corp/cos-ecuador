import { PrismaClient } from "@prisma/client"
import { v4 as uuid } from "uuid"
import { MemoryEntry, MemoryLayer } from "./layers"
import { OpenAIEmbedder } from "@cos/rag/embedder"
import { VectorStore } from "@cos/rag/qdrant-client"
import { Summarizer } from "./summarizer"

export class MemoryService {
  private prisma: PrismaClient
  private embedder: OpenAIEmbedder
  private vectorStore: VectorStore
  private summarizer: Summarizer

  constructor(deps: { prisma: PrismaClient; embedder?: OpenAIEmbedder; vectorStore?: VectorStore }) {
    this.prisma = deps.prisma
    this.embedder = deps.embedder ?? new OpenAIEmbedder()
    this.vectorStore = deps.vectorStore ?? new VectorStore({ collectionName: "cos_memory" })
    this.summarizer = new Summarizer()
  }

  async add(entry: Omit<MemoryEntry, "id" | "embedding">): Promise<MemoryEntry> {
    const id = uuid()
    const embedding = await this.embedder.embedOne(this.formatForEmbedding(entry))

    await this.prisma.memoryEntry.create({
      data: {
        id,
        layer: entry.layer,
        scopeId: entry.scopeId,
        companyId: entry.companyId,
        type: entry.type,
        content: entry.content,
        metadata: entry.metadata,
        timestamp: new Date(entry.metadata.timestamp),
      },
    })

    await this.vectorStore.upsert([
      { id, vector: embedding, payload: { ...entry, timestamp: entry.metadata.timestamp } as any },
    ])

    return { ...entry, id, embedding }
  }

  async addChatMessage(opts: { conversationId: string; companyId: string; clientId?: string; projectId?: string; userId: string; role: "user" | "assistant"; content: string }): Promise<void> {
    const entry = {
      layer: MemoryLayer.CONVERSATION,
      scopeId: opts.conversationId,
      companyId: opts.companyId,
      type: "message" as const,
      content: `[${opts.role}]: ${opts.content}`,
      metadata: { userId: opts.userId, role: opts.role, timestamp: new Date().toISOString(), source: "chat", tags: opts.clientId ? [`client:${opts.clientId}`] : [] },
    }
    await this.add(entry)

    if (opts.clientId && opts.role === "assistant") {
      await this.add({
        ...entry,
        layer: MemoryLayer.CLIENT,
        scopeId: opts.clientId,
        metadata: { ...entry.metadata, importance: this.estimateImportance(opts.content) },
      })
    }
  }

  async addDecision(opts: { clientId: string; companyId: string; projectId?: string; userId: string; decision: string; rationale: string; impact?: string }): Promise<void> {
    const content = `DECISIÓN: ${opts.decision}\nRATIONALE: ${opts.rationale}${opts.impact ? `\nIMPACTO: ${opts.impact}` : ""}`
    await Promise.all([
      this.add({ layer: MemoryLayer.CLIENT, scopeId: opts.clientId, companyId: opts.companyId, type: "decision", content, metadata: { userId: opts.userId, timestamp: new Date().toISOString(), source: "manual", importance: 0.9, tags: ["decision"] } }),
      ...(opts.projectId ? [this.add({ layer: MemoryLayer.PROJECT, scopeId: opts.projectId, companyId: opts.companyId, type: "decision", content, metadata: { userId: opts.userId, timestamp: new Date().toISOString(), importance: 0.9 } })] : []),
    ])
  }

  async retrieve(opts: { query: string; companyId: string; conversationId?: string; clientId?: string; projectId?: string; maxPerLayer?: number }): Promise<Record<string, MemoryEntry[]>> {
    const max = opts.maxPerLayer ?? 5
    const queryEmbedding = await this.embedder.embedOne(opts.query)

    const searchLayer = async (layer: MemoryLayer, scopeId: string) => {
      const results = await this.vectorStore.search({ query: queryEmbedding, companyId: opts.companyId, limit: max + 5, scoreThreshold: 0.5 })
      return results.filter((r: any) => r.payload.layer === layer && r.payload.scope_id === scopeId).map((r: any) => ({ id: r.id, ...r.payload }))
    }

    const [conversation, project, client, firm] = await Promise.all([
      opts.conversationId ? searchLayer(MemoryLayer.CONVERSATION, opts.conversationId) : [],
      opts.projectId ? searchLayer(MemoryLayer.PROJECT, opts.projectId) : [],
      opts.clientId ? searchLayer(MemoryLayer.CLIENT, opts.clientId) : [],
      searchLayer(MemoryLayer.FIRM, opts.companyId).then((r) => r.slice(0, Math.floor(max / 2))),
    ])

    return { conversation, project, client, firm }
  }

  async summarizeConversation(conversationId: string, companyId: string): Promise<string> {
    const entries = await this.prisma.memoryEntry.findMany({
      where: { layer: MemoryLayer.CONVERSATION, scopeId: conversationId, companyId },
      orderBy: { timestamp: "asc" },
    })
    if (entries.length < 20) return entries.map((e) => e.content).join("\n")

    const older = entries.slice(0, -10)
    const recent = entries.slice(-10)
    const summary = await this.summarizer.summarize(older.map((e) => e.content).join("\n"))
    return `RESUMEN DE CONVERSACIÓN PREVIA:\n${summary}\n\nMENSAJES RECIENTES:\n${recent.map((e) => e.content).join("\n")}`
  }

  private formatForEmbedding(entry: Omit<MemoryEntry, "id" | "embedding">): string {
    return [`[${entry.layer.toUpperCase()}]`, `[${entry.type}]`, entry.content, ...(entry.metadata.tags?.length ? [`Tags: ${entry.metadata.tags.join(", ")}`] : [])].join(" ")
  }

  private estimateImportance(content: string): number {
    let score = 0.5
    if (/decisión|decidimos|acordamos/i.test(content)) score += 0.3
    if (/\$\d+|\d+%/.test(content)) score += 0.1
    if (/riesgo|crítico|urgente/i.test(content)) score += 0.2
    return Math.min(1, score)
  }
}