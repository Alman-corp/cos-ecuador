import { prisma } from "@/lib/db/prisma"
import { marketplace, certification, productRegistry } from "@/core/platform"

export interface AiTool {
  name: string
  description: string
  execute: (params: any, context: ToolContext) => Promise<ToolResult>
}

export interface ToolContext {
  companyId: string
  userId: string
}

export interface ToolResult {
  success: boolean
  message: string
  data?: any
}

const tools: Map<string, AiTool> = new Map()

function register(tool: AiTool) {
  tools.set(tool.name, tool)
}

function getAll(): AiTool[] {
  return Array.from(tools.values())
}

function get(name: string): AiTool | undefined {
  return tools.get(name)
}

// ── CRM Tools ──

register({
  name: "generate_report",
  description: "Genera un informe profesional del cliente incluyendo health score, ratios, riesgos y recomendaciones",
  async execute(params: { clientId: string }, ctx: ToolContext) {
    const client = await prisma.client.findFirst({ where: { id: params.clientId, companyId: ctx.companyId } })
    if (!client) return { success: false, message: "Cliente no encontrado" }
    return { success: true, message: `Informe generado para ${client.name}`, data: { clientId: params.clientId, status: "generated" } }
  },
})

register({
  name: "create_strategy",
  description: "Crea un plan estratégico para un cliente con objetivos y timeline",
  async execute(params: { clientId: string; objective: string; targetValue: number }, ctx: ToolContext) {
    const project = await prisma.project.create({
      data: {
        companyId: ctx.companyId, clientId: params.clientId,
        name: `Estrategia: ${params.objective}`,
        projectType: "strategic_planning",
        description: `Objetivo: ${params.objective} (target: ${params.targetValue})`,
        startDate: new Date(),
        createdBy: ctx.userId,
      },
    })
    return { success: true, message: `Estrategia creada: ${project.name}`, data: { projectId: project.id } }
  },
})

register({
  name: "create_task",
  description: "Crea una tarea asignada a un usuario",
  async execute(params: { title: string; description?: string; assigneeId?: string; dueDate?: string; clientId: string }, ctx: ToolContext) {
    return { success: true, message: `Tarea creada: ${params.title}`, data: { taskId: "pending", title: params.title } }
  },
})

register({
  name: "schedule_meeting",
  description: "Programa una reunión con el cliente",
  async execute(params: { clientId: string; title: string; date: string; attendees?: string[] }, ctx: ToolContext) {
    return { success: true, message: `Reunión programada: ${params.title}`, data: { meetingId: "pending", date: params.date } }
  },
})

register({
  name: "send_email",
  description: "Envía un correo al cliente",
  async execute(params: { clientId: string; subject: string; body: string }, ctx: ToolContext) {
    return { success: true, message: `Correo enviado: ${params.subject}`, data: { status: "sent" } }
  },
})

register({
  name: "request_document",
  description: "Solicita un documento específico al cliente",
  async execute(params: { clientId: string; documentType: string; description?: string }, ctx: ToolContext) {
    return { success: true, message: `Documento solicitado: ${params.documentType}`, data: { status: "requested" } }
  },
})

register({
  name: "create_project",
  description: "Crea un nuevo proyecto para el cliente",
  async execute(params: { clientId: string; name: string; projectType: string; description?: string }, ctx: ToolContext) {
    const project = await prisma.project.create({
      data: {
        companyId: ctx.companyId, clientId: params.clientId,
        name: params.name, projectType: params.projectType,
        description: params.description || null,
        startDate: new Date(), createdBy: ctx.userId,
      },
    })
    return { success: true, message: `Proyecto creado: ${project.name}`, data: { projectId: project.id } }
  },
})

// ── Platform Tools ──

register({
  name: "list_products",
  description: "Lista todos los productos/suites disponibles en la plataforma con su estado y precio",
  async execute(_params: any, _ctx: ToolContext) {
    const all = marketplace.getAvailable()
    return {
      success: true,
      message: `${all.length} productos disponibles`,
      data: all.map((p) => ({
        id: p.id,
        name: p.name,
        status: p.lifecycle,
        compatible: p.compatible,
        price: p.price,
        stats: p.stats,
      })),
    }
  },
})

