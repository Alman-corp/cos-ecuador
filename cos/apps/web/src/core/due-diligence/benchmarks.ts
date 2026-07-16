interface BenchmarkSet {
  currentRatio: { p25: number; p50: number; p75: number }
  debtToEquity: { p25: number; p50: number; p75: number }
  netMargin: { p25: number; p50: number; p75: number }
  roe: { p25: number; p50: number; p75: number }
  roa: { p25: number; p50: number; p75: number }
}

const INDUSTRY_BENCHMARKS: Record<string, BenchmarkSet> = {
  Manufactura: { currentRatio: { p25: 1.2, p50: 1.8, p75: 2.5 }, debtToEquity: { p25: 0.5, p50: 1.0, p75: 1.8 }, netMargin: { p25: 0.03, p50: 0.07, p75: 0.12 }, roe: { p25: 0.05, p50: 0.12, p75: 0.20 }, roa: { p25: 0.02, p50: 0.05, p75: 0.10 } },
  Comercio: { currentRatio: { p25: 1.0, p50: 1.5, p75: 2.0 }, debtToEquity: { p25: 0.8, p50: 1.5, p75: 2.5 }, netMargin: { p25: 0.02, p50: 0.05, p75: 0.08 }, roe: { p25: 0.08, p50: 0.15, p75: 0.25 }, roa: { p25: 0.03, p50: 0.06, p75: 0.11 } },
  Construcción: { currentRatio: { p25: 1.0, p50: 1.4, p75: 1.9 }, debtToEquity: { p25: 1.0, p50: 2.0, p75: 3.5 }, netMargin: { p25: 0.02, p50: 0.05, p75: 0.09 }, roe: { p25: 0.05, p50: 0.10, p75: 0.18 }, roa: { p25: 0.02, p50: 0.04, p75: 0.08 } },
  Servicios: { currentRatio: { p25: 1.1, p50: 1.6, p75: 2.2 }, debtToEquity: { p25: 0.3, p50: 0.8, p75: 1.5 }, netMargin: { p25: 0.05, p50: 0.10, p75: 0.18 }, roe: { p25: 0.10, p50: 0.18, p75: 0.30 }, roa: { p25: 0.04, p50: 0.08, p75: 0.14 } },
  Tecnología: { currentRatio: { p25: 1.5, p50: 2.2, p75: 3.5 }, debtToEquity: { p25: 0.1, p50: 0.4, p75: 0.8 }, netMargin: { p25: 0.08, p50: 0.15, p75: 0.25 }, roe: { p25: 0.12, p50: 0.22, p75: 0.35 }, roa: { p25: 0.05, p50: 0.10, p75: 0.18 } },
  Agricultura: { currentRatio: { p25: 1.1, p50: 1.5, p75: 2.0 }, debtToEquity: { p25: 0.6, p50: 1.2, p75: 2.0 }, netMargin: { p25: 0.03, p50: 0.06, p75: 0.10 }, roe: { p25: 0.04, p50: 0.08, p75: 0.15 }, roa: { p25: 0.02, p50: 0.04, p75: 0.07 } },
  Financiero: { currentRatio: { p25: 1.0, p50: 1.3, p75: 1.8 }, debtToEquity: { p25: 2.0, p50: 4.0, p75: 6.0 }, netMargin: { p25: 0.05, p50: 0.10, p75: 0.18 }, roe: { p25: 0.08, p50: 0.14, p75: 0.22 }, roa: { p25: 0.01, p50: 0.02, p75: 0.04 } },
}

export function getIndustryBenchmarks(industry: string): BenchmarkSet {
  return INDUSTRY_BENCHMARKS[industry] || INDUSTRY_BENCHMARKS.Manufactura
}
