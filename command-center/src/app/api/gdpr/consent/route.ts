import { NextRequest, NextResponse } from "next/server"
import { appendAudit } from "@/lib/audit-log"

export async function POST(request: NextRequest) {
  const { userId, consentType, granted } = await request.json()

  const validTypes = ["marketing", "analytics", "data_sharing", "cookies"]
  if (!validTypes.includes(consentType)) {
    return NextResponse.json({ error: `Invalid consent type. Valid: ${validTypes.join(", ")}` }, { status: 400 })
  }

  const action = granted ? "consent_granted" : "consent_revoked"
  await appendAudit(action, userId, "consent", `${consentType} consent ${granted ? "granted" : "revoked"}`)

  return NextResponse.json({
    success: true,
    consentType,
    granted,
    updatedAt: new Date().toISOString(),
  })
}
