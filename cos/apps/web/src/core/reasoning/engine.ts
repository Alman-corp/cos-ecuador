import { memoryStore } from "@/core/memory"
import { consultingDna } from "@/core/consulting-dna"
import type {
  ReasoningRequest, ReasoningResponse, Observation, Diagnosis,
  Factor, Hypothesis, Explanation, ReasoningLevel,
} from "./types"

class ReasoningEngine {
  async reason(req: ReasoningRequest): Promise<ReasoningResponse> {
    const observations = this.gatherObservations(req)
    const diagnosis = this.diagnose(observations, req)
    const hypotheses = this.generateHypotheses(observations, diagnosis, req)

    return {
      query: req.query,
      observations,
      diagnosis,
      hypotheses,
      confidence: this.calculateConfidence(observations, hypotheses),
      reasoning: this.buildReasoningText(observations, diagnosis, hypotheses),
      timestamp: new Date().toISOString(),
    }
  }

  async explain(kpi: string, currentValue: number, previousValue: number, companyId: string, clientId?: string): Promise<Explanation> {
    const change = currentValue - previousValue
    const changePercent = previousValue !== 0 ? (change / previousValue) * 100 : 0
    const direction = change > 0 ? "up" : change < 0 ? "down" : "stable"

    // Find related memory entries
    const relatedMemory = clientId
      ? memoryStore.getByEntity(clientId, companyId)
      : memoryStore.getRecent(companyId, 20)
    const recentRisks = relatedMemory.filter((m) => m.type === "risk")
    const recentDecisions = relatedMemory.filter((m) => m.type === "decision")

    let what = `El KPI ${kpi} ${direction === "up" ? "subió" : direction === "down" ? "bajó" : "se mantuvo"} ${Math.abs(changePercent).toFixed(1)}% (de ${previousValue} a ${currentValue}).`

    let why = `Este cambio puede explicarse por ${recentRisks.length > 0 ? `${recentRisks.length} eventos de riesgo registrados` : "factores operativos normales"}.`
    if (recentDecisions.length > 0) {
      why += ` Se tomaron ${recentDecisions.length} decisiones recientes que podrían estar impactando este indicador.`
    }

    // Use DNA thresholds for context
    const relevantThreshold = consultingDna.getThresholds().find((t) =>
      t.indicator.toLowerCase().includes(kpi.toLowerCase())
    )
    if (relevantThreshold) {
      const level = direction === "down"
        ? (currentValue <= relevantThreshold.critical ? "crítico" : currentValue <= relevantThreshold.high ? "alto" : "moderado")
        : "normal"
      why += ` Según los umbrales del DNA de consultoría, el nivel actual es ${level}.`
    }

    return {
      what,
      why,
      how: `Monitorear ${kpi} semanalmente, revisar los factores identificados y ajustar la estrategia según sea necesario.`,
      impact: `${Math.abs(changePercent) > 20 ? "Alto" : Math.abs(changePercent) > 10 ? "Moderado" : "Bajo"} — cambio de ${Math.abs(changePercent).toFixed(1)}%`,
      probability: Math.min(85, 50 + Math.abs(changePercent)),
      timeHorizon: Math.abs(changePercent) > 20 ? "Corto plazo (1-2 semanas)" : "Mediano plazo (1-3 meses)",
    }
  }

