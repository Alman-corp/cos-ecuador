import * as fs from "fs"
import * as path from "path"
import { ACME_MANUFACTURING_DATASET } from "../evaluation/datasets/acme-manufacturing"
import type { EvaluationResult, EvaluationReport } from "../evaluation/types"
import { faithfulness } from "../evaluation/metrics/faithfulness"
import { answerRelevance } from "../evaluation/metrics/answer-relevance"
import { numericalAccuracy } from "../evaluation/metrics/numerical-accuracy"
import { citationAccuracy } from "../evaluation/metrics/citation-accuracy"
import { contextRecall } from "../evaluation/metrics/context-recall"
import OpenAI from "openai"

async function queryBasic(query: string): Promise<{ answer: string; contexts: string[]; citations: string[] }> {
  const { RAGOrchestrator } = await import("@cos/rag")
  const orch = new RAGOrchestrator()
  const result = await orch.queryWithISD({ query, companyId: "tesla", clientId: "benchmark" })
  return {
    answer: result.answer,
    contexts: result.citations.map((c) => c.text),
    citations: result.citations.map((c) => `[${c.id}] ${c.text}`),
  }
}

async function queryAdvanced(query: string): Promise<{ answer: string; contexts: string[]; citations: string[] }> {
  const { AdvancedRAGOrchestrator } = await import("../src/orchestrator")
  const orch = new AdvancedRAGOrchestrator({ openAiKey: process.env.OPENAI_API_KEY })
  const response = await orch.query(query, { companyId: "tesla", clientId: "benchmark" })
  return {
    answer: response.answer,
    contexts: response.contexts,
    citations: response.citations.map((c) => c.text),
  }
}

async function evaluateQuestion(qa: typeof ACME_MANUFACTURING_DATASET[0], answer: string, contexts: string[], citations: string[], llm: OpenAI): Promise<EvaluationResult> {
  const start = performance.now()
  const [faithScore, relevanceScore, citationScore, recallScore] = await Promise.all([
    faithfulness(answer, contexts, llm),
    answerRelevance(qa.question, answer, llm),
    contexts.length > 0 ? citationAccuracy(answer, citations, llm) : Promise.resolve(0),
    contextRecall(contexts, qa.ground_truth_contexts.map((c) => `${c.document_id}:${c.chunk_id}`)),
  ])
  const numScore = numericalAccuracy(answer, contexts)
  const scores = [faithScore, relevanceScore, citationScore, recallScore]
  if (numScore !== null) scores.push(numScore)
  return {
    question: qa.question,
    category: qa.category,
    difficulty: qa.difficulty,
    faithfulness: faithScore,
    answer_relevance: relevanceScore,
    numerical_accuracy: numScore,
    citation_accuracy: citationScore,
    context_recall: recallScore,
    overall: scores.reduce((a, b) => a + b, 0) / scores.length,
    latency_ms: Math.round(performance.now() - start),
    answer,
  }
}

