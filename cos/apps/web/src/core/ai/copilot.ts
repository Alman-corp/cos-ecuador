import { prisma } from "@/lib/db/prisma"
import { assembleClientContext, buildSystemPrompt } from "./context"
import { toolRegistry, type ToolContext } from "./tools"

export interface CopilotRequest {
  companyId: string
  userId: string
  clientId: string
  message: string
  conversationId?: string
}

export interface CopilotResponse {
  message: string
  conversationId: string
  traceId?: string
  suggestedTools?: { name: string; description: string; params: any }[]
  context?: any
}

function detectIntentAndTools(userMessage: string, context: any): { response: string; tools: { name: string; description: string; params: any }[] } {
  const msg = userMessage.toLowerCase()
  const tools: { name: string; description: string; params: any }[] = []
  const c = context.client

  if (msg.includes("informe") || msg.includes("reporte") || msg.includes("report")) {
    tools.push({ name: "generate_report", description: "Generar informe profesional", params: { clientId: c?.id } })
  }
  if (msg.includes("estrat") || msg.includes("plan") || msg.includes("objetivo")) {
    tools.push({ name: "create_strategy", description: "Crear plan estratégico", params: { clientId: c?.id, objective: msg, targetValue: 0 } })
  }
  if (msg.includes("tarea") || msg.includes("task") || msg.includes("pendiente")) {
    tools.push({ name: "create_task", description: "Crear tarea", params: { clientId: c?.id, title: msg } })
  }
  if (msg.includes("reunión") || msg.includes("reunion") || msg.includes("meeting") || msg.includes("agendar")) {
    tools.push({ name: "schedule_meeting", description: "Programar reunión", params: { clientId: c?.id, title: msg, date: new Date().toISOString() } })
  }
  if (msg.includes("correo") || msg.includes("email") || msg.includes("mail") || msg.includes("enviar")) {
    tools.push({ name: "send_email", description: "Enviar correo", params: { clientId: c?.id, subject: msg, body: msg } })
  }
  if (msg.includes("documento") || msg.includes("document") || msg.includes("balance") || msg.includes("pdf")) {
    tools.push({ name: "request_document", description: "Solicitar documento", params: { clientId: c?.id, documentType: "financial_statement" } })
  }
  if (msg.includes("proyecto") || msg.includes("project")) {
    tools.push({ name: "create_project", description: "Crear proyecto", params: { clientId: c?.id, name: msg, projectType: "consulting" } })
  }

  // ── Platform intents ──
  if (msg.includes("producto") || msg.includes("suite") || msg.includes("vertical") || msg.includes("qué hay")) {
    tools.push({ name: "list_products", description: "Listar productos de la plataforma", params: {} })
  }
  if (msg.includes("instalar") || msg.includes("activar")) {
    tools.push({ name: "install_product", description: "Instalar producto", params: { productId: "consulting" } })
  }
  if (msg.includes("certificar") || msg.includes("certifi")) {
    tools.push({ name: "certify_product", description: "Certificar producto", params: { productId: "consulting" } })
  }
  if (msg.includes("recomienda") && (msg.includes("producto") || msg.includes("suite") || msg.includes("módulo"))) {
    tools.push({ name: "find_product_for_client", description: "Recomendar producto para cliente", params: { clientId: c?.id, need: msg } })
  }

  // Generate intelligent response based on query intent
  let response = ""
  const score = c?.score ?? 50
  const docCount = context.documents?.length ?? 0
  const fsCount = context.financialStatements?.length ?? 0

  if (msg.includes("health") || msg.includes("salud") || msg.includes("score") || msg.includes("cómo está")) {
    response = `## Health Score: ${score}/100\n\n`
    if (score >= 70) response += "✅ El cliente tiene una salud financiera **buena**. Sus indicadores están dentro de rangos saludables.\n\n"
    else if (score >= 40) response += "⚠️ El cliente requiere **atención**. Hay indicadores que necesitan seguimiento.\n\n"
    else response += "🔴 El cliente está en **riesgo**. Se recomienda una intervención inmediata.\n\n"

    if (docCount === 0) response += "📄 **Documentos pendientes:** No se han subido documentos aún. Recomiendo solicitar los balances.\n"
    if (fsCount === 0) response += "💰 **Estados financieros:** No hay datos financieros cargados para análisis.\n"
  } else if (msg.includes("recomienda") || msg.includes("qué hago") || msg.includes("acción")) {
    response = "## Recomendaciones\n\n"
    if (score < 60) response += "1. **Prioridad alta:** Revisar liquidez y renegociar deudas si es necesario.\n"
    response += "2. Revisar documentación pendiente y regularizar estados financieros.\n"
    response += "3. Programar reunión de seguimiento con el cliente.\n"
    response += "4. Generar informe ejecutivo para la dirección.\n\n_¿Quieres que ejecute alguna de estas acciones?_"
  } else if (msg.includes("ratio") || msg.includes("indicador") || msg.includes("kpi")) {
    response = `## Indicadores Clave\n\n`
    if (context.financialStatements?.length > 0) {
      const latest = context.financialStatements[0]
      const d = latest.data as Record<string, number>
      if (d) {
        const currentRatio = d.current_assets && d.current_liabilities ? (d.current_assets / d.current_liabilities).toFixed(2) : "N/A"
        const debtEquity = d.total_liabilities && d.equity ? (d.total_liabilities / d.equity).toFixed(2) : "N/A"
        response += `- **Liquidez:** ${currentRatio}\n- **Endeudamiento:** ${debtEquity}\n- **Activos totales:** $${(d.total_assets || 0).toLocaleString()}\n- **Ingresos:** $${(d.revenue || 0).toLocaleString()}\n`
      }
    } else {
      response += "No hay datos financieros disponibles. Sube un balance para ver indicadores.\n"
    }
  } else if (msg.includes("documento") || msg.includes("balance")) {
    response = `## Documentos (${docCount})\n\n`
    if (context.documents?.length > 0) {
      context.documents.slice(0, 5).forEach((d: any) => {
        response += `- **${d.title}** — ${d.status}\n`
      })
    } else {
      response += "No hay documentos subidos aún.\n"
    }
    response += "\n¿Necesitas solicitar algún documento al cliente?"
  } else if (msg.includes("gracias") || msg.includes("thanks")) {
    response = "¡De nada! Estoy aquí para ayudarte con el análisis y gestión de tus clientes.\n\n¿Necesitas algo más?"
  } else if (msg.includes("hola") || msg.includes("buen") || msg.includes("hey")) {
    const name = c?.name || "este cliente"
    response = `¡Hola! Soy tu AI Copilot del **Business Intelligence OS**. Estoy analizando los datos de **${name}**.\n\n`
    response += `**Resumen rápido:**\n`
    response += `- Health Score: **${score}/100**\n`
    response += `- Documentos: **${docCount}**\n`
    response += `- Estados Financieros: **${fsCount}**\n`
    response += `- Plataforma: **${context.platformInfo || "BI OS Core v1.0"}**\n\n`
    response += "Puedes preguntarme sobre:\n"
    response += "- La salud financiera del cliente\n"
    response += "- Indicadores y ratios\n"
    response += "- Recomendaciones de acción\n"
    response += "- **Productos disponibles** en la plataforma\n"
    response += "- **Cuál producto se adapta** a las necesidades del cliente\n"
    response += "- Generar informes o crear estrategias\n\n_¿Qué necesitas?_"
  } else {
    response = `Sobre **${c?.name || "el cliente"}**:\n\n`
    response += `📊 Health Score: **${score}/100**\n`
    response += `📄 Documentos: **${docCount}**\n`
    response += `💰 Estados financieros: **${fsCount}**\n\n`
    response += "¿Te gustaría que profundice en algún aspecto específico?\n\n"
    response += "_Puedo ayudarte con informes, estrategias, tareas, reuniones y más._\n"
    response += "_También puedo mostrarte los **productos** de la plataforma o **recomendarte** el más adecuado para este cliente._"
  }

  return { response, tools }
}

