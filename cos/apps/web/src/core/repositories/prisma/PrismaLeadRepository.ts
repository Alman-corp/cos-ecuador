import type { Lead } from "@prisma/client"
import { prisma } from "@/lib/db/prisma"
import type { ILeadRepository, LeadFilters } from "../LeadRepository"

export class PrismaLeadRepository implements ILeadRepository {
  async findById(id: string): Promise<Lead | null> {
    return prisma.lead.findUnique({ where: { id }, include: { activities: true } })
  }
  async exists(id: string): Promise<boolean> {
    const l = await prisma.lead.findUnique({ where: { id }, select: { id: true } })
    return l !== null
  }
  async count(): Promise<number> {
    return prisma.lead.count()
  }
  async findByEmail(email: string, companyId: string): Promise<Lead | null> {
    return prisma.lead.findFirst({ where: { email, companyId } })
  }
  async findMany(filters: LeadFilters, skip = 0, take = 20): Promise<Lead[]> {
    return prisma.lead.findMany({
      where: {
        companyId: filters.companyId,
        ...(filters.status && { status: filters.status }),
        ...(filters.source && { source: filters.source }),
        ...(filters.assignedTo && { assignedTo: filters.assignedTo }),
        ...(filters.scoreMin !== undefined && { score: { gte: filters.scoreMin } }),
        ...(filters.scoreMax !== undefined && { score: { lte: filters.scoreMax } }),
        ...(filters.createdAfter && { createdAt: { gte: filters.createdAfter } }),
        ...(filters.search && {
          OR: [
            { firstName: { contains: filters.search, mode: "insensitive" } },
            { lastName: { contains: filters.search, mode: "insensitive" } },
            { email: { contains: filters.search, mode: "insensitive" } },
          ],
        }),
      },
      skip, take, orderBy: { score: "desc" },
      include: { activities: { take: 3, orderBy: { createdAt: "desc" } } },
    })
  }
  async countByCompany(companyId: string): Promise<number> {
    return prisma.lead.count({ where: { companyId } })
  }
  async countByStatus(companyId: string): Promise<{ status: string; count: number }[]> {
    const result = await prisma.lead.groupBy({
      by: ["status"], where: { companyId }, _count: { id: true },
    })
    return result.map((r) => ({ status: r.status, count: r._count.id }))
  }
  async findHighValue(companyId: string, minScore: number): Promise<Lead[]> {
    return prisma.lead.findMany({
      where: { companyId, score: { gte: minScore }, status: { not: "converted" } },
      orderBy: { score: "desc" },
    })
  }
  async save(lead: Lead): Promise<Lead> {
    return prisma.lead.update({ where: { id: lead.id }, data: lead })
  }
  async delete(id: string): Promise<void> {
    await prisma.lead.delete({ where: { id } })
  }
  async deleteMany(ids: string[]): Promise<number> {
    const r = await prisma.lead.deleteMany({ where: { id: { in: ids } } })
    return r.count
  }
}
