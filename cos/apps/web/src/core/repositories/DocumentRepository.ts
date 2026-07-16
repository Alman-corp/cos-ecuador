import type { Document } from "@prisma/client"
import type { WriteRepository } from "./interfaces"

export interface DocumentFilters {
  companyId: string
  clientId?: string
  documentType?: string
  status?: string
  uploadedBy?: string
  createdAfter?: Date
}

export interface IDocumentRepository extends WriteRepository<Document> {
  findMany(filters: DocumentFilters, skip?: number, take?: number): Promise<Document[]>
  countByClient(clientId: string): Promise<number>
  countByCompany(companyId: string): Promise<number>
  findByClient(clientId: string): Promise<Document[]>
  findPending(companyId: string): Promise<Document[]>
}
