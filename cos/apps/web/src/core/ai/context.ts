import { prisma } from "@/lib/db/prisma"
import { consultingDna } from "@/core/consulting-dna"
import { marketplace } from "@/core/platform"
import { memoryGraph } from "@/core/memory"

export interface ClientContext {
  client: any
  contacts: any[]
  documents: any[]
  financialStatements: any[]
  projects: any[]
  recentActivity: any[]
  dnaRules?: string
  dnaThresholds?: string
  platformInfo?: string
  availableProducts?: string
  memoryContext?: string
}

export async function assembleClientContext(companyId: string, clientId: string): Promise<ClientContext> {
  const [client, contacts, documents, financialStatements, projects] = await Promise.all([
    prisma.client.findFirst({ where: { id: clientId, companyId } }),
    prisma.clientContact.findMany({ where: { clientId } }),
    prisma.document.findMany({ where: { clientId, companyId }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.financialStatement.findMany({ where: { clientId, companyId }, orderBy: { periodStart: "desc" }, take: 12 }),
    prisma.project.findMany({ where: { clientId, companyId }, orderBy: { createdAt: "desc" }, take: 10 }),
  ])

  const recentActivity = await prisma.auditLog.findMany({
    where: { companyId, entityId: clientId },
    orderBy: { createdAt: "desc" }, take: 10,
  })

  const industry = client?.industry?.toLowerCase() || ""
  const relevantCategories = getCategoriesForIndustry(industry)
  const rules = consultingDna.getRules().filter((r) => relevantCategories.includes(r.category)).slice(0, 8)
  const thresholds = consultingDna.getThresholds().filter((t) => relevantCategories.includes(t.category)).slice(0, 6)

  // Platform info
  const products = marketplace.getAvailable()
  const installed = products.filter((p) => p.lifecycle !== "discovered")
  const available = products.filter((p) => p.lifecycle === "discovered")

  // Load business memory for this client
  const memoryContext = memoryGraph.getContext(companyId, clientId)

  return {
    client, contacts, documents, financialStatements, projects, recentActivity,
    dnaRules: rules.map((r) => `- ${r.name}: ${r.condition} → ${r.action}`).join("\n"),
    dnaThresholds: thresholds.map((t) => `- ${t.name}: ${t.indicator} (bajo: ${t.low}, medio: ${t.medium}, alto: ${t.high}, crítico: ${t.critical})`).join("\n"),
    platformInfo: `BI OS Core v1.0 · ${installed.length} productos activos · ${available.length} disponibles`,
    availableProducts: products.map((p) => `- ${p.name} (${p.status === "active" ? "activo" : "disponible"}, ${p.lifecycle}, ${p.stats.agents} agentes, $${p.price}/mes)`).join("\n"),
    memoryContext,
  }
}

function getCategoriesForIndustry(industry: string): string[] {
  const base = ["liquidity", "solvency", "profitability", "efficiency", "compliance"] as const
  const map: Record<string, string[]> = {
    tecnologia: [...base, "digital"],
    software: [...base, "digital"],
    servicios: [...base, "digital"],
    comercio: [...base, "market"],
    retail: [...base, "market"],
    construccion: [...base, "operational"],
    manufactura: [...base, "operational", "market"],
    agricultura: [...base, "operational"],
    financiero: [...base, "legal"],
    salud: [...base, "legal", "compliance"],
  }
  return map[industry] || [...base, "strategic"]
}

export function buildSystemPrompt(context: ClientContext): string {
  const c = context.client
  if (!c) return "No hay datos del cliente disponibles."

  const docSummary = context.documents.map((d) => `- ${d.title} (${d.documentType}, ${d.status})`).join("\n")
  const fsSummary = context.financialStatements.map((fs) => {
    const data = fs.data as Record<string, number>
    return `- Periodo ${fs.periodStart?.toISOString?.()?.slice(0, 10) || "N/A"}: ingresos=${data?.revenue || "N/A"}, activos=${data?.total_assets || "N/A"}`
  }).join("\n")

  return `Eres el AI Copilot del Business Intelligence OS, una plataforma de inteligencia empresarial con un núcleo extensible y productos (suites) de dominio especializado.

## Contexto de la Plataforma
${context.platformInfo || "BI OS Core v1.0"}

## Productos Disponibles
${context.availableProducts || "Consulting Intelligence Suite (activo)"}

## Contexto del Cliente

**Empresa:** ${c.name}
**Industria:** ${c.industry || "N/A"}
**Health Score:** ${c.score}/100
**Estado:** ${c.status}
**Segmento:** ${c.segment || "N/A"}

## Documentos (${context.documents.length})
${docSummary || "Sin documentos"}

## Estados Financieros (${context.financialStatements.length})
${fsSummary || "Sin estados financieros"}

## Proyectos (${context.projects.length})
${context.projects.map((p) => `- ${p.name} (${p.status})`).join("\n") || "Sin proyectos"}

## ADN de Consultoría — Reglas Aplicables
${context.dnaRules || "No hay reglas específicas para esta industria."}

## ADN de Consultoría — Umbrales de Riesgo
${context.dnaThresholds || "No hay umbrales específicos para esta industria."}

## Memoria Empresarial
${context.memoryContext || "Sin historial previo."}

## Instrucciones

1. Eres un experto en inteligencia empresarial, consultoría, finanzas y productos de software.
2. Analiza la situación del cliente basándote en los datos disponibles y las reglas del ADN de Consultoría.
3. También puedes recomendar productos de la plataforma que resuelvan necesidades específicas del cliente.
4. Proporciona respuestas claras, accionables y en español.
5. Si el usuario solicita una acción, sugiere la herramienta adecuada.
6. Las herramientas disponibles son: generate_report, create_strategy, create_task, schedule_meeting, send_email, request_document, create_project, list_products, get_product_detail, certify_product.
7. Responde en formato markdown.
8. Sé conciso pero completo.
9. Puedes referenciar las reglas del ADN de Consultoría para justificar tus recomendaciones.
10. Puedes recomendar productos específicos de la plataforma (Consulting, Financial, Accounting, Legal, Investment) basándote en las necesidades del cliente.`
}
