import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/core/persistence", () => ({
  persistence: { register: vi.fn(), scheduleSave: vi.fn(), loadAll: vi.fn() },
  ensurePersistence: vi.fn(),
}))

import { memoryStore } from "./store"

describe("MemoryStore", () => {
  beforeEach(() => {
    memoryStore.clear()
  })

  describe("store", () => {
    it("adds an entry to the store", () => {
      const entry = memoryStore.store({
        companyId: "c1", type: "kpi_change", title: "Test", description: "test",
        entities: [], tags: [], userId: "u1", userName: "User",
        importance: "medium",
      })
      expect(entry).toHaveProperty("id")
      expect(entry).toHaveProperty("timestamp")
      expect(entry.companyId).toBe("c1")
      expect(entry.type).toBe("kpi_change")
    })
  })

  describe("getRecent", () => {
    it("returns recent entries", () => {
      memoryStore.store({ companyId: "c1", type: "decision", title: "a", description: "a", entities: [], tags: [], userId: "u1", userName: "U", importance: "low" })
      memoryStore.store({ companyId: "c1", type: "decision", title: "b", description: "b", entities: [], tags: [], userId: "u1", userName: "U", importance: "medium" })
      const recent = memoryStore.getRecent("c1", 10)
      expect(recent.length).toBe(2)
    })
  })

  describe("summarize", () => {
    it("returns summary stats", () => {
      memoryStore.store({ companyId: "c1", type: "kpi_change", title: "t", description: "d", entities: [], tags: [], userId: "u1", userName: "U", importance: "high" })
      const summary = memoryStore.summarize("c1")
      expect(summary).toHaveProperty("total")
      expect(summary).toHaveProperty("byType")
      expect(summary).toHaveProperty("byImportance")
      expect(summary).toHaveProperty("critical")
    })
  })

  describe("query", () => {
    it("filters entries by type and importance", () => {
      memoryStore.store({ companyId: "c1", type: "decision", title: "a", description: "a", entities: [], tags: [], userId: "u1", userName: "U", importance: "high" })
      memoryStore.store({ companyId: "c1", type: "kpi_change", title: "b", description: "b", entities: [], tags: [], userId: "u1", userName: "U", importance: "low" })
      const results = memoryStore.query({ companyId: "c1", type: "decision", importance: "high" })
      expect(results.length).toBe(1)
      expect(results[0].title).toBe("a")
    })
  })

  describe("getByEntity", () => {
    it("finds entries by entity id", () => {
      memoryStore.store({ companyId: "c1", type: "note", title: "Note", description: "desc", entities: ["ent_1"], tags: [], userId: "u1", userName: "U", importance: "low" })
      const results = memoryStore.getByEntity("ent_1", "c1")
      expect(results.length).toBe(1)
    })
  })

  describe("getTimeline", () => {
    it("returns entries from recent days", () => {
      memoryStore.store({ companyId: "c1", type: "event", title: "Event", description: "desc", entities: [], tags: [], userId: "u1", userName: "U", importance: "medium" })
      const timeline = memoryStore.getTimeline("c1", undefined, 30)
      expect(timeline.length).toBe(1)
    })
  })

  describe("restoreAll", () => {
    it("restores entries from external data", () => {
      const data = [{
        id: "mem_1", companyId: "c1", type: "decision" as const, title: "Restored", description: "restored",
        entities: [], tags: [], metadata: {}, timestamp: new Date().toISOString(), userId: "u1",
        userName: "U", importance: "medium" as const,
      }]
      memoryStore.restoreAll(data)
      const all = memoryStore.getAll()
      expect(all.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe("clear", () => {
    it("clears all entries", () => {
      memoryStore.store({ companyId: "c1", type: "decision", title: "a", description: "a", entities: [], tags: [], userId: "u1", userName: "U", importance: "medium" })
      memoryStore.clear()
      expect(memoryStore.getAll().length).toBe(0)
    })
  })

  describe("getAll", () => {
    it("returns all entries", () => {
      const all = memoryStore.getAll()
      expect(Array.isArray(all)).toBe(true)
    })
  })
})
