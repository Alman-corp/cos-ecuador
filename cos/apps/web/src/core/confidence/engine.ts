import type { ConfidenceResult, ConfidenceFactor, ConfidenceInput, ConfidenceContext } from "./types"
import { learningEngine } from "@/core/learning"

const DEFAULT_INPUT: ConfidenceInput = {
  context: "prediction",
  dataPoints: 0,
  dataCompleteness: 0,
  dataRecencyDays: 999,
  historicalMatches: 0,
  kpiConsistency: 0,
  benchmarkAvailable: false,
  businessCasesAvailable: 0,
  industryKnown: false,
}

class ConfidenceEngine {
  evaluate(input: Partial<ConfidenceInput> = {}): ConfidenceResult {
    const ctx = { ...DEFAULT_INPUT, ...input }
    const factors = this.buildFactors(ctx)
    const overall = this.calculateOverall(factors)
    const label = this.getLabel(overall)
    const summary = this.buildSummary(overall, factors, ctx)

    return {
      overall: Math.round(overall * 10) / 10,
      context: ctx.context,
      label,
      factors,
      summary,
      timestamp: new Date().toISOString(),
    }
  }

  // ── Evaluate for a specific prediction ──

  evaluatePrediction(
    historicalDataPoints: number,
    rSquared: number,
    kpiCount: number,
    industry: string | undefined,
  ): ConfidenceResult {
    const businessCases = industry ? learningEngine.search({ industry, limit: 0 }) : []
    const hasBenchmark = !!industry

    return this.evaluate({
      context: "prediction",
      dataPoints: historicalDataPoints,
      dataCompleteness: Math.min(100, (historicalDataPoints / 24) * 100),
      dataRecencyDays: 0,
      historicalMatches: businessCases.length,
      kpiConsistency: Math.round(rSquared * 100),
      benchmarkAvailable: hasBenchmark,
      businessCasesAvailable: learningEngine.getStats().total,
      industryKnown: !!industry,
      previousAccuracy: undefined,
    })
  }

  // ── Evaluate for a recommendation ──

  evaluateRecommendation(
    evidenceCount: number,
    similarCases: number,
    industryKnown: boolean,
  ): ConfidenceResult {
    return this.evaluate({
      context: "recommendation",
      dataPoints: evidenceCount,
      dataCompleteness: Math.min(100, (evidenceCount / 10) * 100),
      dataRecencyDays: 0,
      historicalMatches: similarCases,
      kpiConsistency: 0,
      benchmarkAvailable: false,
      businessCasesAvailable: learningEngine.getStats().total,
      industryKnown,
    })
  }

  // ── Evaluate for a diagnosis ──

  evaluateDiagnosis(
    observations: number,
    consistentKPIs: number,
    industryKnown: boolean,
  ): ConfidenceResult {
    return this.evaluate({
      context: "diagnosis",
      dataPoints: observations,
      dataCompleteness: Math.min(100, (observations / 8) * 100),
      dataRecencyDays: 0,
      historicalMatches: 0,
      kpiConsistency: Math.min(100, (consistentKPIs / observations) * 100),
      benchmarkAvailable: false,
      businessCasesAvailable: learningEngine.getStats().total,
      industryKnown,
    })
  }

  // ── Private ──

