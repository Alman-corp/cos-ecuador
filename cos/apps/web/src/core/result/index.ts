export type Result<T, E = Error> = Success<T> | Failure<E>

export class Success<T, E = never> {
  readonly _tag = "success" as const
  constructor(public readonly value: T) {}
  isSuccess(): this is Success<T, E> { return true }
  isFailure(): this is Failure<E> { return false }
  getOrThrow(): T { return this.value }
}

export class Failure<E = Error, T = never> {
  readonly _tag = "failure" as const
  constructor(public readonly error: E) {}
  isSuccess(): this is Success<T, E> { return false }
  isFailure(): this is Failure<E, T> { return true }
  getOrThrow(): never { throw this.error }
}

export function success<T, E = never>(value: T): Result<T, E> {
  return new Success(value)
}

export function failure<T = never, E = Error>(error: E): Result<T, E> {
  return new Failure(error)
}

export function fromThrowable<T>(fn: () => T): Result<T, Error> {
  try { return success(fn()) }
  catch (error) { return failure(error instanceof Error ? error : new Error(String(error))) }
}

export async function fromPromise<T>(promise: Promise<T>): Promise<Result<T, Error>> {
  try { return success(await promise) }
  catch (error) { return failure(error instanceof Error ? error : new Error(String(error))) }
}
