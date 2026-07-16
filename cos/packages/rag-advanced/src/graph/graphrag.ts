import type { Entity, Relation, AdvancedChunk } from "../types"

interface GraphStats {
  nodes: number
  edges: number
  avgDegree: number
  entityTypes: Record<string, number>
}

export class GraphRAG {
  private entities = new Map<string, Entity>()
  private relations: Relation[] = []
  private entityChunks = new Map<string, string[]>()

  index(chunks: AdvancedChunk[], entities: Entity[], relations: Relation[]): void {
    for (const e of entities) this.entities.set(e.id, e)
    this.relations = relations
    for (const c of chunks) {
      for (const eId of c.entities) {
        if (!this.entityChunks.has(eId)) this.entityChunks.set(eId, [])
        this.entityChunks.get(eId)!.push(c.id)
      }
    }
  }

  search(query: string, maxHops = 2): {
    entities: Entity[]
    relations: Relation[]
    chunkIds: string[]
    context: string
  } {
    const queryEntities = this.findQueryEntities(query)
    const visited = new Set<string>()
    const queue: Array<{ id: string; hops: number }> = queryEntities.map((e) => ({ id: e.id, hops: 0 }))
    const resultEntities = new Map<string, Entity>()
    const resultRelations: Relation[] = []
    const resultChunks = new Set<string>()

    for (const qe of queryEntities) resultEntities.set(qe.id, qe)

    while (queue.length > 0) {
      const current = queue.shift()!
      if (current.hops >= maxHops || visited.has(current.id)) continue
      visited.add(current.id)

      const connected = this.relations.filter((r) => r.source === current.id || r.target === current.id)
      for (const rel of connected) {
        resultRelations.push(rel)
        const otherId = rel.source === current.id ? rel.target : rel.source
        const other = this.entities.get(otherId)
        if (other && !resultEntities.has(otherId)) {
          resultEntities.set(otherId, other)
          queue.push({ id: otherId, hops: current.hops + 1 })
        }
        const chunks = this.entityChunks.get(otherId) ?? []
        for (const cId of chunks) resultChunks.add(cId)
      }
    }

    const context = [...resultEntities.values()].map((e) =>
      `${e.name} (${e.type}): ${Object.entries(e.properties).map(([k, v]) => `${k}=${v}`).join(", ")}`
    ).join("\n")

    return {
      entities: [...resultEntities.values()],
      relations: resultRelations,
      chunkIds: [...resultChunks],
      context,
    }
  }

  getStats(): GraphStats {
    const entityTypes: Record<string, number> = {}
    for (const e of this.entities.values()) {
      entityTypes[e.type] = (entityTypes[e.type] ?? 0) + 1
    }
    return {
      nodes: this.entities.size,
      edges: this.relations.length,
      avgDegree: this.entities.size > 0 ? (2 * this.relations.length) / this.entities.size : 0,
      entityTypes,
    }
  }

  private findQueryEntities(query: string): Entity[] {
    const q = query.toLowerCase()
    return [...this.entities.values()].filter((e) =>
      q.includes(e.canonical_name) || q.includes(e.name.toLowerCase())
    )
  }
}
