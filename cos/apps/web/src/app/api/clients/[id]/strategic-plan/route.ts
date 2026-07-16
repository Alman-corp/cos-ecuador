import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { withTenant } from "@/lib/db/with-tenant"
import { logger } from "@/lib/logger"
import { getSessionFromRequest } from "@/lib/auth/token"
import { executeStrategicPlan } from "@/core/services/StrategicPlanExecutor"
import { strategicPlanningService, type StrategicObjective } from "@/core/services/StrategicPlanningService"
import { validateBody } from "@/lib/validate"
import { CreateStrategicPlanSchema } from "@/lib/api-schemas"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { id: clientId } = await params
    const client = await withTenant(session.companyId, (tx) =>
      tx.client.findFirst({ where: { id: clientId } })
    )
    if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })

    const body = await req.json()
    const { data: v, errors } = validateBody(CreateStrategicPlanSchema, body)
    if (errors) return NextResponse.json({ error: errors }, { status: 400 })
    const objectives: any[] = v.objectives || []

    if (objectives.length === 0) {
      // Auto-generate objectives from latest analysis
      const [latestAnalysis, latestFS] = await withTenant(session.companyId, (tx) =>
        Promise.all([
          tx.auditLog.findFirst({
            where: { entityId: clientId, action: "FINANCIAL_ANALYSIS" },
            orderBy: { createdAt: "desc" },
          }),
          tx.financialStatement.findFirst({
            where: { clientId },
            orderBy: { periodStart: "desc" },
          }),
        ])
      )

      const data = latestFS?.data as Record<string, number> | null
      if (data) {
        const deRatio = data.total_liabilities && data.equity ? data.total_liabilities / data.equity : 0
        const currentRatio = data.current_assets && data.current_liabilities ? data.current_assets / data.current_liabilities : 0

        if (currentRatio < 1.5) {
          objectives.push({
            id: "liq-1", title: "Mejorar liquidez corriente",
            category: "risk", currentValue: Math.round(currentRatio * 100), targetValue: 150, deadline: new Date(Date.now() + 180 * 86400000),
          })
        }
        if (deRatio > 2) {
          objectives.push({
            id: "debt-1", title: "Reducir nivel de endeudamiento",
            category: "risk", currentValue: Math.round(deRatio * 100), targetValue: 100, deadline: new Date(Date.now() + 365 * 86400000),
          })
        }
        objectives.push({
          id: "growth-1", title: "Incrementar ingresos operativos",
          category: "growth", currentValue: 100, targetValue: 130, deadline: new Date(Date.now() + 365 * 86400000),
        })
      }

      if (objectives.length === 0) {
        objectives.push({
          id: "gen-1", title: "Diagnóstico inicial completo",
          category: "efficiency", currentValue: 0, targetValue: 100, deadline: new Date(Date.now() + 90 * 86400000),
        })
      }
    }

    // Generate strategic plan and execute it
    const plan = strategicPlanningService.analyzePlan(objectives)
    const result = await executeStrategicPlan(
      session.companyId, clientId, session.userId, objectives,
    )

    // Record telemetry and audit
    await withTenant(session.companyId, (tx) =>
      tx.auditLog.create({
        data: {
          userId: session.userId,
          action: "STRATEGIC_PLAN_CREATED", entity: "client", entityId: clientId,
          newValues: { objectives: objectives.length, tasks: result.totalTasks },
          source: "api",
        },
      })
    )

    return NextResponse.json({
      ...result,
      strategicPlan: plan,
    })
  } catch (error) {
    logger.error({ err: error }, "strategic plan error")
    return NextResponse.json({ error: "Error creando plan estratégico" }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { id: clientId } = await params
    const [objectives, projects] = await withTenant(session.companyId, (tx) =>
      Promise.all([
        tx.clientObjective.findMany({
          where: { clientId },
          include: { keyResults: true },
          orderBy: { createdAt: "desc" },
        }),
        tx.project.findMany({
          where: { clientId, projectType: "strategic_planning" },
          include: { tasks: true },
          orderBy: { createdAt: "desc" },
        }),
      ])
    )

    return NextResponse.json({
      objectives, projects,
      summary: {
        totalObjectives: objectives.length,
        completedObjectives: objectives.filter((o) => o.status === "completed").length,
        totalTasks: projects.reduce((s, p) => s + p.tasks.length, 0),
        completedTasks: projects.reduce((s, p) => s + p.tasks.filter((t) => t.status === "done" || t.status === "completed").length, 0),
      },
    })
  } catch (error) {
    logger.error({ err: error }, "strategic plan GET error")
    return NextResponse.json({ error: "Error obteniendo plan estratégico" }, { status: 500 })
  }
}
