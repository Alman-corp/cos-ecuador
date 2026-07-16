import { eventBus } from "../bus/EventBus"
import type { IEvent } from "../bus/EventBus"
import { logger } from "@/lib/logger"

interface OutboxMessage {
  id: string
  eventType: string
  aggregateId: string
  payload: IEvent
  status: "pending" | "sent" | "failed"
  createdAt: Date
}

const inbox: OutboxMessage[] = []

export async function appendToOutbox(event: IEvent): Promise<void> {
  inbox.push({
    id: crypto.randomUUID(),
    eventType: event.type,
    aggregateId: event.aggregateId,
    payload: event,
    status: "pending",
    createdAt: new Date(),
  })
}

export async function processOutbox(batchSize = 50): Promise<number> {
  const pending = inbox.filter((m) => m.status === "pending").slice(0, batchSize)
  for (const msg of pending) {
    try {
      await eventBus.publish(msg.payload)
      msg.status = "sent"
    } catch {
      msg.status = "failed"
    }
  }
  return pending.length
}

export class OutboxWorker {
  private running = false
  private interval: ReturnType<typeof setInterval> | null = null

  start(ms = 5000): void {
    if (this.running) return
    this.running = true
    this.interval = setInterval(async () => {
      try { await processOutbox() }
      catch (e) { logger.error({ err: e }, "outbox worker error") }
    }, ms)
  }

  stop(): void {
    this.running = false
    if (this.interval) { clearInterval(this.interval); this.interval = null }
  }
}

export const outboxWorker = new OutboxWorker()