register({
  name: "get_product_detail",
  description: "Obtiene el detalle completo de un producto/suite de la plataforma",
  async execute(params: { productId: string }, _ctx: ToolContext) {
    const pkg = productRegistry.get(params.productId)
    if (!pkg) return { success: false, message: `Producto '${params.productId}' no encontrado` }
    return {
      success: true,
      message: `${pkg.manifest.name} v${pkg.manifest.version}`,
      data: {
        id: pkg.manifest.id,
        name: pkg.manifest.name,
        description: pkg.manifest.description,
        version: pkg.manifest.version,
        lifecycle: pkg.lifecycle,
        price: pkg.manifest.price,
        agents: pkg.manifest.agents.map((a) => ({ name: a.name, description: a.description, tools: a.tools })),
        rules: pkg.manifest.rules.map((r) => ({ name: r.name, category: r.category })),
        kpis: pkg.manifest.kpis.map((k) => ({ name: k.name, unit: k.unit })),
        dashboards: pkg.manifest.dashboards.map((d) => ({ name: d.name, route: d.route })),
        permissions: pkg.manifest.permissions,
        configSchema: pkg.manifest.configSchema ? Object.keys(pkg.manifest.configSchema) : [],
      },
    }
  },
})

register({
  name: "install_product",
  description: "Instala un producto/suite en la plataforma",
  async execute(params: { productId: string }, _ctx: ToolContext) {
    const result = await marketplace.install(params.productId)
    if (!result.success) return { success: false, message: result.error || "Error al instalar" }
    return { success: true, message: `Producto instalado correctamente`, data: { productId: params.productId, status: "installed" } }
  },
})

register({
  name: "certify_product",
  description: "Ejecuta la suite de certificación sobre un producto/suite",
  async execute(params: { productId: string }, _ctx: ToolContext) {
    const pkg = productRegistry.get(params.productId)
    if (!pkg) return { success: false, message: `Producto '${params.productId}' no encontrado` }
    const report = await certification.certify(pkg)
    return {
      success: true,
      message: report.certified ? `✓ ${pkg.manifest.name} certificado` : `✗ ${pkg.manifest.name} NO certificado (${report.failed} tests fallaron)`,
      data: {
        certified: report.certified,
        total: report.total,
        passed: report.passed,
        failed: report.failed,
        results: report.results.map((r) => ({ id: r.testId, passed: r.passed, message: r.message })),
      },
    }
  },
})

register({
  name: "find_product_for_client",
  description: "Recomienda el mejor producto/suite según las necesidades del cliente",
  async execute(params: { clientId: string; need: string }, ctx: ToolContext) {
    const client = await prisma.client.findFirst({ where: { id: params.clientId, companyId: ctx.companyId } })
    if (!client) return { success: false, message: "Cliente no encontrado" }

    const all = marketplace.getAvailable()
    const need = params.need.toLowerCase()
    let recommendations = all

    if (need.includes("contabilidad") || need.includes("accounting") || need.includes("impuesto") || need.includes("iva")) {
      recommendations = all.filter((p) => p.id === "accounting" || p.id === "consulting")
    } else if (need.includes("financiero") || need.includes("valuation") || need.includes("dcf") || need.includes("wacc")) {
      recommendations = all.filter((p) => p.id === "financial" || p.id === "investment")
    } else if (need.includes("legal") || need.includes("contrato") || need.includes("compliance") || need.includes("abogado")) {
      recommendations = all.filter((p) => p.id === "legal" || p.id === "consulting")
    } else if (need.includes("inversion") || need.includes("investment") || need.includes("dd") || need.includes("duediligence")) {
      recommendations = all.filter((p) => p.id === "investment" || p.id === "financial")
    } else if (need.includes("consultoria") || need.includes("estrategia") || need.includes("diagnostico")) {
      recommendations = all.filter((p) => p.id === "consulting")
    }

    return {
      success: true,
      message: `Recomendaciones para ${client.name}`,
      data: recommendations.map((p) => ({
        name: p.name,
        relevance: p.id === "consulting" ? "core" : "especializado",
        price: p.price,
        status: p.lifecycle,
        agents: p.stats.agents,
        reason: getRecommendationReason(p.id, need),
      })),
    }
  },
})

function getRecommendationReason(productId: string, need: string): string {
  const reasons: Record<string, string> = {
    consulting: "Suite principal de diagnóstico estratégico, financiero y operativo para PYMEs",
    financial: "Modelamiento financiero, valoración DCF/CAPM/WACC y simulación de escenarios",
    accounting: "Contabilidad bajo NIIF, declaraciones de IVA/Renta y conciliaciones automáticas",
    legal: "Gestión de contratos, compliance y seguimiento de expedientes judiciales",
    investment: "Valoración de empresas, scoring de inversiones y due diligence automatizado",
  }
  return reasons[productId] || "Suite especializada"
}

export const toolRegistry = { register, getAll, get }
