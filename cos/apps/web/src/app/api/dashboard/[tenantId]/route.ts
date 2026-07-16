import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params

  const [
    totalClients, activeProjects, totalLeads, totalUsers,
    clients, leadsCountByStatus, latestStatements,
    recentActivity, taxDeclarationsCount, legalContractsCount,
    deliverablesCount, competitorsCount,
  ] = await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `SELECT set_config('app.tenant_id', $1, true)`,
      tenantId,
    )

    return Promise.all([
      tx.client.count({ where: { deletedAt: null } }),
      tx.project.count({ where: {} }),
      tx.lead.count({ where: {} }),
      tx.user.count({ where: { isActive: true } }),
      tx.client.findMany({
        where: { deletedAt: null },
        orderBy: { score: "desc" },
        take: 5,
        select: { id: true, name: true, score: true },
      }),
      tx.lead.groupBy({ by: ["status"], _count: { id: true } }),
      tx.financialStatement.findMany({
        orderBy: { periodStart: "desc" },
        take: 12,
        select: { periodStart: true, data: true, clientId: true },
      }),
      tx.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, action: true, entity: true, entityId: true, createdAt: true },
      }),
      tx.taxDeclaration.count({ where: {} }),
      tx.legalContract.count({ where: {} }),
      tx.deliverable.count({ where: {} }),
      tx.competitor.count({ where: {} }),
    ])
  })

  const healthAvg = clients.length > 0
    ? Math.round(clients.reduce((s, c) => s + (c.score || 0), 0) / clients.length)
    : 0

  const totalRevenue = latestStatements.reduce((s, fs) => {
    const d = fs.data as Record<string, number> | null
    return s + (d?.revenue || d?.total_revenue || 0)
  }, 0)

  const activeClients = clients.filter((c) => (c.score || 0) >= 50).length

  return NextResponse.json({
    totalClients,
    activeClients,
    atRiskClients: clients.filter((c) => (c.score || 0) < 50).length,
    totalLeads,
    leadsByStatus: leadsCountByStatus.map((l) => ({ status: l.status, count: l._count.id })),
    totalUsers,
    activeProjects,
    monthlyRevenue: totalRevenue / Math.max(latestStatements.length, 1),
    healthAvg,
    topClients: clients,
    recentActivity: recentActivity.map((a) => ({
      id: a.id,
      action: a.action,
      entity: a.entity,
      entityId: a.entityId,
      date: a.createdAt,
    })),
    extendedMetrics: {
      taxDeclarations: taxDeclarationsCount,
      legalContracts: legalContractsCount,
      deliverables: deliverablesCount,
      competitors: competitorsCount,
    },
    _tenant: tenantId,
    _cachedAt: new Date().toISOString(),
  })
}
