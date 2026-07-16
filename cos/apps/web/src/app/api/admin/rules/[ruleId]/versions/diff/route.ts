import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { RuleVersionManager } from "@/core/consulting-dna/version-manager"

const manager = new RuleVersionManager(prisma)

export async function GET(req: NextRequest, { params }: { params: { ruleId: string } }) {
  try {
    const v1 = parseInt(req.nextUrl.searchParams.get("v1") ?? "0", 10)
    const v2 = parseInt(req.nextUrl.searchParams.get("v2") ?? "0", 10)
    if (!v1 || !v2) {
      return NextResponse.json({ error: "v1 and v2 query params required" }, { status: 400 })
    }
    const diff = await manager.diff(params.ruleId, v1, v2)
    return NextResponse.json(diff)
  } catch (error) {
    return NextResponse.json({ error: "Failed to compute diff" }, { status: 500 })
  }
}
