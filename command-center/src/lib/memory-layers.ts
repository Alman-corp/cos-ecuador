export type MemoryType = "working" | "episodic" | "semantic" | "procedural"

export interface MemoryEntry {
  id: string
  type: MemoryType
  content: string
  metadata: Record<string, string>
  timestamp: number
  ttl: number | null
}

const STORAGE_KEY = "cos-memory-layers"

function loadMemory(): MemoryEntry[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") }
  catch { return [] }
}

function saveMemory(memory: MemoryEntry[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory))
  } catch {
    // localStorage full or unavailable — silently drop
  }
}

export function addMemory(type: MemoryType, content: string, metadata: Record<string, string> = {}, ttlMinutes: number | null = null): MemoryEntry {
  const memory = loadMemory()
  const entry: MemoryEntry = {
    id: crypto.randomUUID(), type, content, metadata,
    timestamp: Date.now(), ttl: ttlMinutes ? Date.now() + ttlMinutes * 60_000 : null,
  }
  memory.push(entry)
  saveMemory(memory)
  return entry
}

export function getMemory(type?: MemoryType): MemoryEntry[] {
  const memory = loadMemory()
  const now = Date.now()
  const valid = memory.filter((e) => !e.ttl || e.ttl > now)
  return type ? valid.filter((e) => e.type === type) : valid
}

export function getWorkingMemory(conversationId: string): MemoryEntry[] {
  return getMemory("working").filter((e) => e.metadata.conversationId === conversationId)
}

export function getEpisodicMemory(userId: string): MemoryEntry[] {
  return getMemory("episodic").filter((e) => e.metadata.userId === userId)
}

export function getSemanticMemory(): MemoryEntry[] {
  return getMemory("semantic")
}

export function clearWorkingMemory(conversationId: string): void {
  const memory = loadMemory()
  saveMemory(memory.filter((e) => !(e.type === "working" && e.metadata.conversationId === conversationId)))
}

export function addContext(conversationId: string, context: string): void {
  addMemory("working", context, { conversationId })
}

export function addUserPreference(key: string, value: string): void {
  addMemory("semantic", `${key}:${value}`, { key, type: "preference" })
}

export function getRelevantContext(conversationId: string, query: string): string {
  const memories = getWorkingMemory(conversationId)
  const semantic = getSemanticMemory()
  const relevant = [...memories, ...semantic]
    .filter((m) => m.content.toLowerCase().includes(query.toLowerCase().slice(0, 20)))
    .slice(-5)
  return relevant.map((m) => m.content).join("\n")
}
