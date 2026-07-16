import { NextResponse } from "next/server"
import { planningEngine } from "@/core/planning"
import { validateBody } from "@/lib/validate"
import { PlanningPostSchema } from "@/lib/api-schemas"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get("companyId")
  const planId = searchParams.get("planId")
  const active = searchParams.get("active")

  if (planId) {
    const plan = planningEngine.getPlan(planId)
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    return NextResponse.json(plan)
  }

  if (!companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 })

  if (active === "true") {
    return NextResponse.json(planningEngine.getActivePlans(companyId))
  }

  return NextResponse.json(planningEngine.getPlans(companyId))
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { data, errors } = validateBody(PlanningPostSchema, body)
    if (errors) return NextResponse.json({ error: errors }, { status: 400 })

    switch (data.action) {
      case "generate": {
        const plan = await planningEngine.generatePlan({
          companyId: data.companyId,
          objective: data.objective,
          category: data.category,
          clientId: data.clientId,
          targetValue: data.targetValue,
          currentValue: data.currentValue,
          unit: data.unit,
          timeframeMonths: data.timeframeMonths,
          priority: data.priority,
        })
        return NextResponse.json(plan, { status: 201 })
      }
      case "execute": {
        const result = await planningEngine.executePlan(data.planId)
        return NextResponse.json(result)
      }
    }
  } catch (err) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}
