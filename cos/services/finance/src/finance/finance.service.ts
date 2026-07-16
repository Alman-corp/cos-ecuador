import { Injectable } from "@nestjs/common"
import { RatiosEngine } from "./ratios-engine"
import { ProjectionsEngine } from "./projections-engine"

@Injectable()
export class FinanceService {
  constructor(
    private readonly ratiosEngine: RatiosEngine,
    private readonly projectionsEngine: ProjectionsEngine,
  ) {}

  async calculateRatios(data: any, prevData?: any) {
    return this.ratiosEngine.calculate(data, prevData)
  }

  async calculateDcf(params: {
    freeCashFlows: number[]
    terminalGrowthRate: number
    discountRate: number
    sharesOutstanding: number
    netDebt: number
  }) {
    return this.projectionsEngine.projectDcf(params)
  }

  async projectStatements(baseYear: any, assumptions: any) {
    return this.projectionsEngine.projectFinancialStatements(baseYear, assumptions)
  }

  async runMonteCarlo(params: {
    historicalReturns: number[]
    initialValue: number
    horizon: number
    iterations: number
    confidenceLevel: number
  }) {
    const { historicalReturns, initialValue, horizon, iterations, confidenceLevel } = params
    const mean = historicalReturns.reduce((a, b) => a + b, 0) / historicalReturns.length
    const variance = historicalReturns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / historicalReturns.length
    const stdDev = Math.sqrt(variance)

    const results: number[] = []
    for (let i = 0; i < iterations; i++) {
      let value = initialValue
      for (let t = 0; t < horizon; t++) {
        const z = this.boxMuller()
        value *= Math.exp(mean + stdDev * z)
      }
      results.push(value)
    }

    results.sort((a, b) => a - b)
    const lowerIdx = Math.floor((1 - confidenceLevel / 100) / 2 * iterations)
    const upperIdx = Math.floor((1 + confidenceLevel / 100) / 2 * iterations)
    const meanResult = results.reduce((a, b) => a + b, 0) / iterations

    const min = results[0]
    const max = results[results.length - 1]
    const binCount = 50
    const binWidth = (max - min) / binCount
    const histogram: { binStart: number; binEnd: number; count: number }[] = []
    for (let i = 0; i < binCount; i++) {
      const binStart = min + i * binWidth
      const binEnd = binStart + binWidth
      const count = results.filter(r => r >= binStart && r < binEnd).length
      histogram.push({ binStart: +binStart.toFixed(0), binEnd: +binEnd.toFixed(0), count })
    }

    return {
      mean: +meanResult.toFixed(0),
      median: +results[Math.floor(iterations / 2)].toFixed(0),
      stdDev: +stdDev.toFixed(4),
      percentile5: +results[Math.floor(0.05 * iterations)].toFixed(0),
      percentile95: +results[Math.floor(0.95 * iterations)].toFixed(0),
      lowerBound: +results[lowerIdx].toFixed(0),
      upperBound: +results[upperIdx].toFixed(0),
      min: +min.toFixed(0),
      max: +max.toFixed(0),
      histogram,
    }
  }

  private boxMuller(): number {
    let u = 0, v = 0
    while (u === 0) u = Math.random()
    while (v === 0) v = Math.random()
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  }
}
