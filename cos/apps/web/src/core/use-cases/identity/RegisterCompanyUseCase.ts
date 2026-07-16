import { prisma } from "@/lib/db/prisma"
import { eventBus, type ICommand, type ICommandHandler } from "@/core/bus"
import { ConflictError } from "@/core/errors"
import type { IUnitOfWork } from "@/core/unit-of-work"

export interface RegisterCompanyCommand extends ICommand {
  readonly type: "identity.registerCompany"
  name: string
  taxId?: string
  email: string
  phone?: string
  firstName: string
  lastName: string
}

export interface RegisterCompanyResult {
  companyId: string
  slug: string
  name: string
  userId: string
}

export interface RegisterCompanyDeps {
  uow?: IUnitOfWork
}

export class RegisterCompanyUseCase implements ICommandHandler<RegisterCompanyCommand, RegisterCompanyResult> {
  constructor(private deps?: RegisterCompanyDeps) {}

  async handle(command: RegisterCompanyCommand): Promise<RegisterCompanyResult> {
    const { name, taxId, email, phone, firstName, lastName } = command
    if (!name || !email) {
      throw new Error("VALIDATION: name and email are required")
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

    const existing = await prisma.company.findUnique({ where: { slug } })
    if (existing) throw new ConflictError("A company with this name already exists")

    const company = await prisma.company.create({
      data: { name, slug, taxId: taxId || null, email, phone: phone || null, status: "active" },
    })
    await prisma.companySettings.create({ data: { companyId: company.id } })

    const roles = await Promise.all([
      prisma.role.create({ data: { companyId: company.id, name: "admin", description: "Administrador del sistema", isSystem: true, permissions: ["all"] } }),
      prisma.role.create({ data: { companyId: company.id, name: "director", description: "Director de consultoría", isSystem: true, permissions: ["clients.read", "clients.write", "reports.read", "team.read", "team.write"] } }),
      prisma.role.create({ data: { companyId: company.id, name: "consultant", description: "Consultor", isSystem: true, permissions: ["clients.read", "clients.write", "reports.read"] } }),
      prisma.role.create({ data: { companyId: company.id, name: "viewer", description: "Solo lectura", isSystem: true, permissions: ["clients.read", "reports.read"] } }),
    ])

    const adminRole = roles.find((r) => r.name === "admin")!
    const admin = await prisma.user.create({
      data: { email, firstName: firstName || "Admin", lastName: lastName || "", companyId: company.id },
    })
    await prisma.userRole.create({ data: { userId: admin.id, roleId: adminRole.id } })

    await eventBus.publish({
      type: "identity.companyRegistered",
      aggregateId: company.id,
      occurredAt: new Date(),
      companyId: company.id,
      name: company.name,
      email,
      adminId: admin.id,
    })

    return { companyId: company.id, slug: company.slug, name: company.name, userId: admin.id }
  }
}

export const registerCompanyUseCase = new RegisterCompanyUseCase()
