import type { KnowledgeGraph, KnowledgeGraphNode, KnowledgeGraphEdge } from "../types"
import { enterpriseOntology, enterpriseRelations, type OntologyClass, type OntologyRelation } from "./ontology"
import { memoryStore } from "@/core/memory"

class KnowledgeGraphEngine {
  private companyGraphs = new Map<string, KnowledgeGraph>()

  getOntology(): { classes: OntologyClass[]; relations: OntologyRelation[] } {
    return { classes: enterpriseOntology, relations: enterpriseRelations }
  }

  getClass(id: string): OntologyClass | undefined {
    return enterpriseOntology.find((c) => c.id === id)
  }

  getChildren(parentId: string): OntologyClass[] {
    return enterpriseOntology.filter((c) => c.parentId === parentId)
  }

  getRelations(sourceId: string): OntologyRelation[] {
    return enterpriseRelations.filter((r) => r.source === sourceId || r.target === sourceId)
  }

  getPath(fromId: string, toId: string): OntologyRelation[] | null {
    const visited = new Set<string>()
    const queue: { id: string; path: OntologyRelation[] }[] = [{ id: fromId, path: [] }]

    while (queue.length > 0) {
      const current = queue.shift()!
      if (current.id === toId) return current.path

      if (visited.has(current.id)) continue
      visited.add(current.id)

      const relations = enterpriseRelations.filter((r) => r.source === current.id)
      for (const rel of relations) {
        if (!visited.has(rel.target)) {
          queue.push({ id: rel.target, path: [...current.path, rel] })
        }
      }
    }
    return null
  }

  getSubtree(rootId: string): { classes: OntologyClass[]; relations: OntologyRelation[] } {
    const visited = new Set<string>()
    const classes: OntologyClass[] = []
    const relations: OntologyRelation[] = []
    const queue = [rootId]

    while (queue.length > 0) {
      const current = queue.shift()!
      if (visited.has(current)) continue
      visited.add(current)

      const cls = enterpriseOntology.find((c) => c.id === current)
      if (cls) classes.push(cls)

      const rels = enterpriseRelations.filter((r) => r.source === current)
      for (const rel of rels) {
        relations.push(rel)
        if (!visited.has(rel.target)) queue.push(rel.target)
      }
    }

    return { classes, relations }
  }

  buildCompanyGraph(companyId: string): KnowledgeGraph {
    const cached = this.companyGraphs.get(companyId)
    if (cached) return cached

    const memory = memoryStore.getRecent(companyId, 200)
    const summary = memoryStore.summarize(companyId)

    const nodes: KnowledgeGraphNode[] = []
    const edges: KnowledgeGraphEdge[] = []

    // Root node: the company itself
    nodes.push({
      id: `company:${companyId}`,
      type: "ent:Enterprise",
      label: "Empresa",
      description: "Empresa analizada por BI OS",
      domain: "ontology",
      properties: { memoryEntries: summary.total },
    })

    // Build nodes from memory content
    const entityTypes = new Map<string, { count: number; types: Set<string> }>()

    for (const entry of memory) {
      if (entry.clientId) {
        const key = `entity:${entry.clientId}`
        if (!entityTypes.has(key)) {
          entityTypes.set(key, { count: 0, types: new Set() })
        }
        const ent = entityTypes.get(key)!
        ent.count++
        ent.types.add(entry.type)
      }
      for (const tag of entry.tags) {
        const key = `tag:${tag}`
        if (!entityTypes.has(key)) {
          entityTypes.set(key, { count: 0, types: new Set() })
        }
        const ent = entityTypes.get(key)!
        ent.count++
        ent.types.add(entry.type)
      }
    }

    for (const [key, info] of entityTypes) {
      const isEntity = key.startsWith("entity:")
      const label = isEntity ? key.replace("entity:", "") : key.replace("tag:", "")
      const type = isEntity ? "ent:Client" : "ent:BusinessCapability"

      nodes.push({
        id: key,
        type,
        label,
        description: `${info.count} events recorded`,
        domain: "ontology",
        properties: { count: info.count, types: Array.from(info.types) },
      })

      edges.push({
        source: `company:${companyId}`,
        target: key,
        type: isEntity ? "supports" : "composed_of",
        label: isEntity ? "se relaciona con" : "tiene",
        weight: Math.min(info.count / 10, 1),
      })
    }

    // Add memory-type summary nodes
    const typeColors: Record<string, string> = {
      decision: "ent:Decision",
      risk: "ent:BusinessRisk",
      kpi_change: "ent:KPI",
      meeting: "ent:BusinessEvent",
      task: "ent:BusinessProcess",
      recommendation: "ent:BestPractice",
      alert: "ent:BusinessRisk",
    }

    for (const [type, ontologyType] of Object.entries(typeColors)) {
      const count = summary.byType[type]
      if (count && count > 0) {
        const typeNodeId = `type:${type}`
        if (!nodes.find((n) => n.id === typeNodeId)) {
          const cls = enterpriseOntology.find((c) => c.id === ontologyType)
          nodes.push({
            id: typeNodeId,
            type: ontologyType,
            label: cls?.name || type,
            description: `${count} registros de tipo ${type}`,
            domain: "ontology",
            properties: { count },
          })
          edges.push({
            source: `company:${companyId}`,
            target: typeNodeId,
            type: "composed_of",
            label: `tiene ${count} ${type}`,
            weight: Math.min(count / 20, 1),
          })
        }
      }
    }

    const graph: KnowledgeGraph = { nodes, edges }
    this.companyGraphs.set(companyId, graph)
    return graph
  }

  queryCompanyGraph(companyId: string, type?: string): KnowledgeGraph {
    const graph = this.buildCompanyGraph(companyId)
    if (!type) return graph

    return {
      nodes: graph.nodes.filter((n) => n.type === type || n.id === `company:${companyId}`),
      edges: graph.edges.filter(
        (e) =>
          (graph.nodes.find((n) => n.id === e.source)?.type === type || e.source === `company:${companyId}`) &&
          (graph.nodes.find((n) => n.id === e.target)?.type === type || e.target === `company:${companyId}`),
      ),
    }
  }

  getCompanyContext(companyId: string): string {
    const graph = this.buildCompanyGraph(companyId)
    if (graph.nodes.length <= 1) return "Sin datos suficientes para construir el grafo de conocimiento."

    const types = new Map<string, number>()
    for (const node of graph.nodes) {
      const t = node.type.replace("ent:", "")
      types.set(t, (types.get(t) || 0) + 1)
    }

    let context = "## Grafo de Conocimiento Empresarial\n\n"
    context += `**Nodos:** ${graph.nodes.length} | **Relaciones:** ${graph.edges.length}\n\n`
    context += "### Tipos de entidades\n"
    for (const [type, count] of types) {
      if (type !== "Enterprise") context += `- ${type}: ${count}\n`
    }
    context += "\n### Relaciones principales\n"
    for (const edge of graph.edges.slice(0, 10)) {
      const sourceLabel = graph.nodes.find((n) => n.id === edge.source)?.label || edge.source
      const targetLabel = graph.nodes.find((n) => n.id === edge.target)?.label || edge.target
      context += `- ${sourceLabel} → ${edge.label} → ${targetLabel}\n`
    }

    return context
  }

  clearCompany(companyId: string) {
    this.companyGraphs.delete(companyId)
  }
}

export const knowledgeGraph = new KnowledgeGraphEngine()
