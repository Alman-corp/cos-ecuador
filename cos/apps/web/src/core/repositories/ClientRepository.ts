import type { Client } from "@prisma/client"
import type { WriteRepository } from "./interfaces"

export interface ClientFilters {
  companyId: string
  isActive?: boolean
  segment?: string
  industry?: string
  search?: string
  createdAfter?: Date
  assignedTo?: string
}

export interface ClientHealthSummary {
  id: string
  name: string
  email: string | null
  healthScore: number
  healthStatus: string
  documentCompliance: number
  lastActivity: Date | null
  totalRevenue: number
}

export interface IClientRepository extends WriteRepository<Client> {
  findByEmail(email: string, companyId: string): Promise<Client | null>
  findMany(filters: ClientFilters, skip?: number, take?: number): Promise<Client[]>
  countByCompany(companyId: string): Promise<number>
  findHighRisk(companyId: string, threshold: number): Promise<Client[]>
  findHealthSummaries(companyId: string): Promise<ClientHealthSummary[]>
  searchByName(companyId: string, query: string): Promise<Client[]>
}
