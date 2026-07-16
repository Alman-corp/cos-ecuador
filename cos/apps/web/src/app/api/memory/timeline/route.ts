import { NextRequest, NextResponse } from "next/server"
import { memoryStore, memoryGraph } from "@/core/memory"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get("companyId") || "default"
  const clientId = searchParams.get("clientId") || undefined
  const days = parseInt(searchParams.get("days") || "30", 10)

  const timeline = memoryStore.getTimeline(companyId, clientId, days)
  const graph = memoryGraph.build(companyId, clientId)
  const summary = memoryStore.summarize(companyId, clientId)

  return NextResponse.json({ timeline, graph, summary })
}
