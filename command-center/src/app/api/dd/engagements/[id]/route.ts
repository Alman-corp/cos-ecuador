import { NextRequest, NextResponse } from "next/server"
import { getEngagement, updateEngagement, deleteEngagement } from "@/lib/actions/dd-actions"
import { checkRateLimit } from "@/lib/rate-limiter"

function getClientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "127.0.0.1"
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ip = getClientIp(request)
  const { allowed, retryAfter } = checkRateLimit(ip, 100)
  if (!allowed) {
    return NextResponse.json({ error: "Too Many Requests", retryAfter }, { status: 429, headers: { "Retry-After": String(retryAfter) } })
  }

  const { id } = await params
  const result = await getEngagement(id)
  if ("error" in result) return NextResponse.json(result, { status: 400 })
  return NextResponse.json(result)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ip = getClientIp(request)
  const { allowed, retryAfter } = checkRateLimit(ip, 100)
  if (!allowed) {
    return NextResponse.json({ error: "Too Many Requests", retryAfter }, { status: 429, headers: { "Retry-After": String(retryAfter) } })
  }

  const { id } = await params
  const body = await request.json()
  const result = await updateEngagement({ id, ...body })
  if ("error" in result) return NextResponse.json(result, { status: 400 })
  return NextResponse.json(result)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ip = getClientIp(request)
  const { allowed, retryAfter } = checkRateLimit(ip, 100)
  if (!allowed) {
    return NextResponse.json({ error: "Too Many Requests", retryAfter }, { status: 429, headers: { "Retry-After": String(retryAfter) } })
  }

  const { id } = await params
  const result = await deleteEngagement(id)
  if ("error" in result) return NextResponse.json(result, { status: 400 })
  return NextResponse.json(result)
}