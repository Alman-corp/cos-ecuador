import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"

@Injectable()
export class ContractsService {
  constructor(private prisma: PrismaService) {}

  async findByClient(clientId: string) {
    return this.prisma.clientContract.findMany({
      where: { clientCompanyId: clientId },
      include: { versions: { orderBy: { version: "desc" }, take: 1 } },
      orderBy: { startDate: "desc" },
    })
  }

  async findById(id: string) {
    const contract = await this.prisma.clientContract.findUnique({
      where: { id },
      include: {
        clientCompany: { select: { id: true, name: true } },
        versions: { orderBy: { version: "desc" } },
      },
    })
    if (!contract) throw new NotFoundException("Contract not found")
    return contract
  }

  async create(data: {
    clientCompanyId: string
    name: string
    type?: string
    startDate: string
    endDate?: string
    value?: number
    currency?: string
    status?: string
  }) {
    const client = await this.prisma.clientCompany.findUnique({ where: { id: data.clientCompanyId } })
    if (!client) throw new BadRequestException("Client not found")

    return this.prisma.clientContract.create({
      data: {
        clientCompanyId: data.clientCompanyId,
        name: data.name,
        type: data.type || "service",
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        value: data.value || 0,
        currency: data.currency || "COP",
        status: data.status || "active",
      },
    })
  }

  async update(id: string, data: Partial<{
    name: string
    type: string
    startDate: string
    endDate: string
    value: number
    currency: string
    status: string
  }>) {
    const contract = await this.prisma.clientContract.findUnique({ where: { id } })
    if (!contract) throw new NotFoundException("Contract not found")

    const updateData: any = { ...data }
    if (data.startDate) updateData.startDate = new Date(data.startDate)
    if (data.endDate) updateData.endDate = new Date(data.endDate)

    return this.prisma.clientContract.update({ where: { id }, data: updateData })
  }

  async remove(id: string) {
    const contract = await this.prisma.clientContract.findUnique({ where: { id } })
    if (!contract) throw new NotFoundException("Contract not found")
    return this.prisma.clientContract.update({
      where: { id },
      data: { status: "cancelled" },
    })
  }
}
