import { prisma } from '@/lib/db/prisma'
import { consumeDDCredit } from '@/lib/stripe/use-credits'
import { sendReportDelivery } from '@/lib/email/service'
import { startAnalysis, updateJobStatus } from './orchestrator'
import { incrementCompaniesAnalyzed, incrementReportsGenerated } from '@/lib/monitoring/metrics'
import bcrypt from 'bcryptjs'
import type { FinancialYear } from './types'

export interface WorkerParams {
  companyName: string
  industry: string
  financials?: FinancialYear[]
  companyId?: string
  clientEmail?: string
  clientName?: string
  consultantEmail?: string
  consultantName?: string
  consultantFirm?: string
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars[Math.floor(Math.random() * chars.length)]
  }
  return password
}

export async function processJob(params: WorkerParams): Promise<{ success: boolean; jobId: string; error?: string }> {
  const { companyName, industry, financials, companyId, clientEmail, clientName, consultantEmail, consultantName, consultantFirm } = params

  const companyIdVal = companyId || "00000000-0000-0000-0000-000000000000"

  const job = await startAnalysis(companyName, industry, financials, companyId)

  const reportData = job.report ? JSON.parse(JSON.stringify(job.report)) : null

  await prisma.dueDiligenceJob.create({
    data: {
      id: job.id,
      companyId: companyIdVal,
      targetCompanyName: job.companyName,
      industry: job.industry,
      status: job.status,
      creditsConsumed: 1,
      clientEmail: clientEmail || null,
      clientName: clientName || null,
      startedAt: new Date(job.startedAt),
      completedAt: job.completedAt ? new Date(job.completedAt) : null,
      reportUrl: null,
      reportData,
    },
  })

  if (job.status === "completed") {
    incrementCompaniesAnalyzed()
    incrementReportsGenerated()

    await updateJobStatus(job.id, "completed", { report: job.report })

    const reportUrl = `/api/reports/${job.id}/pdf`
    await updateJobStatus(job.id, "completed", { reportUrl, report: job.report })
    await prisma.dueDiligenceJob.update({
      where: { id: job.id },
      data: { reportUrl },
    })

    const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/portal/login`

    if (clientEmail && consultantEmail) {
      const tempPassword = generateTempPassword()
      const hashedPassword = bcrypt.hashSync(tempPassword, 12)
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

      try {
        await prisma.portalAccess.upsert({
          where: { jobId: job.id },
          update: { tempPassword: hashedPassword, expiresAt },
          create: {
            jobId: job.id,
            email: clientEmail,
            tempPassword: hashedPassword,
            expiresAt,
          },
        })

        await sendReportDelivery({
          clientEmail,
          clientName: clientName || "Cliente",
          companyName: job.companyName,
          consultantEmail: consultantEmail || "consultor@firma.com",
          consultantName: consultantName || "Consultor",
          consultantFirm: consultantFirm || "Firma de Consultor\u00eda",
          reportUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${reportUrl}`,
          portalUrl,
          jobId: job.id,
          creditsRemaining: 0,
          tempPassword,
          expiresAt,
        })
      } catch (e) {
        console.error("Failed to send email / create portal access:", e)
      }
    }

    const creditsResult = await consumeDDCredit(companyIdVal)
    console.log(`Credits after consume: ${JSON.stringify(creditsResult)}`)
  }

  return { success: job.status === "completed", jobId: job.id, error: job.error }
}
