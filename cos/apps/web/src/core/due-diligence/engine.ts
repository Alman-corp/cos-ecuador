import type { DueDiligenceCompany, DueDiligenceReport, RatioAnalysis, RiskFinding, FinancialYear } from "./types"
import { getIndustryBenchmarks } from "./benchmarks"

function calcRatios(f: FinancialYear) {
  const currentRatio = f.currentAssets / f.currentLiabilities
  const quickRatio = (f.currentAssets - f.inventory) / f.currentLiabilities
  const debtToEquity = f.totalLiabilities / (f.equity || 1)
  const netMargin = f.netIncome / f.revenue
  const operatingMargin = f.operatingIncome / f.revenue
  const grossMargin = f.grossProfit / f.revenue
  const roe = f.netIncome / (f.equity || 1)
  const roa = f.netIncome / (f.totalAssets || 1)
  const assetTurnover = f.revenue / (f.totalAssets || 1)
  const interestCoverage = f.operatingIncome / (f.interestExpense || 1)
  const debtRatio = f.totalLiabilities / (f.totalAssets || 1)
  return { currentRatio, quickRatio, debtToEquity, netMargin, operatingMargin, grossMargin, roe, roa, assetTurnover, interestCoverage, debtRatio }
}

function getStatus(value: number, p25: number, p75: number, inverse = false): RatioAnalysis["status"] {
  if (inverse) {
    if (value <= p25) return "healthy"
    if (value <= p75) return "warning"
    return "critical"
  }
  if (value >= p75) return "healthy"
  if (value >= p25) return "warning"
  return "critical"
}

function interpretRatio(name: string, value: number, status: RatioAnalysis["status"], unit: string): string {
  const statusText = status === "healthy" ? "saludable" : status === "warning" ? "requiere atención" : "crítico"
  const formatted = unit === "%" ? `${(value * 100).toFixed(1)}%` : value.toFixed(2)
  return `${name}: ${formatted} — nivel ${statusText}`
}

