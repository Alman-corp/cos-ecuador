export interface FinancialYear {
  year: number
  revenue: number
  costOfSales: number
  grossProfit: number
  operatingExpenses: number
  operatingIncome: number
  interestExpense: number
  netIncome: number
  totalAssets: number
  currentAssets: number
  cashAndEquivalents: number
  accountsReceivable: number
  inventory: number
  totalLiabilities: number
  currentLiabilities: number
  longTermDebt: number
  equity: number
  operatingCashflow: number
  investingCashflow: number
  financingCashflow: number
  employees: number
}

export interface CompanyProfile {
  id: string
  ruc: string
  name: string
  industry: string
  sector: string
  description: string
  founded: number
  status: string
}

export interface DueDiligenceCompany {
  profile: CompanyProfile
  financials: FinancialYear[]
}

export interface RatioAnalysis {
  name: string
  value: number
  benchmarkP25: number
  benchmarkP50: number
  benchmarkP75: number
  status: "healthy" | "warning" | "critical"
  unit: "x" | "%" | "días"
  interpretation: string
}

export interface RiskFinding {
  id: string
  title: string
  description: string
  severity: "critical" | "high" | "medium" | "low"
  category: "liquidity" | "solvency" | "profitability" | "efficiency" | "growth"
  value: string
  recommendation: string
}

export interface DueDiligenceReport {
  company: CompanyProfile
  years: number[]
  executiveSummary: string
  healthScore: number
  healthStatus: string
  ratios: RatioAnalysis[]
  risks: RiskFinding[]
  recommendations: string[]
  maturityScore: number
  maturityLevel: string
  generatedAt: string
}
