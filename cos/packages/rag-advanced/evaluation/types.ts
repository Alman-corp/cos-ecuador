export interface GoldenQA {
  question: string
  ground_truth_answer: string
  ground_truth_contexts: Array<{
    document_id: string
    chunk_id: string
    page?: number
    cell_ref?: string
  }>
  difficulty: "easy" | "medium" | "hard"
  category: "financial" | "operational" | "strategic" | "technical" | "compliance"
}

export interface EvaluationResult {
  question: string
  category: string
  difficulty: string
  faithfulness: number
  answer_relevance: number
  numerical_accuracy: number | null
  citation_accuracy: number
  context_recall: number
  overall: number
  latency_ms: number
  answer: string
}

export interface EvaluationReport {
  timestamp: string
  system: string
  model: string
  total_questions: number
  aggregate: {
    faithfulness: number
    answer_relevance: number
    numerical_accuracy: number
    citation_accuracy: number
    context_recall: number
    overall: number
    avg_latency_ms: number
  }
  by_category: Record<string, {
    count: number
    overall: number
    faithfulness: number
    answer_relevance: number
    citation_accuracy: number
    context_recall: number
  }>
  by_difficulty: Record<string, {
    count: number
    overall: number
  }>
  regressions: Array<{
    question: string
    metric: string
    previous: number
    current: number
    threshold: number
  }>
  results: EvaluationResult[]
}
