import type { PrismaClient } from "@prisma/client"

export interface RuleAnalytics {
  ruleId: string
  ruleName: string
  totalExecutions: number
  triggerCount: number
  triggerRate: number
  avgDuration: number
  lastTriggeredAt: Date | null
  clientDistribution: Array<{ clientId: string; count: number }>
  dailyTrend: Array<{ date: string; count: number }>
}

export class RuleAnalyticsService {
  constructor(private prisma: PrismaClient) {}

  async getRuleAnalytics(ruleId: string, days = 30): Promise<RuleAnalytics> {
    const rule = await this.prisma.consultingRule.findUniqueOrThrow({
      where: { id: ruleId },
    })

    const since = new Date()
    since.setDate(since.getDate() - days)

    const [executions, triggerCount, avgDuration] = await Promise.all([
      this.prisma.consultingRuleExecution.findMany({
        where: { ruleId, evaluatedAt: { gte: since } },
      }),
      this.prisma.consultingRuleExecution.count({
        where: { ruleId, triggered: true, evaluatedAt: { gte: since } },
      }),
      this.prisma.consultingRuleExecution.aggregate({
        where: { ruleId, evaluatedAt: { gte: since } },
        _avg: { duration: true },
      }),
    ])

    const clientMap = new Map<string, number>()
    executions.forEach((e) => {
      clientMap.set(e.clientId, (clientMap.get(e.clientId) ?? 0) + 1)
    })

    const dailyMap = new Map<string, number>()
    executions.forEach((e) => {
      const date = e.evaluatedAt.toISOString().split("T")[0]
      dailyMap.set(date, (dailyMap.get(date) ?? 0) + 1)
    })

    const dailyTrend = Array.from(dailyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const lastTriggered = executions
      .filter((e) => e.triggered)
      .sort((a, b) => b.evaluatedAt.getTime() - a.evaluatedAt.getTime())[0]

    return {
      ruleId,
      ruleName: rule.name,
      totalExecutions: executions.length,
      triggerCount,
      triggerRate:
        executions.length > 0
          ? (triggerCount / executions.length) * 100
          : 0,
      avgDuration: avgDuration._avg.duration ?? 0,
      lastTriggeredAt: lastTriggered?.evaluatedAt ?? null,
      clientDistribution: Array.from(clientMap.entries()).map(
        ([clientId, count]) => ({ clientId, count })
      ),
      dailyTrend,
    }
  }

  async getTopRules(days = 30, limit = 10) {
    const since = new Date()
    since.setDate(since.getDate() - days)

    return this.prisma.consultingRuleExecution.groupBy({
      by: ["ruleId"],
      where: { triggered: true, evaluatedAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { ruleId: "desc" } },
      take: limit,
    })
  }

  async getPerformance(ruleId: string, days = 7) {
    const since = new Date()
    since.setDate(since.getDate() - days)

    return this.prisma.consultingRuleExecution.findMany({
      where: { ruleId, evaluatedAt: { gte: since } },
      select: { evaluatedAt: true, duration: true, triggered: true },
      orderBy: { evaluatedAt: "desc" },
    })
  }

  async getSummary(days = 30) {
    const since = new Date()
    since.setDate(since.getDate() - days)

    const [totalRules, triggeredToday, avgDuration] = await Promise.all([
      this.prisma.consultingRule.count(),
      this.prisma.consultingRuleExecution.count({
        where: { triggered: true, evaluatedAt: { gte: since } },
      }),
      this.prisma.consultingRuleExecution.aggregate({
        where: { evaluatedAt: { gte: since } },
        _avg: { duration: true },
      }),
    ])

    const allExecutions = await this.prisma.consultingRuleExecution.count({
      where: { evaluatedAt: { gte: since } },
    })

    return {
      totalRules,
      triggeredToday,
      avgTriggerRate:
        allExecutions > 0
          ? (triggeredToday / allExecutions) * 100
          : 0,
      avgDuration: avgDuration._avg.duration ?? 0,
    }
  }
}
