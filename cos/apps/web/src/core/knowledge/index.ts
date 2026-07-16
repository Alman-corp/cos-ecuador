import { knowledgeGraph } from "./graph/engine"
import { ifrsEngine } from "./ifrs/engine"
import { ifrsValidator, validationRules } from "./ifrs/validator"
import { ifrsConcepts, ifrsConceptMap, type IFRSConcept } from "./ifrs/concepts"
import { sriEngine } from "./sri/engine"
import { kpiLibrary } from "./kpis/engine"
import { kpiCatalog, kpiMap, kpiByDomain, kpiDomains, type KPIDefinition, type KpiDomain } from "./kpis/catalog"
import { benchmarkEngine } from "./benchmarks/engine"
import { industryBenchmarks, type IndustryBenchmark } from "./benchmarks/data"
import { enterpriseOntology, enterpriseRelations, type OntologyClass, type OntologyRelation } from "./graph/ontology"

export interface EnterpriseKnowledgeSummary {
  ontology: { classes: number; relations: number }
  ifrs: { concepts: number; validationRules: number; ratios: number }
  sri: { taxRates: number; activities: number; benchmarks: number }
  kpis: { total: number; domains: number }
  benchmarks: { industries: number; metrics: number; totalSamples: number }
  totalKnowledgeEntries: number
}

export class EnterpriseKnowledgeBase {
  getSummary(): EnterpriseKnowledgeSummary {
    const ontologyClasses = enterpriseOntology.length
    const ontologyRelations = enterpriseRelations.length
    const ifrsCount = ifrsConcepts.length
    const validationCount = validationRules.length
    const sriRates = sriEngine.getTaxRates().length
    const sriActivities = sriEngine.searchActivities("").length
    const sriBench = sriEngine.getBenchmark("servicios") ? industryBenchmarks.length : 0
    const kpiCount = kpiLibrary.getTotalCount()
    const kpiDomainsCount = kpiLibrary.getDomains().length
    const benchIndustries = benchmarkEngine.getAllIndustries().length
    const totalSamples = industryBenchmarks.reduce((s, b) => s + b.sampleSize, 0)

    return {
      ontology: { classes: ontologyClasses, relations: ontologyRelations },
      ifrs: { concepts: ifrsCount, validationRules: validationCount, ratios: 12 },
      sri: { taxRates: sriRates, activities: sriActivities, benchmarks: sriBench },
      kpis: { total: kpiCount, domains: kpiDomainsCount },
      benchmarks: { industries: benchIndustries, metrics: 14, totalSamples },
      totalKnowledgeEntries: ontologyClasses + ontologyRelations + ifrsCount + validationCount + sriRates + sriActivities + kpiCount + benchIndustries,
    }
  }

