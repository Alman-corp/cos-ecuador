import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import * as amqp from "amqplib"
import { NotificationsService } from "../notifications/notifications.service"

interface ConsumableEvent {
  eventType: string
  aggregateId: string
  aggregateType: string
  data: Record<string, unknown>
  metadata?: Record<string, unknown>
  timestamp?: string
}

const EVENT_CHANNEL_MAP: Record<string, string> = {
  "tax.obligation.due_soon": "email",
  "tax.obligation.overdue": "email",
  "tax.declaration.reminder": "email",
  "tax.payment.confirmed": "in_app",
  "tax.payment.failed": "email",
  "sri.invoice.received": "in_app",
  "sri.invoice.rejected": "email",
  "compliance.audit.triggered": "slack",
  "company.document.expiring": "email",
  "company.document.expired": "email",
  "system.alert": "slack",
}

const EVENT_TYPE_MAP: Record<string, string> = {
  "tax.obligation.due_soon": "obligation_due_soon",
  "tax.obligation.overdue": "obligation_overdue",
  "tax.declaration.reminder": "declaration_reminder",
  "tax.payment.confirmed": "payment_confirmed",
  "tax.payment.failed": "payment_failed",
  "sri.invoice.received": "sri_invoice_received",
  "sri.invoice.rejected": "sri_invoice_rejected",
  "compliance.audit.triggered": "audit_triggered",
  "company.document.expiring": "document_expiring",
  "company.document.expired": "document_expired",
  "system.alert": "system_alert",
}

@Injectable()
export class EventsConsumer implements OnModuleDestroy {
  private readonly logger = new Logger(EventsConsumer.name)
  private connection: amqp.Connection | null = null
  private channel: amqp.Channel | null = null

  constructor(
    private config: ConfigService,
    private notifications: NotificationsService
  ) {
    this.init()
  }

  private async init(): Promise<void> {
    try {
      const url = this.config.get<string>("RABBITMQ_URL", "amqp://localhost:5672")
      this.connection = await amqp.connect(url)
      this.channel = await this.connection.createChannel()

      const exchange = "notifications"
      const queue = "notifications.queue"

      await this.channel.assertExchange(exchange, "topic", { durable: true })
      await this.channel.assertQueue(queue, { durable: true })
      await this.channel.bindQueue(queue, exchange, "#")

      this.channel.consume(queue, async (msg) => {
        if (!msg) return

        try {
          const event: ConsumableEvent = JSON.parse(msg.content.toString())
          await this.handleEvent(event)
          this.channel!.ack(msg)
        } catch (err) {
          this.logger.error(`Failed to process event: ${err}`)
          this.channel!.nack(msg, false, false)
        }
      })

      this.logger.log("Listening for domain events on notifications queue")
    } catch (err) {
      this.logger.warn(`RabbitMQ consumer not available: ${err}`)
    }
  }

  private async handleEvent(event: ConsumableEvent): Promise<void> {
    const channel = EVENT_CHANNEL_MAP[event.eventType]
    const type = EVENT_TYPE_MAP[event.eventType]

    if (!channel || !type) {
      this.logger.debug(`No handler for event type: ${event.eventType}`)
      return
    }

    const companyId = (event.metadata?.companyId ?? event.data.companyId ?? "") as string
    const userId = (event.metadata?.userId ?? event.data.userId ?? "") as string

    if (!companyId || !userId) {
      this.logger.warn(`Event ${event.eventType} missing companyId/userId`)
      return
    }

    await this.notifications.send({
      companyId,
      userId,
      channel,
      type,
      templateType: type,
      variables: event.data as Record<string, unknown>,
      referenceType: event.aggregateType,
      referenceId: event.aggregateId,
      metadata: event.metadata,
    })
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.channel?.close()
      await this.connection?.close()
    } catch {
      // ignore close errors
    }
  }
}
