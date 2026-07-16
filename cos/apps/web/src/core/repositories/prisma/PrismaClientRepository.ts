import type { Client } from "@prisma/client"
import { prisma } from "@/lib/db/prisma"
import type { IClientRepository, ClientFilters, ClientHealthSummary } from "../ClientRepository"

export class PrismaClientRepository implements IClientRepository {
  async findById(id: string): Promise<Client | null> {
    return prisma.client.findUnique({
      where: { id },
      include: { documents: true, contacts: true, lead: true },
    })
  }
  async exists(id: string): Promise<boolean> {
    const c = await prisma.client.findUnique({ where: { id }, select: { id: true } })
    return c !== null
  }
  async count(): Promise<number> {
    return prisma.client.count()
  }
  async findByEmail(email: string, companyId: string): Promise<Client | null> {
    return prisma.client.findFirst({ where: { email, companyId } })
  }
  async findMany(filters: ClientFilters, skip = 0, take = 20): Promise<Client[]> {
    return prisma.client.findMany({
      where: {
        companyId: filters.companyId,
        ...(filters.isActive !== undefined && { status: filters.isActive ? "active" : "inactive" }),
        ...(filters.segment && { segment: filters.segment }),
        ...(filters.industry && { industry: filters.industry }),
        ...(filters.createdAfter && { createdAt: { gte: filters.createdAfter } }),
        ...(filters.assignedTo && { assignedTo: filters.assignedTo }),
        ...(filters.search && {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" } },
            { email: { contains: filters.search, mode: "insensitive" } },
          ],
        }),
      },
      skip, take, orderBy: { createdAt: "desc" },
      include: { documents: { take: 1, orderBy: { createdAt: "desc" } }, contacts: { take: 1 } },
    })
  }
  async countByCompany(companyId: string): Promise<number> {
    return prisma.client.count({ where: { companyId } })
  }
  async findHighRisk(companyId: string, threshold: number): Promise<Client[]> {
    return prisma.client.findMany({
      where: { companyId, score: { lte: threshold } },
      orderBy: { score: "asc" },
    })
  }
  async findHealthSummaries(companyId: string): Promise<ClientHealthSummary[]> {
    const clients = await prisma.client.findMany({
      where: { companyId },
      select: {
        id: true, name: true, email: true, score: true, status: true,
        documents: { select: { id: true, status: true } },
        updatedAt: true,
      },
    })
    return clients.map((c) => ({
      id: c.id, name: c.name, email: c.email,
      healthScore: c.score, healthStatus: c.score >= 70 ? "healthy" : c.score >= 40 ? "warning" : "critical",
      documentCompliance: c.documents.length > 0
        ? (c.documents.filter((d) => d.status === "approved").length / c.documents.length) * 100
        : 0,
      lastActivity: c.updatedAt,
      totalRevenue: 0,
    }))
  }
  async searchByName(companyId: string, query: string): Promise<Client[]> {
    return prisma.client.findMany({
      where: { companyId, name: { contains: query, mode: "insensitive" } },
      take: 10,
    })
  }
  async save(client: Client): Promise<Client> {
    return prisma.client.update({ where: { id: client.id }, data: client })
  }
  async delete(id: string): Promise<void> {
    await prisma.client.delete({ where: { id } })
  }
  async deleteMany(ids: string[]): Promise<number> {
    const r = await prisma.client.deleteMany({ where: { id: { in: ids } } })
    return r.count
  }
}
