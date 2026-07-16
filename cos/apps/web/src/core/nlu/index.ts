export interface NLUIntent {
  id: string
  name: string
  patterns: RegExp[]
  category: "query" | "action" | "analysis" | "report" | "alert"
  priority: number
  response?: string
}

export interface NLUEntity {
  type: string
  value: string
  start: number
  end: number
  confidence: number
}

export interface NLUResult {
  text: string
  intent: NLUIntent | null
  intentScore: number
  entities: NLUEntity[]
  sentiment: "positive" | "negative" | "neutral"
  confidence: number
  suggestions: string[]
}

const INTENTS: NLUIntent[] = [
  { id: "int_health_check", name: "Consulta de Salud Financiera", category: "query", priority: 10, patterns: [/salud\s*(financiera|empresarial)/i, /cómo\s*est(á|a)\s*(la\s*)?(empresa|compañía)/i, /health\s*score/i, /diagnóstico/i] },
  { id: "int_kpi_query", name: "Consulta de KPI", category: "query", priority: 9, patterns: [/kpi/i, /indicador/i, /ratio/i, /índice/i] },
  { id: "int_scenario", name: "Análisis de Escenarios", category: "analysis", priority: 8, patterns: [/escenario/i, /simulaci[oó]n/i, /qu[eé] pasaría/i, /what\s*if/i, /stress/i] },
  { id: "int_prediction", name: "Predicción", category: "analysis", priority: 8, patterns: [/predecir/i, /predicci[oó]n/i, /pron[oó]stico/i, /proyecci[oó]n/i, /tendencia/i, /forecast/i] },
  { id: "int_benchmark", name: "Benchmarking", category: "analysis", priority: 7, patterns: [/benchmark/i, /comparar/i, /industria/i, /competencia/i, /mercado/i] },
  { id: "int_report", name: "Generar Reporte", category: "report", priority: 9, patterns: [/reporte/i, /informe/i, /generar\s*(reporte|informe)/i, /exportar/i, /descargar/i] },
  { id: "int_plan", name: "Plan Estratégico", category: "action", priority: 8, patterns: [/plan\s*(estrat[eé]gico|de\s*acci[oó]n)/i, /estrategia/i, /objetivos/i] },
  { id: "int_alert", name: "Alertas y Riesgos", category: "alert", priority: 10, patterns: [/alerta/i, /riesgo/i, /advertencia/i, /peligro/i, /critical/i, /urgen/i] },
  { id: "int_compliance", name: "Cumplimiento", category: "query", priority: 6, patterns: [/cumplimient/i, /regulatorio/i, /norma/i, /sri/i, /supercias/i, /tributario/i] },
  { id: "int_cashflow", name: "Flujo de Caja", category: "analysis", priority: 7, patterns: [/flujo\s*de\s*caja/i, /cash\s*flow/i, /liquidez/i, /efectivo/i] },
  { id: "int_valuation", name: "Valoración", category: "analysis", priority: 6, patterns: [/valoraci[oó]n/i, /valuaci[oó]n/i, /valu[eé]/i, /cu[áa]nto\s*vale/i] },
  { id: "int_optimize", name: "Optimización", category: "action", priority: 7, patterns: [/optimiza/i, /mejora/i, /eficiencia/i, /reducir\s*(costos|gastos)/i, /ahorrar/i] },
]