  getContextForExecutive(industry?: string): string {
    const summary = this.getSummary()
    let context = `## Enterprise Knowledge Lake\n\n`
    context += `Plataforma con **${summary.totalKnowledgeEntries}** entradas de conocimiento estructurado.\n\n`

    context += `### Ontología Empresarial\n`
    context += `${summary.ontology.classes} clases de negocio con ${summary.ontology.relations} relaciones semánticas.\n`
    context += `Cubre: Empresa, Organización, Departamento, Capacidades, Procesos, Actividades, KPIs, Riesgos, Controles, Normativas, Stakeholders, Activos, Proyectos y más.\n\n`

    context += `### Taxonomía IFRS\n`
    context += `${summary.ifrs.concepts} conceptos financieros oficiales IFRS (Balance General, Estado Resultados, Flujo Efectivo, ORI).\n`
    context += `${summary.ifrs.validationRules} reglas de validación automática (balance cuadrado, consistencia resultados, cash flow balance, etc.).\n`
    context += `12 razones financieras calculables automáticamente desde conceptos IFRS.\n\n`

    context += `### SRI Tax Intelligence\n`
    context += `${summary.sri.taxRates} tasas impositivas oficiales Ecuador 2026 (IR 25%, IVA 15%, ICE, retenciones, IESS).\n`
    context += `${summary.sri.activities} actividades económicas CIIU clasificadas por sector.\n`
    context += `Benchmarks sectoriales: ingreso promedio, margen operativo, carga tributaria, empleados.\n\n`

    context += `### Universal KPI Library\n`
    context += `${summary.kpis.total} KPIs en ${summary.kpis.domains} dominios:\n`
    for (const d of kpiDomains.sort((a, b) => b.count - a.count).filter((d) => d.count > 0)) {
      context += `- ${d.label}: ${d.count} KPIs\n`
    }
    context += `Cada KPI con fórmula, umbrales, interpretación, riesgos asociados y acciones recomendadas.\n\n`

    context += `### Industry Benchmarks\n`
    context += `${summary.benchmarks.industries} industrias con benchmarks completos (percentiles 25/50/75).\n`
    context += `${summary.benchmarks.totalSamples.toLocaleString()} empresas analizadas en total.\n`
    context += `14 métricas por industria permiten comparación percentilada.\n`

    if (industry) {
      const bench = benchmarkEngine.getBenchmark(industry)
      if (bench) {
        context += `\n### Benchmark para ${bench.industry}\n`
        context += `Liquidez: ${bench.liquidity.p50}x | Margen Neto: ${(bench.netMargin.p50 * 100).toFixed(1)}% | ROE: ${(bench.roe.p50 * 100).toFixed(1)}%\n`
        context += `D/E: ${bench.debtToEquity.p50}x | Rotación Activos: ${bench.assetTurnover.p50}x | DSO: ${bench.dso.p50} días\n`
      }
    }

    return context
  }

