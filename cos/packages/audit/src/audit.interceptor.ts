import "reflect-metadata";

export interface AuditInterceptorOptions {
  getTenantId: () => string;
  getUserId: () => string;
  log: (entry: {
    tenantId: string;
    action: string;
    entity: string;
    entityId?: string;
    performedBy: string;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  }) => Promise<void>;
}

export function createAuditInterceptor(options: AuditInterceptorOptions) {
  return function intercept(target: object, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    const original = descriptor.value;
    descriptor.value = async function (...args: unknown[]) {
      const config: { action: string; entity: string } | undefined = Reflect.getMetadata("audit:config", target, propertyKey);
      if (!config) return original.apply(this, args);
      const before = { ...(args[0] as Record<string, unknown>) };
      const result = await original.apply(this, args);
      try {
        await options.log({
          tenantId: options.getTenantId(),
          action: config.action,
          entity: config.entity,
          entityId: result?.id as string | undefined,
          performedBy: options.getUserId(),
          before,
          after: result as Record<string, unknown> | undefined,
        });
      } catch {
        // Never fail the main operation due to audit logging error
      }
      return result;
    };
    return descriptor;
  };
}
