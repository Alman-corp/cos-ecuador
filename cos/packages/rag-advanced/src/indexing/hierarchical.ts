import type { AdvancedChunk } from "../types"

interface HierarchicalNode {
  id: string
  level: "summary" | "section" | "verbatim"
  title: string
  content: string
  children: HierarchicalNode[]
  metadata: Record<string, unknown>
  sourceChunks: string[]
}

export class HierarchicalIndexer {
  build(chunks: AdvancedChunk[]): HierarchicalNode[] {
    const grouped = this.groupByDocument(chunks)
    return grouped.map(([docId, docChunks]) => this.buildDocTree(docId, docChunks))
  }

  expand(nodes: HierarchicalNode[], chunkMap: Map<string, AdvancedChunk>): AdvancedChunk[] {
    const results: AdvancedChunk[] = []
    const visit = (node: HierarchicalNode) => {
      if (node.level === "verbatim") {
        for (const id of node.sourceChunks) {
          const c = chunkMap.get(id)
          if (c) results.push(c)
        }
      }
      for (const child of node.children) visit(child)
    }
    for (const n of nodes) visit(n)
    return results
  }

  pathToNode(nodes: HierarchicalNode[], targetId: string): HierarchicalNode[] {
    const path: HierarchicalNode[] = []
    const find = (node: HierarchicalNode): boolean => {
      path.push(node)
      if (node.id === targetId) return true
      for (const child of node.children) if (find(child)) return true
      path.pop()
      return false
    }
    for (const n of nodes) if (find(n)) break
    return path
  }

  private groupByDocument(chunks: AdvancedChunk[]): Map<string, AdvancedChunk[]> {
    const map = new Map<string, AdvancedChunk[]>()
    for (const c of chunks) {
      if (!map.has(c.document_id)) map.set(c.document_id, [])
      map.get(c.document_id)!.push(c)
    }
    return map
  }

  private buildDocTree(docId: string, chunks: AdvancedChunk[]): HierarchicalNode {
    const summary = chunks.slice(0, 3).map((c) => c.text).join(" ").slice(0, 500)
    const sections = new Map<string, AdvancedChunk[]>()
    for (const c of chunks) {
      const key = c.section ?? "general"
      if (!sections.has(key)) sections.set(key, [])
      sections.get(key)!.push(c)
    }
    const sectionNodes: HierarchicalNode[] = []
    for (const [sectionName, sectionChunks] of sections) {
      const sectionSummary = sectionChunks.map((c) => c.text).join(" ").slice(0, 300)
      sectionNodes.push({
        id: `${docId}-section-${sectionName}`,
        level: "section",
        title: sectionName,
        content: sectionSummary,
        children: sectionChunks.map((c) => ({
          id: c.id,
          level: "verbatim" as const,
          title: c.heading_path.slice(-1)[0] ?? `Chunk ${c.chunk_index}`,
          content: c.text.slice(0, 200),
          children: [],
          metadata: { page: c.page, paragraph: c.chunk_index },
          sourceChunks: [c.id],
        })),
        metadata: { count: sectionChunks.length },
        sourceChunks: sectionChunks.map((c) => c.id),
      })
    }
    return {
      id: `${docId}-summary`,
      level: "summary",
      title: docId,
      content: summary,
      children: sectionNodes,
      metadata: { totalChunks: chunks.length },
      sourceChunks: chunks.map((c) => c.id),
    }
  }
}
