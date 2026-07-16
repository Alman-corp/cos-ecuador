export interface SanityWarning {
  type: "error" | "warning"
  field: string
  message: string
  severity: number
}

export interface SanityCheckResult {
  passed: boolean
  score: number
  warnings: SanityWarning[]
}

export interface FinancialDataForCheck {
  totalAssets: number
  totalLiabilities: number
  equity: number
  revenue: number
  costOfSales: number
  operatingIncome: number
  netIncome: number
  cash: number
  currentAssets: number
  currentLiabilities: number
  inventory: number
  accountsReceivable: number
}

export function runSanityChecks(data: FinancialDataForCheck): SanityCheckResult {
  const warnings: SanityWarning[] = []

  // 1. Balance debe cuadrar
  const balanceDiff = Math.abs(data.totalAssets - (data.totalLiabilities + data.equity))
  if (balanceDiff > 100) {
    warnings.push({
      type: balanceDiff > 1000 ? "error" : "warning",
      field: "balance",
      message: `Balance descuadrado por $${balanceDiff.toLocaleString()}. Activos: $${data.totalAssets.toLocaleString()}, Pasivos+Patrimonio: $${(data.totalLiabilities + data.equity).toLocaleString()}`,
      severity: balanceDiff > 1000 ? 90 : 50,
    })
  }

  // 2. Margen bruto no negativo sin razón
  const grossProfit = data.revenue - data.costOfSales
  if (grossProfit < 0) {
    warnings.push({
      type: "error",
      field: "grossMargin",
      message: `Margen bruto negativo (-$${Math.abs(grossProfit).toLocaleString()}). Verificar COGS mayor a ingresos.`,
      severity: 95,
    })
  } else if (grossProfit / data.revenue < 0.05 && data.revenue > 0) {
    warnings.push({
      type: "warning",
      field: "grossMargin",
      message: `Margen bruto muy bajo (${((grossProfit / data.revenue) * 100).toFixed(1)}%). Revisar estructura de costos.`,
      severity: 40,
    })
  }

  // 3. Utilidad coherente con impuestos
  if (data.operatingIncome > 0 && data.netIncome > 0) {
    const impliedTaxRate = (data.operatingIncome - data.netIncome) / data.operatingIncome
    if (impliedTaxRate < 0 || impliedTaxRate > 0.5) {
      warnings.push({
        type: "warning",
        field: "taxRate",
        message: `Tasa impositiva implícita anómala (${(impliedTaxRate * 100).toFixed(1)}%). Esperada ~25%.`,
        severity: 35,
      })
    }
  }

  // 4. Cash vs Revenue (fraude detection)
  if (data.revenue > 0 && data.cash / data.revenue > 1) {
    warnings.push({
      type: "warning",
      field: "cashRatio",
      message: `Efectivo ($${data.cash.toLocaleString()}) superior a ingresos anuales ($${data.revenue.toLocaleString()}). Verificar.`,
      severity: 60,
    })
  }

  // 5. Liquidez extrema
  if (data.currentLiabilities > 0) {
    const cr = data.currentAssets / data.currentLiabilities
    if (cr < 0.5) {
      warnings.push({
        type: "error",
        field: "liquidity",
        message: `Liquidez corriente crítica (${cr.toFixed(2)}x). Riesgo de insolvencia.`,
        severity: 85,
      })
    } else if (cr > 5) {
      warnings.push({
        type: "warning",
        field: "liquidity",
        message: `Liquidez corriente muy alta (${cr.toFixed(2)}x). Posible ineficiencia en uso de activos.`,
        severity: 25,
      })
    }
  }

  // 6. Endeudamiento extremo
  if (data.totalLiabilities > 0 && data.equity > 0) {
    const dte = data.totalLiabilities / data.equity
    if (dte > 5) {
      warnings.push({
        type: "error",
        field: "leverage",
        message: `Endeudamiento patrimonial crítico (${dte.toFixed(2)}x). Empresa altamente apalancada.`,
        severity: 90,
      })
    }
  }

  // 7. CxC creciendo vs Revenue (si tenemos múltiples años, esto se hace en el engine)

  const score = Math.max(0, 100 - warnings.reduce((sum, w) => sum + w.severity * (w.type === "error" ? 1 : 0.5), 0))

  return {
    passed: warnings.filter((w) => w.type === "error").length === 0,
    score,
    warnings,
  }
}
