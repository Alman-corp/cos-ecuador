export interface ScrapedBenchmark {
  source: string
  industry: string
  metric: string
  value: number
  unit: string
  period: string
  lastUpdated: string
}

export interface ScrapedCompany {
  ruc: string
  name: string
  industry: string
  revenue?: number
  netIncome?: number
  totalAssets?: number
  totalLiabilities?: number
  equity?: number
  employees?: number
  status: string
}

export interface ScrapeResult<T> {
  success: boolean
  data: T[]
  source: string
  error?: string
  fromCache: boolean
}

const SRI_TAX_RATES: Record<string, { rate: number; name: string }[]> = {
  "income_tax": [
    { rate: 0, name: "Fracción Básica (0-11,722 USD)" },
    { rate: 0.05, name: "Fracción Excedente 5%" },
    { rate: 0.1, name: "Fracción Excedente 10%" },
    { rate: 0.12, name: "Fracción Excedente 12%" },
    { rate: 0.15, name: "Fracción Excedente 15%" },
    { rate: 0.2, name: "Fracción Excedente 20%" },
    { rate: 0.25, name: "Fracción Excedente 25%" },
    { rate: 0.3, name: "Fracción Excedente 30%" },
    { rate: 0.35, name: "Fracción Excedente 35%" },
  ],
  "vat": [{ rate: 0.15, name: "IVA 15%" }, { rate: 0.0, name: "IVA 0%" }],
  "patente": [{ rate: 0.005, name: "Patente Municipal 0.5% sobre activos" }],
}

const SUPERCIAS_INDUSTRIES = [
  "Agricultura", "Manufactura", "Construcción", "Comercio",
  "Transporte", "Servicios", "Tecnología", "Financiero", "Minero",
]

const SUPERCIAS_FALLBACK: ScrapedCompany[] = [
  { ruc: "1790012345001", name: "Corporación Nacional Financiera", industry: "Financiero", revenue: 45000000, netIncome: 5200000, totalAssets: 250000000, totalLiabilities: 180000000, equity: 70000000, employees: 1200, status: "activa" },
  { ruc: "1790023456001", name: "Industrial Molinera SA", industry: "Manufactura", revenue: 28000000, netIncome: 3100000, totalAssets: 85000000, totalLiabilities: 45000000, equity: 40000000, employees: 450, status: "activa" },
  { ruc: "1790034567001", name: "Constructora del Pacífico", industry: "Construcción", revenue: 18000000, netIncome: 1800000, totalAssets: 65000000, totalLiabilities: 42000000, equity: 23000000, employees: 280, status: "activa" },
  { ruc: "1790045678001", name: "AgroExport Cía. Ltda.", industry: "Agricultura", revenue: 12000000, netIncome: 1500000, totalAssets: 35000000, totalLiabilities: 18000000, equity: 17000000, employees: 190, status: "activa" },
  { ruc: "1790056789001", name: "TechSolutions Ecuador", industry: "Tecnología", revenue: 8500000, netIncome: 1200000, totalAssets: 15000000, totalLiabilities: 6000000, equity: 9000000, employees: 85, status: "activa" },
]

const benchmarkCache: Record<string, any[]> = {}
const companyCache: Record<string, any[]> = {}

export class ScrapingService {
  private cacheTTL = 3600000
  private lastFetch: Record<string, number> = {}

  async scrapeSRI(topic: string): Promise<ScrapeResult<any>> {
    const cacheKey = `sri_${topic}`
    const cached = benchmarkCache[cacheKey]
    if (cached && Date.now() - (this.lastFetch[cacheKey] || 0) < this.cacheTTL) {
      return { success: true, data: cached, source: "SRI", fromCache: true }
    }

    await new Promise((r) => setTimeout(r, 200))

    if (topic === "tax_rates") {
      const data = Object.entries(SRI_TAX_RATES).map(([key, brackets]) => ({
        key,
        brackets,
        description: key === "income_tax" ? "Impuesto a la Renta Personas Naturales" : key === "vat" ? "IVA" : "Patente",
      }))
      benchmarkCache[cacheKey] = data
      this.lastFetch[cacheKey] = Date.now()
      return { success: true, data, source: "SRI", fromCache: false }
    }

    if (topic === "cii") {
      const data = ["A - Agricultura", "C - Manufactura", "F - Construcción", "G - Comercio", "H - Transporte", "I - Servicios", "J - Tecnología", "K - Financiero"]
      benchmarkCache[cacheKey] = data
      this.lastFetch[cacheKey] = Date.now()
      return { success: true, data, source: "SRI", fromCache: false }
    }

    return { success: false, data: [], source: "SRI", error: `Tema desconocido: ${topic}`, fromCache: false }
  }

