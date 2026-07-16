import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async findByClient(clientId: string) {
    return this.prisma.clientContact.findMany({
      where: { clientCompanyId: clientId },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
    })
  }

  async findById(id: string) {
    const contact = await this.prisma.clientContact.findUnique({
      where: { id },
      include: { clientCompany: { select: { id: true, name: true } } },
    })
    if (!contact) throw new NotFoundException("Contact not found")
    return contact
  }

  async create(data: {
    clientCompanyId: string
    name: string
    position?: string
    email?: string
    phone?: string
    isPrimary?: boolean
  }) {
    const client = await this.prisma.clientCompany.findUnique({ where: { id: data.clientCompanyId } })
    if (!client) throw new BadRequestException("Client not found")

    if (data.isPrimary) {
      await this.prisma.clientContact.updateMany({
        where: { clientCompanyId: data.clientCompanyId, isPrimary: true },
        data: { isPrimary: false },
      })
    }

    return this.prisma.clientContact.create({ data })
  }

  async update(id: string, data: Partial<{
    name: string
    position: string
    email: string
    phone: string
    isPrimary: boolean
  }>) {
    const contact = await this.prisma.clientContact.findUnique({ where: { id } })
    if (!contact) throw new NotFoundException("Contact not found")

    if (data.isPrimary) {
      await this.prisma.clientContact.updateMany({
        where: { clientCompanyId: contact.clientCompanyId, isPrimary: true, id: { not: id } },
        data: { isPrimary: false },
      })
    }

    return this.prisma.clientContact.update({ where: { id }, data })
  }

  async remove(id: string) {
    const contact = await this.prisma.clientContact.findUnique({ where: { id } })
    if (!contact) throw new NotFoundException("Contact not found")
    return this.prisma.clientContact.delete({ where: { id } })
  }
}
