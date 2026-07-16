import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSessionFromRequest } from "@/lib/auth/token"

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const [totalTraces, feedbackStats, byAgent, byTaskType] = await Promise.all([
    prisma.aiTrace.count({ where: { companyId: session.companyId } }),
    prisma.aiTrace.aggregate({
      where: { companyId: session.companyId, feedbackScore: { not: null } },
      _avg: { feedbackScore: true },
      _count: { feedbackScore: true },
    }),
    prisma.aiTrace.groupBy({
      by: ["agentName"],
      where: { companyId: session.companyId },
      _count: { id: true },
      _avg: { feedbackScore: true },
    }),
    prisma.aiTrace.groupBy({
      by: ["taskType"],
      where: { companyId: session.companyId },
      _count: { id: true },
      _avg: { feedbackScore: true },
    }),
  ] as const)

  return NextResponse.json({
    totalTraces,
    feedbackCount: feedbackStats._count.feedbackScore || 0,
    averageScore: feedbackStats._avg.feedbackScore
      ? Number(feedbackStats._avg.feedbackScore.toFixed(2))
      : null,
    byAgent: byAgent.map((a) => ({
      agent: a.agentName || "unknown",
      count: a._count.id,
      avgScore: a._avg.feedbackScore ? Number(a._avg.feedbackScore.toFixed(2)) : null,
    })),
    byTaskType: byTaskType.map((t) => ({
      taskType: t.taskType,
      count: t._count.id,
      avgScore: t._avg.feedbackScore ? Number(t._avg.feedbackScore.toFixed(2)) : null,
    })),
  })
}
