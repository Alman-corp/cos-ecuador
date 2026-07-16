import { unitOfWork } from "../unit-of-work"
import { createClientUseCase, type CreateClientCommand, type CreateClientResult } from "../use-cases/crm"
import { success, type Result, failure } from "../result"

export class CrmFacade {
  async createClient(data: CreateClientCommand): Promise<Result<CreateClientResult>> {
    try {
      const result = await unitOfWork.run(async (uow) => {
        const uc = new (createClientUseCase.constructor as any)({ uow })
        return uc.handle(data)
      })
      return success(result)
    } catch (err: any) {
      return failure(err)
    }
  }

  async convertLead(data: { leadId: string; companyId: string; convertedBy: string }): Promise<Result<any>> {
    try {
      const result = await unitOfWork.run(async () => {
        const { convertLeadToClientUseCase } = await import("../use-cases/crm")
        return convertLeadToClientUseCase.handle({ ...data, type: "crm.convertLeadToClient" })
      })
      return success(result)
    } catch (err: any) {
      return failure(err)
    }
  }

  async onboardClient(data: {
    companyId: string; leadId?: string
    clientData: { name: string; taxId?: string; industry?: string; email?: string; phone?: string }
    initialDocs?: { title: string; fileUrl: string; documentType: string }[]
    contactName: string; contactEmail: string; createdBy: string
  }): Promise<Result<{ clientId: string }>> {
    try {
      const result = await unitOfWork.run(async () => {
        const { onboardClientUseCase } = await import("../use-cases/crm")
        return onboardClientUseCase.handle({ ...data, type: "crm.onboardClient" })
      })
      return success(result)
    } catch (err: any) {
      return failure(err)
    }
  }
}

export const crmFacade = new CrmFacade()
