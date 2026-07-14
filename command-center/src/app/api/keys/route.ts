import { NextRequest, NextResponse } from "next/server"
import { createApiKey, listApiKeys, revokeApiKey } from "@/lib/api-keys"
import { appendAudit } from "@/lib/audit-log"

export async function GET() {
  const keys = listApiKeys()
  return NextResponse.json({ keys })
}

export async function POST(request: NextRequest) {
  const { name, scopes, expiresInDays } = await request.json()
  if (!name || !scopes?.length) {
    return NextResponse.json({ error: "name and scopes are required" }, { status: 400 })
  }
  const { key, rawKey } = await createApiKey(name, scopes, expiresInDays)
  await appendAudit("api_key_created", "system", "api_keys", `Key "${name}" created with scopes: ${scopes.join(", ")}`)
  return NextResponse.json({ key, rawKey })
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const ok = revokeApiKey(id)
  if (!ok) return NextResponse.json({ error: "Key not found" }, { status: 404 })
  await appendAudit("api_key_revoked", "system", "api_keys", `Key ${id} revoked`)
  return NextResponse.json({ success: true })
}
