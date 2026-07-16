import { NextRequest, NextResponse } from "next/server"
import React from "react"
import { renderToStream } from "@react-pdf/renderer"
import { DueDiligencePDF } from "@/lib/pdf/due-diligence-report"
import { getJob } from "@/core/due-diligence/orchestrator"

export async function GET(_req: NextRequest, { params }: { params: { jobId: string } }) {
  try {
    const job = await getJob(params.jobId)
    if (!job) return NextResponse.json({ error: "Job no encontrado" }, { status: 404 })
    if (job.status !== "completed" || !job.report) {
      return NextResponse.json({ error: "Reporte no disponible", status: job.status }, { status: 400 })
    }

    const element = React.createElement(DueDiligencePDF, { report: job.report })
    const stream = await renderToStream(element as any)

    const chunks: Buffer[] = []
    for await (const chunk of stream as any) {
      chunks.push(Buffer.from(chunk))
    }
    const pdfBuffer = Buffer.concat(chunks)

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="DD-${job.companyName.toLowerCase().replace(/\s+/g, "-")}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error generando PDF" }, { status: 500 })
  }
}