const ENTITY_PATTERNS: { type: string; pattern: RegExp }[] = [
  { type: "company", pattern: /(?:de\s+)?([A-Z][a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+?(?:SA|SA\.|Cía\.|Cia\.|Ltda\.|Corp\.|S\.A\.|S\.A|Ecuador|Ecuatoriana))/ },
  { type: "metric", pattern: /(?:el\s+)?(current ratio|quick ratio|debt to equity|ROE|ROA|margen\s*\w+|liquidez|solvencia|rentabilidad|endeudamiento)/i },
  { type: "number", pattern: /(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+\.?\d*)\s*(millones|mil|billones)?/ },
  { type: "industry", pattern: /(manufactura|comercio|servicios|tecnología|construcción|agricultura|transporte|minero|financiero)/i },
  { type: "date", pattern: /(\d{4}[-/]\d{2}[-/]\d{2}|(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+\d{4})/i },
  { type: "percentage", pattern: /(\d+(?:\.\d+)?)\s*%/ },
  { type: "currency", pattern: /(\d+(?:\.\d+)?)\s*(USD|dólares|dolares|\$)/i },
]

export class NLUEngine {
  classify(text: string): NLUResult {
    const matchedIntents: { intent: NLUIntent; score: number }[] = []

    for (const intent of INTENTS) {
      let score = 0
      for (const pattern of intent.patterns) {
        const matches = text.match(pattern)
        if (matches) {
          score += matches[0].length / text.length * 10
        }
      }
      if (score > 0) {
        matchedIntents.push({ intent, score })
      }
    }

    matchedIntents.sort((a, b) => {
      const prioDiff = b.intent.priority - a.intent.priority
      return prioDiff !== 0 ? prioDiff : b.score - a.score
    })

    const bestMatch = matchedIntents[0] || null
    const bestIntent = bestMatch?.intent || null
    const intentScore = bestMatch ? bestMatch.score : 0

    const entities: NLUEntity[] = []
    for (const { type, pattern } of ENTITY_PATTERNS) {
      let m: RegExpExecArray | null
      const p = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g")
      while ((m = p.exec(text)) !== null) {
        const value = m[m.length - 1] || m[1]
        if (value && !entities.some((e) => e.type === type && e.value === value)) {
          entities.push({
            type,
            value,
            start: m.index,
            end: m.index + m[0].length,
            confidence: type === "number" || type === "percentage" || type === "currency" ? 0.95 : 0.8,
          })
        }
      }
    }

    const sentiment = this.analyzeSentiment(text)
    const confidence = bestIntent ? Math.min(100, intentScore * 10 + entities.length * 5) : 10
    const suggestions = this.generateSuggestions(bestIntent?.id || null)

    return {
      text,
      intent: bestIntent,
      intentScore: Math.round(intentScore * 100) / 100,
      entities,
      sentiment,
      confidence: Math.round(confidence),
      suggestions,
    }
  }

  private analyzeSentiment(text: string): "positive" | "negative" | "neutral" {
    const positive = /(buen[oa]|mejor[aó]|excelente|positivo|crecimient|aument[oó]|ganancia|saludable)/gi
    const negative = /(mal[oa]|peor|cr[íi]tic[oa]|declive|ca[íi]da|p[eé]rdida|riesgo|alerta|urgen)/gi
    const posCount = (text.match(positive) || []).length
    const negCount = (text.match(negative) || []).length
    if (posCount > negCount) return "positive"
    if (negCount > posCount) return "negative"
    return "neutral"
  }

  private generateSuggestions(intentId: string | null): string[] {
    const suggestions: Record<string, string[]> = {
      int_health_check: ["Ver health score detallado", "Comparar con industria", "Ver evolución mensual"],
      int_kpi_query: ["Ver todos los KPIs", "KPI de liquidez", "KPI de rentabilidad"],
      int_scenario: ["Simular crecimiento 10%", "Escenario pesimista", "Stress test completo"],
      int_prediction: ["Predecir próximos 30 días", "Proyección de ingresos", "Tendencia de ROE"],
      int_report: ["Generar reporte PDF", "Exportar a Excel", "Reporte ejecutivo"],
      int_benchmark: ["Comparar con industria", "Benchmark de liquidez", "Ver mejores prácticas"],
      int_plan: ["Generar plan estratégico", "Ver plan actual", "Evaluar objetivos"],
      int_alert: ["Ver alertas activas", "Historial de alertas", "Configurar umbrales"],
      int_cashflow: ["Proyección de caja", "Análisis de liquidez", "Stress de caja"],
      int_valuation: ["Valoración rápida", "Múltiplos de mercado", "Flujo descontado"],
      int_compliance: ["Checklist SRI", "Obligaciones tributarias", "Estado de cumplimiento"],
      int_optimize: ["Optimizar costos", "Mejorar eficiencia", "Reducir gastos operativos"],
    }
    if (intentId && suggestions[intentId]) return suggestions[intentId]
    return ["Consultar salud financiera", "Ver indicadores clave", "Generar reporte"]
  }
}

export const nluEngine = new NLUEngine()
