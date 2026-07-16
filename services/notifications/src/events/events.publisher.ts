import { Injectable, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import * as amqp from "amqplib"

export interface DomainEvent {
  eventType: string
  aggregateId: string
  aggregateType: string
  data: Record<string, unknown>
  metadata?: Record<string, unknown>
}

@Injectable()
export class EventsPublisher {
  private readonly logger = new Logger(EventsPublisher.name)
  private connection: amqp.Connection | null = null
  private channel: amqp.Channel | null = null
  private readonly exchange = "notifications"

  constructor(private config: ConfigService) {
    this.init()
  }

  private async init(): Promise<void> {
    try {
      const url = this.config.get<string>("RABBITMQ_URL", "amqp://localhost:5672")
      this.connection = await amqp.connect(url)
      this.channel = await this.connection.createChannel()
      await this.channel.assertExchange(this.exchange, "topic", { durable: true })
      this.logger.log("Connected to RabbitMQ for publishing")
    } catch (err) {
      this.logger.warn(`RabbitMQ not available: ${err}`)
    }
  }

  async publish(event: DomainEvent): Promise<void> {
    if (!this.channel) {
      this.logger.warn("RabbitMQ not connected, event will not be published")
      return
    }

    const routingKey = `notification.${event.eventType}`
    const message = Buffer.from(
      JSON.stringify({
        ...event,
        timestamp: new Date().toISOString(),
      })
    )

    try {
      this.channel.publish(this.exchange, routingKey, message, {
        persistent: true,
        contentType: "application/json",
      })
      this.logger.log(`Event published: ${routingKey}`)
    } catch (err) {
      this.logger.error(`Failed to publish event: ${err}`)
    }
  }

  async close(): Promise<void> {
    try {
      await this.channel?.close()
      await this.connection?.close()
    } catch {
      // ignore close errors
    }
  }
}
