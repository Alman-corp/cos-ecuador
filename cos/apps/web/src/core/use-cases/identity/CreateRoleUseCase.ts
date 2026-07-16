import { prisma } from "@/lib/db/prisma"
import { eventBus, type ICommand, type ICommandHandler } from "@/core/bus"
import { ValidationError } from "@/core/errors"
import type { IUnitOfWork } from "@/core/unit-of-work"

export interface CreateRoleCommand extends ICommand {
  readonly type: "identity.createRole"
  companyId: string
  name: string
  permissions: string[]
  createdBy: string
}
export interface CreateRoleResult { roleId: string; name: string }

export interface CreateRoleDeps { uow?: IUnitOfWork }

export class CreateRoleUseCase implements ICommandHandler<CreateRoleCommand, CreateRoleResult> {
  constructor(private deps?: CreateRoleDeps) {}
  async handle(command: CreateRoleCommand): Promise<CreateRoleResult> {
    const { companyId, name, permissions, createdBy } = command
    if (!name) throw new ValidationError("Role name is required")

    const existing = await prisma.role.findFirst({ where: { name, companyId }, select: { id: true } })
    if (existing) throw new ValidationError("Role already exists in this company")

    const role = await prisma.role.create({
      data: { companyId, name, description: `Custom role: ${name}`, permissions },
    })

    await eventBus.publish({
      type: "identity.roleCreated",
      aggregateId: role.id,
      occurredAt: new Date(),
      companyId,
      roleId: role.id,
      name: role.name,
      createdBy,
    })

    return { roleId: role.id, name: role.name }
  }
}
export const createRoleUseCase = new CreateRoleUseCase()
