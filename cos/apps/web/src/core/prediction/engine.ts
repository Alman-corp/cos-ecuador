import { memoryStore } from "@/core/memory"
import { consultingDna } from "@/core/consulting-dna"
import { confidenceEngine } from "@/core/confidence"
import type {
  PredictionResult, TimeSeriesPoint, Trend, Projection,
  Scenario, EarlyWarning, KPIDataPoint,
} from "./types"

class PredictionEngine {
  async predict(companyId: string, clientId?: string): Promise<PredictionResult> {
    const memory = clientId
      ? memoryStore.getByEntity(clientId, companyId)
      : memoryStore.getRecent(companyId, 100)

    const kpiChanges = memory.filter((m) => m.type === "kpi_change")
    const risks = memory.filter((m) => m.type === "risk")

    // Build time series from memory
    const timeSeries = this.buildTimeSeries(kpiChanges)
    const indicators: PredictionResult["indicators"] = []

    for (const [name, points] of Object.entries(timeSeries)) {
      if (points.length < 2) continue
      const sorted = points.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      const currentValue = sorted[sorted.length - 1].value
      const trend = this.analyzeTrend(sorted)
      const projection30d = this.project(sorted, 30)
      const projection90d = this.project(sorted, 90)

      indicators.push({ name, currentValue, trend, projection30d, projection90d })
    }

    // Generate scenarios
    const scenarios = this.generateScenarios(indicators)

    // Generate early warnings
    const earlyWarnings = this.generateEarlyWarnings(indicators, risks)

    // Calculate overall confidence with Confidence Engine
    const confidenceResult = confidenceEngine.evaluatePrediction(
      memory.length,
      indicators.reduce((s, i) => Math.max(s, i.trend.rSquared), 0),
      indicators.length,
      undefined,
    )
    const confidence = confidenceResult.overall

    // Build summary
    const summary = this.buildSummary(indicators, earlyWarnings, scenarios)

    return {
      companyId,
      clientId,
      generatedAt: new Date().toISOString(),
      indicators,
      scenarios,
      earlyWarnings,
      summary,
      confidence,
      confidenceFactors: confidenceResult.factors.map((f) => ({
        name: f.name, status: f.status, detail: f.detail, score: f.score,
      })),
    }
  }

  async predictKPI(kpi: string, historicalData: KPIDataPoint[], days: number): Promise<{
    trend: Trend
    projection: Projection
    estimatedValue: number
    confidence: number
  }> {
    const sorted = historicalData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const trend = this.analyzeTrend(sorted.map((p) => ({ date: p.date, value: p.value })))
    const projection = this.project(sorted.map((p) => ({ date: p.date, value: p.value })), days)
    const lastValue = sorted[sorted.length - 1].value
    const projectedPoints = projection.points
    const estimatedValue = projectedPoints.length > 0 ? projectedPoints[projectedPoints.length - 1].value : lastValue
    const confidence = Math.min(90, Math.max(30, trend.rSquared * 100))

    return { trend, projection, estimatedValue, confidence }
  }

  async cashFlowForecast(
    currentCash: number,
    monthlyInflow: number,
    monthlyOutflow: number,
    months: number,
  ): Promise<{ monthly: { month: number; cash: number; inflow: number; outflow: number }[]; breakevenMonth: number | null; willRunOut: boolean; runOutMonth: number | null }> {
    const monthly: { month: number; cash: number; inflow: number; outflow: number }[] = []
    let cash = currentCash
    let runOutMonth: number | null = null

    for (let m = 1; m <= months; m++) {
      cash = cash + monthlyInflow - monthlyOutflow
      monthly.push({ month: m, cash: Math.round(cash), inflow: monthlyInflow, outflow: monthlyOutflow })
      if (cash <= 0 && runOutMonth === null) runOutMonth = m
    }

    const breakeven = monthly.find((m) => m.cash >= 0 && m.cash >= currentCash)
    return {
      monthly,
      breakevenMonth: breakeven?.month || null,
      willRunOut: runOutMonth !== null,
      runOutMonth,
    }
  }

  // ── Private Methods ──

  private buildTimeSeries(kpiChanges: any[]): Record<string, TimeSeriesPoint[]> {
    const series: Record<string, TimeSeriesPoint[]> = {}
    for (const kc of kpiChanges) {
      const name = kc.title.replace("KPI ", "")
      const match = kc.description.match(/De (\d+(?:\.\d+)?) a (\d+(?:\.\d+)?)/)
      if (match) {
        if (!series[name]) series[name] = []
        series[name].push({
          date: kc.timestamp.slice(0, 10),
          value: parseFloat(match[2]),
          label: kc.description,
        })
      }
    }
    return series
  }

