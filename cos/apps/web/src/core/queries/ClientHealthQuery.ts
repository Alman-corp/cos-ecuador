import { prisma } from "@/lib/db/prisma"
import { clientHealthService } from "@/core/services/ClientHealthService"
import type { IQuery, IQueryHandler } from "@/core/bus"
import type { ClientHealthScore } from "@/core/services/ClientHealthService"

export interface ClientHealthQuery extends IQuery {
  readonly type: "client.clientHealth"
  companyId: string
  clientId: string
}

export class ClientHealthHandler implements IQueryHandler<ClientHealthQuery, ClientHealthScore> {
  async handle(query: ClientHealthQuery): Promise<ClientHealthScore> {
    const client = await prisma.client.findFirst({
      where: { id: query.clientId, companyId: query.companyId },
    })
    if (!client) throw new Error("Client not found")

    const docs = await prisma.document.findMany({ where: { clientId: query.clientId } })
    const tickets = await prisma.ticket.findMany({ where: { clientId: query.clientId } })
    const projects = await prisma.project.findMany({ where: { clientId: query.clientId } })

    return clientHealthService.calculateHealth({
      id: client.id,
      score: client.score || 0,
      daysSinceLastInteraction: 0,
      documentsUploaded: docs.filter((d) => d.status === "processed").length,
      documentsPending: docs.filter((d) => d.status === "pending").length,
      activeProjects: projects.filter((p) => p.status !== "completed").length,
      overdueTasks: 0,
      openTickets: tickets.filter((t) => t.status === "open").length,
      paymentStatus: "current",
    })
  }
}

export const clientHealthHandler = new ClientHealthHandler()
