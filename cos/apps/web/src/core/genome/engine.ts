import { memoryStore } from "@/core/memory"
import { consultingDna } from "@/core/consulting-dna"
import type { EnterpriseGenome, DimensionScore, GenomeDimension, DimensionFactor, GenomeComparison, GenomeSummary } from "./types"

const genomeStore = new Map<string, EnterpriseGenome>()

const DIMENSION_CONFIG: Record<GenomeDimension, { label: string; description: string; factors: string[]; weight: number }> = {
  finanzas: {
    label: "Finanzas", description: "Salud financiera: liquidez, rentabilidad, endeudamiento, márgenes",
    factors: ["liquidez", "rentabilidad", "endeudamiento", "margen_operativo", "flujo_caja"],
    weight: 12,
  },
  operaciones: {
    label: "Operaciones", description: "Eficiencia operativa: procesos, automatización, productividad",
    factors: ["eficiencia_procesos", "automatizacion", "productividad", "capacidad_operativa"],
    weight: 10,
  },
  talento: {
    label: "Talento", description: "Capital humano: equipo, habilidades, retención, desarrollo",
    factors: ["retencion_talento", "desarrollo_equipo", "clima_laboral", "capacitacion"],
    weight: 9,
  },
  digitalizacion: {
    label: "Digitalización", description: "Madurez digital: adopción tecnológica, transformación digital",
    factors: ["adopcion_tecnologica", "presencia_digital", "automatizacion_digital", "datos_y_analitica"],
    weight: 8,
  },
  clientes: {
    label: "Clientes", description: "Relación con clientes: satisfacción, retención, adquisición",
    factors: ["satisfaccion_cliente", "retencion_clientes", "adquisicion", "calidad_servicio"],
    weight: 9,
  },
  comercial: {
    label: "Comercial", description: "Gestión comercial: ventas, marketing, crecimiento de ingresos",
    factors: ["crecimiento_ventas", "efectividad_comercial", "canales_venta", "presencia_mercado"],
    weight: 8,
  },
  tributario: {
    label: "Tributario", description: "Gestión tributaria: cumplimiento, planificación, riesgos fiscales",
    factors: ["cumplimiento_tributario", "planificacion_fiscal", "riesgos_fiscales", "eficiencia_tributaria"],
    weight: 7,
  },
  legal: {
    label: "Legal", description: "Cumplimiento legal: regulatorio, contratos, riesgos legales",
    factors: ["cumplimiento_legal", "gestion_contractual", "riesgos_legales", "gobierno_corporativo"],
    weight: 7,
  },
  tecnologia: {
    label: "Tecnología", description: "Infraestructura tecnológica: stack, seguridad, innovación TI",
    factors: ["infraestructura_ti", "seguridad_informatica", "stack_tecnologico", "innovacion_ti"],
    weight: 7,
  },
  cultura: {
    label: "Cultura", description: "Cultura empresarial: valores, adaptabilidad, comunicación",
    factors: ["cultura_organizacional", "adaptabilidad", "comunicacion_interna", "valores"],
    weight: 6,
  },
  innovacion: {
    label: "Innovación", description: "Capacidad de innovación: I+D, nuevos productos, mejora continua",
    factors: ["capacidad_innovacion", "inversion_idd", "nuevos_productos", "mejora_continua"],
    weight: 6,
  },
  gobierno: {
    label: "Gobierno", description: "Gobierno corporativo: estructura, políticas, controles, transparencia",
    factors: ["estructura_gobierno", "politicas_controles", "transparencia", "toma_decisiones"],
    weight: 5,
  },
  esg: {
    label: "ESG", description: "Ambiental, social y gobierno: sostenibilidad, impacto social, ética",
    factors: ["ambiental", "social", "gobernanza_esg", "sostenibilidad"],
    weight: 3,
  },
  madurez: {
    label: "Madurez Empresarial", description: "Madurez global: integración de todas las dimensiones",
    factors: ["madurez_estrategica", "madurez_operativa", "madurez_financiera", "madurez_digital"],
    weight: 3,
  },
}

