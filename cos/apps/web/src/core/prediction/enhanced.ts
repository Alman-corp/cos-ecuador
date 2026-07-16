import type { TimeSeriesPoint, Trend, Projection, EarlyWarning } from "./types"

export interface SeasonalDecomposition {
  trend: number[]
  seasonal: number[]
  residual: number[]
  seasonalFactors: number[]
  period: number
}

export interface AnomalyResult {
  index: number
  date: string
  actual: number
  expected: number
  deviation: number
  severity: "low" | "medium" | "high" | "critical"
}

export interface EnhancedProjection extends Projection {
  modelUsed: "arima_like" | "seasonal_arima" | "holt_winters" | "linear"
  seasonalityDetected: boolean
  period?: number
  decomposition?: SeasonalDecomposition
}

export class EnhancedPredictionEngine {
  detectSeasonality(points: TimeSeriesPoint[]): { hasSeasonality: boolean; period: number } {
    if (points.length < 6) return { hasSeasonality: false, period: 0 }
    const values = points.map((p) => p.value)
    const n = values.length
    const maxLag = Math.min(Math.floor(n / 2), 12)
    let bestPeriod = 3
    let bestAutocorr = 0

    for (let lag = 2; lag <= maxLag; lag++) {
      let cov = 0, varY = 0
      const mean = values.reduce((s, v) => s + v, 0) / n
      for (let i = 0; i < n - lag; i++) {
        cov += (values[i] - mean) * (values[i + lag] - mean)
        varY += (values[i] - mean) ** 2
      }
      const autocorr = varY !== 0 ? cov / (varY * ((n - lag) / n)) : 0
      if (Math.abs(autocorr) > Math.abs(bestAutocorr)) {
        bestAutocorr = autocorr
        bestPeriod = lag
      }
    }

    return {
      hasSeasonality: Math.abs(bestAutocorr) > 0.3,
      period: bestPeriod,
    }
  }

  decomposeSeasonal(points: TimeSeriesPoint[], period: number): SeasonalDecomposition {
    const n = points.length
    const values = points.map((p) => p.value)
    const trend: number[] = []
    for (let i = 0; i < n; i++) {
      const start = Math.max(0, i - Math.floor(period / 2))
      const end = Math.min(n, i + Math.ceil(period / 2))
      const window = values.slice(start, end)
      trend.push(window.reduce((s, v) => s + v, 0) / window.length)
    }

    const detrended = values.map((v, i) => v - trend[i])
    const seasonalFactors: number[] = []
    for (let p = 0; p < period; p++) {
      const sum = detrended.reduce((s, v, i) => (i % period === p ? s + v : s), 0)
      const count = detrended.reduce((c, _, i) => (i % period === p ? c + 1 : c), 0)
      seasonalFactors.push(count > 0 ? sum / count : 0)
    }

    const seasonal: number[] = values.map((_, i) => seasonalFactors[i % period])
    const residual: number[] = values.map((v, i) => v - trend[i] - seasonal[i])

    return { trend, seasonal, residual, seasonalFactors, period }
  }

  projectEnhanced(points: TimeSeriesPoint[], days: number): EnhancedProjection {
    if (points.length < 3) {
      return this.fallbackLinear(points, days)
    }

    const seasonality = this.detectSeasonality(points)
    const sorted = [...points].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    if (seasonality.hasSeasonality) {
      return this.seasonalARIMA(sorted, days, seasonality.period)
    }

    if (sorted.length >= 6) {
      return this.holtWintersProjection(sorted, days)
    }

    return this.arimaLikeProjection(sorted, days)
  }

