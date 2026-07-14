import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-keys"

export async function POST(request: NextRequest) {
  const { apiKey } = await request.json()
  if (!apiKey) return NextResponse.json({ valid: false, error: "apiKey required" }, { status: 400 })

  const result = await validateApiKey(apiKey)
  if (!result) return NextResponse.json({ valid: false }, { status: 401 })

  return NextResponse.json({ valid: true, scopes: result.scopes })
}
