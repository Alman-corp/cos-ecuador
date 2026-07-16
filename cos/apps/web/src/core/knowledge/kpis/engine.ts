import { kpiCatalog, kpiMap, kpiByDomain, kpiDomains, type KPIDefinition, type KpiDomain } from "./catalog"

export interface KPIEvaluation {
  kpi: KPIDefinition
  value: number
  status: "excellent" | "good" | "moderate" | "critical" | "unknown"
  interpretation: string
  recommendations: string[]
}

class KPILibraryEngine {
  getKPIs(domain?: KpiDomain, search?: string): KPIDefinition[] {
    let results = domain ? kpiByDomain.get(domain) || [] : kpiCatalog
    if (search) {
      const q = search.toLowerCase()
      results = results.filter(
        (k) =>
          k.name.toLowerCase().includes(q) ||
          k.abbreviation.toLowerCase().includes(q) ||
          k.description.toLowerCase().includes(q) ||
          k.id.includes(q),
      )
    }
    return results
  }

  getKPI(id: string): KPIDefinition | undefined {
    return kpiMap.get(id)
  }

  getDomains(): { domain: KpiDomain; label: string; count: number }[] {
    return kpiDomains
  }

  getTotalCount(): number {
    return kpiCatalog.length
  }

  evaluate(kpiId: string, value: number): KPIEvaluation {
    const kpi = kpiMap.get(kpiId)
    if (!kpi) return { kpi: { id: kpiId, name: "Desconocido", abbreviation: "N/A", description: "", formula: "", unit: "", domain: "financial", subdomain: "", interpretation: "", thresholds: { direction: "higher_is_better" }, frequency: "monthly", applicableIndustries: [], relatedKpis: [], relatedRisks: [], recommendedActions: [] }, value, status: "unknown", interpretation: "KPI no encontrado", recommendations: [] }

    const t = kpi.thresholds
    let status: KPIEvaluation["status"] = "unknown"

    if (t.direction === "higher_is_better") {
      if (t.excellent !== undefined && value >= t.excellent) status = "excellent"
      else if (t.good !== undefined && value >= t.good) status = "good"
      else if (t.moderate !== undefined && value >= t.moderate) status = "moderate"
      else status = "critical"
    } else if (t.direction === "lower_is_better") {
      if (t.excellent !== undefined && value <= t.excellent) status = "excellent"
      else if (t.good !== undefined && value <= t.good) status = "good"
      else if (t.moderate !== undefined && value <= t.moderate) status = "moderate"
      else status = "critical"
    } else {
      const inRange = (t.rangeMin !== undefined && t.rangeMax !== undefined && value >= t.rangeMin && value <= t.rangeMax)
      status = inRange ? "good" : "moderate"
    }

    const statusLabels = { excellent: "Excelente ✅", good: "Buena 👍", moderate: "Regular ⚠️", critical: "Crítica 🔴", unknown: "Sin datos ❓" }

    return {
      kpi,
      value,
      status,
      interpretation: `${kpi.name}: ${value}${kpi.unit} — ${statusLabels[status]}. ${kpi.interpretation}`,
      recommendations: kpi.recommendedActions,
    }
  }

  evaluateMultiple(values: Record<string, number>): KPIEvaluation[] {
    return Object.entries(values).map(([id, value]) => this.evaluate(id, value))
  }

  getSummary(): string {
    return `## Universal KPI Library\n\n` +
      `**${kpiCatalog.length}** KPIs catalogados en **${kpiDomains.length}** dominios\n\n` +
      kpiDomains.map((d) => `- **${d.label}**: ${d.count} KPIs`).join("\n") + `\n\n` +
      `Cada KPI incluye: definición, fórmula, unidad, umbrales (excelente/bueno/regular/crítico), ` +
      `interpretación, riesgos asociados, acciones recomendadas, industrias aplicables y conceptos IFRS relacionados`
  }

  getRelatedKPIs(kpiId: string): KPIDefinition[] {
    const kpi = kpiMap.get(kpiId)
    if (!kpi) return []
    return kpi.relatedKpis.map((id) => kpiMap.get(id)).filter((k): k is KPIDefinition => !!k)
  }

  suggestKPIsForIndustry(industry: string): KPIDefinition[] {
    const ind = industry.toLowerCase()
    return kpiCatalog.filter(
      (k) => k.applicableIndustries.includes("*") || k.applicableIndustries.some((a) => ind.includes(a.toLowerCase())),
    )
  }
}

export const kpiLibrary = new KPILibraryEngine()
