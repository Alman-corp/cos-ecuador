import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { RuleAnalyticsService } from "@/core/consulting-dna/analytics"

const analytics = new RuleAnalyticsService(prisma)

export async function GET(req: NextRequest, { params }: { params: { ruleId: string } }) {
  try {
    const days = parseInt(req.nextUrl.searchParams.get("days") ?? "30", 10)
    const result = await analytics.getRuleAnalytics(params.ruleId, days)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