  private fallbackLinear(points: TimeSeriesPoint[], days: number): EnhancedProjection {
    const n = points.length
    const values = points.map((p) => p.value)
    const xMean = (n - 1) / 2
    const yMean = values.reduce((s, v) => s + v, 0) / n
    let num = 0, den = 0
    for (let i = 0; i < n; i++) {
      num += (i - xMean) * (values[i] - yMean)
      den += (i - xMean) ** 2
    }
    const slope = den !== 0 ? num / den : 0
    const intercept = yMean - slope * xMean
    const lastDate = new Date(points[n - 1].date)
    const projectedPoints: TimeSeriesPoint[] = []
    const upper: number[] = []
    const lower: number[] = []
    const residuals = values.map((v, i) => Math.abs(v - (slope * i + intercept)))
    const stdError = residuals.reduce((s, r) => s + r, 0) / Math.max(residuals.length, 1)

    for (let d = 1; d <= days; d++) {
      const date = new Date(lastDate)
      date.setDate(date.getDate() + d)
      const val = slope * (n - 1 + d) + intercept
      projectedPoints.push({ date: date.toISOString().slice(0, 10), value: Math.round(val * 100) / 100 })
      upper.push(Math.round((val + stdError * 1.96) * 100) / 100)
      lower.push(Math.round((val - stdError * 1.96) * 100) / 100)
    }

    return { points: projectedPoints, confidence: 30, upperBound: upper, lowerBound: lower, modelUsed: "linear", seasonalityDetected: false }
  }

  private arimaLikeProjection(points: TimeSeriesPoint[], days: number): EnhancedProjection {
    const n = points.length
    const values = points.map((p) => p.value)
    const diffs: number[] = []
    for (let i = 1; i < n; i++) diffs.push(values[i] - values[i - 1])

    const meanDiff = diffs.reduce((s, v) => s + v, 0) / diffs.length
    const lastValue = values[n - 1]
    const lastDate = new Date(points[n - 1].date)

    const projectedPoints: TimeSeriesPoint[] = []
    const upper: number[] = []
    const lower: number[] = []
    const diffStd = Math.sqrt(diffs.reduce((s, v) => s + (v - meanDiff) ** 2, 0) / diffs.length)
    let cumulative = lastValue

    for (let d = 1; d <= days; d++) {
      cumulative += meanDiff
      const date = new Date(lastDate)
      date.setDate(date.getDate() + d)
      projectedPoints.push({ date: date.toISOString().slice(0, 10), value: Math.round(cumulative * 100) / 100 })
      upper.push(Math.round((cumulative + diffStd * 1.96 * Math.sqrt(d)) * 100) / 100)
      lower.push(Math.round((cumulative - diffStd * 1.96 * Math.sqrt(d)) * 100) / 100)
    }

    return { points: projectedPoints, confidence: Math.min(85, 40 + n * 3), upperBound: upper, lowerBound: lower, modelUsed: "arima_like", seasonalityDetected: false }
  }

  private seasonalARIMA(points: TimeSeriesPoint[], days: number, period: number): EnhancedProjection {
    const decomp = this.decomposeSeasonal(points, period)
    const lastDate = new Date(points[points.length - 1].date)
    const n = points.length
    const trendSlope = decomp.trend.length >= 4
      ? (decomp.trend[decomp.trend.length - 1] - decomp.trend[decomp.trend.length - 4]) / 3
      : 0
    const lastTrend = decomp.trend[decomp.trend.length - 1] || points[n - 1].value
    const projectedPoints: TimeSeriesPoint[] = []
    const upper: number[] = []
    const lower: number[] = []
    const residualStd = Math.sqrt(decomp.residual.reduce((s, v) => s + v * v, 0) / Math.max(decomp.residual.length, 1))

    for (let d = 1; d <= days; d++) {
      const date = new Date(lastDate)
      date.setDate(date.getDate() + d)
      const tVal = lastTrend + trendSlope * d
      const sVal = decomp.seasonalFactors[(n - 1 + d) % period]
      const val = tVal + sVal
      projectedPoints.push({ date: date.toISOString().slice(0, 10), value: Math.round(val * 100) / 100 })
      upper.push(Math.round((val + residualStd * 1.96) * 100) / 100)
      lower.push(Math.round((val - residualStd * 1.96) * 100) / 100)
    }

    return {
      points: projectedPoints,
      confidence: Math.min(90, 50 + n * 2),
      upperBound: upper,
      lowerBound: lower,
      modelUsed: "seasonal_arima",
      seasonalityDetected: true,
      period,
      decomposition: decomp,
    }
  }

