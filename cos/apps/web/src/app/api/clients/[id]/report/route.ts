import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { withTenant } from "@/lib/db/with-tenant"
import { logger } from "@/lib/logger"
import { getSessionFromRequest } from "@/lib/auth/token"
import { generateReportStream } from "@/lib/pdf/generate"
import { strategicPlanningService } from "@/core/services/StrategicPlanningService"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { id: clientId } = await params
    const { client, latestFS, latestAudit, complianceAudit } = await withTenant(session.companyId, async (tx) => {
      const c = await tx.client.findFirst({
        where: { id: clientId },
        include: { documents: { take: 20, orderBy: { createdAt: "desc" } } },
      })
      const [fs, audit, compliance] = await Promise.all([
        tx.financialStatement.findFirst({
          where: { clientId },
          orderBy: { periodStart: "desc" },
        }),
        tx.auditLog.findFirst({
          where: { entityId: clientId, action: "FINANCIAL_ANALYSIS" },
          orderBy: { createdAt: "desc" },
        }),
        tx.auditLog.findFirst({
          where: { entityId: clientId, action: "COMPLIANCE_REPORT" },
          orderBy: { createdAt: "desc" },
        }),
      ])
      return { client: c, latestFS: fs, latestAudit: audit, complianceAudit: compliance }
    })
    if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })

    const data = latestFS?.data as Record<string, number> | null || {}
    const analysisData = (latestAudit?.newValues as Record<string, any>) || {}
    const complianceData = (complianceAudit?.newValues as Record<string, any>) || {}

    // Build ratios
    const ratios: any = {
      liquidity: { current: data.current_assets && data.current_liabilities ? data.current_assets / data.current_liabilities : undefined },
      solvency: { debtToEquity: data.total_liabilities && data.equity ? data.total_liabilities / data.equity : undefined },
      profitability: {
        netMargin: data.revenue ? (data.net_income || 0) / data.revenue : undefined,
        roe: data.equity ? (data.net_income || 0) / data.equity : undefined,
      },
    }

    // Build strategic plan objectives
    const objectives = analysisData.objectives || [
      { title: "Mejorar salud financiera", category: "risk", currentValue: client.score, targetValue: 80 },
      { title: "Incrementar eficiencia operativa", category: "efficiency", currentValue: 50, targetValue: 85 },
    ]
    const plan = strategicPlanningService.analyzePlan(objectives)
    const timeline = plan.timeline.map((t) => ({
      phase: t.phase,
      actions: t.objectives || [],
    }))

    const reportData = {
      client: {
        name: client.name,
        industry: client.industry || undefined,
        segment: client.segment || undefined,
        status: client.status,
        score: client.score,
      },
      analysis: {
        healthScore: analysisData.healthScore || client.score,
        healthStatus: analysisData.healthStatus || (client.score >= 70 ? "Saludable" : client.score >= 40 ? "Requiere Atención" : "En Riesgo"),
        ratios,
        alerts: (analysisData.alerts as string[]) || [],
        recommendations: (analysisData.recommendations as string[]) || [],
      },
      compliance: complianceData.status ? {
        score: complianceData.score || 0,
        status: complianceData.status || "unknown",
        checks: (complianceData.checks || complianceData.gaps || []).map((g: any) => ({
          name: typeof g === "string" ? g : (g.name || g.requirement || "Unknown"),
          passed: typeof g === "string" ? false : (g.passed ?? false),
        })),
      } : undefined,
      strategicPlan: {
        objectives: plan.objectives || objectives,
        timeline: timeline.length > 0 ? timeline : [{ phase: "Corto Plazo (0-3 meses)", actions: ["Diagnóstico detallado", "Plan de acción inmediato"] }],
      },
      documents: client.documents.map((d) => ({ title: d.title, status: d.status })),
      generatedAt: new Date().toISOString(),
      generatedBy: session.userId,
    }

    // Record telemetry
    await withTenant(session.companyId, (tx) =>
      tx.auditLog.create({
        data: {
          userId: session.userId,
          action: "REPORT_GENERATED", entity: "client", entityId: clientId,
          newValues: { reportType: "professional_pdf", clientScore: client.score },
          source: "api",
        },
      })
    )

    const stream = await generateReportStream(reportData)
    const chunks: Buffer[] = []
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }
    const pdfBuffer = Buffer.concat(chunks)

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="informe-${client.name.replace(/\s+/g, "-").toLowerCase()}.pdf"`,
      },
    })
  } catch (error) {
    logger.error({ err: error }, "report generation error")
    return NextResponse.json({ error: "Error generando informe PDF" }, { status: 500 })
  }
}
