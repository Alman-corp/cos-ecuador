import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { RuleVersionManager } from "@/core/consulting-dna/version-manager"
import { PrismaRulesRepository } from "@/core/consulting-dna/rules-engine/prisma-repository"
import { ConsultingDNACalculator } from "@/core/consulting-dna/rules-engine/calculator"

const manager = new RuleVersionManager(prisma)

export async function GET() {
  try {
    const rules = await prisma.consultingRule.findMany({
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(rules)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch rules" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, description, category, condition, then, enabled, metadata, changeNotes } = body
    if (!name || !category || !condition || !then) {
      return NextResponse.json({ error: "name, category, condition, and then are required" }, { status: 400 })
    }
    const rule = await manager.create(
      { name, description, category, condition, then, enabled, metadata, changeNotes },
      "system"
    )
    return NextResponse.json(rule, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create rule" }, { status: 500 })
  }
}
