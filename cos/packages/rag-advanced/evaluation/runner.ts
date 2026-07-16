import type { GoldenQA, EvaluationResult, EvaluationReport } from "../types"
import { faithfulness } from "../metrics/faithfulness"
import { answerRelevance } from "../metrics/answer-relevance"
import { numericalAccuracy } from "../metrics/numerical-accuracy"
import { citationAccuracy } from "../metrics/citation-accuracy"
import { contextRecall } from "../metrics/context-recall"
import OpenAI from "openai"

export interface EvaluationOptions {
  model?: string
  llm?: OpenAI
  parallel?: number
  previousReport?: EvaluationReport
  onProgress?: (done: number, total: number) => void
}

export async function runEvaluation(
  questions: GoldenQA[],
  ragAnswer: (q: string) => Promise<{ answer: string; contexts: string[]; citations: string[] }>,
  options: EvaluationOptions = {}
): Promise<EvaluationReport> {
  const llm = options.llm ?? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const parallel = options.parallel ?? 3
  const results: EvaluationResult[] = []

  const processQuestion = async (qa: GoldenQA): Promise<EvaluationResult> => {
    const start = performance.now()
    const { answer, contexts, citations } = await ragAnswer(qa.question)
    const latency = performance.now() - start

    const [faithfulnessScore, relevanceScore, citationScore, recallScore] = await Promise.all([
      faithfulness(answer, contexts, llm),
      answerRelevance(qa.question, answer, llm),
      contexts.length > 0 ? citationAccuracy(answer, citations, llm) : Promise.resolve(0),
      contextRecall(contexts, qa.ground_truth_contexts.map((c) => `${c.document_id}:${c.chunk_id}`)),
    ])
    const numericalScore = numericalAccuracy(answer, contexts)

    const scores = [faithfulnessScore, relevanceScore, citationScore, recallScore]
    if (numericalScore !== null) scores.push(numericalScore)
    const overall = scores.reduce((a, b) => a + b, 0) / scores.length

    return {
      question: qa.question,
      category: qa.category,
      difficulty: qa.difficulty,
      faithfulness: faithfulnessScore,
      answer_relevance: relevanceScore,
      numerical_accuracy: numericalScore,
      citation_accuracy: citationScore,
      context_recall: recallScore,
      overall,
      latency_ms: Math.round(latency),
      answer,
    }
  }

  const queue = [...questions]
  const inFlight = new Set<Promise<void>>()
  let completed = 0

  const next = () => {
    while (inFlight.size < parallel && queue.length > 0) {
      const qa = queue.shift()!
      const p = processQuestion(qa).then((r) => {
        results.push(r)
        completed++
        inFlight.delete(p)
        options.onProgress?.(completed, questions.length)
      }).catch((err) => {
        results.push({
          question: qa.question,
          category: qa.category,
          difficulty: qa.difficulty,
          faithfulness: 0,
          answer_relevance: 0,
          numerical_accuracy: null,
          citation_accuracy: 0,
          context_recall: 0,
          overall: 0,
          latency_ms: 0,
          answer: `ERROR: ${err instanceof Error ? err.message : "Unknown"}`,
        })
        completed++
        inFlight.delete(p)
        options.onProgress?.(completed, questions.length)
      })
      inFlight.add(p)
    }
    if (inFlight.size > 0) return Promise.any(inFlight).then(next)
    return Promise.resolve()
  }
  await next()

  const metricAvg = (metric: keyof EvaluationResult) => {
    const vals = results.map((r) => r[metric]).filter((v): v is number => v !== null)
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
  }

  const aggregate = {
    faithfulness: metricAvg("faithfulness"),
    answer_relevance: metricAvg("answer_relevance"),
    numerical_accuracy: metricAvg("numerical_accuracy") ?? 0,
    citation_accuracy: metricAvg("citation_accuracy"),
    context_recall: metricAvg("context_recall"),
    overall: metricAvg("overall"),
    avg_latency_ms: results.reduce((a, b) => a + b.latency_ms, 0) / results.length,
  }

  const byCategory: Record<string, { count: number; overall: number; faithfulness: number; answer_relevance: number; citation_accuracy: number; context_recall: number }> = {}
  const byDifficulty: Record<string, { count: number; overall: number }> = {}
  for (const r of results) {
    if (!byCategory[r.category]) byCategory[r.category] = { count: 0, overall: 0, faithfulness: 0, answer_relevance: 0, citation_accuracy: 0, context_recall: 0 }
    byCategory[r.category].count++
    byCategory[r.category].overall += r.overall
    byCategory[r.category].faithfulness += r.faithfulness
    byCategory[r.category].answer_relevance += r.answer_relevance
    byCategory[r.category].citation_accuracy += r.citation_accuracy
    byCategory[r.category].context_recall += r.context_recall
    if (!byDifficulty[r.difficulty]) byDifficulty[r.difficulty] = { count: 0, overall: 0 }
    byDifficulty[r.difficulty].count++
    byDifficulty[r.difficulty].overall += r.overall
  }
  for (const k of Object.keys(byCategory)) {
    const c = byCategory[k]
    c.overall /= c.count; c.faithfulness /= c.count; c.answer_relevance /= c.count; c.citation_accuracy /= c.count; c.context_recall /= c.count
  }
  for (const k of Object.keys(byDifficulty)) byDifficulty[k].overall /= byDifficulty[k].count

  const regressions: EvaluationReport["regressions"] = []
  if (options.previousReport) {
    const prev = options.previousReport
    for (const r of results) {
      const prevR = prev.results.find((p) => p.question === r.question)
      if (!prevR) continue
      for (const metric of ["faithfulness", "answer_relevance", "citation_accuracy", "context_recall", "overall"] as const) {
        const current = r[metric]
        const previous = prevR[metric]
        if (previous - current > 0.1) {
          regressions.push({ question: r.question, metric, previous, current, threshold: 0.1 })
        }
      }
    }
  }

  return {
    timestamp: new Date().toISOString(),
    system: "RAG Advanced",
    model: options.model ?? "gpt-4o-mini",
    total_questions: questions.length,
    aggregate,
    by_category: byCategory,
    by_difficulty: byDifficulty,
    regressions,
    results,
  }
}
