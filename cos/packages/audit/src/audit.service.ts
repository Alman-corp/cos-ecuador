import { PrismaClient } from "@prisma/client";

export interface AuditEntry {
  tenantId: string;
  action: string;
  entity: string;
  entityId?: string;
  performedBy: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export class AuditService {
  constructor(private prisma: PrismaClient) {}

  async log(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId: entry.tenantId,
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId,
          performedBy: entry.performedBy,
          before: entry.before ?? {},
          after: entry.after ?? {},
          metadata: entry.metadata ?? {},
        },
      });
    } catch {
      // Never fail the main operation due to audit logging error
    }
  }

  async findByTenant(tenantId: string, options?: { limit?: number; offset?: number; entity?: string }) {
    const where: Record<string, unknown> = { tenantId };
    if (options?.entity) where.entity = options.entity;
    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: options?.limit ?? 50,
        skip: options?.offset ?? 0,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { data, total };
  }
}
