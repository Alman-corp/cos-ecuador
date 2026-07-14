// @llm-engineer — DO NOT MODIFY WITHOUT APPROVAL
export interface GraphEntity {
  id: string
  name: string
  type: "company" | "metric" | "person" | "concept" | "product"
  properties: Record<string, string>
}

export interface GraphRelation {
  sourceId: string
  targetId: string
  relation: string
  strength: number
  evidence: string
}

const ENTITIES: GraphEntity[] = [
  { id: "tsla", name: "Tesla", type: "company", properties: { sector: "Automotive", ticker: "TSLA", revenue: "$94.8B" } },
  { id: "byd", name: "BYD", type: "company", properties: { sector: "Automotive", region: "China" } },
  { id: "vw", name: "Volkswagen", type: "company", properties: { sector: "Automotive", region: "Europe" } },
  { id: "ebitda", name: "EBITDA", type: "metric", properties: { value: "$14.6B", margin: "15.4%" } },
  { id: "fcf", name: "Free Cash Flow", type: "metric", properties: { value: "$6.2B", yield: "1.7%" } },
  { id: "revenue", name: "Revenue", type: "metric", properties: { value: "$94.8B", growth: "12.3%" } },
  { id: "margin", name: "Operating Margin", type: "metric", properties: { value: "16.5%", trend: "improving" } },
  { id: "elon", name: "Elon Musk", type: "person", properties: { role: "CEO", company: "Tesla" } },
  { id: "dcf", name: "DCF Valuation", type: "concept", properties: { method: "Discounted Cash Flow", wacc: "12%" } },
  { id: "model-y", name: "Model Y", type: "product", properties: { segment: "SUV", volume: "highest" } },
]

const RELATIONS: GraphRelation[] = [
  { sourceId: "tsla", targetId: "ebitda", relation: "reports", strength: 1.0, evidence: "Q4 2025 earnings" },
  { sourceId: "tsla", targetId: "revenue", relation: "generates", strength: 1.0, evidence: "Annual report" },
  { sourceId: "tsla", targetId: "fcf", relation: "produces", strength: 0.9, evidence: "Cash flow statement" },
  { sourceId: "tsla", targetId: "margin", relation: "achieves", strength: 0.9, evidence: "Margin analysis" },
  { sourceId: "tsla", targetId: "elon", relation: "led_by", strength: 1.0, evidence: "SEC filing" },
  { sourceId: "tsla", targetId: "model-y", relation: "manufactures", strength: 1.0, evidence: "Product lineup" },
  { sourceId: "tsla", targetId: "dcf", relation: "valued_by", strength: 0.7, evidence: "Analyst report" },
  { sourceId: "tsla", targetId: "byd", relation: "competes_with", strength: 0.9, evidence: "Market analysis" },
  { sourceId: "tsla", targetId: "vw", relation: "competes_with", strength: 0.7, evidence: "Market analysis" },
  { sourceId: "ebitda", targetId: "revenue", relation: "derived_from", strength: 0.8, evidence: "Income statement" },
  { sourceId: "fcf", targetId: "ebitda", relation: "depends_on", strength: 0.6, evidence: "Cash flow logic" },
]

export function getEntities(): GraphEntity[] { return ENTITIES }
export function getRelations(): GraphRelation[] { return RELATIONS }

export function graphSearch(query: string): { entities: GraphEntity[]; relations: GraphRelation[]; context: string } {
  const q = query.toLowerCase()
  const matchedEntities = ENTITIES.filter((e) =>
    e.name.toLowerCase().includes(q) || e.type.toLowerCase().includes(q) ||
    Object.values(e.properties).some((v) => v.toLowerCase().includes(q))
  )

  const matchedIds = new Set(matchedEntities.map((e) => e.id))
  const matchedRelations = RELATIONS.filter((r) => matchedIds.has(r.sourceId) || matchedIds.has(r.targetId))

  // Add connected entities (2-hop expansion)
  const connectedIds = new Set(matchedIds)
  for (const r of matchedRelations) {
    connectedIds.add(r.sourceId)
    connectedIds.add(r.targetId)
  }
  const connectedEntities = ENTITIES.filter((e) => connectedIds.has(e.id))

  const context = buildGraphContext(connectedEntities, matchedRelations)
  return { entities: connectedEntities, relations: matchedRelations, context }
}

function buildGraphContext(entities: GraphEntity[], relations: GraphRelation[]): string {
  const parts: string[] = []
  for (const e of entities) {
    const outgoing = relations.filter((r) => r.sourceId === e.id)
    for (const r of outgoing) {
      const target = entities.find((en) => en.id === r.targetId)
      if (target) {
        parts.push(`${e.name} ${r.relation} ${target.name} (${r.evidence})`)
      }
    }
  }
  return parts.join("\n")
}

export function getEntityConnections(entityId: string, depth: number = 2): { entities: GraphEntity[]; relations: GraphRelation[] } {
  let visitedEntities = new Set<string>([entityId])
  let currentLayer = new Set<string>([entityId])

  for (let i = 0; i < depth; i++) {
    const nextLayer = new Set<string>()
    for (const eid of currentLayer) {
      const connected = RELATIONS.filter((r) => r.sourceId === eid || r.targetId === eid)
      for (const r of connected) {
        if (!visitedEntities.has(r.sourceId)) { nextLayer.add(r.sourceId); visitedEntities.add(r.sourceId) }
        if (!visitedEntities.has(r.targetId)) { nextLayer.add(r.targetId); visitedEntities.add(r.targetId) }
      }
    }
    currentLayer = nextLayer
  }

  return {
    entities: ENTITIES.filter((e) => visitedEntities.has(e.id)),
    relations: RELATIONS.filter((r) => visitedEntities.has(r.sourceId) && visitedEntities.has(r.targetId)),
  }
}