export async function processCopilotMessage(req: CopilotRequest): Promise<CopilotResponse> {
  const context = await assembleClientContext(req.companyId, req.clientId)
  if (!context.client) {
    return { message: "Cliente no encontrado", conversationId: "", context: null }
  }

  // Get or create conversation
  let conversationId = req.conversationId
  if (!conversationId) {
    const agent = await prisma.aiAgent.findFirst({
      where: { companyId: req.companyId, isActive: true },
      orderBy: { createdAt: "asc" },
    })
    if (!agent) {
      // Auto-create default agent
      const agent = await prisma.aiAgent.create({
        data: {
          companyId: req.companyId, name: "copilot",
          agentType: "copilot", model: "gpt-4",
          systemPrompt: "Eres un copiloto de inteligencia financiera.",
          createdBy: req.userId,
        },
      })
    }
    const conversation = await prisma.aiConversation.create({
      data: {
        companyId: req.companyId, clientId: req.clientId,
        userId: req.userId, agentId: agent?.id || "pending",
        context: { clientId: req.clientId },
        createdBy: req.userId,
      },
    })
    conversationId = conversation.id

    // Store context as system message
    await prisma.aiMessage.create({
      data: {
        conversationId, role: "system",
        content: buildSystemPrompt(context),
      },
    })
  }

  // Store user message
  await prisma.aiMessage.create({
    data: { conversationId, role: "user", content: req.message },
  })

  // Generate response
  const { response, tools } = detectIntentAndTools(req.message, context)

  // Store AI response
  await prisma.aiMessage.create({
    data: { conversationId, role: "assistant", content: response },
  })

  // Create trace for feedback tracking
  const trace = await prisma.aiTrace.create({
    data: {
      companyId: req.companyId,
      conversationId,
      taskType: "copilot_response",
      model: "rule-based",
      userMessage: req.message,
      response,
      status: "success",
      userId: req.userId,
    },
  })

  return {
    message: response,
    conversationId,
    traceId: trace.id,
    suggestedTools: tools.length > 0 ? tools : undefined,
    context: {
      clientName: context.client?.name,
      healthScore: context.client?.score,
      documentCount: context.documents.length,
      fsCount: context.financialStatements.length,
    },
  }
}
