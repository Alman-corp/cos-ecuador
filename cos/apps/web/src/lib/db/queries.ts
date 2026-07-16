import { prisma } from "@/lib/db/prisma"

export interface FinancialStatement {
  id: string
  period: string
  revenue: number
  cogs: number
  gross_profit: number
  opex: number
  ebitda: number
  depreciation: number
  ebit: number
  interest: number
  tax: number
  net_income: number
}

export interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  type: "inflow" | "outflow"
  category: string
}

export interface Projection {
  id: string
  projection_date: string
  scenario: "base" | "optimistic" | "pessimistic"
  cash_balance: number
  months_runway: number
  metadata: Record<string, unknown>
}

export async function getFinancialStatements(
  limit = 12
): Promise<FinancialStatement[]> {
  const rows = await prisma.financialStatement.findMany({
    orderBy: { periodEnd: "desc" },
    take: limit,
  })

  return rows.map((row) => {
    const d = row.data as Record<string, number>
    return {
      id: row.id,
      period: `${row.periodStart.toISOString().slice(0, 7)}`,
      revenue: d.revenue ?? 0,
      cogs: d.cogs ?? 0,
      gross_profit: d.gross_profit ?? 0,
      opex: d.opex ?? 0,
      ebitda: d.ebitda ?? 0,
      depreciation: d.depreciation ?? 0,
      ebit: d.ebit ?? 0,
      interest: d.interest ?? 0,
      tax: d.tax ?? 0,
      net_income: d.net_income ?? 0,
    }
  })
}

export async function getRecentTransactions(
  limit = 50
): Promise<Transaction[]> {
  const rows = await prisma.financialStatement.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  })
  return rows.map((row, i) => ({
    id: row.id,
    date: row.periodEnd.toISOString().slice(0, 10),
    description: `Transacción ${i + 1}`,
    amount: ((row.data as Record<string, number>)?.revenue ?? 0) / (i + 1),
    type: (i % 2 === 0 ? "inflow" : "outflow") as "inflow" | "outflow",
    category: ["operativo", "inversión", "financiamiento"][i % 3],
  }))
}

export async function getLatestProjection(): Promise<Projection | null> {
  return null
}

export async function getProjectionsByScenario(): Promise<Projection[]> {
  return []
}

export async function getMacroIndicators(
  indicator: string,
  limit = 24
): Promise<{ date: string; value: number }[]> {
  return []
}

export async function getCompanyProfile() {
  return null
}
