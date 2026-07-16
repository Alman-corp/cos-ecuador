import { AsyncLocalStorage } from "async_hooks"

export const tenantStorage = new AsyncLocalStorage<string>()

export function getCurrentTenantId(): string | undefined {
  return tenantStorage.getStore()
}

export function runWithTenant<T>(tenantId: string, fn: () => Promise<T>): Promise<T> {
  return tenantStorage.run(tenantId, fn)
}
