import { prisma } from "@/lib/db/prisma"
import type { IQuery, IQueryHandler } from "@/core/bus"

export interface DashboardDirectorQuery extends IQuery {
  readonly type: "dashboard.director"
  companyId: string
}

export interface DashboardDirectorResult {
  totalClients: number
  activeProjects: number
  monthlyRevenue: number
  clientHealthAvg: number
  topClients: { id: string; name: string; score: number }[]
  recentActivity: { id: string; action: string; entity: string; date: Date }[]
}

export class DashboardDirectorHandler implements IQueryHandler<DashboardDirectorQuery, DashboardDirectorResult> {
  async handle(query: DashboardDirectorQuery): Promise<DashboardDirectorResult> {
    const [totalClients, activeProjects, clients, latestStatements, recentActivity] =
      await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(
          `SELECT set_config('app.tenant_id', $1, true)`,
          query.companyId,
        )
        return Promise.all([
          tx.client.count({ where: { deletedAt: null } }),
          tx.project.count({ where: { status: { not: "completed" } } }),
          tx.client.findMany({
            orderBy: { score: "desc" },
            take: 5,
            select: { id: true, name: true, score: true },
          }),
          tx.financialStatement.findMany({
            orderBy: { periodStart: "desc" },
            take: 12,
            select: { data: true },
          }),
          tx.auditLog.findMany({
            orderBy: { createdAt: "desc" },
            take: 10,
            select: { id: true, action: true, entity: true, createdAt: true },
          }),
        ])
      })

    const totalRevenue = latestStatements.reduce((s, fs) => {
      const d = fs.data as Record<string, number> | null
      return s + (d?.revenue || d?.total_revenue || 0)
    }, 0)

    return {
      totalClients,
      activeProjects,
      monthlyRevenue: totalRevenue / Math.max(latestStatements.length, 1),
      clientHealthAvg: clients.reduce((s, c) => s + (c.score || 0), 0) / (clients.length || 1),
      topClients: clients,
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        action: a.action,
        entity: a.entity,
        date: a.createdAt,
      })),
    }
  }
}

export const dashboardDirectorHandler = new DashboardDirectorHandler()
