import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.user.findMany({
      where: { companyId },
      include: {
        department: true,
        roles: { include: { role: true } },
      },
    })
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        company: true,
        department: true,
        roles: { include: { role: true } },
      },
    })
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } })
  }

  async create(data: {
    email: string
    firstName: string
    lastName: string
    companyId: string
    departmentId?: string
    position?: string
    roleIds?: string[]
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        companyId: data.companyId,
        departmentId: data.departmentId,
        position: data.position,
        roles: data.roleIds
          ? { create: data.roleIds.map((roleId) => ({ roleId })) }
          : undefined,
      },
      include: { roles: { include: { role: true } } },
    })
  }

  async update(id: string, data: Partial<{
    firstName: string
    lastName: string
    position: string
    isActive: boolean
    departmentId: string
  }>) {
    return this.prisma.user.update({ where: { id }, data })
  }
}
