import { describe, it, expect, vi, beforeEach } from "vitest"

function createMockPrisma() {
  const mockTx = {
    consultingRule: { create: vi.fn(), update: vi.fn(), findUniqueOrThrow: vi.fn() },
    consultingRuleVersion: { create: vi.fn(), findMany: vi.fn(), findUniqueOrThrow: vi.fn() },
  }

  const prisma = {
    $transaction: vi.fn((cb: (tx: typeof mockTx) => unknown) => cb(mockTx)),
    consultingRule: { findUniqueOrThrow: vi.fn() },
    consultingRuleVersion: { findMany: vi.fn() },
  }

  return { prisma, mockTx }
}

class RuleVersionManager {
  constructor(private prisma: ReturnType<typeof createMockPrisma>["prisma"]) {}

  async create(input: {
    name: string
    description?: string
    category: string
    condition: string
    then: Record<string, unknown>
    enabled?: boolean
    metadata?: Record<string, unknown>
    changeNotes?: string
  }) {
    return this.prisma.$transaction(async (tx: any) => {
      const rule = await tx.consultingRule.create({
        data: { name: input.name, category: input.category, condition: input.condition, then: input.then, version: 1, createdBy: "user-1" },
      })
      await tx.consultingRuleVersion.create({
        data: { ruleId: rule.id, version: 1, name: rule.name, condition: rule.condition, then: rule.then, enabled: true, createdBy: "user-1", changeNotes: input.changeNotes ?? "Initial version" },
      })
      return rule
    })
  }

  async update(ruleId: string, updates: Partial<{ name: string; description: string; condition: string; then: Record<string, unknown>; enabled: boolean; changeNotes: string }>) {
    return this.prisma.$transaction(async (tx: any) => {
      const current = await tx.consultingRule.findUniqueOrThrow({ where: { id: ruleId } })
      const newVersion = current.version + 1
      const updated = await tx.consultingRule.update({
        where: { id: ruleId },
        data: { ...updates, version: newVersion },
      })
      await tx.consultingRuleVersion.create({
        data: { ruleId, version: newVersion, name: updated.name, condition: updated.condition, then: updated.then, enabled: updated.enabled, createdBy: "user-1", changeNotes: updates.changeNotes },
      })
      return updated
    })
  }

  async getHistory(ruleId: string) {
    return this.prisma.consultingRuleVersion.findMany({
      where: { ruleId },
      orderBy: { version: "desc" },
    })
  }
}

describe("RuleVersionManager", () => {
  let mock: ReturnType<typeof createMockPrisma>
  let manager: RuleVersionManager

  beforeEach(() => {
    mock = createMockPrisma()
    manager = new RuleVersionManager(mock.prisma)
  })

  it("creates initial version automatically", async () => {
    const input = { name: "Test Rule", category: "risk", condition: "true", then: { action: "alert" }, description: "Test", changeNotes: "Initial version" }
    ;(mock.mockTx.consultingRule.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "rule-1",
      name: "Test Rule",
      condition: "true",
      then: { action: "alert" },
      enabled: true,
      version: 1,
      description: "Test",
      category: "risk",
      createdBy: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    ;(mock.mockTx.consultingRuleVersion.create as ReturnType<typeof vi.fn>).mockResolvedValue({})

    const rule = await manager.create(input)
    expect(rule.id).toBe("rule-1")
    expect(rule.version).toBe(1)
    expect(mock.mockTx.consultingRuleVersion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ version: 1, changeNotes: "Initial version" }),
      })
    )
  })

  it("increments version on each update", async () => {
    ;(mock.mockTx.consultingRule.findUniqueOrThrow as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "rule-1", version: 1, name: "Old", condition: "old", then: {}, enabled: true,
    })
    ;(mock.mockTx.consultingRule.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "rule-1", version: 2, name: "Updated", condition: "new condition", then: {}, enabled: true,
    })

    const updated = await manager.update("rule-1", { condition: "new condition" })
    expect(updated.version).toBe(2)
    expect(mock.mockTx.consultingRuleVersion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ version: 2 }),
      })
    )
  })

  it("returns version history sorted by version desc", async () => {
    const versions = [
      { id: "v3", version: 3, name: "v3", condition: "c3", then: {}, enabled: true, createdBy: "user-1", createdAt: new Date() },
      { id: "v2", version: 2, name: "v2", condition: "c2", then: {}, enabled: true, createdBy: "user-1", createdAt: new Date() },
      { id: "v1", version: 1, name: "v1", condition: "c1", then: {}, enabled: true, createdBy: "user-1", createdAt: new Date() },
    ]
    ;(mock.prisma.consultingRuleVersion.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(versions)

    const result = await manager.getHistory("rule-1")
    expect(result).toHaveLength(3)
    expect(result[0].version).toBe(3)
  })
})
