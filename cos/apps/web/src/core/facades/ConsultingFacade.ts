import { unitOfWork } from "../unit-of-work"
import { analyzeFinancialStatementsUseCase, type AnalyzeFinancialStatementsCommand, type AnalyzeFinancialStatementsResult } from "../use-cases/consulting"
import { complianceService } from "../services/ComplianceService"
import { strategicPlanningService } from "../services/StrategicPlanningService"
import { success, type Result, failure } from "../result"

export class ConsultingFacade {
  async runFullAnalysis(data: AnalyzeFinancialStatementsCommand): Promise<Result<AnalyzeFinancialStatementsResult>> {
    try {
      const result = await unitOfWork.run(async (uow) => {
        const uc = new (analyzeFinancialStatementsUseCase.constructor as any)({ uow })
        return uc.handle(data)
      })
      return success(result)
    } catch (err: any) {
      return failure(err)
    }
  }

  async generateComplianceReport(companyId: string, clientId: string, checklistType: string, performedBy: string): Promise<Result<any>> {
    try {
      const { prisma } = await import("@/lib/db/prisma")
      const result = await unitOfWork.run(async () => {
        const client = await prisma.client.findFirst({ where: { id: clientId, companyId } })
        if (!client) throw new Error("Client not found")
        const docs = await prisma.document.findMany({ where: { clientId } })
        const checks = docs.map((d) => ({
          id: d.id, name: d.title, category: "regulatory" as const,
          required: true, passed: d.status === "approved", notes: d.status,
        }))
        const report = complianceService.evaluate(checks)
        await prisma.auditLog.create({
          data: {
            companyId, userId: performedBy, action: "COMPLIANCE_REPORT",
            entity: "client", entityId: clientId,
            newValues: { status: report.status, score: report.overallScore, missingItems: report.gaps },
          },
        })
        return { ...report, clientId }
      })
      return success(result)
    } catch (err: any) {
      return failure(err)
    }
  }

  async assessStrategicGap(
    clientId: string,
    currentState: Record<string, number>, desiredState: Record<string, number>,
  ): Promise<Result<any>> {
    try {
      const objectives = Object.entries(desiredState).map(([title, targetValue]) => ({
        id: `${clientId}:${title}`, title, category: "growth" as const,
        currentValue: currentState[title] || 0, targetValue,
        deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      }))
      const plan = strategicPlanningService.analyzePlan(objectives)
      return success({ ...plan, clientId })
    } catch (err: any) {
      return failure(err)
    }
  }
}

export const consultingFacade = new ConsultingFacade()
