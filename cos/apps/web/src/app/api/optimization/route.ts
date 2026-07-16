import { NextResponse } from "next/server"
import { optimizationEngine } from "@/core/optimization"
import { validateBody } from "@/lib/validate"
import { OptimizationPostSchema } from "@/lib/api-schemas"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const planId = searchParams.get("planId")
  const companyId = searchParams.get("companyId")

  if (planId) {
    const result = optimizationEngine.getResult(planId)
    if (!result) return NextResponse.json({ error: "No optimization result found" }, { status: 404 })
    return NextResponse.json(result)
  }

  if (companyId) {
    return NextResponse.json(optimizationEngine.getAllResults(companyId))
  }

  return NextResponse.json([])
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { data, errors } = validateBody(OptimizationPostSchema, body)
    if (errors) return NextResponse.json({ error: errors }, { status: 400 })

    const d = data as any
    switch (d.action) {
      case "analyze": {
        const result = await optimizationEngine.analyzePlan(d)
        return NextResponse.json(result)
      }
      case "simulate": {
        const result = await optimizationEngine.simulateWhatIf(d)
        return NextResponse.json(result)
      }
    }
  } catch (err) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
