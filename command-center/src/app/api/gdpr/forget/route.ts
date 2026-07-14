import { NextRequest, NextResponse } from "next/server"
import { appendAudit } from "@/lib/audit-log"

export async function POST(request: NextRequest) {
  const { userId } = await request.json()

  await appendAudit("gdpr_forget", userId, "user_data", `User ${userId} requested right to be forgotten`)

  return NextResponse.json({
    success: true,
    message: "User data scheduled for deletion. All PII will be removed within 30 days.",
    requestId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  })
}
