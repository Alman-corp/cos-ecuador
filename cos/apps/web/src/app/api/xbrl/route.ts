import { NextRequest, NextResponse } from "next/server"
import { getSessionFromRequest } from "@/lib/auth/token"
import { parseXBRLInstance, getFinancialRatiosFromXBRL } from "@/core/xbrl"
import { memoryStore } from "@/core/memory"

function getCompanyId(req: NextRequest, session: { companyId: string } | null): string {
  return session?.companyId || req.headers.get("x-company-id") || "demo-company"
}
function getUserId(_req: NextRequest, session: { userId: string } | null): string {
  return session?.userId || "demo"
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req).catch(() => null)

  try {
    const formData = await req.formData()
    const file = formData.get("file")
    const companyId = (formData.get("companyId") as string) || getCompanyId(req, session)

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Archivo XBRL requerido" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const xml = buffer.toString("utf-8")
    const result = parseXBRLInstance(xml, companyId)

    if (result.statements.length > 0) {
      const statement = result.statements[0]
      const userId = getUserId(req, session)

      memoryStore.store({
        companyId,
        type: "note",
        title: `Carga XBRL: ${statement.type}`,
        description: `Estado financiero ${statement.type} cargado para período ${statement.periodStart} a ${statement.periodEnd}. ${result.statements[0].concepts.length} conceptos extraídos.`,
        tags: ["xbrl", "financial", statement.type],
        entities: [],
        metadata: { periodStart: statement.periodStart, periodEnd: statement.periodEnd, conceptCount: statement.concepts.length, unrecognized: result.unrecognizedConcepts.length },
        userId,
        importance: "medium",
      })

      if (result.unrecognizedConcepts.length === 0) {
        const ratios = getFinancialRatiosFromXBRL(statement, "Manufactura")
        memoryStore.store({
          companyId,
          type: "kpi_change",
          title: "Ratios desde XBRL",
          description: `Ratios calculados de estados financieros XBRL: liquidez=${ratios.currentRatio}, deuda/capital=${ratios.debtToEquity}, margen=${ratios.netMargin}%`,
          tags: ["xbrl", "ratios", "financial"],
          entities: [],
          metadata: { ratios },
          userId,
          importance: "high",
        })
      }
    }

    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : "Error procesando XBRL" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    supportedConcepts: Object.entries(
      { CA: "Activo Corriente", NCA: "Activo No Corriente", TA: "Total Activos", CL: "Pasivo Corriente", NCL: "Pasivo No Corriente", TL: "Total Pasivos", EQ: "Patrimonio", REV: "Ingresos", COS: "Costo Ventas", GP: "Utilidad Bruta", NI: "Utilidad Neta", CASH: "Efectivo", AR: "Cuentas por Cobrar", INV: "Inventarios", PPE: "Propiedad Planta y Equipo", AP: "Cuentas por Pagar" },
    ).map(([id, label]) => ({ ifrsConceptId: id, label })),
    supportedTypes: ["balance_sheet", "income_statement", "cash_flow", "equity"],
    version: "1.0",
  })
}
