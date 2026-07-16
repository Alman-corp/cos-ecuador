import { NextRequest, NextResponse } from "next/server"

const NOTIFICATIONS_SERVICE_URL = process.env.NEXT_PUBLIC_NOTIFICATIONS_URL ?? "http://localhost:3010"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const companyId = req.headers.get("x-company-id") ?? req.nextUrl.searchParams.get("companyId")
  if (!companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 })

  const res = await fetch(`${NOTIFICATIONS_SERVICE_URL}/api/v1/webhooks/${id}/test`, {
    method: "POST",
    headers: { "x-company-id": companyId },
  })
  return NextResponse.json(await res.json(), { status: res.status })
}
