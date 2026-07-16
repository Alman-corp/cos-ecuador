import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { RuleVersionManager } from "@/core/consulting-dna/version-manager"

const manager = new RuleVersionManager(prisma)

export async function GET(_req: NextRequest, { params }: { params: { ruleId: string } }) {
  try {
    const versions = await manager.getHistory(params.ruleId)
    return NextResponse.json(versions)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch versions" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { ruleId: string } }) {
  try {
    const body = await req.json()
    const { targetVersion } = body
    if (!targetVersion) {
      return NextResponse.json({ error: "targetVersion required" }, { status: 400 })
    }
    const rule = await manager.rollback(params.ruleId, targetVersion, "system")
    return NextResponse.json(rule)
  } catch (error) {
    return NextResponse.json({ error: "Failed to rollback" }, { status: 500 })
  }
}