  private holtWintersProjection(points: TimeSeriesPoint[], days: number): EnhancedProjection {
    const n = points.length
    const values = points.map((p) => p.value)
    const alpha = 0.3, beta = 0.1
    let level = values[0], trend_ = values[1] - values[0]
    const fitted: number[] = []

    for (let i = 0; i < n; i++) {
      const prevLevel = level
      level = alpha * values[i] + (1 - alpha) * (level + trend_)
      trend_ = beta * (level - prevLevel) + (1 - beta) * trend_
      fitted.push(level)
    }

    const lastDate = new Date(points[n - 1].date)
    const projectedPoints: TimeSeriesPoint[] = []
    const upper: number[] = []
    const lower: number[] = []
    const residuals = values.map((v, i) => Math.abs(v - fitted[i]))
    const mae = residuals.reduce((s, r) => s + r, 0) / n

    for (let d = 1; d <= days; d++) {
      const date = new Date(lastDate)
      date.setDate(date.getDate() + d)
      const val = level + trend_ * d
      projectedPoints.push({ date: date.toISOString().slice(0, 10), value: Math.round(val * 100) / 100 })
      upper.push(Math.round((val + mae * 1.96) * 100) / 100)
      lower.push(Math.round((val - mae * 1.96) * 100) / 100)
    }

    return { points: projectedPoints, confidence: Math.min(85, 45 + n * 2), upperBound: upper, lowerBound: lower, modelUsed: "holt_winters", seasonalityDetected: false }
  }

  detectAnomalies(points: TimeSeriesPoint[], threshold = 2): AnomalyResult[] {
    if (points.length < 4) return []
    const values = points.map((p) => p.value)
    const mean = values.reduce((s, v) => s + v, 0) / values.length
    const std = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length)
    const anomalies: AnomalyResult[] = []

    for (let i = 0; i < values.length; i++) {
      const deviation = Math.abs(values[i] - mean) / (std || 1)
      if (deviation > threshold) {
        let severity: AnomalyResult["severity"] = "low"
        if (deviation > 3) severity = "critical"
        else if (deviation > 2.5) severity = "high"
        else if (deviation > 2) severity = "medium"
        anomalies.push({
          index: i,
          date: points[i].date,
          actual: values[i],
          expected: Math.round(mean * 100) / 100,
          deviation: Math.round(deviation * 100) / 100,
          severity,
        })
      }
    }
    return anomalies
  }

  generateEarlyWarningsEnhanced(
    indicators: { name: string; currentValue: number; projection: EnhancedProjection }[],
    thresholds: Record<string, { warning: number; critical: number }>,
  ): EarlyWarning[] {
    const warnings: EarlyWarning[] = []
    for (const ind of indicators) {
      const t = thresholds[ind.name]
      if (!t) continue
      const proj = ind.projection.points
      for (const p of proj) {
        if (p.value <= t.critical) {
          const daysFromNow = Math.ceil((new Date(p.date).getTime() - Date.now()) / 86400000)
          warnings.push({
            indicator: ind.name,
            currentValue: ind.currentValue,
            threshold: t.critical,
            estimatedDaysToThreshold: Math.max(1, daysFromNow),
            estimatedDate: p.date,
            severity: daysFromNow <= 30 ? "critical" : daysFromNow <= 60 ? "high" : "medium",
            recommendation: `Intervenir antes del ${p.date}. Valor proyectado: ${p.value}, umbral crítico: ${t.critical}.`,
          })
          break
        }
        if (p.value <= t.warning) {
          const daysFromNow = Math.ceil((new Date(p.date).getTime() - Date.now()) / 86400000)
          if (!warnings.find((w) => w.indicator === ind.name)) {
            warnings.push({
              indicator: ind.name,
              currentValue: ind.currentValue,
              threshold: t.warning,
              estimatedDaysToThreshold: Math.max(1, daysFromNow),
              estimatedDate: p.date,
              severity: "low",
              recommendation: `Monitorear ${ind.name}. Se acerca al umbral de advertencia (${t.warning}) para el ${p.date}.`,
            })
          }
          break
        }
      }
    }
    return warnings
  }
}

export const enhancedPredictionEngine = new EnhancedPredictionEngine()
