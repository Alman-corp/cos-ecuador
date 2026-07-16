import type { FinancialStatement } from "@prisma/client"
import type { Repository } from "./interfaces"

export interface FinancialStatementFilters {
  clientId?: string
  companyId?: string
  statementType?: string
  createdAfter?: Date
}

export interface IFinancialStatementRepository extends Repository<FinancialStatement> {
  findMany(filters: FinancialStatementFilters, skip?: number, take?: number): Promise<FinancialStatement[]>
  findLatestByClient(clientId: string): Promise<FinancialStatement | null>
  findPeriodRange(clientId: string, from: Date, to: Date): Promise<FinancialStatement[]>
}
