import { memoryStore, type MemoryEntry } from "./store"

export interface MemoryNode {
  id: string
  type: "client" | "project" | "decision" | "risk" | "kpi" | "document" | "meeting" | "company"
  label: string
  properties: Record<string, any>
}

export interface MemoryEdge {
  source: string
  target: string
  relationship: "led_to" | "affected" | "resulted_in" | "triggered" | "resolved" | "references"
  weight: number
}

export interface MemoryGraph {
  nodes: MemoryNode[]
  edges: MemoryEdge[]
}

class MemoryGraphBuilder {
  build(companyId: string, clientId?: string): MemoryGraph {
    const entries = clientId
      ? memoryStore.getByEntity(clientId, companyId)
      : memoryStore.getRecent(companyId, 100)

    const nodesMap = new Map<string, MemoryNode>()
    const edges: MemoryEdge[] = []

    // Add company node
    nodesMap.set(companyId, { id: companyId, type: "company", label: "Empresa", properties: {} })

    for (const entry of entries) {
      // Create node for each entity
      for (const entityId of entry.entities) {
        if (!nodesMap.has(entityId)) {
          nodesMap.set(entityId, {
            id: entityId,
            type: inferEntityType(entry.type),
            label: entityId,
            properties: {},
          })
        }
      }

      // Create edge from entry to its entities
      for (const entityId of entry.entities) {
        edges.push({
          source: entry.id,
          target: entityId,
          relationship: "references",
          weight: 1,
        })
      }

      // Connect related entries by shared entities
      const related = entries.filter((e) =>
        e.id !== entry.id && e.entities.some((ent) => entry.entities.includes(ent))
      )
      for (const rel of related) {
        edges.push({
          source: entry.id,
          target: rel.id,
          relationship: inferRelationship(entry.type, rel.type),
          weight: 1,
        })
      }
    }

    return {
      nodes: Array.from(nodesMap.values()),
      edges: edges.filter((e, i, arr) => arr.findIndex((x) => x.source === e.source && x.target === e.target) === i),
    }
  }

  getContext(companyId: string, clientId: string): string {
    const entries = memoryStore.getByEntity(clientId, companyId)
    if (entries.length === 0) return "No hay historial disponible para este cliente."

    const timeline = entries.slice(0, 20).map((e) =>
      `[${e.timestamp.slice(0, 10)}] ${e.type.toUpperCase()}: ${e.title} — ${e.description.slice(0, 120)}`
    ).join("\n")

    return `## Memoria Empresarial — ${entries.length} eventos\n\n${timeline}`
  }
}

function inferEntityType(memoryType: string): MemoryNode["type"] {
  const map: Record<string, MemoryNode["type"]> = {
    decision: "decision",
    strategy: "decision",
    meeting: "meeting",
    document_change: "document",
    kpi_change: "kpi",
    risk: "risk",
    task: "project",
    recommendation: "decision",
    alert: "risk",
  }
  return map[memoryType] || "client"
}

function inferRelationship(from: string, to: string): MemoryEdge["relationship"] {
  if (from === "risk" && to === "decision") return "triggered"
  if (from === "decision" && to === "kpi_change") return "resulted_in"
  if (from === "meeting" && to === "decision") return "led_to"
  if (from === "risk" && to === "risk") return "affected"
  return "references"
}

export const memoryGraph = new MemoryGraphBuilder()
