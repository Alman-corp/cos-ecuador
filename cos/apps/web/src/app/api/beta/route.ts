import { NextResponse } from "next/server"
import { seedAll } from "@/core/beta/seed"
import { learningEngine } from "@/core/learning"
import { genomeEngine } from "@/core/genome"
import { planningEngine } from "@/core/planning"
import { memoryStore } from "@/core/memory"

let seeded = false

export async function GET() {
  const memorySummary = memoryStore.summarize("demo-company")
  const plans = planningEngine.getPlans("demo-company")
  const caseStats = learningEngine.getStats()
  const genome = genomeEngine.getGenome("demo-company")

  return NextResponse.json({
    seeded,
    stats: {
      memoryEntries: memorySummary.total,
      plans: plans.length,
      activePlans: plans.filter((p) => p.status === "active").length,
      businessCases: caseStats.total,
      genomeAnalyzed: !!genome,
    },
    routes: [
      "/director", "/director/planificacion", "/director/ejecucion",
      "/director/biblioteca", "/director/genoma", "/director/productos",
      "/director/platform",
    ],
  })
}

export async function POST() {
  if (seeded) {
    return NextResponse.json({ message: "Already seeded", seeded: true })
  }

  try {
    await seedAll()
    seeded = true
    return NextResponse.json({ message: "Beta data seeded successfully", seeded: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
