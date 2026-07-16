import { unitOfWork } from "../unit-of-work"
import { registerCompanyUseCase, type RegisterCompanyCommand, type RegisterCompanyResult } from "../use-cases/identity"
import { success, type Result, failure } from "../result"

export class IdentityFacade {
  async registerCompany(data: RegisterCompanyCommand): Promise<Result<RegisterCompanyResult>> {
    try {
      const result = await unitOfWork.run(async (uow) => {
        const uc = new (registerCompanyUseCase.constructor as any)({ uow })
        return uc.handle(data)
      })
      return success(result)
    } catch (err: any) {
      return failure(err)
    }
  }

  async inviteUser(data: { companyId: string; email: string; roleId: string; invitedBy: string }): Promise<Result<any>> {
    try {
      const result = await unitOfWork.run(async () => {
        const { inviteUserUseCase } = await import("../use-cases/identity")
        return inviteUserUseCase.handle({ ...data, type: "identity.inviteUser" })
      })
      return success(result)
    } catch (err: any) {
      return failure(err)
    }
  }

  async createRole(data: { companyId: string; name: string; permissions: string[]; createdBy: string }): Promise<Result<any>> {
    try {
      const result = await unitOfWork.run(async () => {
        const { createRoleUseCase } = await import("../use-cases/identity")
        return createRoleUseCase.handle({ ...data, type: "identity.createRole" })
      })
      return success(result)
    } catch (err: any) {
      return failure(err)
    }
  }
}

export const identityFacade = new IdentityFacade()
