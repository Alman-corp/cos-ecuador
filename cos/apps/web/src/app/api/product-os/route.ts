import { NextRequest, NextResponse } from "next/server"
import { getSessionFromRequest } from "@/lib/auth/token"
import { productOS } from "@/core/product-os"
import { getVerticalDNA, getAllVerticalDNASummary } from "@/core/vertical-dnas"

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const section = searchParams.get("section") || "summary"

  switch (section) {
    case "full":
      return NextResponse.json(productOS.getFullOS())
    case "pricing":
      return NextResponse.json(productOS.getFullOS().pricing)
    case "metrics":
      return NextResponse.json(productOS.getFullOS().metrics)
    case "roadmap":
      return NextResponse.json(productOS.getFullOS().roadmap)
    case "risks":
      return NextResponse.json(productOS.getFullOS().risks)
    case "competitive":
      return NextResponse.json(productOS.getFullOS().competitiveMatrix)
    case "investment":
      return NextResponse.json(productOS.getFullOS().investment)
    case "ai-strategy":
      return NextResponse.json(productOS.getFullOS().aiStrategy)
    case "icps":
      return NextResponse.json(productOS.getFullOS().icps)
    case "beta":
      return NextResponse.json(productOS.getFullOS().betaProgram)
    case "architecture":
      return NextResponse.json({ kernel: productOS.getFullOS().biOSArchitecture.kernel, verticalPacks: productOS.getFullOS().verticalPacks })
    case "vertical-dna": {
      const packId = searchParams.get("packId")
      if (packId) return NextResponse.json(getVerticalDNA(packId))
      return NextResponse.json(getAllVerticalDNASummary())
    }
    default:
      return NextResponse.json(productOS.getSummary())
  }
}