  private analyzeTrend(points: TimeSeriesPoint[]): Trend {
    const n = points.length
    if (n < 2) return { direction: "stable", strength: 0, slope: 0, intercept: 0, rSquared: 0, description: "Datos insuficientes" }

    const xMean = (n - 1) / 2
    const yMean = points.reduce((s, p) => s + p.value, 0) / n

    let num = 0, den = 0
    for (let i = 0; i < n; i++) {
      const xDev = i - xMean
      const yDev = points[i].value - yMean
      num += xDev * yDev
      den += xDev * xDev
    }

    const slope = den !== 0 ? num / den : 0
    const intercept = yMean - slope * xMean

    // R-squared
    let ssRes = 0, ssTot = 0
    for (let i = 0; i < n; i++) {
      const yPred = slope * i + intercept
      ssRes += (points[i].value - yPred) ** 2
      ssTot += (points[i].value - yMean) ** 2
    }
    const rSquared = ssTot !== 0 ? 1 - ssRes / ssTot : 0

    const direction = slope > 0.01 ? "up" : slope < -0.01 ? "down" : "stable"
    const strength = Math.min(1, Math.abs(rSquared))
    const description = direction === "up"
      ? `Tendencia alcista (pendiente: ${slope.toFixed(4)})`
      : direction === "down"
        ? `Tendencia bajista (pendiente: ${slope.toFixed(4)})`
        : "Estable"

    return { direction, strength, slope, intercept, rSquared: Math.round(rSquared * 100) / 100, description }
  }

  private project(points: TimeSeriesPoint[], days: number): Projection {
    const trend = this.analyzeTrend(points)
    const lastIndex = points.length - 1
    const lastDate = new Date(points[lastIndex].date)
    const projected: TimeSeriesPoint[] = []
    const upper: number[] = []
    const lower: number[] = []

    // Standard error of the estimate
    const residuals = points.map((p, i) => Math.abs(p.value - (trend.slope * i + trend.intercept)))
    const stdError = residuals.reduce((s, r) => s + r, 0) / Math.max(residuals.length, 1)

    for (let d = 1; d <= days; d++) {
      const futureDate = new Date(lastDate)
      futureDate.setDate(futureDate.getDate() + d)
      const projectedValue = trend.slope * (lastIndex + d) + trend.intercept
      projected.push({
        date: futureDate.toISOString().slice(0, 10),
        value: Math.round(projectedValue * 100) / 100,
      })
      upper.push(Math.round((projectedValue + stdError * 1.96) * 100) / 100)
      lower.push(Math.round((projectedValue - stdError * 1.96) * 100) / 100)
    }

    return {
      points: projected,
      confidence: Math.round(trend.rSquared * 100),
      upperBound: upper,
      lowerBound: lower,
    }
  }

  private generateScenarios(indicators: PredictionResult["indicators"]): Scenario[] {
    const scenarios: Scenario[] = []

    if (indicators.length === 0) {
      return [{
        name: "base",
        label: "Escenario Base",
        probability: 60,
        projections: {},
        summary: "Sin datos históricos suficientes para generar escenarios.",
      }]
    }

    // Base scenario
    const baseSummary = indicators.map((i) => {
      const proj90 = i.projection90d.points
      const finalValue = proj90.length > 0 ? proj90[proj90.length - 1].value : i.currentValue
      const change = ((finalValue - i.currentValue) / i.currentValue) * 100
      return `${i.name}: ${i.currentValue.toFixed(1)} → ${finalValue.toFixed(1)} (${change >= 0 ? "+" : ""}${change.toFixed(1)}%)`
    }).join(". ")

    scenarios.push({
      name: "base",
      label: "Escenario Base",
      probability: 60,
      projections: Object.fromEntries(indicators.map((i) => [i.name, i.projection90d])),
      summary: `Tendencia actual: ${baseSummary}`,
    })

    // Optimistic scenario (+20% on upward trends)
    const optSummary = indicators.map((i) => {
      const improvement = i.trend.direction === "up" ? 1.2 : i.trend.direction === "down" ? 0.8 : 1.0
      const current = i.currentValue
      return `${i.name}: ${(current * improvement).toFixed(1)} (${improvement >= 1 ? "+" : ""}${((improvement - 1) * 100).toFixed(0)}%)`
    }).join(". ")

    scenarios.push({
      name: "optimistic",
      label: "Escenario Optimista",
      probability: 20,
      projections: Object.fromEntries(indicators.map((i) => [i.name, i.projection90d])),
      summary: `Mejora esperada: ${optSummary}`,
    })

    // Pessimistic scenario (-20% on upward trends, +20% on downward)
    const pesSummary = indicators.map((i) => {
      const worsen = i.trend.direction === "up" ? 0.8 : i.trend.direction === "down" ? 1.2 : 1.0
      const current = i.currentValue
      return `${i.name}: ${(current * worsen).toFixed(1)} (${worsen >= 1 ? "+" : ""}${((worsen - 1) * 100).toFixed(0)}%)`
    }).join(". ")

    scenarios.push({
      name: "pessimistic",
      label: "Escenario Pesimista",
      probability: 15,
      projections: Object.fromEntries(indicators.map((i) => [i.name, i.projection90d])),
      summary: `Riesgo: ${pesSummary}`,
    })

    // Stress scenario
    scenarios.push({
      name: "stress",
      label: "Escenario de Estrés",
      probability: 5,
      projections: Object.fromEntries(indicators.map((i) => [i.name, i.projection90d])),
      summary: "Los indicadores podrían deteriorarse significativamente si se materializan los riesgos identificados.",
    })

    return scenarios
  }

