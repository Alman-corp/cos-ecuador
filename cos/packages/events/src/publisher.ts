import amqplib, { Channel, Connection } from "amqplib";
import { CosEvent, CosEventSchema } from "./events-schemas";

const EXCHANGE = "cos.events";
const EXCHANGE_TYPE = "topic";
const DLX = "cos.events.dlx";

export class EventPublisher {
  private conn: Connection | null = null;
  private channel: Channel | null = null;
  private connecting: Promise<void> | null = null;

  constructor(private rabbitmqUrl: string = process.env.RABBITMQ_URL || "amqp://localhost") {}

  async connect(): Promise<void> {
    if (this.channel) return;
    if (this.connecting) return this.connecting;
    this.connecting = (async () => {
      this.conn = await amqplib.connect(this.rabbitmqUrl);
      this.channel = await this.conn.createChannel();
      await this.channel.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true });
      await this.channel.assertExchange(DLX, "fanout", { durable: true });
      this.conn.on("close", () => {
        this.channel = null;
        this.conn = null;
        this.connecting = null;
      });
    })();
    await this.connecting;
  }

  async publish(event: CosEvent): Promise<void> {
    const parsed = CosEventSchema.parse(event);
    await this.connect();
    if (!this.channel) throw new Error("Channel not available");
    const routingKey = parsed.eventType;
    this.channel.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(parsed)), {
      persistent: true,
      contentType: "application/json",
      headers: { "x-tenant-id": parsed.tenantId },
    });
  }

  async close(): Promise<void> {
    await this.channel?.close();
    await this.conn?.close();
    this.channel = null;
    this.conn = null;
    this.connecting = null;
  }
}
