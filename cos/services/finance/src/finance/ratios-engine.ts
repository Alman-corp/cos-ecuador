import { Injectable } from "@nestjs/common"

export interface FinancialInput {
  currentAssets: number
  currentLiabilities: number
  totalAssets: number
  totalLiabilities: number
  equity: number
  revenue: number
  netIncome: number
  ebit: number
  inventory: number
  accountsReceivable: number
  cogs: number
  ebitda: number
  interestExpense: number
  cash: number
  accountsPayable: number
  workingCapital: number
}

export interface RiskSignal {
  metric: string
  severity: "low" | "medium" | "high" | "critical"
  message: string
  value: number
  threshold: number
}

@Injectable()
export class RatiosEngine {
  calculate(data: FinancialInput, prevData?: FinancialInput) {
    const ratios = {
      liquidity: {
        currentRatio: data.currentLiabilities ? +(data.currentAssets / data.currentLiabilities).toFixed(2) : null,
        quickRatio: data.currentLiabilities ? +((data.currentAssets - data.inventory) / data.currentLiabilities).toFixed(2) : null,
        cashRatio: data.currentLiabilities ? +(data.cash / data.currentLiabilities).toFixed(2) : null,
        workingCapitalRatio: data.totalAssets ? +(data.workingCapital / data.totalAssets).toFixed(2) : null,
      },
      solvency: {
        debtToEquity: data.equity ? +(data.totalLiabilities / data.equity).toFixed(2) : null,
        debtRatio: data.totalAssets ? +(data.totalLiabilities / data.totalAssets).toFixed(2) : null,
        equityRatio: data.totalAssets ? +((data.equity / data.totalAssets) * 100).toFixed(2) : null,
        interestCoverage: data.interestExpense ? +(data.ebit / data.interestExpense).toFixed(2) : null,
      },
      profitability: {
        netMargin: data.revenue ? +((data.netIncome / data.revenue) * 100).toFixed(2) : null,
        operatingMargin: data.revenue ? +((data.ebit / data.revenue) * 100).toFixed(2) : null,
        roa: data.totalAssets ? +((data.netIncome / data.totalAssets) * 100).toFixed(2) : null,
        roe: data.equity ? +((data.netIncome / data.equity) * 100).toFixed(2) : null,
        ebitdaMargin: data.revenue ? +((data.ebitda / data.revenue) * 100).toFixed(2) : null,
      },
      efficiency: {
        assetTurnover: data.totalAssets ? +(data.revenue / data.totalAssets).toFixed(2) : null,
        inventoryTurnover: data.inventory ? +(data.cogs / data.inventory).toFixed(2) : null,
        receivablesTurnover: data.accountsReceivable ? +(data.revenue / data.accountsReceivable).toFixed(2) : null,
        payablesTurnover: data.accountsPayable ? +(data.cogs / data.accountsPayable).toFixed(2) : null,
      },
    }

    const signals = this.detectRiskSignals(data, ratios)
    const change = prevData ? this.calculateChange(ratios, prevData) : null

    return { ratios, signals, change }
  }

  private detectRiskSignals(data: FinancialInput, ratios: any): RiskSignal[] {
    const signals: RiskSignal[] = []

    if (ratios.liquidity.currentRatio !== null && ratios.liquidity.currentRatio < 1.0) {
      signals.push({ metric: "current_ratio", severity: "critical", message: "Capital de trabajo negativo — riesgo de liquidez inmediato", value: ratios.liquidity.currentRatio, threshold: 1.0 })
    } else if (ratios.liquidity.currentRatio !== null && ratios.liquidity.currentRatio < 1.5) {
      signals.push({ metric: "current_ratio", severity: "high", message: "Liquidez por debajo del nivel recomendado", value: ratios.liquidity.currentRatio, threshold: 1.5 })
    }

    if (ratios.solvency.debtToEquity !== null && ratios.solvency.debtToEquity > 3.0) {
      signals.push({ metric: "debt_to_equity", severity: "critical", message: "Apalancamiento excesivo — riesgo de insolvencia", value: ratios.solvency.debtToEquity, threshold: 3.0 })
    } else if (ratios.solvency.debtToEquity !== null && ratios.solvency.debtToEquity > 2.0) {
      signals.push({ metric: "debt_to_equity", severity: "high", message: "Apalancamiento elevado", value: ratios.solvency.debtToEquity, threshold: 2.0 })
    }

    if (ratios.solvency.interestCoverage !== null && ratios.solvency.interestCoverage < 1.5) {
      signals.push({ metric: "interest_coverage", severity: "critical", message: "EBIT insuficiente para cubrir intereses", value: ratios.solvency.interestCoverage, threshold: 1.5 })
    } else if (ratios.solvency.interestCoverage !== null && ratios.solvency.interestCoverage < 3.0) {
      signals.push({ metric: "interest_coverage", severity: "high", message: "Cobertura de intereses ajustada", value: ratios.solvency.interestCoverage, threshold: 3.0 })
    }

    if (ratios.profitability.netMargin !== null && ratios.profitability.netMargin < 0) {
      signals.push({ metric: "net_margin", severity: "critical", message: "Margen neto negativo — pérdidas operativas", value: ratios.profitability.netMargin, threshold: 0 })
    }

    if (ratios.profitability.roe !== null && ratios.profitability.roe < 5) {
      signals.push({ metric: "roe", severity: "medium", message: "Rendimiento sobre capital por debajo del costo de oportunidad", value: ratios.profitability.roe, threshold: 5 })
    }

    if (ratios.liquidity.cashRatio !== null && ratios.liquidity.cashRatio < 0.2) {
      signals.push({ metric: "cash_ratio", severity: "high", message: "Efectivo insuficiente para obligaciones inmediatas", value: ratios.liquidity.cashRatio, threshold: 0.2 })
    }

    if (ratios.efficiency.receivablesTurnover !== null && ratios.efficiency.receivablesTurnover < 4) {
      signals.push({ metric: "receivables_turnover", severity: "medium", message: "Cobranza lenta — posible riesgo de incobrabilidad", value: ratios.efficiency.receivablesTurnover, threshold: 4 })
    }

    return signals
  }

  private calculateChange(ratios: any, prev: FinancialInput) {
    const prevCurrentRatio = prev.currentLiabilities ? prev.currentAssets / prev.currentLiabilities : null
    const prevNetMargin = prev.revenue ? (prev.netIncome / prev.revenue) * 100 : null
    const prevRoa = prev.totalAssets ? (prev.netIncome / prev.totalAssets) * 100 : null
    const prevRoe = prev.equity ? (prev.netIncome / prev.equity) * 100 : null
    return {
      currentRatio: prevCurrentRatio ? +((ratios.liquidity.currentRatio - prevCurrentRatio) / prevCurrentRatio * 100).toFixed(1) : null,
      netMargin: prevNetMargin ? +((ratios.profitability.netMargin - prevNetMargin) / prevNetMargin * 100).toFixed(1) : null,
      roa: prevRoa ? +((ratios.profitability.roa - prevRoa) / prevRoa * 100).toFixed(1) : null,
      roe: prevRoe ? +((ratios.profitability.roe - prevRoe) / prevRoe * 100).toFixed(1) : null,
    }
  }
}
