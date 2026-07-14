export interface KGEntity {
  id: string
  name: string
  type: "company" | "metric" | "person" | "concept" | "product" | "event" | "document"
  value?: number
  change?: number
  sentiment?: "positive" | "negative" | "neutral"
  properties: Record<string, string>
}

export interface KGRelation {
  id: string
  source: string
  target: string
  relation: string
  weight: number
  evidence?: string
}

export interface KnowledgeGraph {
  entities: KGEntity[]
  relations: KGRelation[]
}

const entities: KGEntity[] = [
  { id: "e1", name: "Tesla Inc.", type: "company", properties: { ticker: "TSLA", sector: "Automotive", marketCap: "$780B" } },
  { id: "e2", name: "Revenue", type: "metric", value: 94.8, change: -2.9, sentiment: "negative", properties: { period: "FY 2025", unit: "$B" } },
  { id: "e3", name: "EBITDA", type: "metric", value: 14.6, change: -9.1, sentiment: "negative", properties: { period: "FY 2025", unit: "$B", margin: "15.4%" } },
  { id: "e4", name: "Free Cash Flow", type: "metric", value: 6.2, change: 73.7, sentiment: "positive", properties: { period: "FY 2025", unit: "$B" } },
  { id: "e5", name: "Elon Musk", type: "person", properties: { role: "CEO", tenure: "2004-present" } },
  { id: "e6", name: "Energy Storage", type: "product", value: 2.1, change: 85, sentiment: "positive", properties: { unit: "$B", growth: "85% YoY" } },
  { id: "e7", name: "Model Y", type: "product", properties: { segment: "SUV", units: "~1.2M" } },
  { id: "e8", name: "Operating Margin", type: "metric", value: 4.6, change: -36.1, sentiment: "negative", properties: { period: "FY 2025", unit: "%" } },
  { id: "e9", name: "Cash Position", type: "metric", value: 44.1, change: 5.8, sentiment: "positive", properties: { period: "FY 2025", unit: "$B" } },
  { id: "e10", name: "Cost Optimization", type: "concept", properties: { initiative: "Project Maverick" } },
  { id: "e11", name: "Gross Margin", type: "metric", value: 18.0, change: 0.1, sentiment: "neutral", properties: { period: "FY 2025", unit: "%" } },
  { id: "e12", name: "Cybertruck", type: "product", properties: { segment: "Pickup", launch: "2024" } },
  { id: "e13", name: "SG&A", type: "metric", value: 6.9, change: -15.8, sentiment: "positive", properties: { period: "Q4 2025", unit: "% of revenue" } },
  { id: "e14", name: "Operating Cash Flow", type: "metric", value: 14.7, change: 12.5, sentiment: "positive", properties: { period: "FY 2025", unit: "$B" } },
  { id: "e15", name: "CAPEX", type: "metric", value: 8.5, change: 18.1, sentiment: "negative", properties: { period: "FY 2025", unit: "$B" } },
  { id: "e16", name: "Net Income", type: "metric", value: 3.8, change: -46.5, sentiment: "negative", properties: { period: "FY 2025", unit: "$B" } },
  { id: "e17", name: "Automotive Margin", type: "metric", value: 19.8, change: 1.3, sentiment: "positive", properties: { period: "Q4 2025", unit: "%" } },
  { id: "e18", name: "Deliveries", type: "metric", value: 1.79, change: -1.1, sentiment: "neutral", properties: { period: "FY 2025", unit: "M units" } },
  { id: "e19", name: "FSD", type: "product", properties: { status: "Supervised", revenue: "recurring" } },
  { id: "e20", name: "Optimization", type: "concept", properties: { scope: "operational efficiency" } },
]

const relations: KGRelation[] = [
  { id: "r1", source: "e1", target: "e2", relation: "generates", weight: 0.95 },
  { id: "r2", source: "e1", target: "e3", relation: "generates", weight: 0.9 },
  { id: "r3", source: "e1", target: "e4", relation: "generates", weight: 0.85 },
  { id: "r4", source: "e5", target: "e1", relation: "leads", weight: 0.8 },
  { id: "r5", source: "e1", target: "e6", relation: "operates", weight: 0.7 },
  { id: "r6", source: "e1", target: "e7", relation: "produces", weight: 0.75 },
  { id: "r7", source: "e2", target: "e8", relation: "impacts", weight: 0.6 },
  { id: "r8", source: "e2", target: "e11", relation: "drives", weight: 0.65 },
  { id: "r9", source: "e3", target: "e4", relation: "enables", weight: 0.55 },
  { id: "r10", source: "e9", target: "e1", relation: "strengthens", weight: 0.7 },
  { id: "r11", source: "e10", target: "e13", relation: "improves", weight: 0.5 },
  { id: "r12", source: "e1", target: "e12", relation: "produces", weight: 0.6 },
  { id: "r13", source: "e14", target: "e4", relation: "feeds", weight: 0.75 },
  { id: "r14", source: "e15", target: "e14", relation: "reduces", weight: -0.4 },
  { id: "r15", source: "e2", target: "e16", relation: "determines", weight: 0.8 },
  { id: "r16", source: "e17", target: "e11", relation: "composes", weight: 0.6 },
  { id: "r17", source: "e18", target: "e2", relation: "drives", weight: 0.85 },
  { id: "r18", source: "e1", target: "e19", relation: "develops", weight: 0.5 },
  { id: "r19", source: "e19", target: "e2", relation: "contributes", weight: 0.3 },
  { id: "r20", source: "e20", target: "e13", relation: "optimizes", weight: 0.45 },
  { id: "r21", source: "e20", target: "e8", relation: "improves", weight: 0.5 },
  { id: "r22", source: "e5", target: "e19", relation: "champions", weight: 0.6 },
  { id: "r23", source: "e6", target: "e2", relation: "contributes", weight: 0.5 },
  { id: "r24", source: "e10", target: "e8", relation: "targets", weight: 0.55 },
  { id: "r25", source: "e2", target: "e9", relation: "accumulates", weight: 0.4 },
]

export function getKnowledgeGraph(): KnowledgeGraph {
  return { entities, relations }
}

export function findEntity(id: string): KGEntity | undefined {
  return entities.find((e) => e.id === id)
}

export function getEntityConnections(entityId: string): { entities: KGEntity[]; relations: KGRelation[] } {
  const connected = relations.filter((r) => r.source === entityId || r.target === entityId)
  const connectedIds = new Set<string>()
  connected.forEach((r) => { connectedIds.add(r.source); connectedIds.add(r.target) })
  return {
    entities: entities.filter((e) => connectedIds.has(e.id)),
    relations: connected,
  }
}

export function searchGraph(query: string): KnowledgeGraph {
  const q = query.toLowerCase()
  const matched = entities.filter((e) =>
    e.name.toLowerCase().includes(q) ||
    e.type.toLowerCase().includes(q) ||
    Object.values(e.properties).some((v) => v.toLowerCase().includes(q))
  )
  const matchedIds = new Set(matched.map((e) => e.id))
  const matchedRels = relations.filter((r) => matchedIds.has(r.source) || matchedIds.has(r.target))
  const relatedIds = new Set<string>()
  matchedRels.forEach((r) => { relatedIds.add(r.source); relatedIds.add(r.target) })
  const relatedEntities = entities.filter((e) => relatedIds.has(e.id))
  return { entities: relatedEntities, relations: matchedRels }
}
