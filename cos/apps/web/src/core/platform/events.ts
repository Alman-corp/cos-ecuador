import { CoreEvent, type CoreEventPayload } from "./contracts"
import { logger } from "@/lib/logger"

type EventHandler = (payload: CoreEventPayload) => Promise<void> | void

interface Subscription {
  event: CoreEvent
  handler: EventHandler
  priority: number
  source: string
}

class PlatformEventBus {
  private subscribers: Subscription[] = []
  private history: CoreEventPayload[] = []
  private maxHistory = 100

  subscribe(event: CoreEvent, handler: EventHandler, source: string, priority = 0) {
    this.subscribers.push({ event, handler, priority, source })
    this.subscribers.sort((a, b) => b.priority - a.priority)
  }

  unsubscribe(event: CoreEvent, source: string) {
    this.subscribers = this.subscribers.filter((s) => !(s.event === event && s.source === source))
  }

  async emit(event: CoreEvent, data: Record<string, any>, source: string) {
    const payload: CoreEventPayload = { event, timestamp: new Date().toISOString(), data, source }

    this.history.push(payload)
    if (this.history.length > this.maxHistory) this.history.shift()

    const handlers = this.subscribers
      .filter((s) => s.event === event)
      .sort((a, b) => b.priority - a.priority)

    for (const sub of handlers) {
      try {
        await sub.handler(payload)
      } catch (err) {
        logger.error({ err, source: sub.source }, "platform event handler error")
      }
    }
  }

  getHistory(event?: CoreEvent): CoreEventPayload[] {
    return event ? this.history.filter((h) => h.event === event) : this.history
  }

  clear() {
    this.history = []
  }
}

export const platformEvents = new PlatformEventBus()