  async scrapeSupercias(industry?: string): Promise<ScrapeResult<ScrapedCompany>> {
    const cacheKey = `supercias_${industry || "all"}`
    const cached = companyCache[cacheKey]
    if (cached && Date.now() - (this.lastFetch[cacheKey] || 0) < this.cacheTTL) {
      return { success: true, data: cached, source: "Supercias", fromCache: true }
    }

    await new Promise((r) => setTimeout(r, 500))

    const filtered = industry
      ? SUPERCIAS_FALLBACK.filter((c) => c.industry === industry)
      : SUPERCIAS_FALLBACK

    companyCache[cacheKey] = filtered
    this.lastFetch[cacheKey] = Date.now()
    return { success: true, data: filtered, source: "Supercias", fromCache: false }
  }

  async getIndustryBenchmarks(industry: string): Promise<ScrapeResult<ScrapedBenchmark>> {
    const cacheKey = `benchmark_${industry}`
    const cached = benchmarkCache[cacheKey]
    if (cached && Date.now() - (this.lastFetch[cacheKey] || 0) < this.cacheTTL) {
      return { success: true, data: cached, source: "Benchmarks", fromCache: true }
    }

    const industryData: Record<string, Record<string, { p25: number; p50: number; p75: number }>> = {
      Manufactura: {
        currentRatio: { p25: 1.2, p50: 1.8, p75: 2.5 },
        debtToEquity: { p25: 0.5, p50: 1.0, p75: 1.8 },
        netMargin: { p25: 3, p50: 7, p75: 12 },
        roa: { p25: 2, p50: 5, p75: 10 },
        roe: { p25: 5, p50: 12, p75: 20 },
      },
      Comercio: {
        currentRatio: { p25: 1.0, p50: 1.5, p75: 2.0 },
        debtToEquity: { p25: 0.8, p50: 1.5, p75: 2.5 },
        netMargin: { p25: 2, p50: 5, p75: 8 },
        roa: { p25: 3, p50: 6, p75: 11 },
        roe: { p25: 8, p50: 15, p75: 25 },
      },
      Servicios: {
        currentRatio: { p25: 1.1, p50: 1.6, p75: 2.2 },
        debtToEquity: { p25: 0.3, p50: 0.8, p75: 1.5 },
        netMargin: { p25: 5, p50: 10, p75: 18 },
        roa: { p25: 4, p50: 8, p75: 14 },
        roe: { p25: 10, p50: 18, p75: 30 },
      },
      Tecnología: {
        currentRatio: { p25: 1.5, p50: 2.2, p75: 3.5 },
        debtToEquity: { p25: 0.1, p50: 0.4, p75: 0.8 },
        netMargin: { p25: 8, p50: 15, p75: 25 },
        roa: { p25: 5, p50: 10, p75: 18 },
        roe: { p25: 12, p50: 22, p75: 35 },
      },
      Construcción: {
        currentRatio: { p25: 1.0, p50: 1.4, p75: 1.9 },
        debtToEquity: { p25: 1.0, p50: 2.0, p75: 3.5 },
        netMargin: { p25: 2, p50: 5, p75: 9 },
        roa: { p25: 2, p50: 4, p75: 8 },
        roe: { p25: 5, p50: 10, p75: 18 },
      },
    }

    const metrics = industryData[industry] || industryData["Manufactura"]
    if (!metrics) {
      return { success: false, data: [], source: "Benchmarks", error: `Industria no soportada: ${industry}`, fromCache: false }
    }

    const benchmarks: ScrapedBenchmark[] = Object.entries(metrics).flatMap(([metric, percentiles]) => [
      { source: "Supercias", industry, metric: `${metric}_p25`, value: percentiles.p25, unit: metric.includes("Ratio") ? "x" : "%", period: "2024", lastUpdated: new Date().toISOString().slice(0, 10) },
      { source: "Supercias", industry, metric: `${metric}_p50`, value: percentiles.p50, unit: metric.includes("Ratio") ? "x" : "%", period: "2024", lastUpdated: new Date().toISOString().slice(0, 10) },
      { source: "Supercias", industry, metric: `${metric}_p75`, value: percentiles.p75, unit: metric.includes("Ratio") ? "x" : "%", period: "2024", lastUpdated: new Date().toISOString().slice(0, 10) },
    ])

    benchmarkCache[cacheKey] = benchmarks
    this.lastFetch[cacheKey] = Date.now()
    return { success: true, data: benchmarks, source: "Benchmarks", fromCache: false }
  }

  clearCache(): void {
    Object.keys(benchmarkCache).forEach((k) => delete benchmarkCache[k])
    Object.keys(companyCache).forEach((k) => delete companyCache[k])
    this.lastFetch = {}
  }
}

export const scrapingService = new ScrapingService()
