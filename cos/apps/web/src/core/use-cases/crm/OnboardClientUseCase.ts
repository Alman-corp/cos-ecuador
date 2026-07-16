import { prisma } from "@/lib/db/prisma"
import { commandBus, eventBus, type ICommand, type ICommandHandler } from "@/core/bus"
import { financialAnalysisService } from "@/core/services/FinancialAnalysisService"
import type { IUnitOfWork } from "@/core/unit-of-work"
import type { CreateClientCommand, CreateClientResult } from "./CreateClientUseCase"
import type { ConvertLeadToClientCommand } from "./ConvertLeadToClientUseCase"

export interface OnboardClientCommand extends ICommand {
  readonly type: "crm.onboardClient"
  companyId: string
  leadId?: string
  clientData: { name: string; taxId?: string; industry?: string; email?: string; phone?: string }
  initialDocs?: { title: string; fileUrl: string; documentType: string }[]
  contactName: string
  contactEmail: string
  createdBy: string
}

export interface OnboardClientDeps { uow?: IUnitOfWork }

export class OnboardClientUseCase implements ICommandHandler<OnboardClientCommand, { clientId: string }> {
  constructor(private deps?: OnboardClientDeps) {}
  async handle(command: OnboardClientCommand): Promise<{ clientId: string }> {
    const cmd: CreateClientCommand = {
      type: "crm.createClient",
      companyId: command.companyId,
      name: command.clientData.name,
      taxId: command.clientData.taxId,
      industry: command.clientData.industry,
      email: command.clientData.email,
      phone: command.clientData.phone,
      contactFirstName: command.contactName.split(" ")[0] || command.contactName,
      contactLastName: command.contactName.split(" ").slice(1).join(" ") || "",
      contactEmail: command.contactEmail,
      createdBy: command.createdBy,
    }
    const { clientId } = await commandBus.dispatch<CreateClientCommand, CreateClientResult>(cmd)

    if (command.initialDocs) {
      await prisma.document.createMany({
        data: command.initialDocs.map((doc) => ({
          companyId: command.companyId, clientId,
          title: doc.title, documentType: doc.documentType, fileUrl: doc.fileUrl,
          status: "pending", uploadedBy: command.createdBy,
        })),
      })
    }

    if (command.leadId) {
      const convertCmd: ConvertLeadToClientCommand = {
        type: "crm.convertLeadToClient",
        leadId: command.leadId, companyId: command.companyId, convertedBy: command.createdBy,
      }
      await commandBus.dispatch(convertCmd)
    }

    const health = financialAnalysisService.assessHealth(
      financialAnalysisService.calculateRatios({
        currentAssets: 0, cash: 0, accountsReceivable: 0, inventory: 0,
        nonCurrentAssets: 0, totalAssets: 0, currentLiabilities: 0, longTermDebt: 0,
        totalLiabilities: 0, equity: 0, revenue: 0, cogs: 0, grossProfit: 0,
        opex: 0, ebitda: 0, netIncome: 0,
      }),
    )

    await prisma.auditLog.create({
      data: {
        companyId: command.companyId, userId: command.createdBy,
        action: "CLIENT_ONBOARDED", entity: "client", entityId: clientId,
        newValues: { clientId, healthStatus: health.status, healthScore: health.score },
      },
    })

    await eventBus.publish({
      type: "crm.clientOnboarded",
      aggregateId: clientId,
      occurredAt: new Date(),
      companyId: command.companyId,
      clientId,
      documentsCount: command.initialDocs?.length ?? 0,
      healthStatus: health.status,
      createdBy: command.createdBy,
    })

    return { clientId }
  }
}
export const onboardClientUseCase = new OnboardClientUseCase()
