import type { PrismaClient, ConsultingRule } from "@prisma/client"

export interface CreateRuleInput {
  name: string
  description?: string
  category: string
  condition: string
  then: Record<string, unknown>
  enabled?: boolean
  metadata?: Record<string, unknown>
  changeNotes?: string
}

export class RuleVersionManager {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateRuleInput, userId: string): Promise<ConsultingRule> {
    return this.prisma.$transaction(async (tx) => {
      const rule = await tx.consultingRule.create({
        data: {
          name: input.name,
          description: input.description,
          category: input.category,
          condition: input.condition,
          then: input.then,
          enabled: input.enabled ?? true,
          metadata: input.metadata,
          version: 1,
          createdBy: userId,
        },
      })

      await tx.consultingRuleVersion.create({
        data: {
          ruleId: rule.id,
          version: 1,
          name: rule.name,
          description: rule.description,
          condition: rule.condition,
          then: rule.then as Record<string, unknown>,
          enabled: rule.enabled,
          createdBy: userId,
          changeNotes: input.changeNotes ?? "Initial version",
        },
      })

      return rule
    })
  }

  async update(
    ruleId: string,
    updates: Partial<CreateRuleInput>,
    userId: string
  ): Promise<ConsultingRule> {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.consultingRule.findUniqueOrThrow({
        where: { id: ruleId },
      })

      const newVersion = current.version + 1

      const updated = await tx.consultingRule.update({
        where: { id: ruleId },
        data: {
          ...(updates.name && { name: updates.name }),
          ...(updates.description !== undefined && { description: updates.description }),
          ...(updates.category && { category: updates.category }),
          ...(updates.condition && { condition: updates.condition }),
          ...(updates.then && { then: updates.then }),
          ...(updates.enabled !== undefined && { enabled: updates.enabled }),
          ...(updates.metadata && { metadata: updates.metadata }),
          version: newVersion,
          updatedBy: userId,
        },
      })

      await tx.consultingRuleVersion.create({
        data: {
          ruleId,
          version: newVersion,
          name: updated.name,
          description: updated.description,
          condition: updated.condition,
          then: updated.then as Record<string, unknown>,
          enabled: updated.enabled,
          createdBy: userId,
          changeNotes: updates.changeNotes,
        },
      })

      return updated
    })
  }

  async rollback(ruleId: string, targetVersion: number, userId: string): Promise<ConsultingRule> {
    return this.prisma.$transaction(async (tx) => {
      const historical = await tx.consultingRuleVersion.findUniqueOrThrow({
        where: { ruleId_version: { ruleId, version: targetVersion } },
      })

      return this.update(
        ruleId,
        {
          name: historical.name,
          description: historical.description ?? undefined,
          condition: historical.condition,
          then: historical.then as Record<string, unknown>,
          enabled: historical.enabled,
          changeNotes: `Rollback to version ${targetVersion}`,
        },
        userId
      )
    })
  }

  async getHistory(ruleId: string) {
    return this.prisma.consultingRuleVersion.findMany({
      where: { ruleId },
      orderBy: { version: "desc" },
    })
  }

  async diff(ruleId: string, v1: number, v2: number) {
    const [version1, version2] = await Promise.all([
      this.prisma.consultingRuleVersion.findUniqueOrThrow({
        where: { ruleId_version: { ruleId, version: v1 } },
      }),
      this.prisma.consultingRuleVersion.findUniqueOrThrow({
        where: { ruleId_version: { ruleId, version: v2 } },
      }),
    ])

    return {
      v1: version1,
      v2: version2,
      changed: {
        name: version1.name !== version2.name,
        description: version1.description !== version2.description,
        condition: version1.condition !== version2.condition,
        then:
          JSON.stringify(version1.then) !== JSON.stringify(version2.then),
        enabled: version1.enabled !== version2.enabled,
      },
    }
  }
}
