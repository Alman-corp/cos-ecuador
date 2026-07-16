import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"

@Injectable()
export class RoleService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.role.findMany({ where: { companyId } })
  }

  async create(data: { companyId: string; name: string; description?: string; permissions?: any[] }) {
    return this.prisma.role.create({
      data: {
        companyId: data.companyId,
        name: data.name,
        description: data.description,
        permissions: data.permissions ?? [],
      },
    })
  }

  async update(id: string, data: Partial<{ name: string; description: string; permissions: any[] }>) {
    return this.prisma.role.update({ where: { id }, data })
  }
}
