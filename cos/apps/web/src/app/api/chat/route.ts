import { NextRequest, NextResponse } from "next/server"
import { validateBody } from "@/lib/validate"
import { ProxyBodySchema } from "@/lib/api-schemas"

const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL || "http://localhost:8000"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { errors } = validateBody(ProxyBodySchema, body)
    if (errors) return NextResponse.json({ error: errors }, { status: 400 })
    const response = await fetch(`${ORCHESTRATOR_URL}/api/v1/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenant_id: body.tenant_id || "default",
        session_id: body.session_id || crypto.randomUUID(),
        message: body.message,
        history: body.history || [],
      }),
    })
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { status: "error", response: "El orquestador no está disponible. Usando modo offline.", agent_used: "OFFLINE" },
      { status: 200 },
    )
  }
}
