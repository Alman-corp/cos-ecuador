import { prisma } from "@/lib/db/prisma"
import { eventBus, type ICommand, type ICommandHandler } from "@/core/bus"
import { NotFoundError, ValidationError } from "@/core/errors"
import type { IUnitOfWork } from "@/core/unit-of-work"

export interface InviteUserCommand extends ICommand {
  readonly type: "identity.inviteUser"
  companyId: string
  email: string
  roleId: string
  invitedBy: string
}
export interface InviteUserResult { userId: string; email: string }

export interface InviteUserDeps { uow?: IUnitOfWork }

export class InviteUserUseCase implements ICommandHandler<InviteUserCommand, InviteUserResult> {
  constructor(private deps?: InviteUserDeps) {}
  async handle(command: InviteUserCommand): Promise<InviteUserResult> {
    const { companyId, email, roleId, invitedBy } = command
    if (!email) throw new ValidationError("Email is required")

    const company = await prisma.company.findUnique({ where: { id: companyId }, select: { id: true } })
    if (!company) throw new NotFoundError("Company not found")

    const existing = await prisma.user.findFirst({ where: { email, companyId }, select: { id: true } })
    if (existing) throw new ValidationError("User already exists in this company")

    const role = await prisma.role.findFirst({ where: { id: roleId, companyId }, select: { id: true } })
    if (!role) throw new NotFoundError("Role not found in this company")

    const user = await prisma.user.create({
      data: { email, companyId, firstName: email.split("@")[0], lastName: "" },
    })
    await prisma.userRole.create({ data: { userId: user.id, roleId } })

    await eventBus.publish({
      type: "identity.userInvited",
      aggregateId: user.id,
      occurredAt: new Date(),
      companyId,
      userId: user.id,
      email,
      invitedBy,
    })

    return { userId: user.id, email: user.email }
  }
}
export const inviteUserUseCase = new InviteUserUseCase()