export function generateReport(company: DueDiligenceCompany): DueDiligenceReport {
  const { profile, financials } = company
  const latest = financials[0]
  const prev = financials[1]
  const benchmarks = getIndustryBenchmarks(profile.industry)

  const ratios = calcRatios(latest)
  const prevRatios = prev ? calcRatios(prev) : null

  const ratioDefs = [
    { name: "Liquidez Corriente", key: "currentRatio" as const, unit: "x" as const, inverse: false, bKey: "currentRatio" as const },
    { name: "Prueba Ácida", key: "quickRatio" as const, unit: "x" as const, inverse: false, bKey: "currentRatio" as const },
    { name: "Endeudamiento Patrimonial", key: "debtToEquity" as const, unit: "x" as const, inverse: true, bKey: "debtToEquity" as const },
    { name: "Margen Neto", key: "netMargin" as const, unit: "%" as const, inverse: false, bKey: "netMargin" as const },
    { name: "Margen Operativo", key: "operatingMargin" as const, unit: "%" as const, inverse: false, bKey: "netMargin" as const },
    { name: "ROE", key: "roe" as const, unit: "%" as const, inverse: false, bKey: "roe" as const },
    { name: "ROA", key: "roa" as const, unit: "%" as const, inverse: false, bKey: "roa" as const },
    { name: "Rotación de Activos", key: "assetTurnover" as const, unit: "x" as const, inverse: false, bKey: "currentRatio" as const },
    { name: "Cobertura de Intereses", key: "interestCoverage" as const, unit: "x" as const, inverse: false, bKey: "currentRatio" as const },
  ]

  const ratioAnalysis: RatioAnalysis[] = ratioDefs.map((def) => {
    const value = ratios[def.key]
    const b = benchmarks[def.bKey] || { p25: 0.5, p50: 1.0, p75: 1.5 }
    const status = getStatus(value, b.p25, b.p75, def.inverse)
    return { name: def.name, value, benchmarkP25: b.p25, benchmarkP50: b.p50, benchmarkP75: b.p75, status, unit: def.unit, interpretation: interpretRatio(def.name, value, status, def.unit) }
  })

  const risks: RiskFinding[] = []
  const recommendations: string[] = []

  if (ratios.currentRatio < 1.2) {
    risks.push({ id: "risk-liquidity", title: "Riesgo de Liquidez", description: `La liquidez corriente es de ${ratios.currentRatio.toFixed(2)}x, por debajo del umbral seguro de 1.5x. La empresa podría tener dificultades para cubrir obligaciones de corto plazo.`, severity: ratios.currentRatio < 1.0 ? "critical" : "high", category: "liquidity", value: `${ratios.currentRatio.toFixed(2)}x`, recommendation: "Implementar gestión activa de capital de trabajo: acelerar cobranzas, negociar plazos con proveedores y reducir niveles de inventario." })
    recommendations.push("Implementar gestión activa de capital de trabajo para mejorar liquidez corriente.")
  }
  if (ratios.quickRatio < 0.8) {
    risks.push({ id: "risk-quick", title: "Prueba Ácida Insuficiente", description: `La prueba ácida es de ${ratios.quickRatio.toFixed(2)}x, indicando dependencia de inventarios para cumplir obligaciones.`, severity: "medium", category: "liquidity", value: `${ratios.quickRatio.toFixed(2)}x`, recommendation: "Reducir niveles de inventario y optimizar cuentas por cobrar para mejorar liquidez inmediata." })
  }
  if (ratios.debtToEquity > 2.0) {
    risks.push({ id: "risk-solvency", title: "Sobreendeudamiento", description: `El nivel de endeudamiento patrimonial es de ${ratios.debtToEquity.toFixed(2)}x, indicando alta dependencia de financiamiento externo.`, severity: ratios.debtToEquity > 3.0 ? "critical" : "high", category: "solvency", value: `${ratios.debtToEquity.toFixed(2)}x`, recommendation: "Reducir apalancamiento: capitalizar utilidades, evaluar venta de activos no estratégicos y renegociar plazos de deuda." })
    recommendations.push("Reducir apalancamiento mediante capitalización de utilidades y reestructuración de deuda.")
  }
  if (ratios.debtToEquity > 1.0 && ratios.debtToEquity <= 2.0) {
    risks.push({ id: "risk-solvency-moderate", title: "Endeudamiento Moderado", description: `El nivel de endeudamiento patrimonial es de ${ratios.debtToEquity.toFixed(2)}x, dentro de rango moderado. Monitorear tendencia.`, severity: "low", category: "solvency", value: `${ratios.debtToEquity.toFixed(2)}x`, recommendation: "Mantener monitoreo trimestral del nivel de endeudamiento y establecer un límite máximo interno de 2.0x." })
  }
  if (ratios.netMargin < 0.05) {
    risks.push({ id: "risk-profitability", title: "Margen Neto Reducido", description: `El margen neto es de ${(ratios.netMargin * 100).toFixed(1)}%, por debajo del 5% considerado saludable para la industria.`, severity: ratios.netMargin < 0.02 ? "critical" : "high", category: "profitability", value: `${(ratios.netMargin * 100).toFixed(1)}%`, recommendation: "Revisar estructura de costos y precios: identificar productos de baja rentabilidad, renegociar proveedores y evaluar incrementos de precios." })
    recommendations.push("Revisar estructura de costos y política de precios para mejorar márgenes.")
  }
  if (ratios.interestCoverage < 2.0) {
    risks.push({ id: "risk-coverage", title: "Cobertura de Intereses Insuficiente", description: `La cobertura de intereses es de ${ratios.interestCoverage.toFixed(1)}x, indicando que la utilidad operativa no cubre adecuadamente los gastos financieros.`, severity: ratios.interestCoverage < 1.0 ? "critical" : "high", category: "solvency", value: `${ratios.interestCoverage.toFixed(1)}x`, recommendation: "Refinanciar deuda existente a menores tasas y priorizar pago de pasivos de alto costo." })
    recommendations.push("Refinanciar deuda existente para mejorar cobertura de intereses.")
  }
  if (prevRatios && ratios.revenue < prev.revenue) {
    risks.push({ id: "risk-decline", title: "Declive en Ingresos", description: `Los ingresos disminuyeron de $${(prev.revenue / 1000000).toFixed(1)}M a $${(latest.revenue / 1000000).toFixed(1)}M en el último período.`, severity: "high", category: "growth", value: `-${((1 - latest.revenue / prev.revenue) * 100).toFixed(1)}%`, recommendation: "Identificar causas de la caída de ingresos: pérdida de clientes, contracción de mercado o problemas de competitividad. Desarrollar plan de recuperación comercial." })
    recommendations.push("Desarrollar plan de recuperación comercial para revertir la caída de ingresos.")
  }
  if (prevRatios && ratios.revenue > prev.revenue) {
    const growth = ((latest.revenue / prev.revenue - 1) * 100).toFixed(1)
    recommendations.push(`Aprovechar el crecimiento de ingresos del ${growth}% para invertir en áreas estratégicas y consolidar posición de mercado.`)
  }
  if (ratios.assetTurnover < 0.5) {
    risks.push({ id: "risk-efficiency", title: "Baja Rotación de Activos", description: `La rotación de activos es de ${ratios.assetTurnover.toFixed(2)}x, indicando que la empresa genera pocos ingresos por cada dólar invertido en activos.`, severity: "medium", category: "efficiency", value: `${ratios.assetTurnover.toFixed(2)}x`, recommendation: "Optimizar base de activos: evaluar venta de activos subutilizados, mejorar eficiencia operativa y aumentar productividad." })
    recommendations.push("Optimizar la base de activos para mejorar rotación y eficiencia operativa.")
  }

  const healthScore = Math.round(
    (ratios.currentRatio > 1.5 ? 15 : ratios.currentRatio > 1.0 ? 10 : 5) +
    (ratios.debtToEquity < 1.5 ? 15 : ratios.debtToEquity < 2.5 ? 10 : 5) +
    (ratios.netMargin > 0.1 ? 15 : ratios.netMargin > 0.05 ? 10 : 5) +
    (ratios.roe > 0.15 ? 15 : ratios.roe > 0.08 ? 10 : 5) +
    (ratios.interestCoverage > 3 ? 15 : ratios.interestCoverage > 1.5 ? 10 : 5) +
    (ratios.assetTurnover > 1.0 ? 15 : ratios.assetTurnover > 0.5 ? 10 : 5) +
    (ratios.revenue > (prev?.revenue ?? 0) ? 10 : 5),
  )

  const healthStatus = healthScore >= 80 ? "Saludable — la empresa presenta una situación financiera sólida con riesgos controlados." :
    healthScore >= 60 ? "Atención — existen áreas de mejora que requieren intervención para evitar deterioro." :
    healthScore >= 40 ? "Riesgo — la empresa presenta debilidades financieras significativas que amenazan su estabilidad." :
    "Crítico — la empresa enfrenta problemas financieros severos que requieren acción inmediata."

  if (recommendations.length === 0) {
    recommendations.push("Mantener las prácticas financieras actuales y monitorear indicadores trimestralmente.")
    recommendations.push("Considerar oportunidades de expansión y diversificación para impulsar crecimiento adicional.")
  }

  return {
    company: profile,
    years: financials.map((f) => f.year),
    executiveSummary: `${profile.name} es una empresa del sector ${profile.industry.toLowerCase()} con ${financials[0].employees} empleados y una facturación de $${(financials[0].revenue / 1000000).toFixed(1)}M en ${financials[0].year}. El análisis financiero revela un Health Score de ${healthScore}/100, clasificado como "${healthScore >= 60 ? "saludable" : healthScore >= 40 ? "en observación" : "en riesgo"}". ${risks.length > 0 ? `Se identificaron ${risks.length} riesgos clave que requieren atención.` : "No se identificaron riesgos significativos."} ${recommendations.length > 0 ? `Se formularon ${recommendations.length} recomendaciones estratégicas.` : ""}`,
    healthScore,
    healthStatus,
    ratios: ratioAnalysis,
    risks,
    recommendations,
    maturityScore: Math.round(healthScore * 0.85),
    maturityLevel: healthScore >= 80 ? "optimized" : healthScore >= 60 ? "managed" : healthScore >= 40 ? "defined" : "initial",
    generatedAt: new Date().toISOString(),
  }
}
