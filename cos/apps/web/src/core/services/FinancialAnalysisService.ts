export interface FinancialData {
  currentAssets: number
  cash: number
  accountsReceivable: number
  inventory: number
  nonCurrentAssets: number
  totalAssets: number
  currentLiabilities: number
  longTermDebt: number
  totalLiabilities: number
  equity: number
  revenue: number
  cogs: number
  grossProfit: number
  opex: number
  ebitda: number
  netIncome: number
}

export interface FinancialRatios {
  liquidity: { current: number; quick: number; cash: number }
  solvency: { debtToEquity: number; debtRatio: number }
  profitability: { grossMargin: number; operatingMargin: number; netMargin: number; roe: number; roa: number }
  efficiency: { assetTurnover: number; inventoryTurnover: number }
}

export class FinancialAnalysisService {
  calculateRatios(data: FinancialData): FinancialRatios {
    return {
      liquidity: {
        current: data.currentAssets / (data.currentLiabilities || 1),
        quick: (data.currentAssets - data.inventory) / (data.currentLiabilities || 1),
        cash: data.cash / (data.currentLiabilities || 1),
      },
      solvency: {
        debtToEquity: data.totalLiabilities / (data.equity || 1),
        debtRatio: data.totalLiabilities / (data.totalAssets || 1),
      },
      profitability: {
        grossMargin: data.grossProfit / (data.revenue || 1),
        operatingMargin: data.ebitda / (data.revenue || 1),
        netMargin: data.netIncome / (data.revenue || 1),
        roe: data.netIncome / (data.equity || 1),
        roa: data.netIncome / (data.totalAssets || 1),
      },
      efficiency: {
        assetTurnover: data.revenue / (data.totalAssets || 1),
        inventoryTurnover: data.cogs / (data.inventory || 1),
      },
    }
  }

  assessHealth(ratios: FinancialRatios): { score: number; status: string; alerts: string[] } {
    const alerts: string[] = []
    let score = 100

    if (ratios.liquidity.current < 1.2) { score -= 15; alerts.push("Liquidez crítica: ratio corriente < 1.2") }
    else if (ratios.liquidity.current < 1.5) { score -= 5 }
    else { score += 5 }

    if (ratios.liquidity.quick < 0.8) { score -= 10; alerts.push("Prueba ácida baja: < 0.8") }

    if (ratios.solvency.debtToEquity > 2.0) { score -= 15; alerts.push("Endeudamiento alto: D/E > 2.0") }
    else if (ratios.solvency.debtToEquity > 1.0) { score -= 5 }

    if (ratios.profitability.netMargin < 0.02) { score -= 10; alerts.push("Margen neto muy bajo") }
    else if (ratios.profitability.netMargin < 0.05) { score -= 3 }

    if (ratios.profitability.roe < 0.05) { score -= 5 }

    const status = score >= 80 ? "healthy" : score >= 50 ? "warning" : "critical"
    return { score, status, alerts }
  }
}

export const financialAnalysisService = new FinancialAnalysisService()
