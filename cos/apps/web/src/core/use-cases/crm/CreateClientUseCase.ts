import { prisma } from "@/lib/db/prisma"
import { eventBus, type ICommand, type ICommandHandler } from "@/core/bus"
import { NotFoundError } from "@/core/errors"
import type { IUnitOfWork } from "@/core/unit-of-work"

export interface CreateClientCommand extends ICommand {
  readonly type: "crm.createClient"
  companyId: string
  name: string
  taxId?: string
  industry?: string
  segment?: string
  email?: string
  phone?: string
  contactFirstName: string
  contactLastName: string
  contactEmail: string
  createdBy: string
}
export interface CreateClientResult { clientId: string; name: string }

export interface CreateClientDeps { uow?: IUnitOfWork }

export class CreateClientUseCase implements ICommandHandler<CreateClientCommand, CreateClientResult> {
  constructor(private deps?: CreateClientDeps) {}
  async handle(command: CreateClientCommand): Promise<CreateClientResult> {
    const company = await prisma.company.findUnique({ where: { id: command.companyId }, select: { id: true } })
    if (!company) throw new NotFoundError("Company not found")

    const client = await prisma.client.create({
      data: {
        companyId: command.companyId,
        name: command.name,
        taxId: command.taxId || null,
        industry: command.industry || null,
        segment: command.segment || null,
        email: command.email || null,
        phone: command.phone || null,
        createdBy: command.createdBy,
        contacts: {
          create: {
            firstName: command.contactFirstName,
            lastName: command.contactLastName,
            email: command.contactEmail,
            isPrimary: true,
          },
        },
      },
    })

    await eventBus.publish({
      type: "crm.clientCreated",
      aggregateId: client.id,
      occurredAt: new Date(),
      companyId: command.companyId,
      clientId: client.id,
      name: client.name,
      createdBy: command.createdBy,
    })

    return { clientId: client.id, name: client.name }
  }
}
export const createClientUseCase = new CreateClientUseCase()
