import type { Company } from "@prisma/client"
import type { WriteRepository } from "./interfaces"

export interface CompanyFilters {
  taxId?: string
  isActive?: boolean
  search?: string
}

export interface ICompanyRepository extends WriteRepository<Company> {
  findByTaxId(taxId: string): Promise<Company | null>
  findByEmail(email: string): Promise<Company | null>
  findMany(filters?: CompanyFilters, skip?: number, take?: number): Promise<Company[]>
}
