import { NextResponse } from "next/server"
import { confidenceEngine } from "@/core/confidence"
import { validateBody } from "@/lib/validate"
import { ConfidencePostSchema } from "@/lib/api-schemas"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { data, errors } = validateBody(ConfidencePostSchema, body)
    if (errors) return NextResponse.json({ error: errors }, { status: 400 })

    switch (data.action) {
      case "evaluate": {
        const result = confidenceEngine.evaluate(data)
        return NextResponse.json(result)
      }
      case "evaluate-prediction": {
        const result = confidenceEngine.evaluatePrediction(data.historicalDataPoints, data.rSquared, data.kpiCount, data.industry)
        return NextResponse.json(result)
      }
      case "evaluate-recommendation": {
        const result = confidenceEngine.evaluateRecommendation(data.evidenceCount, data.similarCases, data.industryKnown)
        return NextResponse.json(result)
      }
      case "evaluate-diagnosis": {
        const result = confidenceEngine.evaluateDiagnosis(data.observations, data.consistentKPIs, data.industryKnown)
        return NextResponse.json(result)
      }
    }
  } catch (err) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