class GenomeEngine {
  async analyze(companyId: string, companyName: string, industry?: string, size?: string): Promise<EnterpriseGenome> {
    const memory = memoryStore.getRecent(companyId, 200)
    const summary = memoryStore.summarize(companyId)

    const dimensions = await Promise.all(
      (Object.keys(DIMENSION_CONFIG) as GenomeDimension[]).map((dim) =>
        this.scoreDimension(dim, companyId, memory, summary)
      )
    )

    const totalWeight = Object.values(DIMENSION_CONFIG).reduce((s, c) => s + c.weight, 0)
    const overallScore = Math.round(
      dimensions.reduce((s, d) => s + (d.score * DIMENSION_CONFIG[d.dimension].weight), 0) / totalWeight
    )
    const overallConfidence = Math.round(
      dimensions.reduce((s, d) => s + d.confidence, 0) / dimensions.length
    )

    const strengths: EnterpriseGenome["strengths"] = []
    const weaknesses: EnterpriseGenome["weaknesses"] = []

    for (const d of dimensions) {
      for (const f of d.factors) {
        if (f.value >= 75) strengths.push({ dimension: d.label, score: f.value, factor: f.name })
        else if (f.value <= 35) weaknesses.push({ dimension: d.label, score: f.value, factor: f.name })
      }
    }

    strengths.sort((a, b) => b.score - a.score)
    weaknesses.sort((a, b) => a.score - b.score)

    const recommendations = this.generateRecommendations(dimensions)

    const genome: EnterpriseGenome = {
      companyId,
      companyName,
      industry,
      size,
      generatedAt: new Date().toISOString(),
      overallScore,
      overallConfidence,
      dimensions,
      strengths: strengths.slice(0, 5),
      weaknesses: weaknesses.slice(0, 5),
      recommendations,
    }

    genomeStore.set(companyId, genome)
    return genome
  }

  getGenome(companyId: string): EnterpriseGenome | undefined {
    return genomeStore.get(companyId)
  }

  compare(companyId1: string, companyId2: string): GenomeComparison | null {
    const g1 = genomeStore.get(companyId1)
    const g2 = genomeStore.get(companyId2)
    if (!g1 || !g2) return null

    const dimensionGaps: GenomeComparison["dimensionGaps"] = []
    let totalGap = 0

    for (const d1 of g1.dimensions) {
      const d2 = g2.dimensions.find((d) => d.dimension === d1.dimension)
      if (!d2) continue
      const gap = d1.score - d2.score
      dimensionGaps.push({
        dimension: d1.dimension, label: d1.label,
        thisScore: d1.score, otherScore: d2.score, gap,
      })
      totalGap += Math.abs(gap)
    }

    const similarity = Math.max(0, Math.min(100, 100 - totalGap / g1.dimensions.length))

    const strengths = dimensionGaps.filter((g) => g.gap > 10).map((g) => `${g.label}: +${g.gap} puntos`)
    const weaknesses = dimensionGaps.filter((g) => g.gap < -10).map((g) => `${g.label}: ${g.gap} puntos`)

    return {
      companyId: companyId1,
      otherCompanyId: companyId2,
      similarity: Math.round(similarity),
      dimensionGaps,
      overallGap: Math.round(totalGap / g1.dimensions.length),
      strengths: strengths.slice(0, 3),
      weaknesses: weaknesses.slice(0, 3),
    }
  }

  getSummary(companyId: string): GenomeSummary | null {
    const genome = genomeStore.get(companyId)
    if (!genome) return null

    const sorted = [...genome.dimensions].sort((a, b) => b.score - a.score)
    const topDimension = { name: sorted[0].label, score: sorted[0].score }
    const bottomDimension = { name: sorted[sorted.length - 1].label, score: sorted[sorted.length - 1].score }
    const dimensionsAbove70 = sorted.filter((d) => d.score >= 70).length
    const dimensionsBelow40 = sorted.filter((d) => d.score < 40).length

    // Determine overall trend from individual trends
    const upCount = sorted.filter((d) => d.trend === "up").length
    const downCount = sorted.filter((d) => d.trend === "down").length
    const trend = upCount > downCount ? "up" : downCount > upCount ? "down" : "stable"

    return { companyId: genome.companyId, overallScore: genome.overallScore, topDimension, bottomDimension, dimensionsAbove70, dimensionsBelow40, trend }
  }

