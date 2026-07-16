import { ifrsConcepts, ifrsConceptMap, type IFRSConcept } from "./concepts"

export interface ValidationRule {
  id: string
  name: string
  description: string
  severity: "error" | "warning" | "info"
  validate: (data: Record<string, number>) => ValidationResult
}

export interface ValidationResult {
  ruleId: string
  passed: boolean
  message: string
  severity: "error" | "warning" | "info"
  affectedConcepts: string[]
  expected?: number
  actual?: number
  difference?: number
}

export interface ValidationReport {
  companyId: string
  period: string
  timestamp: string
  totalRules: number
  passed: number
  warnings: number
  errors: number
  results: ValidationResult[]
  score: number
}

export const validationRules: ValidationRule[] = [
  {
    id: "val-bal-001",
    name: "Balance General Cuadrado",
    description: "Activos deben ser igual a Pasivos + Patrimonio",
    severity: "error",
    validate: (data) => {
      const assets = data["ifrs-full:Assets"] || (data["ifrs-full:CurrentAssets"] || 0) + (data["ifrs-full:NoncurrentAssets"] || 0)
      const liabilities = data["ifrs-full:Liabilities"] || (data["ifrs-full:CurrentLiabilities"] || 0) + (data["ifrs-full:NoncurrentLiabilities"] || 0)
      const equity = data["ifrs-full:Equity"] || 0
      const totalEqLiab = liabilities + equity
      const diff = Math.abs(assets - totalEqLiab)
      return {
        ruleId: "val-bal-001", severity: "error",
        passed: diff < 1,
        message: diff < 1 ? "Balance cuadrado correctamente" : `Diferencia: $${diff.toFixed(2)}. Activos (${assets.toFixed(2)}) ≠ Pasivos+Patrimonio (${totalEqLiab.toFixed(2)})`,
        affectedConcepts: ["ifrs-full:Assets", "ifrs-full:Liabilities", "ifrs-full:Equity"],
        expected: assets, actual: totalEqLiab, difference: diff,
      }
    },
  },
  {
    id: "val-bal-002",
    name: "Activo Corriente ≤ Activo Total",
    description: "El activo corriente no debe exceder el activo total",
    severity: "error",
    validate: (data) => {
      const current = data["ifrs-full:CurrentAssets"] || 0
      const total = data["ifrs-full:Assets"] || current
      return {
        ruleId: "val-bal-002", severity: "error",
        passed: current <= total + 1,
        message: current <= total + 1 ? "OK" : `Activo corriente ($${current}) excede activo total ($${total})`,
        affectedConcepts: ["ifrs-full:CurrentAssets", "ifrs-full:Assets"],
        expected: total, actual: current, difference: current - total,
      }
    },
  },
  {
    id: "val-bal-003",
    name: "Activos No Corrientes No Negativos",
    description: "Los activos no corrientes no deben ser negativos",
    severity: "error",
    validate: (data) => {
      const value = data["ifrs-full:NoncurrentAssets"] || 0
      return {
        ruleId: "val-bal-003", severity: "error",
        passed: value >= 0,
        message: value >= 0 ? "OK" : `Activos no corrientes negativos: $${value}`,
        affectedConcepts: ["ifrs-full:NoncurrentAssets"],
        expected: 0, actual: value,
      }
    },
  },
  {
    id: "val-inc-001",
    name: "Resultado Neta Consistente",
    description: "ProfitLoss debe ser igual a ingresos - gastos (cuando todas las partidas están presentes)",
    severity: "warning",
    validate: (data) => {
      const revenue = data["ifrs-full:Revenue"] || 0
      const costSales = data["ifrs-full:CostOfSales"] || 0
      const sellExp = data["ifrs-full:SellingAndDistributionExpenses"] || 0
      const adminExp = data["ifrs-full:AdministrativeExpenses"] || 0
      const finIncome = data["ifrs-full:FinanceIncome"] || 0
      const finCosts = data["ifrs-full:FinanceCosts"] || 0
      const tax = data["ifrs-full:IncomeTaxExpenseContinuingOperations"] || 0
      const netIncome = data["ifrs-full:ProfitLoss"] || 0

      if (revenue === 0 && netIncome === 0) return { ruleId: "val-inc-001", severity: "warning", passed: true, message: "Sin datos para validar", affectedConcepts: [] }

      const calculated = revenue - costSales - sellExp - adminExp + finIncome - finCosts - tax
      const diff = Math.abs(calculated - netIncome)
      return {
        ruleId: "val-inc-001", severity: "warning",
        passed: diff < 1 || Math.abs(diff / Math.max(Math.abs(netIncome), 1)) < 0.05,
        message: diff < 1 ? "Estado de resultados consistente" : `Diferencia detectada: calculado $${calculated.toFixed(2)} vs reportado $${netIncome.toFixed(2)}`,
        affectedConcepts: ["ifrs-full:ProfitLoss", "ifrs-full:Revenue", "ifrs-full:CostOfSales"],
        expected: calculated, actual: netIncome, difference: diff,
      }
    },
  },
  {
    id: "val-inc-002",
    name: "Margen Bruto Positivo",
    description: "El costo de ventas no debe exceder los ingresos (margen bruto negativo)",
    severity: "warning",
    validate: (data) => {
      const revenue = data["ifrs-full:Revenue"] || 0
      const costSales = data["ifrs-full:CostOfSales"] || 0
      if (revenue === 0) return { ruleId: "val-inc-002", severity: "warning", passed: true, message: "Sin datos", affectedConcepts: [] }
      return {
        ruleId: "val-inc-002", severity: "warning",
        passed: costSales < revenue,
        message: costSales < revenue ? `Margen bruto: ${((revenue - costSales) / revenue * 100).toFixed(1)}%` : `Margen bruto negativo: costo de ventas ($${costSales}) excede ingresos ($${revenue})`,
        affectedConcepts: ["ifrs-full:Revenue", "ifrs-full:CostOfSales"],
      }
    },
  },
  {
    id: "val-cash-001",
    name: "Cash Flow Balance",
    description: "La suma de flujos (operación + inversión + financiación) debe igualar la variación de efectivo",
    severity: "error",
    validate: (data) => {
      const operating = data["ifrs-full:NetCashFlowsFromOperatingActivities"] || 0
      const investing = data["ifrs-full:NetCashFlowsFromInvestingActivities"] || 0
      const financing = data["ifrs-full:NetCashFlowsFromFinancingActivities"] || 0
      const netChange = data["ifrs-full:CashAndCashEquivalentsPeriodIncreaseDecrease"] || 0

      if (operating === 0 && investing === 0 && financing === 0 && netChange === 0)
        return { ruleId: "val-cash-001", severity: "error", passed: true, message: "Sin datos", affectedConcepts: [] }

      const calculated = operating + investing + financing
      const diff = Math.abs(calculated - netChange)
      return {
        ruleId: "val-cash-001", severity: "error",
        passed: diff < 1,
        message: diff < 1 ? "Flujo de efectivo consistente" : `Suma flujos ($${calculated}) ≠ variación efectivo ($${netChange}). Diferencia: $${diff}`,
        affectedConcepts: [
          "ifrs-full:NetCashFlowsFromOperatingActivities",
          "ifrs-full:NetCashFlowsFromInvestingActivities",
          "ifrs-full:NetCashFlowsFromFinancingActivities",
          "ifrs-full:CashAndCashEquivalentsPeriodIncreaseDecrease",
        ],
        expected: calculated, actual: netChange, difference: diff,
      }
    },
  },
  {
    id: "val-cash-002",
    name: "Operating Cash Flow vs Net Income",
    description: "Alerta si el flujo operativo es consistentemente menor que la utilidad neta (calidad de ganancia baja)",
    severity: "warning",
    validate: (data) => {
      const operating = data["ifrs-full:NetCashFlowsFromOperatingActivities"]
      const netIncome = data["ifrs-full:ProfitLoss"]
      if (!operating || !netIncome || netIncome <= 0)
        return { ruleId: "val-cash-002", severity: "warning", passed: true, message: "Sin datos suficientes", affectedConcepts: [] }
      const ratio = operating / netIncome
      return {
        ruleId: "val-cash-002", severity: "warning",
        passed: ratio >= 0.5,
        message: ratio >= 1 ? "Calidad de ganancia buena (FCF > Utilidad)" : ratio >= 0.5 ? `Calidad de ganancia aceptable: ${(ratio * 100).toFixed(0)}%` : `Calidad de ganancia baja: Flujo operativo es solo ${(ratio * 100).toFixed(0)}% de la utilidad neta`,
        affectedConcepts: ["ifrs-full:NetCashFlowsFromOperatingActivities", "ifrs-full:ProfitLoss"],
      }
    },
  },
  {
    id: "val-bal-004",
    name: "Prueba de Liquidez",
    description: "Ratio de liquidez corriente = Activo Corriente / Pasivo Corriente",
    severity: "info",
    validate: (data) => {
      const ca = data["ifrs-full:CurrentAssets"] || 0
      const cl = data["ifrs-full:CurrentLiabilities"] || 0
      if (cl === 0) return { ruleId: "val-bal-004", severity: "info", passed: true, message: "Sin pasivo corriente", affectedConcepts: [] }
      const ratio = ca / cl
      return {
        ruleId: "val-bal-004", severity: "info",
        passed: ratio >= 1,
        message: `Liquidez corriente: ${ratio.toFixed(2)}x (${ratio >= 2 ? "Excelente" : ratio >= 1.5 ? "Buena" : ratio >= 1 ? "Aceptable" : "Precaución"})`,
        affectedConcepts: ["ifrs-full:CurrentAssets", "ifrs-full:CurrentLiabilities"],
      }
    },
  },
]