  async diagnoseFinancial(data: Record<string, number>): Promise<Diagnosis> {
    const factors: Factor[] = []
    let criticalCount = 0

    // Liquidity analysis
    if (data.currentAssets && data.currentLiabilities) {
      const liquidity = data.currentAssets / data.currentLiabilities
      const threshold = consultingDna.getThresholds().find((t) => t.indicator === "current_ratio")
      const level = threshold
        ? (liquidity <= threshold.critical ? "critical" : liquidity <= threshold.high ? "high" : liquidity <= threshold.medium ? "medium" : "low")
        : "medium"

      factors.push({
        name: "Liquidez Corriente",
        impact: liquidity >= 1.5 ? "positive" : liquidity >= 1 ? "neutral" : "negative",
        weight: 0.3,
        evidence: [`Ratio actual: ${liquidity.toFixed(2)}`, `Umbral crítico: ${threshold?.critical || 1.0}`],
        explanation: `La liquidez está en ${level === "critical" ? "nivel crítico" : level === "high" ? "nivel alto de riesgo" : "nivel aceptable"}. ${liquidity < 1 ? "Los pasivos superan a los activos corrientes." : ""}`,
      })
      if (level === "critical" || level === "high") criticalCount++
    }

    // Solvency analysis
    if (data.totalLiabilities && data.equity && data.equity > 0) {
      const debtEquity = data.totalLiabilities / data.equity
      factors.push({
        name: "Endeudamiento",
        impact: debtEquity <= 1.5 ? "positive" : debtEquity <= 3 ? "neutral" : "negative",
        weight: 0.25,
        evidence: [`Relación Deuda/Patrimonio: ${debtEquity.toFixed(2)}`],
        explanation: `El nivel de endeudamiento es ${debtEquity > 3 ? "elevado" : debtEquity > 1.5 ? "moderado" : "saludable"}.`,
      })
      if (debtEquity > 3) criticalCount++
    }

    // Profitability analysis
    if (data.revenue && data.netIncome) {
      const margin = (data.netIncome / data.revenue) * 100
      factors.push({
        name: "Margen Neto",
        impact: margin > 10 ? "positive" : margin > 0 ? "neutral" : "negative",
        weight: 0.25,
        evidence: [`Margen neto: ${margin.toFixed(1)}%`],
        explanation: `El margen neto es ${margin > 10 ? "saludable" : margin > 0 ? "ajustado" : "negativo"}.`,
      })
      if (margin < 0) criticalCount++
    }

    // Efficiency analysis
    if (data.revenue && data.totalAssets) {
      const turnover = data.revenue / data.totalAssets
      factors.push({
        name: "Rotación de Activos",
        impact: turnover > 1 ? "positive" : turnover > 0.5 ? "neutral" : "negative",
        weight: 0.2,
        evidence: [`Rotación: ${turnover.toFixed(2)}`],
        explanation: `La empresa genera ${turnover.toFixed(2)}x sus activos en ingresos.`,
      })
    }

    const overallHealth = criticalCount >= 3 ? "critical" : criticalCount >= 2 ? "risk" : criticalCount === 1 ? "attention" : "healthy"
    const positive = factors.filter((f) => f.impact === "positive").length
    const total = factors.length
    const confidence = Math.round((positive / total) * 100)

    return {
      summary: criticalCount >= 2
        ? `${criticalCount} indicadores críticos requieren atención inmediata.`
        : criticalCount === 1
          ? "Un indicador crítico identificado. Se recomienda revisión."
          : "La empresa muestra indicadores generales saludables.",
      factors,
      overallHealth,
      confidence,
    }
  }

  private gatherObservations(req: ReasoningRequest): Observation[] {
    const observations: Observation[] = []
    const memory = req.clientId
      ? memoryStore.getByEntity(req.clientId, req.companyId)
      : memoryStore.getRecent(req.companyId, 30)

    // KPI changes from memory
    const kpiChanges = memory.filter((m) => m.type === "kpi_change")
    for (const kc of kpiChanges) {
      const match = kc.description.match(/De (\d+(?:\.\d+)?) a (\d+(?:\.\d+)?)/)
      if (match) {
        const prev = parseFloat(match[1])
        const curr = parseFloat(match[2])
        const change = curr - prev
        const changePercent = prev !== 0 ? (change / prev) * 100 : 0
        observations.push({
          id: kc.id,
          type: "kpi_change",
          indicator: kc.title.replace("KPI ", ""),
          currentValue: curr,
          previousValue: prev,
          change,
          changePercent,
          direction: change > 0 ? "up" : change < 0 ? "down" : "stable",
          severity: Math.abs(changePercent) > 20 ? "high" : Math.abs(changePercent) > 10 ? "medium" : "low",
          description: kc.description,
        })
      }
    }

    // Risks from memory
    const risks = memory.filter((m) => m.type === "risk")
    for (const r of risks) {
      observations.push({
        id: r.id,
        type: "risk",
        indicator: r.title,
        currentValue: 0,
        previousValue: 0,
        change: 0,
        changePercent: 0,
        direction: "down",
        severity: "high",
        description: r.description,
      })
    }

    return observations
  }

  private diagnose(observations: Observation[], req: ReasoningRequest): Diagnosis | null {
    if (observations.length === 0) return null

    const negativeObservations = observations.filter((o) => o.direction === "down" || o.type === "risk")
    const positiveObservations = observations.filter((o) => o.direction === "up" && o.type !== "risk")

    const factors: Factor[] = []

    for (const obs of negativeObservations.slice(0, 5)) {
      factors.push({
        name: obs.indicator,
        impact: "negative",
        weight: 1 / Math.max(obs.severity === "critical" ? 1 : obs.severity === "high" ? 2 : 3, 1),
        evidence: [obs.description],
        explanation: `${obs.indicator} ${obs.direction === "down" ? "disminuyó" : "presenta riesgo"} (${Math.abs(obs.changePercent).toFixed(0)}% de cambio).`,
      })
    }

    for (const obs of positiveObservations.slice(0, 3)) {
      factors.push({
        name: obs.indicator,
        impact: "positive",
        weight: 0.5,
        evidence: [obs.description],
        explanation: `${obs.indicator} mejoró (${obs.changePercent.toFixed(0)}% positivo).`,
      })
    }

    const criticalCount = observations.filter((o) => o.severity === "critical" || o.severity === "high").length
    const overallHealth = criticalCount >= 3 ? "critical" : criticalCount >= 2 ? "risk" : criticalCount === 1 ? "attention" : "healthy"

    return {
      summary: criticalCount >= 2 ? `${criticalCount} observaciones críticas. Se requiere intervención.` : "Estado general estable con oportunidades de mejora.",
      factors,
      overallHealth,
      confidence: Math.max(60, 100 - criticalCount * 10),
    }
  }

