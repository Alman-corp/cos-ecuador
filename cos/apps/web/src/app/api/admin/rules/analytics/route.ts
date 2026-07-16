import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { RuleAnalyticsService } from "@/core/consulting-dna/analytics"

const analytics = new RuleAnalyticsService(prisma)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const days = parseInt(searchParams.get("days") ?? "30", 10)
    const ruleId = searchParams.get("ruleId")

    if (ruleId) {
      const result = await analytics.getRuleAnalytics(ruleId, days)
      return NextResponse.json(result)
    }

    const [summary, topRules] = await Promise.all([
      analytics.getSummary(days),
      analytics.getTopRules(days),
    ])

    return NextResponse.json({ ...summary, topRules })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
