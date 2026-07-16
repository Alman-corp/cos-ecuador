import { prisma } from "@/lib/db/prisma"
import { eventBus, type ICommand, type ICommandHandler } from "@/core/bus"
import { NotFoundError } from "@/core/errors"
import { LeadAlreadyConvertedException } from "@/core/exceptions"
import type { IUnitOfWork } from "@/core/unit-of-work"

export interface ConvertLeadToClientCommand extends ICommand {
  readonly type: "crm.convertLeadToClient"
  leadId: string
  companyId: string
  convertedBy: string
}
export type ConvertLeadToClientResult = { clientId: string }

export interface ConvertLeadToClientDeps { uow?: IUnitOfWork }

export class ConvertLeadToClientUseCase implements ICommandHandler<ConvertLeadToClientCommand, ConvertLeadToClientResult> {
  constructor(private deps?: ConvertLeadToClientDeps) {}
  async handle(command: ConvertLeadToClientCommand): Promise<ConvertLeadToClientResult> {
    const lead = await prisma.lead.findUnique({ where: { id: command.leadId } })
    if (!lead) throw new NotFoundError("Lead not found")
    if (lead.convertedToClientId) throw new LeadAlreadyConvertedException(command.leadId)

    const client = await prisma.client.create({
      data: {
        companyId: command.companyId,
        name: `${lead.firstName} ${lead.lastName}`,
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
        score: lead.score,
        createdBy: command.convertedBy,
      },
    })
    await prisma.lead.update({
      where: { id: lead.id },
      data: { convertedToClientId: client.id, status: "converted", updatedBy: command.convertedBy },
    })
    await prisma.leadActivity.create({
      data: { leadId: lead.id, type: "conversion", notes: "Lead convertido a cliente", performedBy: command.convertedBy },
    })

    await eventBus.publish({
      type: "crm.leadConverted",
      aggregateId: lead.id,
      occurredAt: new Date(),
      companyId: command.companyId,
      leadId: lead.id,
      clientId: client.id,
      convertedBy: command.convertedBy,
    })

    return { clientId: client.id }
  }
}
export const convertLeadToClientUseCase = new ConvertLeadToClientUseCase()
