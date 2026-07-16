import { commandBus } from "./bus/CommandBus"
import { queryBus } from "./bus/QueryBus"
import { eventBus } from "./bus/EventBus"
import { outboxWorker } from "./outbox"

// Use Cases
import { registerCompanyUseCase } from "./use-cases/identity/RegisterCompanyUseCase"
import { inviteUserUseCase } from "./use-cases/identity/InviteUserUseCase"
import { createRoleUseCase } from "./use-cases/identity/CreateRoleUseCase"
import { createClientUseCase } from "./use-cases/crm/CreateClientUseCase"
import { convertLeadToClientUseCase } from "./use-cases/crm/ConvertLeadToClientUseCase"
import { onboardClientUseCase } from "./use-cases/crm/OnboardClientUseCase"
import { analyzeFinancialStatementsUseCase } from "./use-cases/consulting/AnalyzeFinancialStatementsUseCase"

// Queries
import { dashboardDirectorHandler } from "./queries/DashboardDirectorQuery"
import { clientHealthHandler } from "./queries/ClientHealthQuery"

export function registerCore() {
  // Commands
  commandBus.register("identity.registerCompany", registerCompanyUseCase)
  commandBus.register("identity.inviteUser", inviteUserUseCase)
  commandBus.register("identity.createRole", createRoleUseCase)
  commandBus.register("crm.createClient", createClientUseCase)
  commandBus.register("crm.convertLeadToClient", convertLeadToClientUseCase)
  commandBus.register("crm.onboardClient", onboardClientUseCase)
  commandBus.register("consulting.analyzeFinancialStatements", analyzeFinancialStatementsUseCase)

  // Queries
  queryBus.register("dashboard.director", dashboardDirectorHandler)
  queryBus.register("client.clientHealth", clientHealthHandler)

  // Start outbox worker
  outboxWorker.start(5000)
}
