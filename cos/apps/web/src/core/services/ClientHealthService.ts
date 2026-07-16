export interface ClientProfile {
  id: string
  score: number
  daysSinceLastInteraction: number
  documentsUploaded: number
  documentsPending: number
  activeProjects: number
  overdueTasks: number
  openTickets: number
  paymentStatus: "current" | "late" | "critical"
}

export interface ClientHealthScore {
  overall: number
  status: "healthy" | "attention" | "risk" | "churn"
  dimensions: {
    engagement: number
    documentation: number
    operational: number
    financial: number
  }
  alerts: string[]
}

export class ClientHealthService {
  calculateHealth(client: ClientProfile): ClientHealthScore {
    const alerts: string[] = []

    const engagement = Math.max(0, 100 - client.daysSinceLastInteraction * 2)
    if (client.daysSinceLastInteraction > 30) alerts.push("Cliente sin interacción en más de 30 días")

    const docRatio = client.documentsUploaded / (client.documentsUploaded + client.documentsPending + 1)
    const documentation = Math.round(docRatio * 100)
    if (client.documentsPending > 5) alerts.push(`${client.documentsPending} documentos pendientes`)

    const taskRatio = client.activeProjects > 0 ? (1 - client.overdueTasks / (client.activeProjects * 5 + 1)) : 1
    const operational = Math.round(Math.max(0, taskRatio * 100))
    if (client.overdueTasks > 3) alerts.push(`${client.overdueTasks} tareas vencidas`)

    const financialMap = { current: 100, late: 40, critical: 0 }
    const financial = financialMap[client.paymentStatus]
    if (client.paymentStatus !== "current") alerts.push("Cliente con pagos atrasados")

    const overall = Math.round((engagement * 0.25 + documentation * 0.25 + operational * 0.25 + financial * 0.25))
    const status = overall >= 80 ? "healthy" : overall >= 60 ? "attention" : overall >= 40 ? "risk" : "churn"

    return { overall, status, dimensions: { engagement, documentation, operational, financial }, alerts }
  }
}

export const clientHealthService = new ClientHealthService()
