import { NextRequest, NextResponse } from "next/server"

const NOTIFICATIONS_SERVICE_URL =
  process.env.NEXT_PUBLIC_NOTIFICATIONS_URL ?? "http://localhost:3010"
const NOTIFICATIONS_API_KEY = process.env.NOTIFICATIONS_API_KEY ?? ""

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const apiKey = req.headers.get("x-api-key") ?? NOTIFICATIONS_API_KEY

    const res = await fetch(`${NOTIFICATIONS_SERVICE_URL}/api/v1/notifications/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Proxy error" }))
      return NextResponse.json(err, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to forward notification"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
