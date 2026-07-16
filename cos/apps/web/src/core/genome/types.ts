export type GenomeDimension =
  | "finanzas" | "operaciones" | "talento" | "digitalizacion"
  | "clientes" | "comercial" | "tributario" | "legal"
  | "tecnologia" | "cultura" | "innovacion" | "gobierno"
  | "esg" | "madurez"

export interface DimensionScore {
  dimension: GenomeDimension
  label: string
  score: number  // 0-100
  confidence: number  // 0-100
  trend: "up" | "down" | "stable"
  factors: DimensionFactor[]
  benchmarkPercentile?: number  // 0-100, only when enough data
  description: string
}

export interface DimensionFactor {
  name: string
  value: number  // 0-100
  weight: number  // 0-100
  source: string  // where this came from
  description: string
}

export interface EnterpriseGenome {
  companyId: string
  companyName: string
  industry?: string
  size?: string
  generatedAt: string
  overallScore: number
  overallConfidence: number
  dimensions: DimensionScore[]
  strengths: { dimension: string; score: number; factor: string }[]
  weaknesses: { dimension: string; score: number; factor: string }[]
  recommendations: string[]
}

export interface GenomeComparison {
  companyId: string
  otherCompanyId: string
  similarity: number  // 0-100
  dimensionGaps: { dimension: string; label: string; thisScore: number; otherScore: number; gap: number }[]
  overallGap: number
  strengths: string[]
  weaknesses: string[]
}

export interface GenomeSummary {
  companyId: string
  overallScore: number
  topDimension: { name: string; score: number }
  bottomDimension: { name: string; score: number }
  dimensionsAbove70: number
  dimensionsBelow40: number
  trend: "up" | "down" | "stable"
}
