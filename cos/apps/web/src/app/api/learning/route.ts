import { NextResponse } from "next/server"
import { learningEngine } from "@/core/learning"
import { validateBody } from "@/lib/validate"
import { LearningPostSchema } from "@/lib/api-schemas"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const caseId = searchParams.get("caseId")
  const companyId = searchParams.get("companyId")
  const problem = searchParams.get("problem")
  const category = searchParams.get("category")
  const stats = searchParams.get("stats")

  if (stats === "true") {
    return NextResponse.json(learningEngine.getStats())
  }

  if (caseId) {
    const c = learningEngine.getCase(caseId)
    if (!c) return NextResponse.json({ error: "Case not found" }, { status: 404 })
    return NextResponse.json(c)
  }

  if (problem) {
    const limit = parseInt(searchParams.get("limit") || "5", 10)
    const similar = learningEngine.findSimilar(problem, category || undefined, limit)
    return NextResponse.json(similar)
  }

  return NextResponse.json(learningEngine.getAll(companyId || undefined))
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { data, errors } = validateBody(LearningPostSchema, body)
    if (errors) return NextResponse.json({ error: errors }, { status: 400 })

    const d = data as any
    switch (d.action) {
      case "register": {
        const businessCase = learningEngine.registerCase(d)
        return NextResponse.json(businessCase, { status: 201 })
      }
      case "auto-register": {
        const c = learningEngine.autoRegisterFromPlan(d.planId, d)
        if (!c) return NextResponse.json({ error: "Plan not found or not completed" }, { status: 400 })
        return NextResponse.json(c, { status: 201 })
      }
      case "delete": {
        const deleted = learningEngine.deleteCase(d.caseId)
        return NextResponse.json({ deleted })
      }
      case "search": {
        const results = learningEngine.search(d)
        return NextResponse.json(results)
      }
    }
  } catch (err) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}
