import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { logger } from "@/lib/logger"
import { getSessionFromRequest } from "@/lib/auth/token"
import { validateBody } from "@/lib/validate"
import { CopilotFeedbackSchema } from "@/lib/api-schemas"

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const body = await req.json()
    const { data, errors } = validateBody(CopilotFeedbackSchema, body)
    if (errors) return NextResponse.json({ error: errors }, { status: 400 })

    const trace = await prisma.aiTrace.findFirst({
      where: { id: data.traceId, companyId: session.companyId },
    })
    if (!trace) return NextResponse.json({ error: "Trace no encontrado" }, { status: 404 })

    await prisma.aiTrace.update({
      where: { id: data.traceId },
      data: { feedbackScore: data.score, feedbackText: data.text || null },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ err: error }, "feedback error")
    return NextResponse.json({ error: "Error registrando feedback" }, { status: 500 })
  }
}