  // ── Private: score a single dimension ──

  private async scoreDimension(
    dimension: GenomeDimension,
    companyId: string,
    memory: any[],
    summary: any,
  ): Promise<DimensionScore> {
    const config = DIMENSION_CONFIG[dimension]
    let totalScore = 50  // baseline neutral
    const factors: DimensionFactor[] = []
    let dataPoints = 0

    // Score from memory entries
    const relevantMemory = memory.filter((m) => {
      const text = `${m.title} ${m.description} ${m.tags?.join(" ")}`.toLowerCase()
      return config.factors.some((f) => text.includes(f.replace(/_/g, " ")))
    })

    // Calculate factor scores
    for (const factor of config.factors) {
      const factorMemory = memory.filter((m) => {
        const text = `${m.title} ${m.description}`.toLowerCase()
        return text.includes(factor.replace(/_/g, " "))
      })

      let factorScore = 50
      if (factorMemory.length > 0) {
        dataPoints += factorMemory.length
        // Higher importance events contribute more
        const weightedScores = factorMemory.map((m) => {
          const importance = m.importance === "critical" ? 85 : m.importance === "high" ? 70 : m.importance === "medium" ? 50 : 30
          return importance
        })
        factorScore = Math.round(weightedScores.reduce((s, v) => s + v, 0) / weightedScores.length)
      }

      factors.push({
        name: this.factorLabel(factor),
        value: factorScore,
        weight: 100 / config.factors.length,
        source: factorMemory.length > 0 ? `${factorMemory.length} eventos registrados` : "Sin datos",
        description: this.factorDescription(factor, factorScore),
      })

      totalScore += (factorScore - 50) * (100 / config.factors.length) / 100
    }

    // Boost if dimension has positive recommendations in DNA
    const dnaRules = consultingDna.getRules()
    const relevantRules = dnaRules.filter((r) =>
      (r as any).category?.toLowerCase().includes(dimension) ||
      (r as any).tags?.some((t: string) => config.factors.includes(t))
    )
    if (relevantRules.length > 3) totalScore += 5
    if (relevantRules.length > 6) totalScore += 3

    // Determine trend
    const recent = memory.slice(0, 20)
    const recentPositive = recent.filter((m) => m.type === "decision" || m.type === "recommendation").length
    const recentNegative = recent.filter((m) => m.type === "risk" || m.type === "alert").length
    const trend = recentPositive > recentNegative * 1.5 ? "up" : recentNegative > recentPositive * 1.5 ? "down" : "stable"

    const confidence = Math.min(95, Math.round(50 + dataPoints * 3))

    return {
      dimension,
      label: config.label,
      score: Math.max(5, Math.min(100, Math.round(totalScore))),
      confidence,
      trend,
      factors,
      description: this.dimensionSummary(config.label, Math.round(totalScore), trend),
    }
  }

