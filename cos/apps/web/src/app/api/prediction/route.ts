import { NextRequest, NextResponse } from "next/server"
import { predictionEngine } from "@/core/prediction"
import { validateBody } from "@/lib/validate"
import { PredictionPostSchema } from "@/lib/api-schemas"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get("companyId") || "default"
  const clientId = searchParams.get("clientId") || undefined

  const result = await predictionEngine.predict(companyId, clientId)
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { data, errors } = validateBody(PredictionPostSchema, body)
  if (errors) return NextResponse.json({ error: errors }, { status: 400 })

    const d = data as any
    switch (d.action) {
    case "predict": {
      const result = await predictionEngine.predict(d.companyId, d.clientId)
      return NextResponse.json(result)
    }
    case "predict-kpi": {
      const result = await predictionEngine.predictKPI(d.kpi, d.historicalData, d.days)
      return NextResponse.json(result)
    }
    case "cash-flow": {
      const result = await predictionEngine.cashFlowForecast(
        d.currentCash, d.monthlyInflow, d.monthlyOutflow, d.months,
      )
      return NextResponse.json(result)
    }
  }
}
