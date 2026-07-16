import { NextRequest, NextResponse } from "next/server"
import { getSessionFromRequest } from "@/lib/auth/token"
import { scrapingService } from "@/core/scraping"
import { validateBody } from "@/lib/validate"
import { ScrapingPostSchema } from "@/lib/api-schemas"

export async function GET(req: NextRequest) {
  await getSessionFromRequest(req).catch(() => null)
  const { searchParams } = new URL(req.url)
  const source = searchParams.get("source") || "benchmarks"
  const industry = searchParams.get("industry")
  const topic = searchParams.get("topic") || "tax_rates"

  try {
    if (source === "sri") {
      const result = await scrapingService.scrapeSRI(topic)
      return NextResponse.json(result)
    }
    if (source === "supercias") {
      const result = await scrapingService.scrapeSupercias(industry || undefined)
      return NextResponse.json(result)
    }
    if (source === "benchmarks") {
      const result = await scrapingService.getIndustryBenchmarks(industry || "Manufactura")
      return NextResponse.json(result)
    }

    return NextResponse.json({ success: false, error: `Fuente no soportada: ${source}` }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : "Error en scraping" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  await getSessionFromRequest(req).catch(() => null)

  try {
    const body = await req.json()
    const { data, errors } = validateBody(ScrapingPostSchema, body)
    if (errors) return NextResponse.json({ error: errors }, { status: 400 })

    const d = data as any
    if (d.action === "clear_cache") {
      scrapingService.clearCache()
      return NextResponse.json({ success: true, message: "Caché limpiado" })
    }

    if (d.action === "refresh") {
      scrapingService.clearCache()
      if (d.source === "sri") {
        const result = await scrapingService.scrapeSRI(d.topic || "tax_rates")
        return NextResponse.json(result)
      }
      if (d.source === "supercias") {
        const result = await scrapingService.scrapeSupercias(d.industry)
        return NextResponse.json(result)
      }
      const result = await scrapingService.getIndustryBenchmarks(d.industry)
      return NextResponse.json(result)
    }
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error en scraping" }, { status: 500 })
  }
}
