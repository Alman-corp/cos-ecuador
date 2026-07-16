import { NextResponse } from "next/server"
import { genomeEngine } from "@/core/genome"
import { validateBody } from "@/lib/validate"
import { GenomePostSchema } from "@/lib/api-schemas"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get("companyId")
  const compareId = searchParams.get("compare")
  const summary = searchParams.get("summary")

  if (!companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 })

  if (compareId) {
    const comparison = genomeEngine.compare(companyId, compareId)
    if (!comparison) return NextResponse.json({ error: "One or both genomes not found" }, { status: 404 })
    return NextResponse.json(comparison)
  }

  if (summary === "true") {
    const s = genomeEngine.getSummary(companyId)
    if (!s) return NextResponse.json({ error: "Genome not found" }, { status: 404 })
    return NextResponse.json(s)
  }

  const genome = genomeEngine.getGenome(companyId)
  if (!genome) return NextResponse.json({ error: "Genome not found. Run analysis first." }, { status: 404 })
  return NextResponse.json(genome)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { data, errors } = validateBody(GenomePostSchema, body)
    if (errors) return NextResponse.json({ error: errors }, { status: 400 })

    switch (data.action) {
      case "analyze": {
        const genome = await genomeEngine.analyze(data.companyId, data.companyName, data.industry, data.size)
        return NextResponse.json(genome, { status: 201 })
      }
      case "compare": {
        const comparison = genomeEngine.compare(data.companyId, data.otherCompanyId)
        if (!comparison) return NextResponse.json({ error: "One or both genomes not found" }, { status: 404 })
        return NextResponse.json(comparison)
      }
    }
  } catch (err) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
