import { NextRequest, NextResponse } from "next/server"
import { processJob } from "@/core/due-diligence/worker"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { companyName, industry, financials, companyId, clientEmail, clientName, consultantEmail, consultantName, consultantFirm } = body

    if (!companyName) {
      return NextResponse.json({ error: "companyName es requerido" }, { status: 400 })
    }

    const result = await processJob({
      companyName,
      industry: industry || "Servicios",
      financials,
      companyId,
      clientEmail,
      clientName,
      consultantEmail,
      consultantName,
      consultantFirm,
    })

    return NextResponse.json({ job: { id: result.jobId, success: result.success, error: result.error } })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error al iniciar an\u00e1lisis" }, { status: 500 })
  }
}
