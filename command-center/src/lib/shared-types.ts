export interface DashboardData {
  kpis: {
    revenue: number
    revenuePrev: number
    ebitda: number
    ebitdaPrev: number
    netIncome: number
    netIncomePrev: number
    freeCashFlow: number
    fcfPrev: number
    cashAndInvestments: number
    cashPrev: number
    grossMargin: number
    grossMarginPrev: number
    ebitdaMargin: number
    ebitdaMarginPrev: number
    netMargin: number
    netMarginPrev: number
    opex: number
    opexPrev: number
    revenueGrowth: number
    totalAssets: number
    totalEquity: number
    operatingCashFlow: number
    capex: number
  }
  alerts: Alert[]
  recentActivity: ActivityItem[]
}

export interface Alert {
  id: string
  severity: "critical" | "warning" | "normal"
  metric: string
  message: string
  timestamp: string
  value: number
  threshold: number
}

export interface ActivityItem {
  id: string
  type: string
  description: string
  timestamp: string
  userId?: string
  metadata?: Record<string, unknown>
}

export interface AgentStatus {
  id: string
  name: string
  status: "online" | "offline" | "busy" | "error"
  lastRun: string
  metrics: {
    totalCalls: number
    avgLatency: number
    errorRate: number
    avgScore: number
  }
}

export interface SalaGuerraState {
  sliders: {
    revenueGrowth: number
    cogsRatio: number
    opexRatio: number
    interestRate: number
    taxRate: number
    capexRatio: number
  }
  simulationParams: {
    months: number
    scenarios: SimulationScenario[]
  }
}

export interface SimulationScenario {
  label: string
  sliders: SalaGuerraState["sliders"]
}

export interface DataHubItem {
  id: string
  name: string
  type: "csv" | "xlsx" | "pdf" | "image"
  size: number
  uploadedAt: string
  uploadedBy: string
  metadata: Record<string, unknown>
  columns?: DataHubColumn[]
  rowCount?: number
  status: "pending" | "importing" | "imported" | "error"
}

export interface DataHubColumn {
  name: string
  detectedType: string
  mapped: boolean
  mappedTo?: string
}

export interface ClientPortalData {
  clientId: string
  companyName: string
  documents: DocumentSummary[]
  recentActivity: ActivityItem[]
  kpiSummary: {
    revenue: number
    ebitda: number
    cash: number
    headcount?: number
  }
}

export interface DocumentSummary {
  id: string
  title: string
  type: string
  uploadedAt: string
  status: "processing" | "ready" | "error"
  url?: string
}

export interface DirectorKPIData {
  period: string
  companyName: string
  financials: {
    revenue: { current: number; previous: number; trend: "up" | "down" }
    ebitda: { current: number; previous: number; trend: "up" | "down" }
    netIncome: { current: number; previous: number; trend: "up" | "down" }
    freeCashFlow: { current: number; previous: number; trend: "up" | "down" }
    grossMargin: { current: number; previous: number; trend: "up" | "down" }
    ebitdaMargin: { current: number; previous: number; trend: "up" | "down" }
    netMargin: { current: number; previous: number; trend: "up" | "down" }
    opex: { current: number; previous: number; trend: "up" | "down" }
  }
  valuation?: {
    enterpriseValue: number
    equityValue: number
    evEbitda: number
    peRatio: number
  }
  health: {
    liquidity: number
    solvency: number
    profitability: number
    efficiency: number
    growth: number
  }
  alerts: Alert[]
}

// ── Economic Indicators ──────────────────────────────────────────

export interface EconomicIndicators {
  tasaActiva: { value: number; fecha: string; fuente: string }
  tasaPasiva: { value: number; fecha: string; fuente: string }
  riesgoPais: { value: number; fecha: string; fuente: string }
  inflacionINPC: { value: number; periodo: string; fuente: string }
  canastaBasica: { value: number; ingresoFamiliar: number; canastaVital: number; periodo: string; fuente: string }
  sbu: { value: number; vigencia: string; fuente: string }
}

export type ResearchProjectStatus = "draft" | "active" | "completed" | "archived"

export interface ResearchProject {
  id: string
  title: string
  description: string
  status: ResearchProjectStatus
  industry?: string
  createdAt: string
  updatedAt: string
  createdBy: string
  findings?: string
  tags?: string[]
}
