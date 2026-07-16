export interface IEvent {
  readonly type: string
  readonly aggregateId: string
  readonly occurredAt: Date
  [key: string]: unknown
}

export interface IEventHandler<TEvent extends IEvent> {
  handle(event: TEvent): Promise<void>
}

export class EventBus {
  private handlers = new Map<string, IEventHandler<any>[]>()

  register<T extends IEvent>(type: string, handler: IEventHandler<T>): void {
    const handlers = this.handlers.get(type) || []
    handlers.push(handler)
    this.handlers.set(type, handlers)
  }

  async publish(event: IEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) || []
    await Promise.all(handlers.map((h) => h.handle(event)))
  }
}

export const eventBus = new EventBus()
