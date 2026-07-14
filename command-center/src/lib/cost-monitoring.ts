export interface CostEntry {
  feature: string
  costPerUser: number
  totalCost: number
  users: number
  category: "compute" | "storage" | "network" | "api" | "ai"
  timestamp: string
}

export const FEATURE_COST_MAP: Record<string, { base: number; perUser: number; category: CostEntry["category"] }> = {
  dashboard: { base: 0.02, perUser: 0.001, category: "compute" },
  "stress-simulator": { base: 0.05, perUser: 0.003, category: "compute" },
  margins: { base: 0.01, perUser: 0.001, category: "compute" },
  valuation: { base: 0.08, perUser: 0.005, category: "ai" },
  agents: { base: 0.15, perUser: 0.01, category: "ai" },
  "data-hub": { base: 0.03, perUser: 0.002, category: "storage" },
  "3d-chart": { base: 0.04, perUser: 0.002, category: "compute" },
  pdf: { base: 0.01, perUser: 0.001, category: "compute" },
  notifications: { base: 0.005, perUser: 0.0005, category: "network" },
  search: { base: 0.02, perUser: 0.001, category: "api" },
}

const STORAGE_KEY = "cos-cost-data"

function loadCostData(): CostEntry[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") }
  catch { return [] }
}

function saveCostData(data: CostEntry[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data.slice(-1000)))
}

export function calculateFeatureCosts(totalUsers: number = 1000): CostEntry[] {
  const entries: CostEntry[] = []
  for (const [feature, config] of Object.entries(FEATURE_COST_MAP)) {
    const totalCost = config.base + config.perUser * totalUsers
    entries.push({
      feature, costPerUser: config.perUser, totalCost: parseFloat(totalCost.toFixed(4)),
      users: totalUsers, category: config.category, timestamp: new Date().toISOString(),
    })
  }
  saveCostData(entries)
  return entries
}

export function getCostHistory(): CostEntry[] {
  return loadCostData()
}

export function getTotalMonthlyCost(): number {
  const data = loadCostData()
  if (data.length === 0) return 0
  const latest = data.slice(-Object.keys(FEATURE_COST_MAP).length)
  return parseFloat(latest.reduce((sum, e) => sum + e.totalCost, 0).toFixed(4))
}

export function getCostByCategory(): Record<string, number> {
  const data = loadCostData()
  if (data.length === 0) return {}
  const latest = data.slice(-Object.keys(FEATURE_COST_MAP).length)
  const byCategory: Record<string, number> = {}
  for (const entry of latest) {
    byCategory[entry.category] = (byCategory[entry.category] || 0) + entry.totalCost
  }
  return byCategory
}
