import { ecuadorTaxRates2026, sriActivities, sriBenchmarks } from "./data"
import type { SRITaxRate, SRIBenchmark } from "./data"

export interface SRICompanyProfile {
  revenue: number
  industryCode: string
  industryName: string
  sector: string
  employees: number
  taxPaid: number
  vatDeclared: number
  operatingMargin: number
}

export interface SRIAnalysis {
  expectedTaxBurden: number
  actualTaxBurden: number
  taxGap: number
  estimatedIR: number
  estimatedVAT: number
  estimatedIESS: number
  estimatedBenefits: number
  totalLaborCost: number
  percentileByRevenue: number
  benchmarkComparison: {
    revenue: { company: number; benchmark: number; percentile: number }
    margin: { company: number; benchmark: number; percentile: number }
    taxBurden: { company: number; benchmark: number; percentile: number }
    employees: { company: number; benchmark: number; percentile: number }
  }
  alerts: { type: string; message: string; severity: "low" | "medium" | "high" }[]
}

class SRIEngine {
  getTaxRates(): SRITaxRate[] {
    return ecuadorTaxRates2026
  }

  getTaxRate(id: string): SRITaxRate | undefined {
    return ecuadorTaxRates2026.find((r) => r.id === id)
  }

  searchActivities(query: string): { code: string; name: string; sector: string }[] {
    const q = query.toLowerCase()
    return sriActivities
      .filter((a) => a.name.toLowerCase().includes(q) || a.code.includes(q) || a.sector.toLowerCase().includes(q))
      .map((a) => ({ code: a.code, name: a.name, sector: a.sector }))
  }

  getBenchmark(sector: string): SRIBenchmark | undefined {
    return sriBenchmarks.find((b) => b.sector.toLowerCase() === sector.toLowerCase())
  }

  getSectorFromActivity(code: string): string | undefined {
    return sriActivities.find((a) => a.code === code)?.sector
  }

  analyzeCompany(profile: SRICompanyProfile): SRIAnalysis {
    const benchmark = sriBenchmarks.find((b) => b.sector === profile.sector) || sriBenchmarks.find((b) => b.sector === "Servicios")
    const alerts: SRIAnalysis["alerts"] = []

    // Tax estimates
    const estimatedIR = profile.revenue * 0.25 * Math.max(profile.operatingMargin, 0)
    const estimatedVAT = profile.revenue * 0.15 * 0.7
    const estimatedIESS = profile.employees * 12 * 500 * 0.1175
    const estimatedBenefits = profile.employees * (12 * 500 * 0.0833 * 2 + 500)
    const totalLaborCost = profile.employees * 12 * 500 * (1 + 0.1175 + 0.0945 + 0.0833 + 0.0833 + 0.0833) + profile.employees * 500

    const actualTaxBurden = profile.taxPaid > 0 ? profile.taxPaid / profile.revenue : 0
    const expectedTaxBurden = benchmark ? benchmark.averageTaxBurden : 0.08
    const taxGap = actualTaxBurden - expectedTaxBurden

    // Percentile calculation (simplified normal distribution)
    const revenuePercentile = benchmark ? Math.min(99, Math.max(1, Math.round((profile.revenue / benchmark.averageRevenue) * 50))) : 50
    const marginPercentile = benchmark ? Math.min(99, Math.max(1, Math.round((profile.operatingMargin / benchmark.averageOperatingMargin) * 50))) : 50
    const taxBurdenPercentile = benchmark ? Math.min(99, Math.max(1, Math.round((expectedTaxBurden / (actualTaxBurden || 0.01)) * 50))) : 50
    const employeesPercentile = benchmark ? Math.min(99, Math.max(1, Math.round((profile.employees / benchmark.averageEmployees) * 50))) : 50

    // Generate alerts
    if (taxGap > 0.03) {
      alerts.push({ type: "tax_risk", message: `Carga tributaria ${(taxGap * 100).toFixed(1)}% superior al benchmark sectorial. Revisar planificación tributaria.`, severity: "high" })
    } else if (taxGap < -0.03) {
      alerts.push({ type: "tax_opportunity", message: `Carga tributaria ${(Math.abs(taxGap) * 100).toFixed(1)}% inferior al benchmark. Verificar consistencia.`, severity: "medium" })
    }

    if (profile.operatingMargin < 0.05) {
      alerts.push({ type: "margin_risk", message: `Margen operativo ${(profile.operatingMargin * 100).toFixed(1)}% está por debajo del 5%. Riesgo de rentabilidad.`, severity: "high" })
    }

    if (profile.employees > 10 && profile.revenue / profile.employees < 24000) {
      alerts.push({ type: "productivity", message: `Ingreso por empleado ($${(profile.revenue / profile.employees).toFixed(0)}) bajo. Evaluar productividad.`, severity: "medium" })
    }

    if (profile.vatDeclared < profile.revenue * 0.15 * 0.3) {
      alerts.push({ type: "vat_risk", message: `IVA declarado ($${profile.vatDeclared.toFixed(0)}) parece bajo para ingresos de $${profile.revenue.toFixed(0)}.`, severity: "medium" })
    }

    return {
      expectedTaxBurden,
      actualTaxBurden,
      taxGap,
      estimatedIR: Math.round(estimatedIR),
      estimatedVAT: Math.round(estimatedVAT),
      estimatedIESS: Math.round(estimatedIESS),
      estimatedBenefits: Math.round(estimatedBenefits),
      totalLaborCost: Math.round(totalLaborCost),
      percentileByRevenue: revenuePercentile,
      benchmarkComparison: {
        revenue: {
          company: profile.revenue,
          benchmark: benchmark?.averageRevenue || 0,
          percentile: revenuePercentile,
        },
        margin: {
          company: profile.operatingMargin,
          benchmark: benchmark?.averageOperatingMargin || 0,
          percentile: marginPercentile,
        },
        taxBurden: {
          company: actualTaxBurden,
          benchmark: expectedTaxBurden,
          percentile: taxBurdenPercentile,
        },
        employees: {
          company: profile.employees,
          benchmark: benchmark?.averageEmployees || 0,
          percentile: employeesPercentile,
        },
      },
      alerts,
    }
  }

  getSummary(): string {
    return `## SRI Tax Intelligence Engine\n\n` +
      `**${ecuadorTaxRates2026.length}** tasas y contribuciones oficiales Ecuador 2026\n` +
      `- IR Sociedades: **25%** | IVA: **15%**\n` +
      `- Retenciones: 5 tipos (2%, 8%, 8%, 10%, 30% IVA)\n` +
      `- ICE: Vehículos (10%), Alcohol (40%)\n` +
      `- Laboral: IESS patronal **11.75%**, personal **9.45%**\n` +
      `- Fondos de reserva: **8.33%** | Décimos: **8.33%** c/u\n` +
      `- Participación utilidades: **15%**\n\n` +
      `**${sriActivities.length}** actividades económicas CIIU catalogadas\n` +
      `**${sriBenchmarks.length}** benchmarks sectoriales (revenue, margen, carga tributaria, empleados)\n` +
      `- Percentiles por sector para comparación automatizada`
  }
}

export const sriEngine = new SRIEngine()
