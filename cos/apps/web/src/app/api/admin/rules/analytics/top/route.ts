import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { RuleAnalyticsService } from "@/core/consulting-dna/analytics"

const analytics = new RuleAnalyticsService(prisma)

export async function GET(req: NextRequest) {
  try {
    const days = parseInt(req.nextUrl.searchParams.get("days") ?? "30", 10)
    const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "10", 10)
    const topRules = await analytics.getTopRules(days, limit)

    // Enrich with rule names
    const enriched = await Promise.all(
      topRules.map(async (r) => {
        const rule = await prisma.consultingRule.findUnique({
          where: { id: r.ruleId },
          select: { name: true },
        })
        return {
          ruleId: r.ruleId,
          ruleName: rule?.name ?? "Unknown",
          triggerCount: r._count._all,
        }
      })
    )

    return NextResponse.json(enriched)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch top rules" }, { status: 500 })
  }
}
