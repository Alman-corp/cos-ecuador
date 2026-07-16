import { prisma } from "./db/prisma"
import { type Prisma } from "@prisma/client"

export type TelemetryMilestone =
  | "company_registered"
  | "first_client_created"
  | "first_analysis_completed"
  | "first_document_uploaded"
  | "first_report_generated"
  | "first_payment_completed"

export interface TimeToValue {
  registration: string
  firstClient: string | null
  firstAnalysis: string | null
  firstReport: string | null
  firstPayment: string | null
  daysToFirstClient: number | null
  daysToFirstAnalysis: number | null
  daysToFirstReport: number | null
  daysToFirstPayment: number | null
}

export async function getTimeToValue(companyId: string): Promise<TimeToValue> {
  const [company, firstClient, firstAnalysis, firstReport, firstPayment] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId } }),
    prisma.client.findFirst({ where: { companyId }, orderBy: { createdAt: "asc" } }),
    prisma.auditLog.findFirst({
      where: { companyId, action: "FINANCIAL_ANALYSIS" },
      orderBy: { createdAt: "asc" },
    }),
    prisma.auditLog.findFirst({
      where: { companyId, action: "REPORT_GENERATED" },
      orderBy: { createdAt: "asc" },
    }),
    prisma.auditLog.findFirst({
      where: { companyId, action: "PAYMENT_COMPLETED" },
      orderBy: { createdAt: "asc" },
    }),
  ])

  const regDate = company?.createdAt || new Date()
  const reg = regDate.toISOString()

  function daysDiff(eventDate: Date | undefined | null): number | null {
    if (!eventDate) return null
    return Math.round((eventDate.getTime() - regDate.getTime()) / (1000 * 60 * 60 * 24))
  }

  return {
    registration: reg,
    firstClient: firstClient?.createdAt.toISOString() || null,
    firstAnalysis: firstAnalysis?.createdAt.toISOString() || null,
    firstReport: firstReport?.createdAt.toISOString() || null,
    firstPayment: firstPayment?.createdAt.toISOString() || null,
    daysToFirstClient: daysDiff(firstClient?.createdAt),
    daysToFirstAnalysis: daysDiff(firstAnalysis?.createdAt),
    daysToFirstReport: daysDiff(firstReport?.createdAt),
    daysToFirstPayment: daysDiff(firstPayment?.createdAt),
  }
}

export async function recordMilestone(
  companyId: string,
  milestone: TelemetryMilestone,
  metadata?: Record<string, unknown>,
) {
  await prisma.auditLog.create({
    data: {
      companyId,
      action: milestone.toUpperCase(),
      entity: "system",
      entityId: companyId,
        newValues: (metadata || {}) as Prisma.InputJsonValue,
      source: "telemetry",
    },
  })
}