  private factorLabel(factor: string): string {
    const labels: Record<string, string> = {
      liquidez: "Liquidez", rentabilidad: "Rentabilidad", endeudamiento: "Endeudamiento",
      margen_operativo: "Margen Operativo", flujo_caja: "Flujo de Caja",
      eficiencia_procesos: "Eficiencia de Procesos", automatizacion: "Automatización",
      productividad: "Productividad", capacidad_operativa: "Capacidad Operativa",
      retencion_talento: "Retención de Talento", desarrollo_equipo: "Desarrollo del Equipo",
      clima_laboral: "Clima Laboral", capacitacion: "Capacitación",
      adopcion_tecnologica: "Adopción Tecnológica", presencia_digital: "Presencia Digital",
      automatizacion_digital: "Automatización Digital", datos_y_analitica: "Datos y Analítica",
      satisfaccion_cliente: "Satisfacción del Cliente", retencion_clientes: "Retención de Clientes",
      adquisicion: "Adquisición", calidad_servicio: "Calidad del Servicio",
      crecimiento_ventas: "Crecimiento de Ventas", efectividad_comercial: "Efectividad Comercial",
      canales_venta: "Canales de Venta", presencia_mercado: "Presencia de Mercado",
      cumplimiento_tributario: "Cumplimiento Tributario", planificacion_fiscal: "Planificación Fiscal",
      riesgos_fiscales: "Riesgos Fiscales", eficiencia_tributaria: "Eficiencia Tributaria",
      cumplimiento_legal: "Cumplimiento Legal", gestion_contractual: "Gestión Contractual",
      riesgos_legales: "Riesgos Legales", gobierno_corporativo: "Gobierno Corporativo",
      infraestructura_ti: "Infraestructura TI", seguridad_informatica: "Seguridad Informática",
      stack_tecnologico: "Stack Tecnológico", innovacion_ti: "Innovación TI",
      cultura_organizacional: "Cultura Organizacional", adaptabilidad: "Adaptabilidad",
      comunicacion_interna: "Comunicación Interna", valores: "Valores",
      capacidad_innovacion: "Capacidad de Innovación", inversion_idd: "Inversión en I+D",
      nuevos_productos: "Nuevos Productos", mejora_continua: "Mejora Continua",
      estructura_gobierno: "Estructura de Gobierno", politicas_controles: "Políticas y Controles",
      transparencia: "Transparencia", toma_decisiones: "Toma de Decisiones",
      ambiental: "Ambiental", social: "Social", gobernanza_esg: "Gobernanza ESG",
      sostenibilidad: "Sostenibilidad",
      madurez_estrategica: "Madurez Estratégica", madurez_operativa: "Madurez Operativa",
      madurez_financiera: "Madurez Financiera", madurez_digital: "Madurez Digital",
    }
    return labels[factor] || factor.replace(/_/g, " ")
  }

  private factorDescription(factor: string, score: number): string {
    if (score >= 80) return `Fortaleza: ${this.factorLabel(factor)} sólido`
    if (score >= 60) return `Adecuado: ${this.factorLabel(factor)} dentro de lo esperado`
    if (score >= 40) return `Regular: ${this.factorLabel(factor)} requiere atención`
    return `Debilidad: ${this.factorLabel(factor)} crítico, requiere intervención`
  }

  private dimensionSummary(label: string, score: number, trend: string): string {
    const trendIcon = trend === "up" ? "↑" : trend === "down" ? "↓" : "→"
    const status = score >= 80 ? "Excelente" : score >= 60 ? "Buena" : score >= 40 ? "Regular" : "Crítica"
    return `${label}: ${status} (${score}/100) ${trendIcon}`
  }

  private generateRecommendations(dimensions: DimensionScore[]): string[] {
    const recs: string[] = []
    const sorted = [...dimensions].sort((a, b) => a.score - b.score)

    const weakest = sorted.slice(0, 3)
    for (const d of weakest) {
      const worstFactor = [...d.factors].sort((a, b) => a.value - b.value)[0]
      if (worstFactor && worstFactor.value < 40) {
        recs.push(`Mejorar ${d.label}: ${worstFactor.name} está crítico (${worstFactor.value}/100)`)
      }
    }

    const strongest = sorted.filter((d) => d.score >= 75)
    if (strongest.length > 0) {
      recs.push(`Capitalizar fortalezas en ${strongest.map((d) => d.label).join(", ")} para impulsar áreas débiles`)
    }

    if (dimensions.find((d) => d.dimension === "digitalizacion" && d.score < 50)) {
      recs.push("Acelerar transformación digital como palanca para mejorar múltiples dimensiones")
    }

    if (dimensions.find((d) => d.dimension === "finanzas" && d.score < 50)) {
      recs.push("Priorizar saneamiento financiero antes de iniciativas de crecimiento")
    }

    if (recs.length === 0) {
      recs.push("Perfil empresarial balanceado. Enfocar esfuerzos en innovación y crecimiento sostenible")
    }

    return recs
  }
}

export const genomeEngine = new GenomeEngine()