  private generateEarlyWarnings(indicators: PredictionResult["indicators"], risks: any[]): EarlyWarning[] {
    const warnings: EarlyWarning[] = []

    for (const ind of indicators) {
      if (ind.trend.direction !== "down") continue
      if (ind.projection90d.points.length === 0) continue

      // Find relevant DNA threshold
      const threshold = consultingDna.getThresholds().find((t) =>
        t.indicator.toLowerCase().includes(ind.name.toLowerCase())
      )
      const criticalThreshold = threshold?.critical || 0

      // Estimate when it will hit the threshold
      const proj90 = ind.projection90d.points
      const hitPoint = proj90.find((p) => p.value <= criticalThreshold)
      if (hitPoint) {
        const daysFromNow = Math.ceil((new Date(hitPoint.date).getTime() - Date.now()) / 86400000)
        warnings.push({
          indicator: ind.name,
          currentValue: Math.round(ind.currentValue * 100) / 100,
          threshold: criticalThreshold,
          estimatedDaysToThreshold: Math.max(1, daysFromNow),
          estimatedDate: hitPoint.date,
          severity: daysFromNow <= 30 ? "critical" : daysFromNow <= 60 ? "high" : "medium",
          recommendation: threshold
            ? `Intervenir antes de ${hitPoint.date}. Revisar ${threshold.name.toLowerCase()}.`
            : `Monitorear ${ind.name} semanalmente.`,
        })
      }
    }

    // Add risk-based warnings from memory
    for (const risk of risks.slice(0, 3)) {
      if (!warnings.find((w) => w.indicator === risk.title)) {
        warnings.push({
          indicator: risk.title,
          currentValue: 0,
          threshold: 0,
          estimatedDaysToThreshold: 30,
          estimatedDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
          severity: "high",
          recommendation: risk.description.slice(0, 200),
        })
      }
    }

    return warnings.sort((a, b) => a.estimatedDaysToThreshold - b.estimatedDaysToThreshold)
  }

  private calculateConfidence(indicators: PredictionResult["indicators"], memoryCount: number): number {
    if (indicators.length === 0) return 0

    const dataQuality = Math.min(30, memoryCount * 2)
    const trendQuality = indicators.reduce((s, i) => s + i.trend.rSquared, 0) / indicators.length * 30
    const consistency = indicators.filter((i) => i.trend.direction !== "stable").length / indicators.length * 20
    const coverage = Math.min(20, indicators.length * 5)

    return Math.round(Math.min(95, dataQuality + trendQuality + consistency + coverage))
  }

  private buildSummary(indicators: PredictionResult["indicators"], warnings: EarlyWarning[], scenarios: Scenario[]): string {
    const parts: string[] = []

    const declining = indicators.filter((i) => i.trend.direction === "down")
    const improving = indicators.filter((i) => i.trend.direction === "up")

    if (declining.length > 0) {
      parts.push(`${declining.length} indicador${declining.length > 1 ? "es" : ""} en declive: ${declining.map((i) => i.name).join(", ")}.`)
    }
    if (improving.length > 0) {
      parts.push(`${improving.length} indicador${improving.length > 1 ? "es" : ""} en mejora: ${improving.map((i) => i.name).join(", ")}.`)
    }

    if (warnings.length > 0) {
      const critical = warnings.filter((w) => w.severity === "critical")
      if (critical.length > 0) {
        parts.push(`⚠️ ${critical.length} alerta${critical.length > 1 ? "s" : ""} crítica${critical.length > 1 ? "s" : ""}: ${critical.map((w) => `${w.indicator} (${w.estimatedDaysToThreshold} días)`).join(", ")}.`)
      }
    }

    const baseScenario = scenarios.find((s) => s.name === "base")
    if (baseScenario) {
      parts.push(`Escenario base: ${baseScenario.summary}`)
    }

    return parts.join("\n")
  }
}

export const predictionEngine = new PredictionEngine()
