import { describe, it, expect, vi } from "vitest"

vi.mock("@/core/memory", () => ({
  memoryStore: {
    getRecent: vi.fn().mockReturnValue([]),
    getByEntity: vi.fn().mockReturnValue([]),
  },
}))

vi.mock("@/core/knowledge", () => ({
  knowledgeService: {
    getSummary: vi.fn().mockResolvedValue("Knowledge summary"),
  },
}))

import { nluEngine } from "./index"

describe("NLUEngine", () => {
  describe("classify", () => {
    it("classifies financial health query", () => {
      const result = nluEngine.classify("¿Cómo está la salud financiera de la empresa?")
      expect(result).toBeDefined()
      expect(result.intent).toBeDefined()
      expect(result.intentScore).toBeGreaterThan(0)
      expect(result.sentiment).toBeDefined()
    })

    it("extracts entities from query", () => {
      const result = nluEngine.classify("Analiza el KPI de liquidez para el cliente ABC")
      expect(Array.isArray(result.entities)).toBe(true)
    })

    it("handles empty query gracefully", () => {
      const result = nluEngine.classify("")
      expect(result).toBeDefined()
      expect(result.intent).toBeNull()
    })
  })
})
