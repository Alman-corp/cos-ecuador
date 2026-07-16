export enum MemoryLayer {
  CONVERSATION = "conversation",
  PROJECT = "project",
  CLIENT = "client",
  FIRM = "firm",
}

export interface MemoryEntry {
  id: string
  layer: MemoryLayer
  scopeId: string
  companyId: string
  type: "message" | "decision" | "fact" | "document" | "analysis"
  content: string
  embedding?: number[]
  metadata: {
    userId?: string
    role?: string
    timestamp: string
    source?: string
    importance?: number
    tags?: string[]
  }
}

export interface MemoryQuery {
  layer: MemoryLayer
  scopeId: string
  companyId: string
  query?: string
  types?: string[]
  limit?: number
  since?: Date
}