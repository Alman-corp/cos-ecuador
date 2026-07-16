export interface SimParams {
  daysReceivable: number
  daysPayable: number
  interestRate: number
  revenueGrowth: number
  opexGrowth: number
  initialCash: number
  monthlyRevenue: number
}

export interface MonthProjection {
  month: string
  balance: number
  inflow: number
  outflow: number
  netCash: number
}

export interface SimulationResult {
  timeline: MonthProjection[]
  cashIn: number
  cashOut: number
  interestCost: number
  netCash: number
  finalBalance: number
  runway: number
  isHealthy: boolean
  avgRunwayMonths: number
  probPositiveCash: number
}

export interface Scenario {
  label: string
  description: string
  color: string
  border: string
  params: Partial<SimParams>
}

export interface StressAnalysis {
  base: SimulationResult
  scenarios: Array<{ label: string; color: string; border: string; result: SimulationResult }>
}
