import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { RuleVersionManager } from "@/core/consulting-dna/version-manager"

const manager = new RuleVersionManager(prisma)

export async function GET(_req: NextRequest, { params }: { params: Promise<{ ruleId: string }> }) {
  try {
    const { ruleId } = await params
    const rule = await prisma.consultingRule.findUnique({
      where: { id: ruleId },
    })
    if (!rule) return NextResponse.json({ error: "Rule not found" }, { status: 404 })
    return NextResponse.json(rule)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch rule" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ ruleId: string }> }) {
  try {
    const { ruleId } = await params
    const body = await req.json()
    const rule = await manager.update(ruleId, body, "system")
    return NextResponse.json(rule)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update rule" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ ruleId: string }> }) {
  try {
    const { ruleId } = await params
    await prisma.consultingRule.delete({ where: { id: ruleId } })
    return NextResponse.json({ deleted: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete rule" }, { status: 500 })
  }
}
