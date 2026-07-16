import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { logger } from "@/lib/logger"
import { processCopilotMessage } from "@/core/ai/copilot"
import { toolRegistry } from "@/core/ai/tools"
import { getSessionFromRequest } from "@/lib/auth/token"
import { validateBody } from "@/lib/validate"
import { CopilotMessageSchema, CopilotToolSchema } from "@/lib/api-schemas"

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const { data, errors } = validateBody(CopilotMessageSchema, body)
    if (errors) return NextResponse.json({ error: errors }, { status: 400 })

    const client = await prisma.client.findFirst({
      where: { id: data.clientId, companyId: session.companyId },
    })
    if (!client) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    const result = await processCopilotMessage({
      companyId: session.companyId,
      userId: session.userId,
      clientId: data.clientId,
      message: data.message,
      conversationId: data.conversationId,
    })

    return NextResponse.json(result)
  } catch (error) {
    logger.error({ err: error }, "copilot error")
    return NextResponse.json({ error: "Error interno del copiloto" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const { data, errors } = validateBody(CopilotToolSchema, body)
    if (errors) return NextResponse.json({ error: errors }, { status: 400 })

    const tool = toolRegistry.get(data.toolName)
    if (!tool) {
      return NextResponse.json({ error: `Herramienta '${data.toolName}' no encontrada` }, { status: 404 })
    }

    const result = await tool.execute(data.params, {
      companyId: session.companyId,
      userId: session.userId,
    })

    return NextResponse.json(result)
  } catch (error) {
    logger.error({ err: error }, "tool execution error")
    return NextResponse.json({ error: "Error ejecutando herramienta" }, { status: 500 })
  }
}
