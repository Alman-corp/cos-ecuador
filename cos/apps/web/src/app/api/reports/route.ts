import { NextRequest, NextResponse } from "next/server"
import { getSessionFromRequest } from "@/lib/auth/token"
import { generateReportStream } from "@/lib/pdf/generate"
import { generateCSV, generateExcelXML, REPORT_COLUMNS } from "@/lib/excel/generate"
import { predictionEngine } from "@/core/prediction"
import { memoryStore } from "@/core/memory"
import { validateBody } from "@/lib/validate"
import { GenerateReportSchema } from "@/lib/api-schemas"

function getCompanyId(req: NextRequest, session: { companyId: string } | null): string {
  return session?.companyId || req.headers.get("x-company-id") || "demo-company"
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req).catch(() => null)
  const defaultCompany = getCompanyId(req, session)

  try {
    const body = await req.json()
    const { data, errors } = validateBody(GenerateReportSchema, body)
    if (errors) return NextResponse.json({ error: errors }, { status: 400 })
    const { action, format, companyId = defaultCompany, clientId } = data

    if (action === "diagnostic_report" || action === "generate") {
      const prediction = await predictionEngine.predict(companyId, clientId)
      const memory = memoryStore.getRecent(companyId, 50)
      const alerts = memory.filter((m) => m.type === "risk" || m.type === "alert").map((m) => `[${m.importance}] ${m.title}: ${m.description}`)
      const recommendations = prediction.earlyWarnings.map((w) => w.recommendation)
      const objectives = prediction.indicators.map((i) => ({
        title: i.name,
        category: i.trend.direction,
        currentValue: Math.round(i.currentValue),
        targetValue: Math.round(i.projection90d.points[i.projection90d.points.length - 1]?.value || i.currentValue),
      }))

      const reportData = {
        client: {
          name: clientId || companyId,
          industry: "No especificada",
          segment: "PYME",
          status: "activo",
          score: Math.round(prediction.confidence),
        },
        analysis: {
          healthScore: Math.round(prediction.confidence),
          healthStatus: prediction.summary.slice(0, 200),
          ratios: {
            liquidity: { current: prediction.indicators.find((i) => i.name.toLowerCase().includes("current") || i.name.includes("liquidez"))?.currentValue },
            solvency: { debtToEquity: prediction.indicators.find((i) => i.name.toLowerCase().includes("debt") || i.name.includes("endeudamiento"))?.currentValue },
            profitability: {
              netMargin: prediction.indicators.find((i) => i.name.toLowerCase().includes("margin") || i.name.includes("margen"))?.currentValue,
              roe: prediction.indicators.find((i) => i.name === "ROE")?.currentValue,
            },
          },
          alerts: alerts.slice(0, 5),
          recommendations: recommendations.slice(0, 5),
        },
        compliance: undefined,
        strategicPlan: {
          objectives,
          timeline: [
            { phase: "Corto Plazo (0-30 días)", actions: ["Revisar alertas críticas", "Implementar correcciones inmediatas"] },
            { phase: "Mediano Plazo (30-90 días)", actions: ["Ejecutar plan estratégico", "Monitorear KPIs semanalmente"] },
            { phase: "Largo Plazo (90-180 días)", actions: ["Evaluar resultados", "Ajustar proyecciones"] },
          ],
        },
        documents: memory.filter((m) => m.type === "document_change" || m.type === "note").slice(0, 5).map((m) => ({ title: m.title.slice(0, 60), status: "revisado" })),
        generatedAt: new Date().toISOString(),
        generatedBy: "AI Copilot",
      }

      if (format === "csv") {
        const rows = prediction.indicators.map((i) => ({
          indicator: i.name,
          currentValue: i.currentValue,
          trend: i.trend.direction,
          proj30d: i.projection30d.points[i.projection30d.points.length - 1]?.value || 0,
          proj90d: i.projection90d.points[i.projection90d.points.length - 1]?.value || 0,
          confidence: i.trend.rSquared,
          alert: prediction.earlyWarnings.find((w) => w.indicator === i.name)?.severity || "ninguna",
          recommendation: prediction.earlyWarnings.find((w) => w.indicator === i.name)?.recommendation || "",
        }))
        const csv = generateCSV(REPORT_COLUMNS, rows)
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="reporte-${companyId}-${new Date().toISOString().slice(0, 10)}.csv"`,
          },
        })
      }

      if (format === "excel") {
        const rows = prediction.indicators.map((i) => ({
          indicator: i.name,
          currentValue: i.currentValue,
          trend: i.trend.direction,
          proj30d: i.projection30d.points[i.projection30d.points.length - 1]?.value || 0,
          proj90d: i.projection90d.points[i.projection90d.points.length - 1]?.value || 0,
          confidence: i.trend.rSquared,
          alert: prediction.earlyWarnings.find((w) => w.indicator === i.name)?.severity || "ninguna",
          recommendation: prediction.earlyWarnings.find((w) => w.indicator === i.name)?.recommendation || "",
        }))
        const xml = generateExcelXML(REPORT_COLUMNS, rows, "Reporte Indicadores")
        return new NextResponse(xml, {
          headers: {
            "Content-Type": "application/vnd.ms-excel",
            "Content-Disposition": `attachment; filename="reporte-${companyId}-${new Date().toISOString().slice(0, 10)}.xls"`,
          },
        })
      }

      const stream = await generateReportStream(reportData)
      const chunks: Buffer[] = []
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk as Uint8Array))
      }
      const pdfBuffer = Buffer.concat(chunks)

      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="reporte-${companyId}-${new Date().toISOString().slice(0, 10)}.pdf"`,
        },
      })
    }

    return NextResponse.json({ error: "Acción no soportada" }, { status: 400 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error generando reporte"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    formats: ["pdf", "csv", "excel"],
    actions: ["diagnostic_report", "generate"],
    description: "Genera reportes descargables en PDF, CSV o Excel",
  })
}