  private buildFactors(input: ConfidenceInput): ConfidenceFactor[] {
    const factors: ConfidenceFactor[] = []

    // 1. Data quality
    factors.push(this.makeFactor(
      "Calidad de datos",
      input.dataCompleteness >= 80 ? "positive" : input.dataCompleteness >= 40 ? "neutral" : "negative",
      input.dataCompleteness >= 80 ? "Datos completos y representativos" :
        input.dataCompleteness >= 40 ? "Datos parcialmente completos" : "Datos insuficientes",
      25,
      input.dataCompleteness,
    ))

    // 2. Data recency
    const recencyScore = Math.max(0, 100 - input.dataRecencyDays * 2)
    factors.push(this.makeFactor(
      "Actualidad de datos",
      input.dataRecencyDays <= 7 ? "positive" : input.dataRecencyDays <= 30 ? "neutral" : "negative",
      input.dataRecencyDays <= 7 ? "Datos recientes (menos de 7 días)" :
        input.dataRecencyDays <= 30 ? "Datos del último mes" : `Datos de hace ${input.dataRecencyDays} días`,
      15,
      recencyScore,
    ))

    // 3. Historical evidence
    const evidenceScore = Math.min(100, input.historicalMatches * 10 + input.dataPoints * 2)
    factors.push(this.makeFactor(
      "Evidencia histórica",
      input.historicalMatches >= 5 ? "positive" : input.historicalMatches >= 1 ? "neutral" : "negative",
      input.historicalMatches >= 10 ? `${input.historicalMatches} casos similares encontrados en la biblioteca` :
        input.historicalMatches >= 5 ? `${input.historicalMatches} casos similares disponibles` :
        input.historicalMatches >= 1 ? `${input.historicalMatches} caso similar encontrado` :
        "Sin casos previos similares en la biblioteca",
      20,
      Math.min(100, evidenceScore),
    ))

    // 4. KPI consistency
    factors.push(this.makeFactor(
      "Consistencia de indicadores",
      input.kpiConsistency >= 70 ? "positive" : input.kpiConsistency >= 40 ? "neutral" : "negative",
      input.kpiConsistency >= 70 ? `${Math.round(input.kpiConsistency)}% de los indicadores apuntan en la misma dirección` :
        input.kpiConsistency >= 40 ? "Indicadores moderadamente consistentes" :
        "Indicadores inconsistentes entre sí",
      20,
      input.kpiConsistency,
    ))

    // 5. Benchmark availability
    factors.push(this.makeFactor(
      "Benchmarks de industria",
      input.benchmarkAvailable && input.industryKnown ? "positive" : "negative",
      input.benchmarkAvailable && input.industryKnown ? "Benchmarks de industria disponibles para comparación" :
        !input.industryKnown ? "Industria no especificada — sin benchmarks" :
        "Benchmarks no disponibles para esta industria",
      10,
      input.benchmarkAvailable && input.industryKnown ? 80 : 10,
    ))

    // 6. Business Case Library
    const bclScore = Math.min(100, input.businessCasesAvailable * 5)
    factors.push(this.makeFactor(
      "Biblioteca de casos",
      input.businessCasesAvailable >= 10 ? "positive" : input.businessCasesAvailable >= 3 ? "neutral" : "negative",
      input.businessCasesAvailable >= 10 ? `${input.businessCasesAvailable} casos documentados en la Business Case Library` :
        input.businessCasesAvailable >= 3 ? `${input.businessCasesAvailable} casos disponibles` :
        "Biblioteca de casos en etapa inicial",
      10,
      bclScore,
    ))

    return factors
  }

  private makeFactor(
    name: string, status: ConfidenceFactor["status"], detail: string,
    weight: number, score: number,
  ): ConfidenceFactor {
    return { name, status, detail, weight, score: Math.min(100, Math.max(0, Math.round(score))) }
  }

  private calculateOverall(factors: ConfidenceFactor[]): number {
    const totalWeight = factors.reduce((s, f) => s + f.weight, 0)
    if (totalWeight === 0) return 0
    return factors.reduce((s, f) => s + (f.score * f.weight) / totalWeight, 0)
  }

  private getLabel(score: number): string {
    if (score >= 90) return "Muy alta"
    if (score >= 75) return "Alta"
    if (score >= 55) return "Media"
    if (score >= 35) return "Baja"
    return "Muy baja"
  }

  private buildSummary(overall: number, factors: ConfidenceFactor[], input: ConfidenceInput): string {
    const pos = factors.filter((f) => f.status === "positive").length
    const neg = factors.filter((f) => f.status === "negative").length
    const total = factors.length
    return `Confianza ${this.getLabel(overall).toLowerCase()} (${Math.round(overall)}%) — ${pos}/${total} factores positivos, ${neg}/${total} negativos`
  }
}

export const confidenceEngine = new ConfidenceEngine()
