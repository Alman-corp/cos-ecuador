import type { Company } from "@prisma/client"
import { prisma } from "@/lib/db/prisma"
import type { ICompanyRepository, CompanyFilters } from "../CompanyRepository"

export class PrismaCompanyRepository implements ICompanyRepository {
  async findById(id: string): Promise<Company | null> {
    return prisma.company.findUnique({ where: { id } })
  }
  async exists(id: string): Promise<boolean> {
    const c = await prisma.company.findUnique({ where: { id }, select: { id: true } })
    return c !== null
  }
  async count(): Promise<number> {
    return prisma.company.count()
  }
  async findByTaxId(taxId: string): Promise<Company | null> {
    return prisma.company.findFirst({ where: { taxId } })
  }
  async findByEmail(email: string): Promise<Company | null> {
    return prisma.company.findFirst({ where: { email } })
  }
  async findMany(filters?: CompanyFilters, skip = 0, take = 20): Promise<Company[]> {
    return prisma.company.findMany({
      where: {
        ...(filters?.taxId && { taxId: { contains: filters.taxId } }),
        ...(filters?.isActive !== undefined && { status: filters.isActive ? "active" : "inactive" }),
        ...(filters?.search && {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" } },
            { taxId: { contains: filters.search, mode: "insensitive" } },
          ],
        }),
      },
      skip, take, orderBy: { createdAt: "desc" },
    })
  }
  async save(company: Company): Promise<Company> {
    return prisma.company.update({ where: { id: company.id }, data: company })
  }
  async delete(id: string): Promise<void> {
    await prisma.company.delete({ where: { id } })
  }
  async deleteMany(ids: string[]): Promise<number> {
    const r = await prisma.company.deleteMany({ where: { id: { in: ids } } })
    return r.count
  }
}
