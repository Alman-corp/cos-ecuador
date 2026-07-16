import { memoryStore, memoryGraph } from "@/core/memory"
import { reasoningEngine } from "@/core/reasoning"
import { predictionEngine } from "@/core/prediction"
import { planningEngine } from "@/core/planning"
import { executionEngine } from "@/core/execution"
import { learningEngine } from "@/core/learning"
import { confidenceEngine } from "@/core/confidence"
import { optimizationEngine } from "@/core/optimization"
import { genomeEngine } from "@/core/genome"
import { enterpriseKnowledge, kpiLibrary, benchmarkEngine, ifrsEngine, sriEngine, ifrsValidator, knowledgeGraph } from "@/core/knowledge"
import { validationRules } from "@/core/knowledge/ifrs/validator"

export interface ExecutiveBrief {
  greeting: string
  date: string
  criticalCount: number
  opportunitiesCount: number
  riskCount: number
  overdueTasks: number
  metrics: ExecutiveMetric[]
  criticalItems: ExecutiveItem[]
  opportunities: ExecutiveItem[]
  risks: ExecutiveItem[]
  recommendations: string[]
  memorySummary: string
  reasoning?: {
    observations: string[]
    diagnosis: string
    hypotheses: { title: string; probability: number; action: string }[]
  }
  predictions?: {
    summary: string
    confidence: number
    confidenceLabel: string
    confidenceFactors: { name: string; status: string; detail: string; score: number }[]
    warnings: { indicator: string; daysToThreshold: number; severity: string; recommendation: string }[]
    scenarios: { name: string; label: string; probability: number; summary: string }[]
    cashFlow?: { willRunOut: boolean; runOutMonth: number | null }
  }
}

export interface ExecutiveMetric {
  name: string
  value: string
  change: number
  direction: "up" | "down" | "stable"
  status: "good" | "warning" | "critical"
}

export interface ExecutiveItem {
  id: string
  title: string
  description: string
  clientName?: string
  clientId?: string
  priority: "low" | "medium" | "high" | "critical"
  type: string
  timestamp: string
}