  answerKnowledgeQuery(query: string): string {
    const q = query.toLowerCase()

    if (q.includes("kpi") || q.includes("indicador") || q.includes("métrica")) {
      const domain = q.includes("financiero") || q.includes("finanzas") ? "financial"
        : q.includes("liquidez") ? "liquidity"
        : q.includes("solvencia") ? "solvency"
        : q.includes("rentabilidad") || q.includes("margen") ? "profitability"
        : q.includes("eficiencia") || q.includes("rotación") ? "efficiency"
        : q.includes("crecimiento") || q.includes("crecer") ? "growth"
        : q.includes("operativo") || q.includes("producción") ? "operational"
        : q.includes("comercial") || q.includes("venta") ? "commercial"
        : q.includes("talento") || q.includes("rh") || q.includes("personas") ? "hr"
        : undefined
      const kpis = kpiLibrary.getKPIs(domain, query)
      if (kpis.length === 0) return "No encontré KPIs para esa consulta."
      return kpis.slice(0, 8).map((k) => `📊 **${k.name}** (${k.abbreviation})\n- ${k.description}\n- Fórmula: ${k.formula}\n- Umbrales: ${k.interpretation}`).join("\n\n")
    }

    if (q.includes("benchmark") || q.includes("comparación") || q.includes("sector")) {
      for (const b of industryBenchmarks) {
        if (q.includes(b.industry.toLowerCase()) || q.includes(b.industryCode.toLowerCase())) {
          return `## Benchmark: ${b.industry}\n\n` +
            `**${b.sampleSize.toLocaleString()}** empresas analizadas\n\n` +
            `| Métrica | P25 | P50 (Mediana) | P75 |\n|---|---|---|---|\n` +
            `| Liquidez | ${b.liquidity.p25}x | ${b.liquidity.p50}x | ${b.liquidity.p75}x |\n` +
            `| Prueba Ácida | ${b.quickRatio.p25}x | ${b.quickRatio.p50}x | ${b.quickRatio.p75}x |\n` +
            `| D/E | ${b.debtToEquity.p25}x | ${b.debtToEquity.p50}x | ${b.debtToEquity.p75}x |\n` +
            `| Margen Bruto | ${(b.grossMargin.p25*100).toFixed(0)}% | ${(b.grossMargin.p50*100).toFixed(0)}% | ${(b.grossMargin.p75*100).toFixed(0)}% |\n` +
            `| Margen Neto | ${(b.netMargin.p25*100).toFixed(0)}% | ${(b.netMargin.p50*100).toFixed(0)}% | ${(b.netMargin.p75*100).toFixed(0)}% |\n` +
            `| ROE | ${(b.roe.p25*100).toFixed(0)}% | ${(b.roe.p50*100).toFixed(0)}% | ${(b.roe.p75*100).toFixed(0)}% |\n` +
            `| DSO | ${b.dso.p25}d | ${b.dso.p50}d | ${b.dso.p75}d |`
        }
      }
      return "Industria no encontrada. Disponibles: " + industryBenchmarks.map((b) => b.industry).join(", ")
    }

    if (q.includes("ifrs") || q.includes("niif") || q.includes("concepto") || q.includes("balance")) {
      const results = ifrsEngine.search(query)
      if (results.length === 0) return `No encontré conceptos IFRS para "${query}".`
      return results.slice(0, 5).map((c) =>
        `📘 **${c.name}** (${c.code})\n- ${c.definition}\n- Tipo: ${c.type} | Balance: ${c.balance}\n- Referencias: ${c.references.join(", ")}`
      ).join("\n\n")
    }

    if (q.includes("sri") || q.includes("impuesto") || q.includes("tasa") || q.includes("iva") || q.includes("renta")) {
      const rates = sriEngine.getTaxRates()
      const matching = rates.filter((r) => q.includes(r.name.toLowerCase()) || q.includes(r.type.toLowerCase()) || q.includes(r.id.toLowerCase()))
      const display = matching.length > 0 ? matching : rates
      return display.slice(0, 8).map((r) =>
        `🏛️ **${r.name}**: ${r.type === "social_benefits" && r.id === "sri-lab-007" ? `$${r.rate}/mes` : `${(r.rate * 100).toFixed(1)}%`}\n- ${r.description}\n- Referencia: ${r.reference}`
      ).join("\n\n")
    }

    if (q.includes("ontología") || q.includes("clase") || q.includes("relación") || q.includes("entidad")) {
      if (q.includes("relación") || q.includes("relacion")) {
        return enterpriseRelations.slice(0, 15).map((r) =>
          `🔗 ${r.source.replace("ent:", "")} → **${r.label}** → ${r.target.replace("ent:", "")}`
        ).join("\n")
      }
      return enterpriseOntology.slice(0, 20).map((c) =>
        `📦 **${c.name}** (${c.id})\n- ${c.description}\n- Propiedades: ${c.properties.join(", ")}${c.parentId ? `\n- Padre: ${c.parentId}` : ""}`
      ).join("\n\n")
    }

    if (q.includes("validar") || q.includes("validación") || q.includes("regla")) {
      return validationRules.map((r) =>
        `${r.severity === "error" ? "🔴" : r.severity === "warning" ? "🟡" : "🔵"} **${r.name}**\n- ${r.description}`
      ).join("\n\n")
    }

    return this.getContextForExecutive()
  }
}

export const enterpriseKnowledge = new EnterpriseKnowledgeBase()

export {
  knowledgeGraph,
  ifrsEngine,
  ifrsValidator,
  ifrsConcepts,
  ifrsConceptMap,
  sriEngine,
  kpiLibrary,
  kpiCatalog,
  kpiMap,
  kpiByDomain,
  kpiDomains,
  benchmarkEngine,
  industryBenchmarks,
  enterpriseOntology,
  enterpriseRelations,
}

export type { IFRSConcept, KPIDefinition, KpiDomain, IndustryBenchmark, OntologyClass, OntologyRelation }
