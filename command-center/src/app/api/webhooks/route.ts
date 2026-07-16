import { NextRequest, NextResponse } from "next/server"

const NOTIFICATIONS_SERVICE_URL = process.env.NEXT_PUBLIC_NOTIFICATIONS_URL ?? "http://localhost:3010"

export async function GET(req: NextRequest) {
  const companyId = req.headers.get("x-company-id") ?? req.nextUrl.searchParams.get("companyId")
  if (!companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 })

  const res = await fetch(`${NOTIFICATIONS_SERVICE_URL}/api/v1/webhooks`, {
    headers: { "x-company-id": companyId },
  })
  return NextResponse.json(await res.json(), { status: res.status })
}

export async function POST(req: NextRequest) {
  const companyId = req.headers.get("x-company-id") ?? (await req.json()).companyId
  const body = await req.json()

  const res = await fetch(`${NOTIFICATIONS_SERVICE_URL}/api/v1/webhooks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-company-id": companyId },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