  private generateHypotheses(observations: Observation[], diagnosis: Diagnosis | null, req: ReasoningRequest): Hypothesis[] {
    const hypotheses: Hypothesis[] = []

    if (observations.some((o) => o.indicator.toLowerCase().includes("liquidez") || o.indicator.toLowerCase().includes("current_ratio"))) {
      hypotheses.push({
        id: "h_liquidity",
        title: "Problema de liquidez",
        description: "La liquidez está por debajo de niveles saludables, posiblemente por inventario inmovilizado, cobros lentos o incremento de pasivos bancarios.",
        probability: 75,
        evidence: ["Disminución en ratios de liquidez", "Posibles problemas de cobranza"],
        supportingFactors: ["Inventario alto", "Ciclo de conversión de efectivo largo"],
        counterFactors: ["Líneas de crédito disponibles"],
        recommendedAction: "Revisar cuentas por cobrar, negociar plazos con proveedores y evaluar líneas de crédito.",
      })
    }

    if (observations.some((o) => o.indicator.toLowerCase().includes("endeudamiento") || o.indicator.toLowerCase().includes("debt"))) {
      hypotheses.push({
        id: "h_debt",
        title: "Sobreendeudamiento",
        description: "El nivel de deuda supera ratios saludables, lo que podría afectar la capacidad de inversión y generar estrés financiero.",
        probability: 65,
        evidence: ["Relación deuda/patrimonio elevada", "Posible incremento en gastos financieros"],
        supportingFactors: ["Pasivos crecientes", "Patrimonio estable o decreciente"],
        counterFactors: ["Buena generación de flujo"],
        recommendedAction: "Evaluar reestructuración de deuda, considerar capitalización y revisar gastos financieros.",
      })
    }

    if (observations.some((o) => o.indicator.toLowerCase().includes("margen") || o.indicator.toLowerCase().includes("profit"))) {
      hypotheses.push({
        id: "h_margin",
        title: "Presión sobre márgenes",
        description: "Los márgenes de rentabilidad están bajo presión por aumento de costos o reducción de precios de venta.",
        probability: 60,
        evidence: ["Margen neto decreciente", "Costos operativos en aumento"],
        supportingFactors: ["Inflación en insumos", "Competencia de precios"],
        counterFactors: ["Diferenciación de producto"],
        recommendedAction: "Revisar estructura de costos, evaluar aumentos de precios y optimizar procesos operativos.",
      })
    }

    // Default hypothesis when no specific patterns found
    if (hypotheses.length === 0) {
      hypotheses.push({
        id: "h_general",
        title: "Estado general estable",
        description: "No se detectan patrones anómalos significativos. La empresa muestra indicadores dentro de rangos esperados.",
        probability: 85,
        evidence: ["Indicadores estables", "Sin alertas críticas"],
        supportingFactors: ["Gestión consistente", "Control de riesgos adecuado"],
        counterFactors: ["Factores externos no evaluados"],
        recommendedAction: "Mantener monitoreo regular y ejecutar las estrategias planificadas.",
      })
    }

    return hypotheses.sort((a, b) => b.probability - a.probability)
  }

  private calculateConfidence(observations: Observation[], hypotheses: Hypothesis[]): number {
    const hasData = observations.length > 0
    const hasStrongHypotheses = hypotheses.some((h) => h.probability >= 70)
    const dataConfidence = Math.min(observations.length * 10, 60)
    const hypothesisConfidence = hasStrongHypotheses ? 25 : 10
    return Math.min(dataConfidence + hypothesisConfidence, 95)
  }

  private buildReasoningText(observations: Observation[], diagnosis: Diagnosis | null, hypotheses: Hypothesis[]): string {
    const parts: string[] = []

    if (observations.length > 0) {
      parts.push(`## Observaciones (${observations.length})`)
      for (const o of observations.slice(0, 5)) {
        parts.push(`- ${o.indicator}: ${o.direction === "up" ? "↑" : o.direction === "down" ? "↓" : "→"} ${Math.abs(o.changePercent).toFixed(1)}% (severidad: ${o.severity})`)
      }
    }

    if (diagnosis) {
      parts.push(`\n## Diagnóstico\n${diagnosis.summary}`)
      for (const f of diagnosis.factors.slice(0, 4)) {
        parts.push(`- ${f.name}: impacto ${f.impact} (peso: ${(f.weight * 100).toFixed(0)}%)`)
      }
    }

    if (hypotheses.length > 0) {
      parts.push(`\n## Hipótesis`)
      for (const h of hypotheses.slice(0, 3)) {
        parts.push(`- ${h.title} (probabilidad: ${h.probability}%): ${h.description.slice(0, 120)}...`)
      }
    }

    return parts.join("\n")
  }
}

export const reasoningEngine = new ReasoningEngine()
