import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.company.findMany({
      include: { branches: true, brands: true, departments: true, settings: true },
    })
  }

  async findById(id: string) {
    return this.prisma.company.findUnique({
      where: { id },
      include: {
        branches: true,
        brands: true,
        departments: { include: { children: true } },
        settings: true,
        users: { include: { roles: { include: { role: true } } } },
      },
    })
  }

  async findBySlug(slug: string) {
    return this.prisma.company.findUnique({ where: { slug } })
  }

  async create(data: {
    name: string
    slug: string
    taxId?: string
    email?: string
    phone?: string
  }) {
    return this.prisma.company.create({
      data: {
        name: data.name,
        slug: data.slug,
        taxId: data.taxId,
        email: data.email,
        phone: data.phone,
        settings: {
          create: {}, // default settings
        },
      },
      include: { settings: true },
    })
  }

  async update(id: string, data: Partial<{
    name: string
    slug: string
    taxId: string
    email: string
    phone: string
    status: string
  }>) {
    return this.prisma.company.update({ where: { id }, data })
  }

  async getOrgChart(companyId: string) {
    const departments = await this.prisma.department.findMany({
      where: { companyId, parentId: null },
      include: {
        children: { include: { children: true } },
        users: true,
      },
    })
    return departments
  }
}
