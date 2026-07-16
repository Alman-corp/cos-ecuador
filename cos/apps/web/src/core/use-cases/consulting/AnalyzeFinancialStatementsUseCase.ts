import { prisma } from "@/lib/db/prisma"
import { eventBus, type ICommand, type ICommandHandler } from "@/core/bus"
import { financialAnalysisService } from "@/core/services/FinancialAnalysisService"
import { riskAssessmentService } from "@/core/services/RiskAssessmentService"
import { NotFoundError } from "@/core/errors"
import type { IUnitOfWork } from "@/core/unit-of-work"

export interface AnalyzeFinancialStatementsCommand extends ICommand {
  readonly type: "consulting.analyzeFinancialStatements"
  companyId: string
  clientId: string
  financialStatementIds: string[]
  performedBy: string
}
export interface AnalyzeFinancialStatementsResult {
  ratios: ReturnType<typeof financialAnalysisService.calculateRatios>
  healthScore: number
  healthStatus: string
  alerts: string[]
  riskAssessment: ReturnType<typeof riskAssessmentService.assess>
  recommendations: string[]
}

export interface AnalyzeFinancialStatementsDeps { uow?: IUnitOfWork }

export class AnalyzeFinancialStatementsUseCase
  implements ICommandHandler<AnalyzeFinancialStatementsCommand, AnalyzeFinancialStatementsResult>
{
  constructor(private deps?: AnalyzeFinancialStatementsDeps) {}
  async handle(command: AnalyzeFinancialStatementsCommand): Promise<AnalyzeFinancialStatementsResult> {
    const client = await prisma.client.findFirst({
      where: { id: command.clientId, companyId: command.companyId },
    })
    if (!client) throw new NotFoundError("Client not found")

    const statements = await prisma.financialStatement.findMany({
      where: { id: { in: command.financialStatementIds }, clientId: command.clientId },
    })
    if (statements.length === 0) throw new NotFoundError("No financial statements found")

    const latest = statements[statements.length - 1]
    const data = latest.data as Record<string, number>

    const financialData = {
      currentAssets: data.current_assets || 0, cash: data.cash || 0,
      accountsReceivable: data.accounts_receivable || 0, inventory: data.inventory || 0,
      nonCurrentAssets: data.non_current_assets || 0, totalAssets: data.total_assets || 0,
      currentLiabilities: data.current_liabilities || 0, longTermDebt: data.long_term_debt || 0,
      totalLiabilities: data.total_liabilities || 0, equity: data.equity || 0,
      revenue: data.revenue || 0, cogs: data.cogs || 0, grossProfit: data.gross_profit || 0,
      opex: data.opex || 0, ebitda: data.ebitda || 0, netIncome: data.net_income || 0,
    }

    const ratios = financialAnalysisService.calculateRatios(financialData)
    const health = financialAnalysisService.assessHealth(ratios)
    const riskAssessment = riskAssessmentService.assess([
      { name: "Liquidez", weight: 3, score: ratios.liquidity.current * 50, description: "Capacidad de pago a corto plazo" },
      { name: "Solvencia", weight: 3, score: ratios.solvency.debtToEquity < 1 ? 80 : ratios.solvency.debtToEquity < 2 ? 50 : 20, description: "Nivel de endeudamiento" },
      { name: "Rentabilidad", weight: 2, score: ratios.profitability.netMargin * 2000 as number, description: "Generación de utilidades" },
      { name: "Eficiencia", weight: 1, score: ratios.efficiency.assetTurnover * 50, description: "Uso de activos" },
    ])

    await prisma.auditLog.create({
      data: {
        companyId: command.companyId, userId: command.performedBy,
        action: "FINANCIAL_ANALYSIS", entity: "financial_statement",
        entityId: command.financialStatementIds.join(","),
        newValues: { healthScore: health.score, healthStatus: health.status, alerts: health.alerts },
      },
    })

    await eventBus.publish({
      type: "consulting.financialAnalysisCompleted",
      aggregateId: command.clientId,
      occurredAt: new Date(),
      companyId: command.companyId,
      clientId: command.clientId,
      status: health.status,
      score: health.score,
      performedBy: command.performedBy,
    })

    return {
      ratios, healthScore: health.score, healthStatus: health.status, alerts: health.alerts,
      riskAssessment, recommendations: [...riskAssessment.recommendations, ...health.alerts],
    }
  }
}
export const analyzeFinancialStatementsUseCase = new AnalyzeFinancialStatementsUseCase()
