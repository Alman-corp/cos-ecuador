import type { PrismaClient } from "@prisma/client"
import type { DeclarativeRule } from "./types"
import type { RulesRepository } from "./calculator"

export class PrismaRulesRepository implements RulesRepository {
  constructor(private prisma: PrismaClient) {}

  async loadAll(): Promise<DeclarativeRule[]> {
    const models = await this.prisma.consultingRule.findMany({
      where: { enabled: true },
    })

    return models.map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description ?? undefined,
      category: m.category as DeclarativeRule["category"],
      condition: m.condition,
      priority: m.priority,
      then: m.then as unknown as DeclarativeRule["then"],
      enabled: m.enabled,
      validFrom: m.validFrom?.toISOString(),
      validTo: m.validTo?.toISOString(),
      tags: m.tags as string[] | undefined,
      metadata: m.metadata as Record<string, unknown> | undefined,
    }))
  }
}