function generateBenchmarkReport(basic: EvaluationResult[], advanced: EvaluationResult[]): string {
  const avg = (results: EvaluationResult[], metric: keyof EvaluationResult) => {
    const vals = results.map((r) => r[metric]).filter((v): v is number => v !== null)
    return vals.reduce((a, b) => a + b, 0) / vals.length
  }

  const basicAgg = {
    overall: avg(basic, "overall"),
    faithfulness: avg(basic, "faithfulness"),
    relevance: avg(basic, "answer_relevance"),
    citation: avg(basic, "citation_accuracy"),
    recall: avg(basic, "context_recall"),
    latency: basic.reduce((a, b) => a + b.latency_ms, 0) / basic.length,
  }
  const advAgg = {
    overall: avg(advanced, "overall"),
    faithfulness: avg(advanced, "faithfulness"),
    relevance: avg(advanced, "answer_relevance"),
    citation: avg(advanced, "citation_accuracy"),
    recall: avg(advanced, "context_recall"),
    latency: advanced.reduce((a, b) => a + b.latency_ms, 0) / advanced.length,
  }

  const wins = advanced.reduce((acc, adv, i) => {
    acc.wins += adv.overall > basic[i].overall ? 1 : 0
    acc.losses += adv.overall < basic[i].overall ? 1 : 0
    acc.ties += adv.overall === basic[i].overall ? 1 : 0
    return acc
  }, { wins: 0, losses: 0, ties: 0 })

  const improvements = Object.entries({
    faithfulness: (advAgg.faithfulness - basicAgg.faithfulness) * 100,
    "answer relevance": (advAgg.relevance - basicAgg.relevance) * 100,
    "citation accuracy": (advAgg.citation - basicAgg.citation) * 100,
    "context recall": (advAgg.recall - basicAgg.recall) * 100,
    overall: (advAgg.overall - basicAgg.overall) * 100,
  })

  const questionRows = advanced.map((adv, i) => {
    const bas = basic[i]
    const winner = adv.overall > bas.overall ? "Advanced" : adv.overall < bas.overall ? "Basic" : "Tie"
    const wColor = winner === "Advanced" ? "#22c55e" : winner === "Basic" ? "#ef4444" : "#64748b"
    return `<tr>
      <td style="padding:6px 8px;font-size:11px;color:#e2e8f0;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${adv.question.slice(0, 60)}</td>
      <td style="padding:6px 8px;font-size:11px;text-align:center;color:#94a3b8">${bas.difficulty}</td>
      <td style="padding:6px 8px;font-size:11px;font-family:monospace;text-align:right;color:#94a3b8">${(bas.overall * 100).toFixed(1)}%</td>
      <td style="padding:6px 8px;font-size:11px;font-family:monospace;text-align:right;color:#e2e8f0">${(adv.overall * 100).toFixed(1)}%</td>
      <td style="padding:6px 8px;font-size:11px;font-family:monospace;text-align:right;color:${(adv.overall - bas.overall) * 100 > 0 ? '#22c55e' : '#ef4444'}">${((adv.overall - bas.overall) * 100).toFixed(1)}pp</td>
      <td style="padding:6px 8px;font-size:11px;text-align:center;color:${wColor};font-weight:500">${winner}</td>
    </tr>`
  }).join("")

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>RAG Benchmark: Basic vs Advanced</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
<style>
body{background:#0f172a;color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:24px}
*{box-sizing:border-box}
</style></head><body>
<div style="max-width:960px;margin:0 auto">
  <h1 style="font-size:20px;margin:0 0 4px 0">RAG Benchmark: Basic vs Advanced</h1>
  <p style="color:#94a3b8;font-size:12px;margin:0 0 24px 0">${advanced.length} questions · ${new Date().toLocaleString()}</p>

  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:24px">
    <div style="background:#1e293b;border-radius:12px;padding:16px;text-align:center;border:1px solid #334155">
      <p style="color:#64748b;font-size:10px;margin:0 0 4px 0">Win Rate</p>
      <p style="color:#22c55e;font-size:28px;font-weight:bold;margin:0;font-family:monospace">${(wins.wins / advanced.length * 100).toFixed(0)}%</p>
      <p style="color:#94a3b8;font-size:10px;margin:4px 0 0 0">${wins.wins}W / ${wins.losses}L / ${wins.ties}T</p>
    </div>
    <div style="background:#1e293b;border-radius:12px;padding:16px;text-align:center;border:1px solid #334155">
      <p style="color:#64748b;font-size:10px;margin:0 0 4px 0">Best Improvement</p>
      <p style="color:#22c55e;font-size:28px;font-weight:bold;margin:0;font-family:monospace">${improvements.reduce((max, [_, v]) => Math.max(max, v), 0).toFixed(1)}pp</p>
      <p style="color:#94a3b8;font-size:10px;margin:4px 0 0 0">${improvements.find(([_, v]) => v === Math.max(...improvements.map(([__, v]) => v)))?.[0] ?? ""}</p>
    </div>
    <div style="background:#1e293b;border-radius:12px;padding:16px;text-align:center;border:1px solid #334155">
      <p style="color:#64748b;font-size:10px;margin:0 0 4px 0">Avg Latency Δ</p>
      <p style="color:${advAgg.latency - basicAgg.latency > 0 ? '#eab308' : '#22c55e'};font-size:28px;font-weight:bold;margin:0;font-family:monospace">${(advAgg.latency - basicAgg.latency) > 0 ? "+" : ""}${(advAgg.latency - basicAgg.latency).toFixed(0)}ms</p>
      <p style="color:#94a3b8;font-size:10px;margin:4px 0 0 0">${basicAgg.latency.toFixed(0)}ms → ${advAgg.latency.toFixed(0)}ms</p>
    </div>
  </div>

  <div style="background:#1e293b;border-radius:12px;padding:16px;margin-bottom:24px;border:1px solid #334155">
    <p style="color:#e2e8f0;font-size:13px;font-weight:500;margin:0 0 12px 0">Radar Comparison</p>
    <canvas id="radarChart" style="max-height:260px"></canvas>
  </div>

  <div style="margin-bottom:24px">
    <p style="color:#e2e8f0;font-size:13px;font-weight:500;margin:0 0 8px 0">Metric Improvements</p>
    <table style="width:100%;border-collapse:collapse">
      ${improvements.map(([metric, change]) => {
        const isPositive = change >= 0
        return `<tr>
          <td style="padding:6px 12px;color:#e2e8f0;font-size:12px;text-transform:capitalize">${metric}</td>
          <td style="padding:6px 12px;text-align:right;color:#94a3b8;font-size:12px;font-family:monospace">${(basicAgg[metric as keyof typeof basicAgg] * 100).toFixed(1)}%</td>
          <td style="padding:6px 12px;text-align:right;color:#e2e8f0;font-size:12px;font-family:monospace">${(advAgg[metric as keyof typeof advAgg] * 100).toFixed(1)}%</td>
          <td style="padding:6px 12px;text-align:right;color:${isPositive ? '#22c55e' : '#ef4444'};font-size:12px;font-family:monospace">${isPositive ? '+' : ''}${change.toFixed(1)}pp</td>
        </tr>`
      }).join("")}
    </table>
  </div>

  <div style="margin-bottom:24px">
    <p style="color:#e2e8f0;font-size:13px;font-weight:500;margin:0 0 8px 0">Per-Question Comparison</p>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead><tr style="border-bottom:1px solid #334155">
        <th style="padding:6px 8px;text-align:left;color:#64748b;font-weight:500">Question</th>
        <th style="padding:6px 8px;text-align:center;color:#64748b;font-weight:500">Diff</th>
        <th style="padding:6px 8px;text-align:right;color:#64748b;font-weight:500">Basic</th>
        <th style="padding:6px 8px;text-align:right;color:#64748b;font-weight:500">Advanced</th>
        <th style="padding:6px 8px;text-align:right;color:#64748b;font-weight:500">Δ</th>
        <th style="padding:6px 8px;text-align:center;color:#64748b;font-weight:500">Winner</th>
      </tr></thead>
      <tbody>${questionRows}</tbody>
    </table>
  </div>
</div>
<script>
new Chart(document.getElementById('radarChart'), {
  type:'radar',
  data:{labels:['Faithfulness','Answer Relevance','Numerical Accuracy','Citation Accuracy','Context Recall','Overall'],
    datasets:[
      {label:'Basic RAG',data:[${(basicAgg.faithfulness*100).toFixed(1)},${(basicAgg.relevance*100).toFixed(1)},0,${(basicAgg.citation*100).toFixed(1)},${(basicAgg.recall*100).toFixed(1)},${(basicAgg.overall*100).toFixed(1)}],
        backgroundColor:'rgba(100,116,139,0.1)',borderColor:'rgba(100,116,139,0.6)',borderWidth:2,pointBackgroundColor:'#64748b',pointRadius:3},
      {label:'Advanced RAG',data:[${(advAgg.faithfulness*100).toFixed(1)},${(advAgg.relevance*100).toFixed(1)},0,${(advAgg.citation*100).toFixed(1)},${(advAgg.recall*100).toFixed(1)},${(advAgg.overall*100).toFixed(1)}],
        backgroundColor:'rgba(59,130,246,0.1)',borderColor:'rgba(59,130,246,0.8)',borderWidth:2,pointBackgroundColor:'#3b82f6',pointRadius:3}
    ]},
  options:{plugins:{legend:{labels:{color:'#94a3b8',font:{size:10}}}},scales:{r:{angleLines:{color:'#334155'},grid:{color:'#334155'},pointLabels:{color:'#94a3b8',font:{size:9}},ticks:{color:'#64748b',font:{size:8},backdropColor:'transparent',stepSize:20,callback:v=>v+'%'}},startAngle:90}}
})
</script>
</body></html>`
}

async function main() {
  console.log("╔══════════════════════════════════════════╗")
  console.log("║  RAG Benchmark: Basic vs Advanced        ║")
  console.log("╚══════════════════════════════════════════╝\n")

  const llm = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const dataset = ACME_MANUFACTURING_DATASET
  const basicResults: EvaluationResult[] = []
  const advancedResults: EvaluationResult[] = []

  console.log(`Evaluating ${dataset.length} questions against both pipelines...\n`)

  for (let i = 0; i < dataset.length; i++) {
    const qa = dataset[i]
    console.log(`[${i + 1}/${dataset.length}] ${qa.question.slice(0, 80)}`)

    const basicResponse = await queryBasic(qa.question)
    await new Promise((r) => setTimeout(r, 200))
    const advResponse = await queryAdvanced(qa.question)

    const [basicResult, advResult] = await Promise.all([
      evaluateQuestion(qa, basicResponse.answer, basicResponse.contexts, basicResponse.citations, llm),
      evaluateQuestion(qa, advResponse.answer, advResponse.contexts, advResponse.citations, llm),
    ])
    basicResults.push(basicResult)
    advancedResults.push(advResult)

    console.log(`   Basic: ${(basicResult.overall * 100).toFixed(1)}% | Advanced: ${(advResult.overall * 100).toFixed(1)}% | Δ: ${((advResult.overall - basicResult.overall) * 100).toFixed(1)}pp`)
  }

  const outputDir = path.resolve(__dirname, "../benchmark-results")
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

  const html = generateBenchmarkReport(basicResults, advancedResults)
  const htmlPath = path.join(outputDir, `benchmark-${Date.now()}.html`)
  fs.writeFileSync(htmlPath, html)

  const latestPath = path.join(outputDir, "latest.html")
  fs.writeFileSync(latestPath, html)

  const wins = advancedResults.reduce((acc, adv, i) => {
    acc.wins += adv.overall > basicResults[i].overall ? 1 : 0
    acc.losses += adv.overall < basicResults[i].overall ? 1 : 0
    return acc
  }, { wins: 0, losses: 0 })

  console.log(`\n✅ Benchmark complete!`)
  console.log(`   Report: ${htmlPath}`)
  console.log(`   Report: ${latestPath}`)
  console.log(`\n   Win Rate: ${(wins.wins / dataset.length * 100).toFixed(0)}% (${wins.wins}W / ${wins.losses}L)`)
  console.log(`   Advanced avg: ${(advancedResults.reduce((a, r) => a + r.overall, 0) / advancedResults.length * 100).toFixed(1)}%`)
  console.log(`   Basic avg:    ${(basicResults.reduce((a, r) => a + r.overall, 0) / basicResults.length * 100).toFixed(1)}%`)
}

main().catch(console.error)
