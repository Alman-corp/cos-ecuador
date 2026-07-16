import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { ConsultingDNACalculator } from "@/core/consulting-dna/rules-engine/calculator"
import { PrismaRulesRepository } from "@/core/consulting-dna/rules-engine/prisma-repository"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { ruleId, scenarios } = body

    if (!ruleId || !Array.isArray(scenarios)) {
      return NextResponse.json({ error: "ruleId and scenarios array required" }, { status: 400 })
    }

    const repository = new PrismaRulesRepository(prisma)
    const calculator = new ConsultingDNACalculator(repository)
    await calculator.initialize()

    const results: Record<string, unknown> = {}

    for (const scenario of scenarios) {
      const startTime = Date.now()
      const result = await calculator.evaluateClient(scenario.facts)
      const duration = Date.now() - startTime

      await prisma.consultingRuleExecution.create({
        data: {
          ruleId,
          clientId: scenario.facts.clientId,
          triggered: result.risks.length > 0 || result.opportunities.length > 0,
          result: result as Record<string, unknown>,
          duration,
          contextHash: Buffer.from(JSON.stringify(scenario.facts))
            .toString("base64")
            .slice(0, 32),
        },
      })

      results[scenario.id] = result
    }

    return NextResponse.json({ results })
  } catch (error) {
    return NextResponse.json({ error: "Simulation failed" }, { status: 500 })
  }
}
