import type { User } from "@prisma/client"
import type { WriteRepository } from "./interfaces"

export interface UserFilters {
  companyId?: string
  isActive?: boolean
  roleId?: string
  search?: string
}

export interface IUserRepository extends WriteRepository<User> {
  findByEmail(email: string): Promise<User | null>
  findManyByCompany(companyId: string, filters?: Omit<UserFilters, "companyId">, skip?: number, take?: number): Promise<User[]>
  countByCompany(companyId: string): Promise<number>
  findActiveByCompany(companyId: string): Promise<User[]>
}
