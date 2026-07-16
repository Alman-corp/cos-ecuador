import { logger } from "@/lib/logger"

export type NotificationChannel = "email" | "in_app" | "whatsapp"
export type NotificationPriority = "low" | "medium" | "high" | "critical"
export type NotificationCategory = "alert" | "report" | "milestone" | "task" | "system"

export interface Notification {
  id: string
  companyId: string
  userId?: string
  channel: NotificationChannel
  category: NotificationCategory
  priority: NotificationPriority
  title: string
  body: string
  data?: Record<string, unknown>
  read: boolean
  sentAt: string
  readAt?: string
  scheduledFor?: string
}

export interface NotificationTemplate {
  id: string
  name: string
  category: NotificationCategory
  subject: string
  body: string
  variables: string[]
}

const TEMPLATES: Record<string, NotificationTemplate> = {
  alert_kpi_critical: {
    id: "alert_kpi_critical", name: "Alerta KPI Crítica", category: "alert",
    subject: "Alerta Crítica: {{kpi}}",
    body: "El indicador {{kpi}} ha alcanzado un nivel crítico de {{value}}. Se recomienda acción inmediata. Detalles: {{details}}",
    variables: ["kpi", "value", "details"],
  },
  report_weekly: {
    id: "report_weekly", name: "Reporte Semanal", category: "report",
    subject: "Reporte Semanal - {{company}}",
    body: "Adjuntamos el reporte semanal de indicadores para {{company}}. Health Score: {{healthScore}}. Alertas activas: {{alertCount}}.",
    variables: ["company", "healthScore", "alertCount"],
  },
  milestone_achieved: {
    id: "milestone_achieved", name: "Hito Alcanzado", category: "milestone",
    subject: "¡Hito Alcanzado! {{milestone}}",
    body: "Se ha completado el hito '{{milestone}}' como parte del plan {{planName}}. Progreso actual: {{progress}}%.",
    variables: ["milestone", "planName", "progress"],
  },
  task_assigned: {
    id: "task_assigned", name: "Tarea Asignada", category: "task",
    subject: "Nueva tarea: {{taskName}}",
    body: "Se te ha asignado la tarea '{{taskName}}' con prioridad {{priority}}. Fecha límite: {{dueDate}}.",
    variables: ["taskName", "priority", "dueDate"],
  },
}

interface NotificationTransport {
  send(notification: Notification): Promise<boolean>
}

class EmailTransport implements NotificationTransport {
  async send(notification: Notification): Promise<boolean> {
    logger.info({ to: notification.userId || notification.companyId, subject: notification.title }, "email notification")
    return true
  }
}

class InAppTransport implements NotificationTransport {
  private sent: Notification[] = []

  async send(notification: Notification): Promise<boolean> {
    this.sent.push(notification)
    if (this.sent.length > 100) this.sent.shift()
    return true
  }

  getPending(companyId: string, userId?: string): Notification[] {
    return this.sent.filter(
      (n) => n.companyId === companyId && (!userId || n.userId === userId) && !n.read,
    )
  }

  markRead(notificationId: string): boolean {
    const n = this.sent.find((n) => n.id === notificationId)
    if (n) { n.read = true; n.readAt = new Date().toISOString(); return true }
    return false
  }

  getAll(companyId: string): Notification[] {
    return this.sent.filter((n) => n.companyId === companyId)
  }
}

class NotificationService {
  private transports: Map<NotificationChannel, NotificationTransport> = new Map()
  private inApp = new InAppTransport()

  constructor() {
    this.transports.set("email", new EmailTransport())
    this.transports.set("in_app", this.inApp)
    this.transports.set("whatsapp", new EmailTransport())
  }

  getTemplate(templateId: string): NotificationTemplate | undefined {
    return TEMPLATES[templateId]
  }

  getAllTemplates(): NotificationTemplate[] {
    return Object.values(TEMPLATES)
  }

  renderTemplate(templateId: string, variables: Record<string, string>): { subject: string; body: string } | null {
    const tpl = TEMPLATES[templateId]
    if (!tpl) return null
    let subject = tpl.subject
    let body = tpl.body
    for (const [key, value] of Object.entries(variables)) {
      subject = subject.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value)
      body = body.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value)
    }
    return { subject, body }
  }

  async notify(
    companyId: string,
    channel: NotificationChannel,
    category: NotificationCategory,
    priority: NotificationPriority,
    title: string,
    body: string,
    options?: { userId?: string; data?: Record<string, unknown>; scheduledFor?: string },
  ): Promise<Notification> {
    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      companyId,
      channel,
      category,
      priority,
      title,
      body,
      read: false,
      sentAt: new Date().toISOString(),
      ...options,
    }

    const transport = this.transports.get(channel)
    if (transport) {
      try {
        await transport.send(notification)
      } catch (err) {
        logger.error({ err, channel }, "notification transport failed")
      }
    }

    if (channel !== "in_app") {
      try {
        await this.inApp.send({ ...notification, channel: "in_app" })
      } catch { }
    }

    return notification
  }

  async notifyFromTemplate(
    companyId: string,
    channel: NotificationChannel,
    templateId: string,
    variables: Record<string, string>,
    priority: NotificationPriority = "medium",
    options?: { userId?: string; data?: Record<string, unknown> },
  ): Promise<Notification | null> {
    const rendered = this.renderTemplate(templateId, variables)
    if (!rendered) return null
    const tpl = TEMPLATES[templateId]
    return this.notify(companyId, channel, tpl.category, priority, rendered.subject, rendered.body, options)
  }

  getPending(companyId: string, userId?: string): Notification[] {
    return this.inApp.getPending(companyId, userId)
  }

  markRead(notificationId: string): boolean {
    return this.inApp.markRead(notificationId)
  }

  getHistory(companyId: string): Notification[] {
    return this.inApp.getAll(companyId)
  }
}

export const notificationService = new NotificationService()
