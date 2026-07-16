import { Injectable } from "@nestjs/common"

@Injectable()
export class ProjectionsEngine {
  projectDcf(params: {
    freeCashFlows: number[]
    terminalGrowthRate: number
    discountRate: number
    sharesOutstanding: number
    netDebt: number
  }) {
    const { freeCashFlows, terminalGrowthRate, discountRate, sharesOutstanding, netDebt } = params
    const wacc = discountRate / 100
    const terminalRate = terminalGrowthRate / 100
    let pvFcf = 0

    for (let i = 0; i < freeCashFlows.length; i++) {
      pvFcf += freeCashFlows[i] / Math.pow(1 + wacc, i + 1)
    }

    const terminalValue = (freeCashFlows[freeCashFlows.length - 1] * (1 + terminalRate)) / (wacc - terminalRate)
    const pvTerminal = terminalValue / Math.pow(1 + wacc, freeCashFlows.length)
    const enterpriseValue = pvFcf + pvTerminal
    const equityValue = enterpriseValue - netDebt
    const fairPrice = sharesOutstanding > 0 ? equityValue / sharesOutstanding : 0

    return {
      enterpriseValue: +enterpriseValue.toFixed(0),
      equityValue: +equityValue.toFixed(0),
      fairPrice: +fairPrice.toFixed(2),
      pvOfFcf: +pvFcf.toFixed(0),
      pvOfTerminal: +pvTerminal.toFixed(0),
      terminalValue: +terminalValue.toFixed(0),
      terminalValuePct: +((pvTerminal / enterpriseValue) * 100).toFixed(1),
    }
  }

  projectFinancialStatements(baseYear: {
    revenue: number
    cogs: number
    sgaExpenses: number
    depreciation: number
    interestExpense: number
    taxRate: number
    capex: number
    deltaWorkingCapital: number
  }, assumptions: {
    revenueGrowth: number[]
    cogsPctOfRevenue: number
    sgaPctOfRevenue: number
    depreciationPctOfCapex: number
    taxRate: number
    capexPctOfRevenue: number
    workingCapitalPctOfRevenue: number
  }) {
    const years = assumptions.revenueGrowth.length
    const statements: any[] = []
    let prevRevenue = baseYear.revenue

    for (let i = 0; i < years; i++) {
      const revenue = i === 0 ? baseYear.revenue * (1 + assumptions.revenueGrowth[i]) : prevRevenue * (1 + assumptions.revenueGrowth[i])
      const cogs = revenue * assumptions.cogsPctOfRevenue
      const grossProfit = revenue - cogs
      const sga = revenue * assumptions.sgaPctOfRevenue
      const ebitda = grossProfit - sga
      const capex = revenue * assumptions.capexPctOfRevenue
      const depreciation = capex * assumptions.depreciationPctOfCapex
      const ebit = ebitda - depreciation
      const interest = baseYear.interestExpense
      const ebt = ebit - interest
      const tax = ebt * assumptions.taxRate
      const netIncome = ebt - tax
      const deltaWc = revenue * assumptions.workingCapitalPctOfRevenue
      const fcf = netIncome + depreciation - capex - deltaWc

      statements.push({
        year: i + 1,
        revenue: +revenue.toFixed(0),
        cogs: +cogs.toFixed(0),
        grossProfit: +grossProfit.toFixed(0),
        sga: +sga.toFixed(0),
        ebitda: +ebitda.toFixed(0),
        depreciation: +depreciation.toFixed(0),
        ebit: +ebit.toFixed(0),
        interest: +interest.toFixed(0),
        ebt: +ebt.toFixed(0),
        tax: +tax.toFixed(0),
        netIncome: +netIncome.toFixed(0),
        capex: +capex.toFixed(0),
        deltaWorkingCapital: +deltaWc.toFixed(0),
        fcf: +fcf.toFixed(0),
      })

      prevRevenue = revenue
    }

    return statements
  }
}
