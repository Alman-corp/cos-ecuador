// @llm-engineer — DO NOT MODIFY WITHOUT APPROVAL
export interface PromptVersion {
  id: string
  agentId: string
  version: number
  content: string
  variant: "control" | "variant_a" | "variant_b"
  metrics: { avgScore: number; totalRuns: number; avgLatency: number }
  createdAt: string
  active: boolean
}

const STORAGE_KEY = "cos-prompts"

function loadPrompts(): PromptVersion[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") }
  catch { return [] }
}

function savePrompts(prompts: PromptVersion[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts))
}

const BASE_PROMPTS: Record<string, string> = {
  financial: "Eres un analista financiero senior con 20 años de experiencia en banca de inversión y consultoría estratégica. Tu estilo es preciso, técnico y basado en datos. Siempre justificas tus conclusiones con métricas concretas.",
  forecaster: "Eres un pronosticador experto con formación en econometría y finanzas cuantitativas. Tu enfoque es bayesiano: presentas rangos de probabilidad, no puntos únicos. Usas términos como 'intervalo de confianza del 90%' y 'sesgo prospectivo'.",
  researcher: "Eres un analista de mercado con 15 años de experiencia en equity research y private equity. Tu estilo es visual y accionable: usas comparables, benchmarks sectoriales y casos concretos.",
  synthesizer: "Eres un sintetizador de información financiera. Tu misión es tomar análisis complejos y presentarlos de forma clara, objetiva y estructurada. Usas viñetas, tablas y resúmenes ejecutivos.",
  "dd-analyst": `Eres un analista de Due Diligence experto en finanzas corporativas, valuation, y riesgos. Respondes en español (es-EC). Usas los datos del cliente para dar respuestas precisas. Siempre citas tus fuentes cuando usas datos específicos.

Tus capacidades:
- Análisis de estados financieros (balance, income, cash flow)
- Valuation: DCF, múltiplos comparables, LBO, transacciones precedentes
- Identificación de riesgos: concentración, dependencia, estructurales, regulatorios
- Simulación de escenarios: sensitividad de revenue, opex, margen, WACC
- Benchmarking sectorial y análisis competitivo
- Detección de banderas rojas (red flags) en financials y operaciones

Normas:
1. Siempre respalda afirmaciones con cifras concretas del documento o filing más reciente
2. Cuando cites métricas, incluye la fuente entre corchetes [10-K FY2025 p.12]
3. Para pronósticos, expresa rango de confianza (ej: "90% CI: $2.1B–$2.5B")
4. Destaca riesgos con formato ⚠️ y oportunidades con ✅
5. Si no tienes datos suficientes, indica qué información adicional necesitas
6. Estructura respuestas complejas en: Resumen → Análisis → Riesgos → Recomendación
7. No des asesoría de inversión personalizada sin disclaimer

Formato preferido para respuestas detalladas:
## Resumen Ejecutivo
[2-3 líneas]

## Análisis
[métricas clave con fuentes]

## Riesgos Identificados
- ⚠️ [riesgo] → [impacto]

## Recomendación
[próximos pasos accionables]`,
}

export const DD_SUGGESTION_QUESTIONS: string[] = [
  "¿Cuál es el riesgo más crítico?",
  "Proyecta revenue para los próximos 12 meses",
  "Compara los márgenes contra el sector",
  "¿Qué escenarios de stress testing recomiendas?",
]

export function getBasePrompt(agentId: string): string {
  return BASE_PROMPTS[agentId] || "Eres un asistente financiero experto."
}

export function getOrCreatePrompt(agentId: string): PromptVersion {
  const prompts = loadPrompts()
  const existing = prompts.filter((p) => p.agentId === agentId && p.active)

  if (existing.length > 0) {
    const variant = existing.reduce((a, b) => a.metrics.avgScore > b.metrics.avgScore ? a : b)
    return variant
  }

  const base = getBasePrompt(agentId)
  const variants: PromptVersion[] = [
    { id: crypto.randomUUID(), agentId, version: 1, content: base, variant: "control", metrics: { avgScore: 85, totalRuns: 0, avgLatency: 1200 }, createdAt: new Date().toISOString(), active: true },
    { id: crypto.randomUUID(), agentId, version: 1, content: base + "\n\nIMPORTANTE: Siempre incluye al menos una métrica numérica y un warning si aplica.", variant: "variant_a", metrics: { avgScore: 0, totalRuns: 0, avgLatency: 0 }, createdAt: new Date().toISOString(), active: true },
    { id: crypto.randomUUID(), agentId, version: 1, content: base + "\n\nFormato: [Resumen] → [Análisis] → [Recomendación]. Máximo 3 párrafos.", variant: "variant_b", metrics: { avgScore: 0, totalRuns: 0, avgLatency: 0 }, createdAt: new Date().toISOString(), active: true },
  ]

  savePrompts([...prompts, ...variants])
  return variants[0]
}

export function recordPromptRun(agentId: string, variant: string, score: number, latency: number): void {
  const prompts = loadPrompts()
  const prompt = prompts.find((p) => p.agentId === agentId && p.variant === variant && p.active)
  if (!prompt) return
  prompt.metrics.totalRuns++
  prompt.metrics.avgScore = (prompt.metrics.avgScore * (prompt.metrics.totalRuns - 1) + score) / prompt.metrics.totalRuns
  prompt.metrics.avgLatency = (prompt.metrics.avgLatency * (prompt.metrics.totalRuns - 1) + latency) / prompt.metrics.totalRuns
  savePrompts(prompts)
}

export function getPromptVersions(agentId: string): PromptVersion[] {
  return loadPrompts().filter((p) => p.agentId === agentId)
}

export function promoteVariant(agentId: string, variant: string): void {
  const prompts = loadPrompts()
  for (const p of prompts) {
    if (p.agentId === agentId) p.active = p.variant === variant
  }
  savePrompts(prompts)
}
