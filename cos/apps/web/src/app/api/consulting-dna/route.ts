import { NextRequest, NextResponse } from "next/server"
import { getSessionFromRequest } from "@/lib/auth/token"
import { consultingDna } from "@/core/consulting-dna"

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const section = searchParams.get("section") || "summary"
  const category = searchParams.get("category") as any
  const query = searchParams.get("query")

  switch (section) {
    case "rules":
      return NextResponse.json(consultingDna.getRules(category))
    case "thresholds":
      return NextResponse.json(consultingDna.getThresholds(category))
    case "patterns":
      return NextResponse.json(consultingDna.getPatterns(category))
    case "scales":
      return NextResponse.json(consultingDna.getScales(category))
    case "knowledge":
      if (query) return NextResponse.json(consultingDna.searchKnowledge(query))
      return NextResponse.json(consultingDna.getKnowledge(undefined, category))
    default:
      return NextResponse.json(consultingDna.getDnaSummary())
  }
}
