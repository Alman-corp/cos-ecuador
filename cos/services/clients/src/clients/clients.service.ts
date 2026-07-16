import { Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    companyId: string
    search?: string
    status?: string
    segment?: string
    page?: number
    limit?: number
  }) {
    const { companyId, search, status, segment, page = 1, limit = 20 } = params
    const where: any = { companyId }

    if (status) where.status = status
    if (segment) where.segment = segment
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { tradeName: { contains: search, mode: "insensitive" } },
        { taxId: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
      ]
    }

    const [data, total] = await Promise.all([
      this.prisma.clientCompany.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          contacts: { take: 1, where: { isPrimary: true } },
          contracts: { take: 1, orderBy: { startDate: "desc" } },
          _count: { select: { tickets: true, documents: true, invoices: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.clientCompany.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async findById(id: string) {
    const client = await this.prisma.clientCompany.findUnique({
      where: { id },
      include: {
        contacts: true,
        legalReps: true,
        shareholders: true,
        contracts: { include: { versions: { orderBy: { version: "desc" }, take: 1 } } },
        invoices: { include: { items: true }, orderBy: { issueDate: "desc" } },
        documents: true,
        projects: { include: { milestones: true, risks: true } },
        tickets: { include: { comments: { orderBy: { createdAt: "desc" }, take: 5 } } },
        objectives: { include: { keyResults: true } },
        issues: { orderBy: { createdAt: "desc" } },
      },
    })
    if (!client) throw new NotFoundException("Client not found")
    return client
  }

  async create(data: {
    companyId: string
    name: string
    tradeName?: string
    taxId?: string
    industry?: string
    segment?: string
    email?: string
    phone?: string
    address?: string
    city?: string
    source?: string
    assignedTo?: string
  }) {
    return this.prisma.clientCompany.create({ data })
  }

  async update(id: string, data: Partial<{
    name: string
    tradeName: string
    taxId: string
    industry: string
    segment: string
    status: string
    score: number
    email: string
    phone: string
    address: string
    city: string
    website: string
    assignedTo: string
  }>) {
    const client = await this.prisma.clientCompany.findUnique({ where: { id } })
    if (!client) throw new NotFoundException("Client not found")
    return this.prisma.clientCompany.update({ where: { id }, data })
  }

  async remove(id: string) {
    const client = await this.prisma.clientCompany.findUnique({ where: { id } })
    if (!client) throw new NotFoundException("Client not found")
    return this.prisma.clientCompany.update({
      where: { id },
      data: { status: "inactive" },
    })
  }

  async getTimeline(clientId: string) {
    return this.prisma.timelineEvent.findMany({
      where: { clientCompanyId: clientId },
      orderBy: { occurredAt: "desc" },
      take: 50,
    })
  }

  async getStats(companyId: string) {
    const [total, active, prospects, churned, totalRevenue] = await Promise.all([
      this.prisma.clientCompany.count({ where: { companyId } }),
      this.prisma.clientCompany.count({ where: { companyId, status: "active" } }),
      this.prisma.clientCompany.count({ where: { companyId, status: "prospect" } }),
      this.prisma.clientCompany.count({ where: { companyId, status: "churned" } }),
      this.prisma.clientInvoice.aggregate({
        where: { clientCompany: { companyId } },
        _sum: { total: true },
      }),
    ])
    return { total, active, prospects, churned, totalRevenue: totalRevenue._sum.total ?? 0 }
  }
}
