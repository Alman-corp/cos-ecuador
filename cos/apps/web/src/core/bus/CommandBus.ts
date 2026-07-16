export interface ICommand {
  readonly type: string
}

export interface ICommandHandler<TCommand extends ICommand, TResult = void> {
  handle(command: TCommand): Promise<TResult>
}

export class CommandBus {
  private handlers = new Map<string, ICommandHandler<any, any>>()

  register<T extends ICommand, TResult>(type: string, handler: ICommandHandler<T, TResult>): void {
    if (this.handlers.has(type)) {
      throw new Error(`Handler already registered for command: ${type}`)
    }
    this.handlers.set(type, handler)
  }

  async dispatch<T extends ICommand, TResult = void>(command: T): Promise<TResult> {
    const handler = this.handlers.get(command.type)
    if (!handler) {
      throw new Error(`No handler registered for command: ${command.type}`)
    }
    return handler.handle(command) as Promise<TResult>
  }

}

export const commandBus = new CommandBus()
