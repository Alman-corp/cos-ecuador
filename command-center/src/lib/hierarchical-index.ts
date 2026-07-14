export interface HierarchicalNode {
  id: string
  level: "summary" | "detail" | "verbatim"
  title: string
  content: string
  children: HierarchicalNode[]
  parentId: string | null
  metadata: Record<string, string>
}

const HIERARCHICAL_DATA: HierarchicalNode[] = [
  {
    id: "root-1", level: "summary", title: "Tesla Financial Performance Q4 2025",
    content: "Tesla reported strong Q4 2025 results with revenue of $25.4B and EBITDA of $4.2B. Key metrics show margin expansion to 16.5% and FCF generation of $2.1B.",
    children: [
      {
        id: "detail-1", level: "detail", title: "Revenue Breakdown",
        content: "Total revenue $25.4B: Automotive $22.8B (+12% YoY), Energy $2.1B (+85% YoY), Services & Other $0.5B. Automotive regulatory credits contributed $0.4B.",
        children: [
          {
            id: "verbatim-1", level: "verbatim", title: "Revenue Note 3 - Financial Statements",
            content: "Revenue from automotive sales includes deliveries of 495,000 vehicles in Q4 2025, compared to 445,000 in Q4 2024. ASP declined 3% YoY to $46,060, offset by volume growth of 11.2%.",
            children: [], parentId: "detail-1", metadata: { source: "10-K Filing", page: "12", paragraph: "3.2" },
          },
        ],
        parentId: "root-1", metadata: { type: "financial" },
      },
      {
        id: "detail-2", level: "detail", title: "Margin Analysis",
        content: "Gross margin: 19.8% (vs 18.5% Q4 2024). Operating margin: 16.5%. EBITDA margin: 16.5%. Margin expansion driven by OpEx leverage and lower raw material costs.",
        children: [
          {
            id: "verbatim-2", level: "verbatim", title: "Margin Calculation Details",
            content: "EBITDA = $4,226M on Revenue of $25,415M = 16.62%. YoY improvement of 210bps from $3,512M on $24,318M = 14.44%. SG&A as % of revenue improved from 8.2% to 6.9%.",
            children: [], parentId: "detail-2", metadata: { source: "Earnings Release", page: "5", paragraph: "2.1" },
          },
        ],
        parentId: "root-1", metadata: { type: "financial" },
      },
    ],
    parentId: null, metadata: { period: "Q4_2025" },
  },
  {
    id: "root-2", level: "summary", title: "Valuation Analysis",
    content: "DCF valuation with 12% WACC yields Enterprise Value of $2.4M. Sensitivity analysis shows range of $1.8M-$3.1M. Current EV/EBITDA multiple of 8.2x below sector median.",
    children: [
      {
        id: "detail-3", level: "detail", title: "DCF Assumptions",
        content: "WACC: 12% (risk-free 4.5%, equity risk premium 6.5%, beta 1.15). Terminal growth: 3.5%. Projection: 5 years. FCF growth decays from 15% to 3.5%.",
        children: [], parentId: "root-2", metadata: { type: "valuation" },
      },
    ],
    parentId: null, metadata: { type: "valuation" },
  },
]

export function getHierarchicalTree(): HierarchicalNode[] {
  return HIERARCHICAL_DATA
}

export function findInHierarchy(query: string): HierarchicalNode[] {
  const q = query.toLowerCase()
  const results: HierarchicalNode[] = []

  function search(node: HierarchicalNode) {
    if (node.content.toLowerCase().includes(q) || node.title.toLowerCase().includes(q)) {
      results.push(node)
    }
    for (const child of node.children) search(child)
  }

  for (const root of HIERARCHICAL_DATA) search(root)
  return results
}

export function getHierarchicalPath(nodeId: string): HierarchicalNode[] {
  const path: HierarchicalNode[] = []

  function find(node: HierarchicalNode, target: string): boolean {
    path.push(node)
    if (node.id === target) return true
    for (const child of node.children) {
      if (find(child, target)) return true
    }
    path.pop()
    return false
  }

  for (const root of HIERARCHICAL_DATA) {
    if (find(root, nodeId)) break
  }
  return path
}

export function searchWithDrillDown(query: string): { summary: HierarchicalNode[]; detail: HierarchicalNode[]; verbatim: HierarchicalNode[] } {
  const all = findInHierarchy(query)
  return {
    summary: all.filter((n) => n.level === "summary"),
    detail: all.filter((n) => n.level === "detail"),
    verbatim: all.filter((n) => n.level === "verbatim"),
  }
}
