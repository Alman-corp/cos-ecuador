import * as fs from "fs"
import * as path from "path"
import { ACME_MANUFACTURING_DATASET } from "../datasets/acme-manufacturing"
import { runEvaluation } from "../runner"
import { generateHtmlReport } from "../report-generator"

async function main() {
  const outputDir = path.resolve(__dirname, "../../evaluation/reports")
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })
  let previousReport = null
  const previousPath = path.join(outputDir, "latest.json")
  if (fs.existsSync(previousPath)) {
    try { previousReport = JSON.parse(fs.readFileSync(previousPath, "utf-8")) } catch {}
  }
  console.log(`Running evaluation on ${ACME_MANUFACTURING_DATASET.length} questions...`)
  const report = await runEvaluation(
    ACME_MANUFACTURING_DATASET,
    async (q) => {
      const { AdvancedRAGOrchestrator } = await import("../../src/orchestrator")
      const orch = new AdvancedRAGOrchestrator({ openAiKey: process.env.OPENAI_API_KEY })
      const response = await orch.query(q, { companyId: "tesla", clientId: "eval" })
      return {
        answer: response.answer,
        contexts: response.contexts,
        citations: response.citations.map((c) => c.text),
      }
    },
    { model: "gpt-4o-mini", parallel: 3, previousReport: previousReport ?? undefined }
  )
  const jsonPath = path.join(outputDir, "latest.json")
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2))
  const htmlPath = path.join(outputDir, `report-${Date.now()}.html`)
  fs.writeFileSync(htmlPath, generateHtmlReport(report))
  const latestHtml = path.join(outputDir, "latest.html")
  fs.writeFileSync(latestHtml, generateHtmlReport(report))
  console.log(`\nResults saved:`)
  console.log(`  JSON: ${jsonPath}`)
  console.log(`  HTML: ${htmlPath}`)
  console.log(`  HTML: ${latestHtml}`)
  console.log(`\nOverall score: ${(report.aggregate.overall * 100).toFixed(1)}%`)
  console.log(`Faithfulness: ${(report.aggregate.faithfulness * 100).toFixed(1)}%`)
  console.log(`Answer relevance: ${(report.aggregate.answer_relevance * 100).toFixed(1)}%`)
  console.log(`Citation accuracy: ${(report.aggregate.citation_accuracy * 100).toFixed(1)}%`)
  console.log(`Context recall: ${(report.aggregate.context_recall * 100).toFixed(1)}%`)
  console.log(`Regressions: ${report.regressions.length}`)
}
main().catch(console.error)
