import { NextRequest, NextResponse } from "next/server"
import { reasoningEngine } from "@/core/reasoning"
import { validateBody } from "@/lib/validate"
import { ReasoningPostSchema } from "@/lib/api-schemas"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { data, errors } = validateBody(ReasoningPostSchema, body)
  if (errors) return NextResponse.json({ error: errors }, { status: 400 })

  const d = data as any
  switch (d.action) {
    case "reason": {
      const result = await reasoningEngine.reason({
        companyId: d.companyId,
        clientId: d.clientId,
        query: d.query,
        context: d.context,
      })
      return NextResponse.json(result)
    }
    case "explain": {
      const result = await reasoningEngine.explain(
        d.kpi, d.currentValue, d.previousValue, d.companyId, d.clientId,
      )
      return NextResponse.json(result)
    }
    case "diagnose": {
      const result = await reasoningEngine.diagnoseFinancial(d.data)
      return NextResponse.json(result)
    }
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get("action")
  const companyId = searchParams.get("companyId") || "default"
  const clientId = searchParams.get("clientId") || undefined

  if (action === "reason" || !action) {
    const result = await reasoningEngine.reason({ companyId, clientId, query: "Análisis automático" })
    return NextResponse.json(result)
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