class IFRSValidator {
  get rules(): ValidationRule[] { return validationRules }

  validate(companyId: string, data: Record<string, number>, period: string = new Date().toISOString().slice(0, 7)): ValidationReport {
    const results = validationRules.map((rule) => rule.validate(data))

    return {
      companyId,
      period,
      timestamp: new Date().toISOString(),
      totalRules: results.length,
      passed: results.filter((r) => r.passed).length,
      warnings: results.filter((r) => !r.passed && r.severity === "warning").length,
      errors: results.filter((r) => !r.passed && r.severity === "error").length,
      results,
      score: Math.round((results.filter((r) => r.passed).length / results.length) * 100),
    }
  }

  getConceptDescription(code: string): string | undefined {
    return ifrsConceptMap.get(code)?.definition
  }

  searchConcepts(query: string): IFRSConcept[] {
    const q = query.toLowerCase()
    return Array.from(ifrsConceptMap.values()).filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.definition.toLowerCase().includes(q) ||
        c.references.some((r) => r.toLowerCase().includes(q)),
    )
  }

  getStatementMapping(): Record<string, string[]> {
    return {
      balance: getRootConcepts()
        .filter((c) => ["ifrs-full:Assets", "ifrs-full:Liabilities", "ifrs-full:Equity"].includes(c.code))
        .flatMap((c) => getTree(c.code))
        .map((c) => c.code),
      income: getTree("ifrs-full:ProfitLoss").map((c) => c.code),
      cashflow: ifrsConcepts.filter((c) => c.code.includes("CashFlow") || c.code.includes("NetCash")).map((c) => c.code),
    }
  }

  computeRatios(data: Record<string, number>): Record<string, number> {
    const ca = data["ifrs-full:CurrentAssets"] || 0
    const cl = data["ifrs-full:CurrentLiabilities"] || 0
    const inv = data["ifrs-full:CurrentInventories"] || 0
    const tl = data["ifrs-full:Liabilities"] || (data["ifrs-full:CurrentLiabilities"] || 0) + (data["ifrs-full:NoncurrentLiabilities"] || 0)
    const eq = data["ifrs-full:Equity"] || 0
    const rev = data["ifrs-full:Revenue"] || 0
    const cs = data["ifrs-full:CostOfSales"] || 0
    const ebit = data["ifrs-full:OperatingProfitLoss"] || 0
    const interest = data["ifrs-full:FinanceCosts"] || 1
    const ni = data["ifrs-full:ProfitLoss"] || 0
    const ta = data["ifrs-full:Assets"] || (ca + (data["ifrs-full:NoncurrentAssets"] || 0))
    const rec = data["ifrs-full:TradeAndOtherCurrentReceivables"] || 0

    return {
      currentRatio: cl > 0 ? ca / cl : 0,
      quickRatio: cl > 0 ? (ca - inv) / cl : 0,
      debtToEquity: eq > 0 ? tl / eq : 0,
      debtToAssets: ta > 0 ? tl / ta : 0,
      interestCoverage: interest > 0 ? ebit / interest : 0,
      netMargin: rev > 0 ? ni / rev : 0,
      grossMargin: rev > 0 ? (rev - cs) / rev : 0,
      operatingMargin: rev > 0 ? ebit / rev : 0,
      roe: eq > 0 ? ni / eq : 0,
      roa: ta > 0 ? ni / ta : 0,
      assetTurnover: ta > 0 ? rev / ta : 0,
      dso: rev > 0 && rec > 0 ? (rec / rev) * 365 : 0,
    }
  }
}

function getTree(code: string): IFRSConcept[] {
  const result: IFRSConcept[] = []
  const queue = [code]
  while (queue.length > 0) {
    const current = queue.shift()!
    const concept = ifrsConceptMap.get(current)
    if (concept) result.push(concept)
    const children = ifrsConcepts.filter((c) => c.parentCode === current)
    for (const child of children) queue.push(child.code)
  }
  return result
}

function getRootConcepts(): IFRSConcept[] {
  return ifrsConcepts.filter((c) => !c.parentCode && !c.isAbstract)
}

export const ifrsValidator = new IFRSValidator()
