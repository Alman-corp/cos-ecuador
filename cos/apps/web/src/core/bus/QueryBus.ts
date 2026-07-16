export interface IQuery {
  readonly type: string
}

export interface IQueryHandler<TQuery extends IQuery, TResult> {
  handle(query: TQuery): Promise<TResult>
}

export class QueryBus {
  private handlers = new Map<string, IQueryHandler<any, any>>()

  register<T extends IQuery, TResult>(type: string, handler: IQueryHandler<T, TResult>): void {
    if (this.handlers.has(type)) {
      throw new Error(`Handler already registered for query: ${type}`)
    }
    this.handlers.set(type, handler)
  }

  async ask<TResult>(query: IQuery): Promise<TResult> {
    const handler = this.handlers.get(query.type)
    if (!handler) {
      throw new Error(`No handler registered for query: ${query.type}`)
    }
    return handler.handle(query) as Promise<TResult>
  }
}

export const queryBus = new QueryBus()
