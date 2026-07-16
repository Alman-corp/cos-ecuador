import { NextRequest, NextResponse } from "next/server"
import { enterpriseKnowledge, ifrsEngine, kpiLibrary, benchmarkEngine, sriEngine, ifrsValidator, knowledgeGraph } from "@/core/knowledge"
import { validateBody } from "@/lib/validate"
import { KnowledgePostSchema } from "@/lib/api-schemas"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const domain = searchParams.get("domain")
  const query = searchParams.get("query")
  const industry = searchParams.get("industry")

  if (domain === "summary") {
    return NextResponse.json(enterpriseKnowledge.getSummary())
  }

  if (domain === "kpi") {
    if (query) {
      const kpis = kpiLibrary.getKPIs(undefined, query)
      return NextResponse.json({ total: kpis.length, kpis })
    }
    return NextResponse.json({
      total: kpiLibrary.getTotalCount(),
      domains: kpiLibrary.getDomains(),
    })
  }

  if (domain === "ifrs") {
    if (query) {
      const concepts = ifrsEngine.search(query)
      return NextResponse.json({ total: concepts.length, concepts })
    }
    return NextResponse.json({
      total: ifrsEngine.evaluate("ifrs-full:Assets").totalConcepts,
      validationRules: 8,
    })
  }

  if (domain === "benchmark" && industry) {
    const bench = benchmarkEngine.getBenchmark(industry)
    if (!bench) return NextResponse.json({ error: "Industria no encontrada" }, { status: 404 })
    return NextResponse.json(bench)
  }

  if (domain === "benchmarks") {
    return NextResponse.json(benchmarkEngine.getAllIndustries())
  }

  if (domain === "sri") {
    if (query) {
      const activities = sriEngine.searchActivities(query)
      return NextResponse.json({ activities })
    }
    return NextResponse.json({
      taxRates: sriEngine.getTaxRates(),
      totalActivities: sriEngine.searchActivities("").length,
    })
  }

  if (domain === "ontology") {
    const ontology = knowledgeGraph.getOntology()
    const classId = searchParams.get("class")
    if (classId) {
      const cls = knowledgeGraph.getClass(classId)
      if (!cls) return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 })
      return NextResponse.json({
        class: cls,
        children: knowledgeGraph.getChildren(classId),
        relations: knowledgeGraph.getRelations(classId),
      })
    }
    return NextResponse.json(ontology)
  }

  if (domain === "validate") {
    return NextResponse.json({
      rules: ifrsValidator.rules.map((r) => ({
        id: r.id, name: r.name, severity: r.severity, description: r.description,
      })),
    })
  }

  // If no domain, return the knowledge base context
  return NextResponse.json({
    summary: enterpriseKnowledge.getSummary(),
    context: enterpriseKnowledge.getContextForExecutive(industry || undefined),
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { data, errors } = validateBody(KnowledgePostSchema, body)
    if (errors) return NextResponse.json({ error: errors }, { status: 400 })

    const d = data as any
    switch (d.action) {
      case "search_kpi": {
        const kpis = kpiLibrary.getKPIs(d.domain, d.query)
        return NextResponse.json({ total: kpis.length, kpis })
      }

      case "evaluate_kpi": {
        const result = kpiLibrary.evaluate(d.kpiId, d.value)
        return NextResponse.json(result)
      }

      case "evaluate_ratios": {
        const results = kpiLibrary.evaluateMultiple(d.values)
        return NextResponse.json(results)
      }

      case "benchmark_compare": {
        const comparisons = benchmarkEngine.compare(d.industry, d.ratios)
        return NextResponse.json(comparisons)
      }

      case "benchmark_report": {
        const report = benchmarkEngine.generateFullReport(d.companyId || "unknown", d.industry, d.ratios)
        return NextResponse.json(report)
      }

      case "ifrs_validate": {
        const report = ifrsValidator.validate(d.companyId || "unknown", d.data, d.period)
        return NextResponse.json(report)
      }

      case "ifrs_ratios": {
        const ratios = ifrsValidator.computeRatios(d.data)
        return NextResponse.json(ratios)
      }

      case "sri_analyze": {
        const analysis = sriEngine.analyzeCompany(d.profile)
        return NextResponse.json(analysis)
      }

      case "knowledge_query": {
        const result = enterpriseKnowledge.answerKnowledgeQuery(d.query)
        return NextResponse.json({ query: d.query, result })
      }
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
