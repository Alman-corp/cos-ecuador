export interface TestCase {
  id: string
  agentId: string
  input: string
  expected: string[]
  category: string
  weight: number
}

export interface EvalResult {
  testId: string
  agentId: string
  passed: boolean
  score: number
  latency: number
  missing: string[]
  timestamp: number
}

const STORAGE_KEY = "cos-eval-results"

const TEST_CASES: TestCase[] = [
  // Financial analyst
  { id: crypto.randomUUID(), agentId: "financial", input: "¿Cuál es el margen EBITDA del último trimestre?", expected: ["margen", "EBITDA", "15.4%", "trimestre"], category: "metrics", weight: 3 },
  { id: crypto.randomUUID(), agentId: "financial", input: "Analiza la tendencia de ingresos", expected: ["ingresos", "tendencia", "YoY", "crecimiento"], category: "trends", weight: 2 },
  { id: crypto.randomUUID(), agentId: "financial", input: "¿Qué riesgos financieros identificas?", expected: ["riesgo", "liquidez", "deuda", "cobertura"], category: "risk", weight: 3 },
  { id: crypto.randomUUID(), agentId: "financial", input: "Compara nuestro margen con el de la industria", expected: ["compar", "margen", "industria", "benchmark"], category: "benchmark", weight: 2 },
  { id: crypto.randomUUID(), agentId: "financial", input: "Recomienda acciones para mejorar el FCF", expected: ["recomend", "FCF", "flujo", "caja", "mejorar"], category: "recommendations", weight: 3 },
  // Forecaster
  { id: crypto.randomUUID(), agentId: "forecaster", input: "Pronostica los ingresos para Q1 2026", expected: ["pronostic", "ingresos", "rango", "confianza", "Q1"], category: "forecast", weight: 3 },
  { id: crypto.randomUUID(), agentId: "forecaster", input: "¿Cuál es la probabilidad de recesión?", expected: ["probabilidad", "recesión", "escenario", "base"], category: "macro", weight: 2 },
  // Researcher
  { id: crypto.randomUUID(), agentId: "researcher", input: "Busca comparables de empresas tech en Latam", expected: ["comparables", "tech", "Latam", "múltiplos"], category: "research", weight: 2 },
  { id: crypto.randomUUID(), agentId: "researcher", input: "Análisis de mercado para el sector automotriz 2026", expected: ["mercado", "automotriz", "tendencia", "participación"], category: "market", weight: 3 },
  // Synthesizer
  { id: crypto.randomUUID(), agentId: "synthesizer", input: "Resume el reporte trimestral en 3 puntos", expected: ["resume", "punto", "trimestre", "clave"], category: "summarization", weight: 2 },
  { id: crypto.randomUUID(), agentId: "synthesizer", input: "Crea un dashboard ejecutivo con los KPI principales", expected: ["dashboard", "KPI", "ejecutivo", "principal"], category: "reporting", weight: 3 },
]

export function getTestCases(agentId?: string): TestCase[] {
  return agentId ? TEST_CASES.filter((t) => t.agentId === agentId) : TEST_CASES
}

export function getTestCount(agentId: string): number {
  return TEST_CASES.filter((t) => t.agentId === agentId).length
}

export function loadEvalResults(): EvalResult[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") }
  catch { return [] }
}

function saveEvalResults(results: EvalResult[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(results.slice(-500)))
}

export async function runEval(agentId: string, responseFn: (input: string) => Promise<string>): Promise<EvalResult[]> {
  const cases = getTestCases(agentId)
  const results: EvalResult[] = []

  for (const test of cases) {
    const start = performance.now()
    const response = await responseFn(test.input)
    const latency = performance.now() - start
    const responseLower = response.toLowerCase()
    const missing = test.expected.filter((e) => !responseLower.includes(e.toLowerCase()))
    const passed = missing.length === 0
    const score = passed ? 100 : Math.max(0, 100 - (missing.length / test.expected.length) * 100)

    results.push({ testId: test.id, agentId, passed, score, latency, missing, timestamp: Date.now() })
    await new Promise((r) => setTimeout(r, 50)) // throttle
  }

  saveEvalResults([...loadEvalResults(), ...results])
  return results
}

export function getAggregatedScore(agentId: string): { avgScore: number; passRate: number; avgLatency: number } {
  const results = loadEvalResults().filter((r) => r.agentId === agentId)
  if (results.length === 0) return { avgScore: 0, passRate: 0, avgLatency: 0 }
  return {
    avgScore: parseFloat((results.reduce((a, r) => a + r.score, 0) / results.length).toFixed(1)),
    passRate: parseFloat(((results.filter((r) => r.passed).length / results.length) * 100).toFixed(1)),
    avgLatency: parseFloat((results.reduce((a, r) => a + r.latency, 0) / results.length).toFixed(0)),
  }
}
