import amqplib, { Channel, Connection, ConsumeMessage } from "amqplib";
import { CosEvent, CosEventSchema } from "./events-schemas";

const EXCHANGE = "cos.events";
const DLX = "cos.events.dlx";
const MAX_RETRIES = 3;

export type EventHandler = (event: CosEvent) => Promise<void>;

export class EventConsumer {
  private conn: Connection | null = null;
  private channel: Channel | null = null;
  private handlers = new Map<string, EventHandler[]>();

  constructor(private rabbitmqUrl: string = process.env.RABBITMQ_URL || "amqp://localhost") {}

  async connect(): Promise<void> {
    this.conn = await amqplib.connect(this.rabbitmqUrl);
    this.channel = await this.conn.createChannel();
    await this.channel.assertExchange(EXCHANGE, "topic", { durable: true });
    await this.channel.assertExchange(DLX, "fanout", { durable: true });
    await this.channel.assertQueue("cos.events.dlq", { durable: true });
    await this.channel.bindQueue("cos.events.dlq", DLX, "#");
  }

  on(eventType: string, handler: EventHandler): void {
    const existing = this.handlers.get(eventType) || [];
    existing.push(handler);
    this.handlers.set(eventType, existing);
  }

  async subscribe(routingKeys: string[], queueName: string): Promise<void> {
    if (!this.channel) throw new Error("Not connected");
    const { queue } = await this.channel.assertQueue(queueName, {
      durable: true,
      deadLetterExchange: DLX,
      maxPriority: 10,
    });
    for (const key of routingKeys) {
      await this.channel.bindQueue(queue, EXCHANGE, key);
    }
    await this.channel.prefetch(1);
    await this.channel.consume(queue, async (msg: ConsumeMessage | null) => {
      if (!msg) return;
      try {
        const raw = JSON.parse(msg.content.toString());
        const event = CosEventSchema.parse(raw);
        const handlers = this.handlers.get(event.eventType) || [];
        await Promise.all(handlers.map((h) => h(event)));
        this.channel?.ack(msg);
      } catch (err) {
        const retries = (msg.properties.headers?.["x-retries"] as number) || 0;
        if (retries < MAX_RETRIES) {
          this.channel?.nack(msg, false, false);
        } else {
          this.channel?.reject(msg, false);
        }
      }
    });
  }

  async close(): Promise<void> {
    await this.channel?.close();
    await this.conn?.close();
    this.channel = null;
    this.conn = null;
  }
}
