// @llm-engineer — DO NOT MODIFY
export interface EvalResult {
  question: string
  response: string
  passesKeywords: boolean
  length: number
  missingKeywords: string[]
}

const GOLDEN_QUESTIONS = [
  { question: "¿Cuál es el riesgo más crítico?", keywords: ["riesgo", "crítico", "impacto"] },
  { question: "Proyecta revenue para los próximos 12 meses", keywords: ["proyecta", "revenue", "meses"] },
  { question: "Compara los márgenes contra el sector", keywords: ["compara", "márgenes", "sector"] },
  { question: "¿Qué escenarios de stress testing recomiendas?", keywords: ["escenarios", "stress", "testing"] },
  { question: "Analiza la liquidez de la compañía", keywords: ["liquidez", "compañía", "análisis"] },
]

export function evaluateResponse(
  question: string,
  response: string,
  expectedKeywords: string[]
): { passesKeywords: boolean; length: number; missingKeywords: string[] } {
  const lower = response.toLowerCase()
  const missingKeywords = expectedKeywords.filter((kw) => !lower.includes(kw.toLowerCase()))
  return {
    passesKeywords: missingKeywords.length === 0,
    length: response.length,
    missingKeywords,
  }
}

export async function runGoldenSet(
  responder: (question: string) => Promise<string>
): Promise<EvalResult[]> {
  const results: EvalResult[] = []

  for (const { question, keywords } of GOLDEN_QUESTIONS) {
    const response = await responder(question)
    const { passesKeywords, length, missingKeywords } = evaluateResponse(question, response, keywords)
    results.push({ question, response, passesKeywords, length, missingKeywords })
  }

  const passed = results.filter((r) => r.passesKeywords).length
  console.log(`[Eval Suite] ${passed}/${results.length} tests passed (${((passed / results.length) * 100).toFixed(0)}%)`)

  return results
}
