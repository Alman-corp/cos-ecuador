import { NextResponse } from "next/server"
import { executionEngine } from "@/core/execution"
import { validateBody } from "@/lib/validate"
import { ExecutionPostSchema } from "@/lib/api-schemas"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const planId = searchParams.get("planId")
  const companyId = searchParams.get("companyId")
  const history = searchParams.get("history")
  const alerts = searchParams.get("alerts")

  if (alerts === "true" && companyId) {
    return NextResponse.json(executionEngine.getAllAlerts(companyId))
  }

  if (planId && history === "true") {
    return NextResponse.json(executionEngine.getHistory(planId))
  }

  if (planId) {
    try {
      const status = await executionEngine.analyze(planId)
      return NextResponse.json(status)
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 404 })
    }
  }

  const statusFilter = searchParams.get("status") as any
  return NextResponse.json(executionEngine.getAll(statusFilter))
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { data, errors } = validateBody(ExecutionPostSchema, body)
    if (errors) return NextResponse.json({ error: errors }, { status: 400 })

    switch (data.action) {
      case "detect": {
        const deviations = await executionEngine.autoDetectDeviations(data.planId)
        return NextResponse.json(deviations)
      }
      case "correct": {
        const correction = await executionEngine.proposeCorrection(data.deviationId)
        if (!correction) return NextResponse.json({ error: "Deviation not found" }, { status: 404 })
        return NextResponse.json(correction)
      }
      case "approve": {
        const c = executionEngine.approveCorrection(data.correctionId)
        if (!c) return NextResponse.json({ error: "Correction not found" }, { status: 404 })
        return NextResponse.json(c)
      }
      case "implement": {
        const c = executionEngine.implementCorrection(data.correctionId)
        if (!c) return NextResponse.json({ error: "Correction not found" }, { status: 404 })
        return NextResponse.json(c)
      }
      case "acknowledge-alert": {
        const a = executionEngine.acknowledgeAlert(data.alertId)
        if (!a) return NextResponse.json({ error: "Alert not found" }, { status: 404 })
        return NextResponse.json(a)
      }
      case "resolve-alert": {
        const a = executionEngine.resolveAlert(data.alertId)
        if (!a) return NextResponse.json({ error: "Alert not found" }, { status: 404 })
        return NextResponse.json(a)
      }
      case "reforecast": {
        const forecast = await executionEngine.reforecast(data.planId)
        return NextResponse.json(forecast)
      }
      case "resolve-deviation": {
        const d = executionEngine.resolveDeviation(data.deviationId)
        if (!d) return NextResponse.json({ error: "Deviation not found" }, { status: 404 })
        return NextResponse.json(d)
      }
    }
  } catch (err) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}
