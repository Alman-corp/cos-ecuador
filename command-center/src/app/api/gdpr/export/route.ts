import { NextRequest, NextResponse } from "next/server"
import { appendAudit } from "@/lib/audit-log"

export async function POST(request: NextRequest) {
  const { userId } = await request.json()

  const data = {
    userId,
    profile: { name: "Usuario Demo", email: "demo@example.com", role: "analyst" },
    documents: [
      { id: "doc-1", title: "Reporte Q4 2025", createdAt: "2025-10-01" },
      { id: "doc-2", title: "Valuación DCF", createdAt: "2025-11-15" },
    ],
    activity: [
      { action: "login", timestamp: "2026-07-09T10:00:00Z" },
      { action: "view_report", timestamp: "2026-07-09T10:05:00Z" },
    ],
  }

  await appendAudit("gdpr_export", userId, "user_data", `Data exported for user ${userId}`)

  return NextResponse.json({ success: true, data, exportedAt: new Date().toISOString() })
}
