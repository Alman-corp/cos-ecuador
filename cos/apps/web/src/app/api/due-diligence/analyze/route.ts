import { NextRequest, NextResponse } from "next/server"
import { startAnalysis } from "@/core/due-diligence/orchestrator"
import { processJob } from "@/core/due-diligence/worker"
import { prisma } from "@/lib/db/prisma"
import { incrementCompaniesAnalyzed, incrementReportsGenerated } from "@/lib/monitoring/metrics"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { companyId, financials, companyName, industry, clientEmail, clientName, consultantEmail, consultantName, consultantFirm } = body

    const job = await startAnalysis(
      companyName || "Empresa",
      industry || "Servicios",
      financials,
      companyId,
    )

    if (job.status === "completed" && job.report) {
      incrementCompaniesAnalyzed()
      incrementReportsGenerated()

      try {
        await prisma.dueDiligenceJob.create({
          data: {
            id: job.id,
            companyId: companyId || "00000000-0000-0000-0000-000000000000",
            targetCompanyName: job.companyName,
            industry: job.industry,
            status: job.status,
            creditsConsumed: 1,
            clientEmail: clientEmail || null,
            clientName: clientName || null,
            startedAt: new Date(job.startedAt),
            completedAt: job.completedAt ? new Date(job.completedAt) : null,
            reportUrl: null,
            reportData: JSON.parse(JSON.stringify(job.report)),
          },
        })
      } catch (e) {
        console.error("Failed to persist job:", e)
      }

      if (clientEmail && consultantEmail) {
        processJob({
          companyName: job.companyName,
          industry: job.industry,
          financials,
          companyId,
          clientEmail,
          clientName,
          consultantEmail,
          consultantName,
          consultantFirm,
        }).catch((e) => console.error("Background email/portal job failed:", e))
      }

      return NextResponse.json({
        report: job.report,
        jobId: job.id,
        rawData: { years: job.report.years, data: job.report.ratios },
      })
    }

    return NextResponse.json({
      error: job.error || "El an\u00e1lisis no pudo completarse",
      status: job.status,
    }, { status: 500 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error al procesar an\u00e1lisis" }, { status: 500 })
  }
}
