import type { DueDiligenceCompany, DueDiligenceReport, RatioAnalysis, RiskFinding, FinancialYear } from "./types"
import { getIndustryBenchmarks } from "./benchmarks"
import { consultingDnaAdapter } from "@/core/consulting-dna/engine-adapter"
import type { ClientFacts } from "@/core/consulting-dna/rules-engine/types"

function toClientFacts(company: DueDiligenceCompany): ClientFacts {
  const f = company.financials[0]
  const currentRatio = f.currentAssets / (f.currentLiabilities || 1)
  const netMargin = f.netIncome / (f.revenue || 1)
  return {
    clientId: company.profile.id,
    financials: {
      revenue: { total: f.revenue, growth: company.financials[1] ? ((f.revenue / company.financials[1].revenue) - 1) * 100 : 0, recurring: 0 },
      expenses: { total: f.costOfSales + f.operatingExpenses, fixed: f.operatingExpenses * 0.4, variable: f.costOfSales + f.operatingExpenses * 0.6 },
      balanceSheet: { assets: f.totalAssets, liabilities: { total: f.totalLiabilities, shortTerm: f.currentLiabilities, longTerm: f.longTermDebt }, equity: f.equity },
      cashflow: { operating: f.operatingCashflow, investing: f.investingCashflow, financing: f.financingCashflow, runway: f.cashAndEquivalents / (f.operatingExpenses / 12) },
      ratios: {
        debtToEquity: f.totalLiabilities / (f.equity || 1),
        currentRatio: currentRatio,
        quickRatio: (f.currentAssets - f.inventory) / (f.currentLiabilities || 1),
        grossMargin: f.grossProfit / (f.revenue || 1),
        netMargin: netMargin,
        operatingMargin: f.operatingIncome / (f.revenue || 1),
        roe: f.netIncome / (f.equity || 1),
        roa: f.netIncome / (f.totalAssets || 1),
        assetTurnover: f.revenue / (f.totalAssets || 1),
        interestCoverage: f.operatingIncome / (f.interestExpense || 1),
      },
    },
    operational: { employees: f.employees, digitalMaturity: 0, processAutomation: 0, customerRetention: 0 },
    industry: { sector: company.profile.sector, benchmarkDebtRatio: 1.5, benchmarkMargin: 0.1 },
  }
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

export async function generateReportV2(company: DueDiligenceCompany): Promise<DueDiligenceReport> {
  const { profile, financials } = company
  const latest = financials[0]
  const prev = financials[1]
  const benchmarks = getIndustryBenchmarks(profile.industry)

  await consultingDnaAdapter.initialize()

  const facts = toClientFacts(company)
  const evalResult = await consultingDnaAdapter.evaluateClient(facts)

  const ratios = {
    currentRatio: facts.financials.ratios.currentRatio,
    quickRatio: facts.financials.ratios.quickRatio,
    debtToEquity: facts.financials.ratios.debtToEquity,
    netMargin: facts.financials.ratios.netMargin,
    operatingMargin: facts.financials.ratios.operatingMargin,
    grossMargin: facts.financials.ratios.grossMargin,
    roe: facts.financials.ratios.roe,
    roa: facts.financials.ratios.roa,
    assetTurnover: facts.financials.ratios.assetTurnover,
    interestCoverage: facts.financials.ratios.interestCoverage,
    debtRatio: facts.financials.totalLiabilities / (facts.financials.balanceSheet.assets || 1),
  }

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

  for (const risk of evalResult.risks) {
    risks.push({
      id: risk.ruleId,
      title: risk.message,
      description: risk.message,
      severity: risk.severity === "critical" ? "critical" : risk.severity === "warning" ? "high" : "medium",
      category: risk.ruleId.includes("liquidity") ? "liquidity" : risk.ruleId.includes("solvency") ? "solvency" : "profitability",
      value: risk.severity,
      recommendation: "Revisar indicador y tomar acciones correctivas según el plan estratégico.",
    })
  }

  for (const rec of evalResult.recommendations) {
    recommendations.push(rec.message)
  }

  if (prev && latest.revenue < prev.revenue) {
    risks.push({
      id: "risk-decline", title: "Declive en Ingresos", description: `Los ingresos disminuyeron de $${(prev.revenue / 1000000).toFixed(1)}M a $${(latest.revenue / 1000000).toFixed(1)}M en el último período.`,
      severity: "high", category: "growth", value: `-${((1 - latest.revenue / prev.revenue) * 100).toFixed(1)}%`,
      recommendation: "Identificar causas de la caída de ingresos. Desarrollar plan de recuperación comercial.",
    })
    recommendations.push("Desarrollar plan de recuperación comercial para revertir la caída de ingresos.")
  }

  const healthScore = Math.round(
    (ratios.currentRatio > 1.5 ? 15 : ratios.currentRatio > 1.0 ? 10 : 5) +
    (ratios.debtToEquity < 1.5 ? 15 : ratios.debtToEquity < 2.5 ? 10 : 5) +
    (ratios.netMargin > 0.1 ? 15 : ratios.netMargin > 0.05 ? 10 : 5) +
    (ratios.roe > 0.15 ? 15 : ratios.roe > 0.08 ? 10 : 5) +
    (ratios.interestCoverage > 3 ? 15 : ratios.interestCoverage > 1.5 ? 10 : 5) +
    (ratios.assetTurnover > 1.0 ? 15 : ratios.assetTurnover > 0.5 ? 10 : 5) +
    (latest.revenue > (prev?.revenue ?? 0) ? 10 : 5),
  )

  const healthStatus = healthScore >= 80 ? "Saludable — la empresa presenta una situación financiera sólida con riesgos controlados." :
    healthScore >= 60 ? "Atención — existen áreas de mejora que requieren intervención para evitar deterioro." :
    healthScore >= 40 ? "Riesgo — la empresa presenta debilidades financieras significativas que amenazan su estabilidad." :
    "Crítico — la empresa enfrenta problemas financieros severos que requieren acción inmediata."

  if (recommendations.length === 0) {
    recommendations.push("Mantener las prácticas financieras actuales y monitorear indicadores trimestralmente.")
  }

  return {
    company: profile,
    years: financials.map((f) => f.year),
    executiveSummary: `${profile.name} es una empresa del sector ${profile.industry.toLowerCase()} con ${financials[0].employees} empleados y una facturación de $${(financials[0].revenue / 1000000).toFixed(1)}M en ${financials[0].year}. El análisis financiero revela un Health Score de ${healthScore}/100. ${risks.length > 0 ? `Se identificaron ${risks.length} riesgos clave.` : "No se identificaron riesgos significativos."}`,
    healthScore,
    healthStatus,
    ratios: ratioAnalysis,
    risks,
    recommendations,
    maturityScore: evalResult.maturity.score || Math.round(healthScore * 0.85),
    maturityLevel: evalResult.maturity.level || (healthScore >= 80 ? "optimized" : healthScore >= 60 ? "managed" : healthScore >= 40 ? "defined" : "initial"),
    generatedAt: new Date().toISOString(),
  }
}
