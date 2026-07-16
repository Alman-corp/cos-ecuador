import type { DueDiligenceReport } from "./types"
import type { ReportData } from "@/lib/pdf/report"

export function toReportData(report: DueDiligenceReport): ReportData {
  const alerts = report.risks.map((r) => `[${r.severity.toUpperCase()}] ${r.title}: ${r.description}`)
  return {
    client: { name: report.company.name, industry: report.company.industry, status: report.company.status, score: report.healthScore },
    analysis: {
      healthScore: report.healthScore,
      healthStatus: report.healthStatus,
      ratios: {
        liquidity: { current: report.ratios.find((r) => r.name === "Liquidez Corriente" || r.name === "Current Ratio")?.value },
        solvency: { debtToEquity: report.ratios.find((r) => r.name.includes("Endeudamiento") || r.name.includes("Debt"))?.value },
        profitability: { netMargin: report.ratios.find((r) => r.name.includes("Margen Neto") || r.name.includes("Net Margin"))?.value, roe: report.ratios.find((r) => r.name === "ROE")?.value },
      },
      alerts,
      recommendations: report.recommendations,
    },
    generatedAt: report.generatedAt,
    generatedBy: "COS Due Diligence Engine",
  }
}
