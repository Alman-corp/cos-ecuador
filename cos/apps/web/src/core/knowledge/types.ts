export type KnowledgeDomain =
  | "ifrs" | "tax" | "regulatory" | "kpi" | "benchmark"
  | "risk" | "control" | "process" | "capability" | "case"
  | "ontology" | "industry"

export interface KnowledgeEntry {
  id: string
  domain: KnowledgeDomain
  code: string
  name: string
  description: string
  category: string
  subcategory?: string
  tags: string[]
  relationships: KnowledgeRelationship[]
  source: string
  jurisdiction?: string
  version?: string
  effectiveDate?: string
  metadata: Record<string, any>
}

export interface KnowledgeRelationship {
  type: RelationType
  targetId: string
  targetDomain: KnowledgeDomain
  label: string
  strength?: number
}

export type RelationType =
  | "is_a" | "part_of" | "composed_of" | "depends_on"
  | "maps_to" | "calculates" | "validates" | "regulates"
  | "impacts" | "mitigates" | "triggers" | "references"
  | "requires" | "produces" | "measures" | "classifies"
  | "equivalent_to" | "derived_from" | "supersedes"
  | "conflicts_with" | "supports" | "excludes"

export interface KnowledgeQuery {
  domain?: KnowledgeDomain
  text?: string
  category?: string
  tags?: string[]
  relationType?: RelationType
  relatedTo?: string
  limit?: number
}

export interface KnowledgeGraphNode {
  id: string
  type: string
  label: string
  description: string
  domain: KnowledgeDomain
  properties: Record<string, any>
  x?: number
  y?: number
}

export interface KnowledgeGraphEdge {
  source: string
  target: string
  type: RelationType
  label: string
  weight: number
}

export interface KnowledgeGraph {
  nodes: KnowledgeGraphNode[]
  edges: KnowledgeGraphEdge[]
}

export interface KnowledgeSearchResult {
  entry: KnowledgeEntry
  score: number
  matchedBy: string[]
  path?: string[]
}
