import { NextRequest, NextResponse } from "next/server"
import { validateBody } from "@/lib/validate"
import { ProxyBodySchema } from "@/lib/api-schemas"

const WORKFLOWS_SERVICE = process.env.WORKFLOWS_SERVICE_URL || "http://localhost:3005"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type") || "definitions"
  const companyId = searchParams.get("companyId")
  const status = searchParams.get("status")
  const category = searchParams.get("category")
  const page = searchParams.get("page") || "1"
  const limit = searchParams.get("limit") || "20"

  try {
    if (type === "instances") {
      const params = new URLSearchParams({ companyId: companyId || "", page, limit })
      if (status) params.set("status", status)
      const response = await fetch(`${WORKFLOWS_SERVICE}/api/v1/workflows/instances?${params}`, {
        headers: { "Content-Type": "application/json" },
      })
      const data = await response.json()
      return NextResponse.json(data)
    }

    const params = new URLSearchParams({ companyId: companyId || "" })
    if (category) params.set("category", category)
    const response = await fetch(`${WORKFLOWS_SERVICE}/api/v1/workflows/definitions?${params}`, {
      headers: { "Content-Type": "application/json" },
    })
    const data = await response.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ data: [], total: 0 }, { status: 200 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { errors } = validateBody(ProxyBodySchema, body)
    if (errors) return NextResponse.json({ error: errors }, { status: 400 })
    const endpoint = body.type === "instance"
      ? `${WORKFLOWS_SERVICE}/api/v1/workflows/instances`
      : `${WORKFLOWS_SERVICE}/api/v1/workflows/definitions`

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch {
    return NextResponse.json({ error: "Servicio no disponible" }, { status: 503 })
  }
}
