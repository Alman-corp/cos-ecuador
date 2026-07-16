import type { Document } from "@prisma/client"
import { prisma } from "@/lib/db/prisma"
import type { IDocumentRepository, DocumentFilters } from "../DocumentRepository"

export class PrismaDocumentRepository implements IDocumentRepository {
  async findById(id: string): Promise<Document | null> {
    return prisma.document.findUnique({ where: { id } })
  }
  async exists(id: string): Promise<boolean> {
    const d = await prisma.document.findUnique({ where: { id }, select: { id: true } })
    return d !== null
  }
  async count(): Promise<number> {
    return prisma.document.count()
  }
  async findMany(filters: DocumentFilters, skip = 0, take = 20): Promise<Document[]> {
    return prisma.document.findMany({
      where: {
        companyId: filters.companyId,
        ...(filters.clientId && { clientId: filters.clientId }),
        ...(filters.documentType && { documentType: filters.documentType }),
        ...(filters.status && { status: filters.status }),
        ...(filters.uploadedBy && { uploadedBy: filters.uploadedBy }),
        ...(filters.createdAfter && { createdAt: { gte: filters.createdAfter } }),
      },
      skip, take, orderBy: { createdAt: "desc" },
    })
  }
  async countByClient(clientId: string): Promise<number> {
    return prisma.document.count({ where: { clientId } })
  }
  async countByCompany(companyId: string): Promise<number> {
    return prisma.document.count({ where: { companyId } })
  }
  async findByClient(clientId: string): Promise<Document[]> {
    return prisma.document.findMany({ where: { clientId }, orderBy: { createdAt: "desc" } })
  }
  async findPending(companyId: string): Promise<Document[]> {
    return prisma.document.findMany({ where: { companyId, status: "pending" }, orderBy: { createdAt: "asc" } })
  }
  async save(document: Document): Promise<Document> {
    const { extracted, ...rest } = document
    return prisma.document.update({ where: { id: document.id }, data: { ...rest, extracted: extracted ?? undefined } as any })
  }
  async delete(id: string): Promise<void> {
    await prisma.document.delete({ where: { id } })
  }
  async deleteMany(ids: string[]): Promise<number> {
    const r = await prisma.document.deleteMany({ where: { id: { in: ids } } })
    return r.count
  }
}
