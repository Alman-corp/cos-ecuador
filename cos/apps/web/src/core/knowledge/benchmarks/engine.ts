import { industryBenchmarks, type IndustryBenchmark } from "./data"
import { ifrsValidator } from "../ifrs/validator"

export interface BenchmarkComparison {
  industry: string
  industryCode: string
  companyValue: number
  benchmarkValue: number
  percentile: number
  status: "above_average" | "average" | "below_average" | "critical"
  label: string
  unit: string
}

export interface FullBenchmarkReport {
  companyId: string
  industry: string
  matches: BenchmarkComparison[]
  overallScore: number
  topStrengths: string[]
  topWeaknesses: string[]
  sampleSize: number
  dataDate: string
}

class BenchmarkEngine {
  getBenchmark(industry: string): IndustryBenchmark | undefined {
    const ind = industry.toLowerCase()
    return industryBenchmarks.find(
      (b) =>
        b.industry.toLowerCase() === ind ||
        b.industryCode.toLowerCase() === ind,
    )
  }

  getAllIndustries(): { industry: string; code: string; sampleSize: number }[] {
    return industryBenchmarks.map((b) => ({
      industry: b.industry,
      code: b.industryCode,
      sampleSize: b.sampleSize,
    }))
  }

  getMetrics(): string[] {
    return [
      "liquidity", "quickRatio", "debtToEquity", "debtToAssets",
      "interestCoverage", "grossMargin", "operatingMargin", "netMargin",
      "roe", "roa", "assetTurnover", "dso", "inventoryTurnover", "revenuePerEmployee",
    ]
  }

  compare(industry: string, ratios: Record<string, number>): BenchmarkComparison[] {
    const benchmark = this.getBenchmark(industry)
    if (!benchmark) return []

    const metricLabels: Record<string, { label: string; unit: string }> = {
      liquidity: { label: "Liquidez Corriente", unit: "x" },
      quickRatio: { label: "Prueba Ácida", unit: "x" },
      debtToEquity: { label: "Endeudamiento (D/E)", unit: "x" },
      debtToAssets: { label: "Endeudamiento (D/A)", unit: "%" },
      interestCoverage: { label: "Cobertura de Intereses", unit: "x" },
      grossMargin: { label: "Margen Bruto", unit: "%" },
      operatingMargin: { label: "Margen Operativo", unit: "%" },
      netMargin: { label: "Margen Neto", unit: "%" },
      roe: { label: "ROE", unit: "%" },
      roa: { label: "ROA", unit: "%" },
      assetTurnover: { label: "Rotación de Activos", unit: "x" },
      dso: { label: "Días de Cobro (DSO)", unit: "días" },
      inventoryTurnover: { label: "Rotación Inventario", unit: "x" },
      revenuePerEmployee: { label: "Ingreso por Empleado", unit: "USD" },
    }

    // Map IFRS ratios to benchmark metric names
    const ratioMapping: Record<string, string> = {
      currentRatio: "liquidity",
      quickRatio: "quickRatio",
      debtToEquity: "debtToEquity",
      debtToAssets: "debtToAssets",
      interestCoverage: "interestCoverage",
      grossMargin: "grossMargin",
      operatingMargin: "operatingMargin",
      netMargin: "netMargin",
      roe: "roe",
      roa: "roa",
      assetTurnover: "assetTurnover",
      dso: "dso",
    }

    const comparisons: BenchmarkComparison[] = []

    for (const [ratioKey, metricName] of Object.entries(ratioMapping)) {
      const companyValue = ratios[ratioKey]
      if (companyValue === undefined || companyValue === null) continue

      const bm = (benchmark as any)[metricName] as { p25: number; p50: number; p75: number }
      if (!bm) continue

      const isInverse = metricName === "debtToEquity" || metricName === "debtToAssets" || metricName === "dso"
      const better = isInverse ? "lower_is_better" : "higher_is_better"

      let percentile: number
      let status: BenchmarkComparison["status"]

      if (better === "higher_is_better") {
        if (companyValue >= bm.p75) { percentile = 85; status = "above_average" }
        else if (companyValue >= bm.p50) { percentile = 60; status = "above_average" }
        else if (companyValue >= bm.p25) { percentile = 35; status = "average" }
        else { percentile = 15; status = "below_average" }
      } else {
        if (companyValue <= bm.p25) { percentile = 85; status = "above_average" }
        else if (companyValue <= bm.p50) { percentile = 60; status = "above_average" }
        else if (companyValue <= bm.p75) { percentile = 35; status = "average" }
        else { percentile = 10; status = "critical" }
      }

      comparisons.push({
        industry: benchmark.industry,
        industryCode: benchmark.industryCode,
        companyValue,
        benchmarkValue: bm.p50,
        percentile,
        status,
        label: metricLabels[metricName]?.label || metricName,
        unit: metricLabels[metricName]?.unit || "",
      })
    }

    return comparisons.sort((a, b) => b.percentile - a.percentile)
  }

  getPercentile(industry: string, metric: string, value: number): number {
    const benchmark = this.getBenchmark(industry)
    if (!benchmark) return 50

    const bm = (benchmark as any)[metric] as { p25: number; p50: number; p75: number }
    if (!bm) return 50

    if (value >= bm.p75) return 85
    if (value >= bm.p50) return 60
    if (value >= bm.p25) return 35
    return 15
  }

  generateFullReport(companyId: string, industry: string, ratios: Record<string, number>): FullBenchmarkReport {
    const comparisons = this.compare(industry, ratios)
    const benchmark = this.getBenchmark(industry)

    const strengths = comparisons.filter((c) => c.status === "above_average").slice(0, 3).map(
      (c) => `${c.label}: ${c.companyValue.toFixed(2)}${c.unit} (percentil ${c.percentile})`,
    )
    const weaknesses = comparisons.filter((c) => c.status === "critical" || c.status === "below_average").slice(0, 3).map(
      (c) => `${c.label}: ${c.companyValue.toFixed(2)}${c.unit} (percentil ${c.percentile})`,
    )

    return {
      companyId,
      industry,
      matches: comparisons,
      overallScore: comparisons.length > 0
        ? Math.round(comparisons.reduce((s, c) => s + c.percentile, 0) / comparisons.length)
        : 50,
      topStrengths: strengths,
      topWeaknesses: weaknesses,
      sampleSize: benchmark?.sampleSize || 0,
      dataDate: `${benchmark?.year || 2025}`,
    }
  }

  getSummary(): string {
    return `## Industry Benchmark Engine\n\n` +
      `**${industryBenchmarks.length}** industrias con benchmarks completos (percentiles 25/50/75)\n\n` +
      industryBenchmarks.map(
        (b) => `- **${b.industry}** (${b.industryCode}): ${b.sampleSize.toLocaleString()} empresas analizadas`
      ).join("\n") + `\n\n` +
      `14 métricas por industria: liquidez, prueba ácida, D/E, D/A, cobertura intereses, ` +
      `margen bruto/operativo/neto, ROE, ROA, rotación activos, DSO, rotación inventario, ingreso/empleado\n\n` +
      `Permite: comparación por percentil, detección de fortalezas/debilidades, reporte completo`
  }
}

export const benchmarkEngine = new BenchmarkEngine()