class ExecutiveAI {
  async generateBrief(companyId: string, companyName: string): Promise<ExecutiveBrief> {
    const memory = memoryStore.summarize(companyId)
    const critical = memoryStore.getRecent(companyId, 50).filter((e) => e.importance === "critical" || e.importance === "high")
    const recent = memoryStore.getRecent(companyId, 100)

    const criticalItems: ExecutiveItem[] = critical
      .filter((e) => e.type === "risk" || e.type === "alert")
      .slice(0, 5)
      .map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description.slice(0, 200),
        clientName: e.clientId,
        clientId: e.clientId,
        priority: e.importance as any,
        type: e.type,
        timestamp: e.timestamp,
      }))

    const opportunities: ExecutiveItem[] = recent
      .filter((e) => e.type === "recommendation" || e.type === "decision" || e.type === "strategy")
      .slice(0, 3)
      .map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description.slice(0, 200),
        clientName: e.clientId,
        clientId: e.clientId,
        priority: "medium",
        type: e.type,
        timestamp: e.timestamp,
      }))

    const risks: ExecutiveItem[] = recent
      .filter((e) => e.type === "risk" && e.importance === "critical")
      .slice(0, 3)
      .map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description.slice(0, 200),
        clientName: e.clientId,
        clientId: e.clientId,
        priority: "critical",
        type: e.type,
        timestamp: e.timestamp,
      }))

    const byType = memory.byType
    const byImportance = memory.byImportance

    const metrics: ExecutiveMetric[] = [
      {
        name: "Eventos registrados",
        value: String(memory.total),
        change: 0,
        direction: "stable",
        status: memory.total > 0 ? "good" : "warning",
      },
      {
        name: "Alertas críticas",
        value: String(byImportance.critical || 0),
        change: 0,
        direction: (byImportance.critical || 0) > 0 ? "up" : "stable",
        status: (byImportance.critical || 0) > 0 ? "critical" : "good",
      },
      {
        name: "Decisiones registradas",
        value: String(byType.decision || 0),
        change: 0,
        direction: "stable",
        status: "good",
      },
      {
        name: "Riesgos activos",
        value: String(byType.risk || 0),
        change: 0,
        direction: (byType.risk || 0) > 3 ? "up" : "stable",
        status: (byType.risk || 0) > 3 ? "warning" : "good",
      },
    ]

    const plans = planningEngine.getPlans(companyId)
    const activePlans = plans.filter((p) => p.status === "active")
    const draftPlans = plans.filter((p) => p.status === "draft")

    // Check execution alerts
    const executionAlerts = executionEngine.getAllAlerts(companyId)
    const activeAlerts = executionAlerts.filter((a) => !a.resolvedAt)
    const criticalAlerts = activeAlerts.filter((a) => a.severity === "critical")
    const caseStats = learningEngine.getStats()
    const optimizationResults = optimizationEngine.getAllResults(companyId)
    const genome = genomeEngine.getGenome(companyId)

    const recommendations: string[] = []
    if (criticalAlerts.length > 0) {
      recommendations.push(`🔴 ${criticalAlerts.length} ${criticalAlerts.length === 1 ? "alerta crítica" : "alertas críticas"} de ejecución. Revisa el Monitor de Ejecución.`)
    }
    if ((byImportance.critical || 0) > 0) {
      recommendations.push(`Revisar ${byImportance.critical} ${byImportance.critical === 1 ? "alerta crítica" : "alertas críticas"} en memoria empresarial.`)
    }
    if ((byType.risk || 0) > 3) {
      recommendations.push(`Hay ${byType.risk} riesgos activos. Sugiero una reunión de revisión semanal.`)
    }
    if (activeAlerts.length > 0) {
      recommendations.push(`${activeAlerts.length} ${activeAlerts.length === 1 ? "alerta" : "alertas"} activas en la ejecución de planes.`)
    }
    if (activePlans.length > 0) {
      recommendations.push(`${activePlans.length} ${activePlans.length === 1 ? "plan está" : "planes están"} en ejecución con presupuesto total de $${activePlans.reduce((s, p) => s + p.totalBudget, 0).toLocaleString()}.`)
    }
    if (draftPlans.length > 0) {
      recommendations.push(`${draftPlans.length} ${draftPlans.length === 1 ? "plan está" : "planes están"} pendientes de ejecución. Ve a Planificación o usa el Copilot.`)
    }
    if (caseStats.total > 0) {
      recommendations.push(`Business Case Library: ${caseStats.total} casos registrados con ${caseStats.averageEffectiveness}% de efectividad promedio y ${caseStats.averageROI}% ROI.`)
    }
    if (genome) {
      recommendations.push(`Enterprise Genome: Puntaje global ${genome.overallScore}/100. ${genome.dimensions.filter((d) => d.score >= 70).length} dimensiones sólidas, ${genome.dimensions.filter((d) => d.score < 40).length} críticas.`)
    }
    if (optimizationResults.length > 0) {
      const totalImprovement = optimizationResults.reduce((s, r) => {
        const roiStr = r.improvementPotential.roi
        const val = parseInt(roiStr.replace(/[^0-9-]/g, ""))
        return s + (isNaN(val) ? 0 : val)
      }, 0)
      if (totalImprovement !== 0) {
        recommendations.push(`Potencial de mejora identificado en ${optimizationResults.length} ${optimizationResults.length === 1 ? "plan" : "planes"}: ${totalImprovement > 0 ? "+" : ""}${totalImprovement}% ROI adicional posible.`)
      }
    }
    if ((byType.meeting || 0) === 0) {
      recommendations.push("No se registraron reuniones recientes. Recomiendo agendar seguimientos con los clientes activos.")
    }
    if (recommendations.length === 0) {
      recommendations.push("Todo está bajo control. Sigue monitoreando los KPIs semanalmente.")
    }

    const timeline = memoryStore.getRecent(companyId, 5)
    const memorySummary = timeline.length > 0
      ? timeline.map((e) => `• ${e.timestamp.slice(0, 10)} — ${e.title}`).join("\n")
      : "No hay actividad reciente registrada."

    // Reasoning analysis
    const reasoningResult = await reasoningEngine.reason({
      companyId,
      query: "Análisis ejecutivo automático",
    })

    const reasoning = {
      observations: reasoningResult.observations.slice(0, 4).map((o) =>
        `${o.indicator}: ${o.direction === "up" ? "↑" : o.direction === "down" ? "↓" : "→"} ${Math.abs(o.changePercent).toFixed(0)}%`
      ),
      diagnosis: reasoningResult.diagnosis?.summary || "Sin datos suficientes para diagnóstico.",
      hypotheses: reasoningResult.hypotheses.slice(0, 3).map((h) => ({
        title: h.title,
        probability: h.probability,
        action: h.recommendedAction,
      })),
    }

    // Prediction analysis
    const predictionResult = await predictionEngine.predict(companyId)

    const confidenceResult = confidenceEngine.evaluatePrediction(
      predictionResult.indicators.length,
      predictionResult.indicators.reduce((s, i) => Math.max(s, i.trend.rSquared), 0),
      predictionResult.indicators.length,
      undefined,
    )

    const predictions = {
      summary: predictionResult.summary,
      confidence: predictionResult.confidence,
      confidenceLabel: confidenceResult.label,
      confidenceFactors: confidenceResult.factors.map((f) => ({
        name: f.name, status: f.status, detail: f.detail, score: f.score,
      })),
      warnings: predictionResult.earlyWarnings.slice(0, 3).map((w) => ({
        indicator: w.indicator,
        daysToThreshold: w.estimatedDaysToThreshold,
        severity: w.severity,
        recommendation: w.recommendation,
      })),
      scenarios: predictionResult.scenarios.slice(0, 3).map((s) => ({
        name: s.name,
        label: s.label,
        probability: s.probability,
        summary: s.summary,
      })),
    }

    const hour = new Date().getHours()
    const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches"

    return {
      greeting: `${greeting}, ${companyName}`,
      date: new Date().toLocaleDateString("es-EC", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
      criticalCount: byImportance.critical || 0,
      opportunitiesCount: opportunities.length,
      riskCount: byType.risk || 0,
      overdueTasks: byType.task || 0,
      metrics,
      criticalItems,
      opportunities,
      risks,
      recommendations,
      memorySummary,
      reasoning,
      predictions,
    }
  }

  async answerQuestion(question: string, companyId: string): Promise<string> {
    const q = question.toLowerCase()
    const recent = memoryStore.getRecent(companyId, 50)
    const summary = memoryStore.summarize(companyId)

    if (q.includes("crítico") || q.includes("critico") || q.includes("alerta") || q.includes("urgente")) {
      const critical = recent.filter((e) => e.importance === "critical")
      if (critical.length === 0) return "No hay elementos críticos en este momento."
      return critical.map((e) => `🔴 **${e.title}** — ${e.description.slice(0, 150)}`).join("\n\n")
    }

    if (q.includes("por qué") || q.includes("explica") || q.includes("razón") || q.includes("causa")) {
      const result = await reasoningEngine.reason({ companyId, query: question })
      return result.reasoning
    }

    if (q.includes("recomienda") || q.includes("sugiere") || q.includes("qué hago")) {
      if (summary.total === 0 && planningEngine.getPlans(companyId).length === 0) {
        return "Aún no hay suficientes datos para generar recomendaciones. Comienza definiendo un objetivo estratégico en Planificación."
      }

      const result = await reasoningEngine.reason({ companyId, query: question })

      let response = "## Recomendaciones basadas en análisis\n\n"
      for (const h of result.hypotheses.slice(0, 3)) {
        response += `**${h.title}** (probabilidad: ${h.probability}%)\n`
        response += `${h.recommendedAction}\n\n`
      }

      const plans = planningEngine.getPlans(companyId)
      if (plans.length > 0) {
        response += "### Planes Estratégicos\n\n"
        for (const p of plans) {
          response += `• **${p.objective.title}** — ${p.status} — $${p.totalBudget.toLocaleString()} — ${p.phases.length} fases\n`
        }
      }

      return response
    }

    if (q.includes("pronóstico") || q.includes("predicción") || q.includes("futuro") || q.includes("va a pasar")) {
      const result = await reasoningEngine.reason({ companyId, query: question })
      let response = "## Pronóstico basado en análisis\n\n"
      for (const h of result.hypotheses.slice(0, 2)) {
        response += `**${h.title}** — Probabilidad: ${h.probability}%\n`
        response += `${h.description.slice(0, 200)}\n\n`
      }
      return response
    }

    if (q.includes("ejecución") || q.includes("ejecucion") || q.includes("monitor") || q.includes("alerta") || q.includes("desviación") || q.includes("desviacion")) {
      const alerts = executionEngine.getAllAlerts(companyId)
      const active = alerts.filter((a) => !a.resolvedAt)
      if (active.length === 0) return "No hay alertas activas en la ejecución de planes. Todo está funcionando según lo previsto."
      return active.map((a) => `**${a.severity === "critical" ? "🔴" : a.severity === "severe" ? "🟠" : "🟡"} ${a.title}**\n- ${a.description}\n- Recomendación: ${a.recommendation}\n- Creada: ${new Date(a.createdAt).toLocaleDateString()}`).join("\n\n")
    }

    if (q.includes("plan") || q.includes("planificación") || q.includes("estrategia")) {
      const plans = planningEngine.getPlans(companyId)
      if (plans.length === 0) return "No hay planes estratégicos definidos. Ve a Planificación y describe tu objetivo."
      return plans.map((p) => {
        const progress = p.phases.filter((ph) => ph.status === "completed").length
        return `**${p.objective.title}** (${p.status})\n- Presupuesto: $${p.totalBudget.toLocaleString()}\n- Duración: ${p.estimatedDurationMonths} meses\n- Fases: ${progress}/${p.phases.length} completadas\n- Categoría: ${p.objective.category}\n${p.status === "active" ? "- En ejecución desde " + new Date(p.startedAt!).toLocaleDateString() : ""}`
      }).join("\n\n")
    }

    if (q.includes("genoma") || q.includes("genome") || q.includes("adn empresarial") || q.includes("perfil")) {
      const g = genomeEngine.getGenome(companyId)
      if (!g) return "Aún no se ha generado el Enterprise Genome. Usa la sección Genoma para analizar el perfil empresarial."
      const sorted = [...g.dimensions].sort((a, b) => b.score - a.score)
      let response = `## Enterprise Genome: ${g.companyName}\n\n**Puntaje Global: ${g.overallScore}/100** (Confianza: ${g.overallConfidence}%)\n\n`
      response += "| Dimensión | Puntaje | Tendencia |\n|---|---|---|\n"
      for (const d of sorted) {
        const arrow = d.trend === "up" ? "↑" : d.trend === "down" ? "↓" : "→"
        response += `| ${d.label} | ${d.score} | ${arrow} |\n`
      }
      if (g.recommendations.length > 0) {
        response += "\n### Recomendaciones\n"
        for (const r of g.recommendations) response += `- ${r}\n`
      }
      return response
    }

    if (q.includes("optimización") || q.includes("optimizacion") || q.includes("mejora") || q.includes("mejorar") || q.includes("what if") || q.includes("qué pasaría") || q.includes("que pasaria")) {
      const results = optimizationEngine.getAllResults(companyId)
      if (results.length === 0) return "Aún no hay análisis de optimización disponibles. Completa un plan y registra sus resultados para generar el análisis comparativo."
      return results.map((r) => {
        const best = r.bestVariant
        if (!best) return `**${r.planId}**: Sin variante óptima identificada.`
        return `**${r.planId}** — Mejor variante: **${best.name}**\n- ROI actual: ${r.actualMetrics.roi}% → Potencial: ${r.improvementPotential.roi}\n- Presupuesto: $${r.actualMetrics.budget.toLocaleString()} → ${r.improvementPotential.budget}\n- Duración: ${r.actualMetrics.durationDays} días → ${r.improvementPotential.duration}\n- Impacto en ingresos: $${r.actualMetrics.revenueImpact.toLocaleString()} → ${r.improvementPotential.revenueImpact}\n\n**Lecciones:**\n${r.lessonsForFuture.map((l) => `- ${l}`).join("\n")}`
      }).join("\n\n")
    }

    if (q.includes("caso") || q.includes("biblioteca") || q.includes("lección") || q.includes("leccion") || q.includes("aprendizaje") || q.includes("business case")) {
      const stats = learningEngine.getStats()
      if (stats.total === 0) return "La Business Case Library está vacía. Completa planes y registra sus resultados para construir conocimiento."
      let response = `## Business Case Library\n\n**${stats.total}** casos registrados\n- Efectividad promedio: **${stats.averageEffectiveness}%**\n- ROI promedio: **${stats.averageROI}%**\n- Costo total ahorrado: **$${stats.totalCostSaved.toLocaleString()}**\n- Impacto en ingresos: **$${stats.totalRevenueImpact.toLocaleString()}**\n\n`
      if (stats.topLessons.length > 0) {
        response += "### Lecciones más frecuentes\n"
        for (const l of stats.topLessons) response += `- ${l.lesson} (${l.count}x)\n`
      }
      if (stats.topErrors.length > 0) {
        response += "\n### Errores más frecuentes\n"
        for (const e of stats.topErrors) response += `- ${e.lesson} (${e.count}x)\n`
      }
      return response
    }

    if (q.includes("resumen") || q.includes("summary") || q.includes("cómo vamos")) {
      const result = await reasoningEngine.reason({ companyId, query: question })
      const plans = planningEngine.getPlans(companyId)
      let planInfo = ""
      if (plans.length > 0) {
        const active = plans.filter((p) => p.status === "active").length
        planInfo = `\n- **Planes estratégicos:** ${plans.length} (${active} activos)`
      }
      return `## Resumen Ejecutivo\n\n- **Total eventos:** ${summary.total}\n- **Decisiones:** ${summary.byType.decision || 0}\n- **Riesgos:** ${summary.byType.risk || 0}\n- **Alertas críticas:** ${summary.byImportance.critical || 0}${planInfo}\n\n**Diagnóstico:** ${result.diagnosis?.summary || "Sin datos"}\n\n_Últimos eventos:_\n${recent.slice(0, 5).map((e) => `• ${e.timestamp.slice(0, 10)} — [${e.type}] ${e.title}`).join("\n")}`
    }

    // ═══════════════════════════════════════════════════════════════
    // Enterprise Knowledge intents
    // ═══════════════════════════════════════════════════════════════
    if (q.includes("kpi") || q.includes("indicador") || q.includes("métrica") || q.includes("metric")) {
      const domain = q.includes("liquidez") ? "liquidity"
        : q.includes("solvencia") ? "solvency"
        : q.includes("rentabilidad") || q.includes("margen") ? "profitability"
        : q.includes("eficiencia") || q.includes("rotación") ? "efficiency"
        : q.includes("crecimiento") || q.includes("crecer") ? "growth"
        : q.includes("operativo") || q.includes("producción") ? "operational"
        : q.includes("comercial") || q.includes("venta") ? "commercial"
        : q.includes("talento") || q.includes("rh") || q.includes("personas") ? "hr"
        : q.includes("cliente") || q.includes("nps") || q.includes("satisfacción") ? "customer"
        : undefined
      const kpis = kpiLibrary.getKPIs(domain, question)
      if (kpis.length === 0) return "No encontré KPIs para esa consulta. La biblioteca tiene " + kpiLibrary.getTotalCount() + " KPIs en 18 dominios."
      return kpis.slice(0, 5).map((k) =>
        `📊 **${k.name}** (${k.abbreviation})\n- ${k.description}\n- Fórmula: ${k.formula}\n- ${k.interpretation}`
      ).join("\n\n")
    }

    if (q.includes("benchmark") || q.includes("comparación") || q.includes("sector") || q.includes("industria")) {
      const industries = benchmarkEngine.getAllIndustries()
      for (const b of industries) {
        if (q.includes(b.industry.toLowerCase()) || q.includes(b.code.toLowerCase())) {
          const bench = benchmarkEngine.getBenchmark(b.industry)
          if (!bench) break
          return `## Benchmark: ${bench.industry}\n\n**${bench.sampleSize.toLocaleString()}** empresas analizadas\n\n` +
            `| Métrica | P25 | P50 | P75 |\n|---|---|---|---|\n` +
            `| Liquidez | ${bench.liquidity.p25}x | ${bench.liquidity.p50}x | ${bench.liquidity.p75}x |\n` +
            `| D/E | ${bench.debtToEquity.p25}x | ${bench.debtToEquity.p50}x | ${bench.debtToEquity.p75}x |\n` +
            `| Margen Neto | ${(bench.netMargin.p25*100).toFixed(0)}% | ${(bench.netMargin.p50*100).toFixed(0)}% | ${(bench.netMargin.p75*100).toFixed(0)}% |\n` +
            `| ROE | ${(bench.roe.p25*100).toFixed(0)}% | ${(bench.roe.p50*100).toFixed(0)}% | ${(bench.roe.p75*100).toFixed(0)}% |\n` +
            `| DSO | ${bench.dso.p25}d | ${bench.dso.p50}d | ${bench.dso.p75}d |`
        }
      }
      return `Industrias disponibles: ${industries.map((i) => i.industry).join(", ")}`
    }

    if (q.includes("ifrs") || q.includes("niif") || q.includes("concepto contable") || q.includes("balance")) {
      const results = ifrsEngine.search(question)
      if (results.length === 0) return `No encontré conceptos IFRS en la taxonomía oficial. Tengo ${ifrsEngine.evaluate("ifrs-full:Assets").totalConcepts} conceptos IFRS documentados.`
      return results.slice(0, 5).map((c) =>
        `📘 **${c.name}** (${c.code})\n- ${c.definition}\n- Tipo: ${c.type} | Balance: ${c.balance}\n- Referencias: ${c.references.join(", ")}`
      ).join("\n\n")
    }

    if (q.includes("validar") || q.includes("validación") || q.includes("regla balance") || q.includes("cuadrado")) {
      return validationRules.map((r) =>
        `${r.severity === "error" ? "🔴" : r.severity === "warning" ? "🟡" : "🔵"} **${r.name}**\n- ${r.description}`
      ).join("\n\n")
    }

    if (q.includes("sri") || q.includes("impuesto") || q.includes("tasa") || q.includes("iva") || q.includes("renta") || q.includes("tributo")) {
      const rates = sriEngine.getTaxRates()
      const matching = rates.filter((r) =>
        q.includes(r.name.toLowerCase().slice(0, 10)) ||
        q.includes(r.type) ||
        r.name.toLowerCase().includes(q.slice(0, 15))
      )
      const display = matching.length > 0 ? matching : rates.slice(0, 8)
      return display.map((r) =>
        `🏛️ **${r.name}**: ${r.type === "social_benefits" && r.id === "sri-lab-007" ? `$${r.rate}/mes` : `${(r.rate * 100).toFixed(1)}%`}\n- ${r.description}\n- ${r.reference}`
      ).join("\n\n")
    }

    if (q.includes("ontología") || q.includes("clase") || q.includes("relación") || q.includes("entidad negocio") || q.includes("que es un")) {
      const classes = knowledgeGraph.getOntology().classes
      const searchTerm = q.replace("qué es un", "").replace("que es un", "").replace("que es", "").trim()
      if (searchTerm.length > 2) {
        const match = classes.find((c) =>
          c.name.toLowerCase().includes(searchTerm) ||
          c.id.toLowerCase().includes(searchTerm)
        )
        if (match) {
          const children = knowledgeGraph.getChildren(match.id)
          const rels = knowledgeGraph.getRelations(match.id)
          let response = `📦 **${match.name}**\n- ${match.description}\n- Propiedades: ${match.properties.join(", ")}\n`
          if (match.parentId) {
            const parent = classes.find((c) => c.id === match.parentId)
            if (parent) response += `- Padre: ${parent.name}\n`
          }
          if (children.length > 0) response += `- Hijos: ${children.map((c) => c.name).join(", ")}\n`
          if (rels.length > 0) response += `\nRelaciones:\n${rels.slice(0, 5).map((r) => `  → ${r.label} → ${r.target.replace("ent:", "")}`).join("\n")}`
          return response
        }
      }
      return `Tengo **${classes.length}** clases y **${knowledgeGraph.getOntology().relations.length}** relaciones en la ontología empresarial. Pregunta por una clase específica (ej: "qué es un BusinessCapability").`
    }

    if (q.includes("conocimiento") || q.includes("knowledge") || q.includes("qué sabes") || q.includes("que sabes") || q.includes("capacidades")) {
      const summary = enterpriseKnowledge.getSummary()
      return `## Enterprise Knowledge Lake\n\n` +
        `**${summary.totalKnowledgeEntries}** entradas de conocimiento estructurado\n\n` +
        `🧬 Ontología: ${summary.ontology.classes} clases, ${summary.ontology.relations} relaciones\n` +
        `📘 IFRS: ${summary.ifrs.concepts} conceptos, ${summary.ifrs.validationRules} reglas validación\n` +
        `🏛️ SRI: ${summary.sri.taxRates} tasas, ${summary.sri.activities} actividades económicas\n` +
        `📊 KPIs: ${summary.kpis.total} indicadores en ${summary.kpis.domains} dominios\n` +
        `🏭 Benchmarks: ${summary.benchmarks.industries} industrias, ${summary.benchmarks.totalSamples.toLocaleString()} empresas`
    }

    return `Tengo ${summary.total} eventos registrados en la memoria empresarial. ${summary.byType.decision || 0} decisiones, ${summary.byType.risk || 0} riesgos, ${summary.byType.meeting || 0} reuniones. Además cuento con la Enterprise Knowledge Base con ${enterpriseKnowledge.getSummary().totalKnowledgeEntries} entradas de conocimiento estructurado. ¿Sobre qué aspecto específico quieres información?`
  }
}

export const executiveAI = new ExecutiveAI()
