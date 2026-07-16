import { NextRequest, NextResponse } from "next/server"
import { getSessionFromRequest } from "@/lib/auth/token"
import { notificationService } from "@/core/notifications"
import { validateBody } from "@/lib/validate"
import { NotificationsPostSchema } from "@/lib/api-schemas"

function getCompanyId(req: NextRequest, session: { companyId: string } | null): string {
  return session?.companyId || req.headers.get("x-company-id") || "demo-company"
}
function getUserId(_req: NextRequest, session: { userId: string } | null): string {
  return session?.userId || "demo"
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req).catch(() => null)
  const companyId = getCompanyId(req, session)
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get("mode") || "pending"
  const userId = searchParams.get("userId") || getUserId(req, session)

  try {
    if (mode === "templates") {
      return NextResponse.json({ success: true, templates: notificationService.getAllTemplates() })
    }
    if (mode === "history") {
      return NextResponse.json({ success: true, notifications: notificationService.getHistory(companyId) })
    }
    const pending = notificationService.getPending(companyId, userId)
    return NextResponse.json({ success: true, notifications: pending })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req).catch(() => null)
  const companyId = getCompanyId(req, session)

  try {
    const body = await req.json()
    const { data: v, errors } = validateBody(NotificationsPostSchema, body)
    if (errors) return NextResponse.json({ error: errors }, { status: 400 })

    const n = v as any
    if (n.action === "send") {
      const notification = await notificationService.notify(
        companyId, n.channel, n.category, n.priority, n.title, n.body,
        { userId: n.userId || getUserId(req, session), data: n.data, scheduledFor: n.scheduledFor },
      )
      return NextResponse.json({ success: true, notification })
    }

    if (n.action === "send_template") {
      const notification = await notificationService.notifyFromTemplate(
        companyId, n.channel, n.templateId, n.variables, n.priority,
        { userId: n.userId || getUserId(req, session) },
      )
      if (!notification) return NextResponse.json({ error: "Template no encontrado" }, { status: 404 })
      return NextResponse.json({ success: true, notification })
    }

    if (n.action === "mark_read") {
      const ok = notificationService.markRead(n.notificationId)
      return NextResponse.json({ success: ok })
    }
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 })
  }
}
