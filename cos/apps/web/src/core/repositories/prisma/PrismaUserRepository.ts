import type { User } from "@prisma/client"
import { prisma } from "@/lib/db/prisma"
import type { IUserRepository, UserFilters } from "../UserRepository"

export class PrismaUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } })
  }
  async exists(id: string): Promise<boolean> {
    const u = await prisma.user.findUnique({ where: { id }, select: { id: true } })
    return u !== null
  }
  async count(): Promise<number> {
    return prisma.user.count()
  }
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } })
  }
  async findManyByCompany(companyId: string, filters?: Omit<UserFilters, "companyId">, skip = 0, take = 20): Promise<User[]> {
    return prisma.user.findMany({
      where: {
        companyId,
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
        ...(filters?.roleId && { roleId: filters.roleId }),
        ...(filters?.search && {
          OR: [
            { firstName: { contains: filters.search, mode: "insensitive" } },
            { lastName: { contains: filters.search, mode: "insensitive" } },
            { email: { contains: filters.search, mode: "insensitive" } },
          ],
        }),
      },
      skip, take, orderBy: { createdAt: "desc" },
    })
  }
  async countByCompany(companyId: string): Promise<number> {
    return prisma.user.count({ where: { companyId } })
  }
  async findActiveByCompany(companyId: string): Promise<User[]> {
    return prisma.user.findMany({ where: { companyId, isActive: true } })
  }
  async save(user: User): Promise<User> {
    return prisma.user.update({ where: { id: user.id }, data: user })
  }
  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } })
  }
  async deleteMany(ids: string[]): Promise<number> {
    const r = await prisma.user.deleteMany({ where: { id: { in: ids } } })
    return r.count
  }
}
