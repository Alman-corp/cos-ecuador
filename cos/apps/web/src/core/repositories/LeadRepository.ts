import type { Lead } from "@prisma/client"
import type { WriteRepository } from "./interfaces"

export interface LeadFilters {
  companyId: string
  status?: string
  source?: string
  assignedTo?: string
  scoreMin?: number
  scoreMax?: number
  search?: string
  createdAfter?: Date
}

export interface ILeadRepository extends WriteRepository<Lead> {
  findByEmail(email: string, companyId: string): Promise<Lead | null>
  findMany(filters: LeadFilters, skip?: number, take?: number): Promise<Lead[]>
  countByCompany(companyId: string): Promise<number>
  countByStatus(companyId: string): Promise<{ status: string; count: number }[]>
  findHighValue(companyId: string, minScore: number): Promise<Lead[]>
}
