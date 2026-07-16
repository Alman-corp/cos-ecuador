import { persistence, ensurePersistence } from "@/core/persistence"

export type MemoryType =
  | "decision" | "strategy" | "meeting" | "document_change"
  | "kpi_change" | "risk" | "note" | "event" | "task"
  | "recommendation" | "alert"

export interface MemoryEntry {
  id: string
  companyId: string
  clientId?: string
  type: MemoryType
  title: string
  description: string
  entities: string[]
  tags: string[]
  metadata: Record<string, any>
  timestamp: string
  userId: string
  userName?: string
  importance: "low" | "medium" | "high" | "critical"
}

export interface MemoryQuery {
  companyId: string
  clientId?: string
  type?: MemoryType
  tags?: string[]
  from?: string
  to?: string
  search?: string
  importance?: string
  limit?: number
  offset?: number
}

// ─── In-Memory Store ─────────────────────────────────────────

class MemoryStore {
  private entries: MemoryEntry[] = []
  private maxEntries = 10000

  getAll(): MemoryEntry[] { return this.entries }
  clear(): void { this.entries = [] }
  restoreAll(data: MemoryEntry[]): void { this.entries = data }

  store(entry: Omit<MemoryEntry, "id" | "timestamp">): MemoryEntry {
    ensurePersistence()
    const newEntry: MemoryEntry = {
      ...entry,
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
    }
    this.entries.unshift(newEntry)
    if (this.entries.length > this.maxEntries) this.entries.pop()
    try { persistence.scheduleSave() } catch {}
    return newEntry
  }

  query(query: MemoryQuery): MemoryEntry[] {
    let results = this.entries
      .filter((e) => e.companyId === query.companyId)
    if (query.clientId) results = results.filter((e) => e.clientId === query.clientId)
    if (query.type) results = results.filter((e) => e.type === query.type)
    if (query.importance) results = results.filter((e) => e.importance === query.importance)
    if (query.tags?.length) results = results.filter((e) => query.tags!.some((t) => e.tags.includes(t)))
    if (query.from) results = results.filter((e) => e.timestamp >= query.from!)
    if (query.to) results = results.filter((e) => e.timestamp <= query.to!)
    if (query.search) {
      const q = query.search.toLowerCase()
      results = results.filter((e) => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q))
    }

    const offset = query.offset || 0
    const limit = query.limit || 50
    return results.slice(offset, offset + limit)
  }

  getByEntity(entityId: string, companyId: string): MemoryEntry[] {
    return this.entries.filter((e) => e.companyId === companyId && e.entities.includes(entityId))
  }

  getTimeline(companyId: string, clientId?: string, days = 30): MemoryEntry[] {
    const since = new Date(Date.now() - days * 86400000).toISOString()
    return this.query({ companyId, clientId, from: since, limit: 100 })
  }

  getRecent(companyId: string, limit = 10): MemoryEntry[] {
    return this.entries.filter((e) => e.companyId === companyId).slice(0, limit)
  }

  summarize(companyId: string, clientId?: string): {
    total: number
    byType: Record<string, number>
    byImportance: Record<string, number>
    critical: MemoryEntry[]
  } {
    const filtered = clientId
      ? this.entries.filter((e) => e.companyId === companyId && e.clientId === clientId)
      : this.entries.filter((e) => e.companyId === companyId)

    const byType: Record<string, number> = {}
    const byImportance: Record<string, number> = {}
    for (const e of filtered) {
      byType[e.type] = (byType[e.type] || 0) + 1
      byImportance[e.importance] = (byImportance[e.importance] || 0) + 1
    }

    return {
      total: filtered.length,
      byType,
      byImportance,
      critical: filtered.filter((e) => e.importance === "critical").slice(0, 5),
    }
  }
}

export const memoryStore = new MemoryStore()
