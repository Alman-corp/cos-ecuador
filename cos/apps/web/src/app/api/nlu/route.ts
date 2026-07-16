import { NextRequest, NextResponse } from "next/server"
import { getSessionFromRequest } from "@/lib/auth/token"
import { nluEngine } from "@/core/nlu"
import { validateBody } from "@/lib/validate"
import { NluClassifySchema } from "@/lib/api-schemas"

export async function POST(req: NextRequest) {
  await getSessionFromRequest(req).catch(() => null)

  try {
    const body = await req.json()
    const { data, errors } = validateBody(NluClassifySchema, body)
    if (errors) return NextResponse.json({ error: errors }, { status: 400 })

    if (data.action === "classify" || (!data.action && data.text)) {
      const result = nluEngine.classify(data.text)
      return NextResponse.json({ success: true, result })
    }

    return NextResponse.json({ error: "Acción no soportada" }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error en NLU" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    supportedIntents: [
      "int_health_check", "int_kpi_query", "int_scenario", "int_prediction",
      "int_report", "int_benchmark", "int_plan", "int_alert",
      "int_compliance", "int_cashflow", "int_valuation", "int_optimize",
    ],
    entityTypes: ["company", "metric", "number", "industry", "date", "percentage", "currency"],
    example: {
      text: "¿Cómo está la salud financiera de la empresa?",
      intent: "int_health_check",
      sentiment: "neutral",
    },
  })
}
