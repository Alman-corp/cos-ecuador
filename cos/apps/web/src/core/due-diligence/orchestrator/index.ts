import { prisma } from '@/lib/db/prisma'
import type { DueDiligenceReport } from "../types"
import { generateReportV2 } from "../engine-v2"
import { generateReport } from "../engine"
import { getCompanyById } from "../seed-data"
import type { FinancialYear } from "../types"

export interface DueDiligenceJob {
  id: string
  companyName: string
  industry: string
  status: "pending" | "processing" | "completed" | "failed"
  startedAt: string
  estimatedCompletion: string
  completedAt?: string
  report?: DueDiligenceReport
  error?: string
}

export function createJob(companyName: string, industry: string): DueDiligenceJob {
  return {
    id: `dd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    companyName,
    industry: industry || "Servicios",
    status: "pending",
    startedAt: new Date().toISOString(),
    estimatedCompletion: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
  }
}

export async function startAnalysis(
  companyName: string,
  industry: string,
  financials?: FinancialYear[],
  companyId?: string,
): Promise<DueDiligenceJob> {
  const job = createJob(companyName, industry)
  job.status = "processing"

  try {
    if (companyId) {
      const company = getCompanyById(companyId)
      if (company) {
        try {
          job.report = await generateReportV2(company)
        } catch {
          job.report = generateReport(company)
        }
      }
    } else if (financials && financials.length > 0) {
      const company = {
        profile: { id: "uploaded", ruc: "", name: companyName, industry, sector: industry.toLowerCase(), description: "", founded: financials[0]?.year || 2024, status: "activa" },
        financials,
      }
      try {
        job.report = await generateReportV2(company)
      } catch {
        job.report = generateReport(company)
      }
    }

    if (job.report) {
      job.status = "completed"
      job.completedAt = new Date().toISOString()
    } else {
      job.status = "failed"
      job.error = "No se pudieron generar datos del reporte"
    }
  } catch (e: any) {
    job.status = "failed"
    job.error = e.message || "Error desconocido"
  }

  return job
}

export async function persistJob(job: DueDiligenceJob, companyId?: string) {
  try {
    await prisma.dueDiligenceJob.create({
      data: {
        id: job.id,
        companyId: companyId || "00000000-0000-0000-0000-000000000000",
        targetCompanyName: job.companyName,
        industry: job.industry,
        status: job.status,
        creditsConsumed: 1,
        startedAt: new Date(job.startedAt),
        completedAt: job.completedAt ? new Date(job.completedAt) : null,
        reportUrl: null,
        reportData: job.report ? JSON.parse(JSON.stringify(job.report)) : null,
      },
    })
  } catch (e) {
    console.error("Failed to persist job:", e)
  }
}

export async function updateJobStatus(
  id: string,
  status: string,
  updates?: { reportUrl?: string; report?: DueDiligenceReport; error?: string },
) {
  try {
    const data: any = { status }
    if (status === "completed") data.completedAt = new Date()
    if (updates?.reportUrl) data.reportUrl = updates.reportUrl
    if (updates?.report) data.reportData = JSON.parse(JSON.stringify(updates.report))
    if (updates?.error) data.error = updates.error

    await prisma.dueDiligenceJob.update({ where: { id }, data })
  } catch (e) {
    console.error("Failed to update job:", e)
  }
}

export async function getJob(jobId: string): Promise<DueDiligenceJob | undefined> {
  try {
    const row = await prisma.dueDiligenceJob.findUnique({ where: { id: jobId } })
    if (!row) return undefined
    return {
      id: row.id,
      companyName: row.targetCompanyName,
      industry: row.industry,
      status: row.status as any,
      startedAt: row.startedAt.toISOString(),
      estimatedCompletion: "",
      completedAt: row.completedAt?.toISOString(),
      report: row.reportData as DueDiligenceReport | undefined,
      error: undefined,
    }
  } catch {
    return undefined
  }
}

export async function getAllJobs(): Promise<DueDiligenceJob[]> {
  try {
    const rows = await prisma.dueDiligenceJob.findMany({
      orderBy: { startedAt: "desc" },
      take: 100,
    })
    return rows.map((row) => ({
      id: row.id,
      companyName: row.targetCompanyName,
      industry: row.industry,
      status: row.status as any,
      startedAt: row.startedAt.toISOString(),
      estimatedCompletion: "",
      completedAt: row.completedAt?.toISOString(),
      report: row.reportData as DueDiligenceReport | undefined,
      error: undefined,
    }))
  } catch {
    return []
  }
}

export async function getRecentJobs(limit = 10): Promise<DueDiligenceJob[]> {
  const all = await getAllJobs()
  return all.slice(0, limit)
}
