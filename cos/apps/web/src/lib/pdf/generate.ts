import React from "react"
import { renderToStream } from "@react-pdf/renderer"
import { ReportDocument } from "./report"
import type { ReportData } from "./report"

export async function generateReportStream(data: ReportData): Promise<NodeJS.ReadableStream> {
  const element = React.createElement(ReportDocument, { data })
  return await renderToStream(element as any)
}
