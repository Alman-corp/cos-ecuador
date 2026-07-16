import type { FinancialStatement } from "@prisma/client"
import { prisma } from "@/lib/db/prisma"
import type { IFinancialStatementRepository, FinancialStatementFilters } from "../FinancialStatementRepository"

export class PrismaFinancialStatementRepository implements IFinancialStatementRepository {
  async findById(id: string): Promise<FinancialStatement | null> {
    return prisma.financialStatement.findUnique({ where: { id } })
  }
  async exists(id: string): Promise<boolean> {
    const f = await prisma.financialStatement.findUnique({ where: { id }, select: { id: true } })
    return f !== null
  }
  async count(): Promise<number> {
    return prisma.financialStatement.count()
  }
  async findMany(filters: FinancialStatementFilters, skip = 0, take = 20): Promise<FinancialStatement[]> {
    return prisma.financialStatement.findMany({
      where: {
        ...(filters.clientId && { clientId: filters.clientId }),
        ...(filters.companyId && { companyId: filters.companyId }),
        ...(filters.statementType && { statementType: filters.statementType }),
        ...(filters.createdAfter && { createdAt: { gte: filters.createdAfter } }),
      },
      skip, take, orderBy: { periodStart: "desc" },
    })
  }
  async findLatestByClient(clientId: string): Promise<FinancialStatement | null> {
    return prisma.financialStatement.findFirst({
      where: { clientId },
      orderBy: { periodStart: "desc" },
    })
  }
  async findPeriodRange(clientId: string, from: Date, to: Date): Promise<FinancialStatement[]> {
    return prisma.financialStatement.findMany({
      where: { clientId, periodStart: { gte: from }, periodEnd: { lte: to } },
      orderBy: { periodStart: "asc" },
    })
  }
}
