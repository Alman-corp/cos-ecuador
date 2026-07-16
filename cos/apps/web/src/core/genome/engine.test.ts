import { describe, it, expect, vi } from "vitest"

vi.mock("@/core/memory", () => ({
  memoryStore: {
    add: vi.fn(),
    getByEntity: vi.fn().mockReturnValue([]),
    getRecent: vi.fn().mockReturnValue([]),
    summarize: vi.fn().mockReturnValue({ total: 10 }),
  },
}))

import { genomeEngine } from "./engine"

describe("GenomeEngine", () => {
  describe("analyze", () => {
    it("returns a genome with dimensions and overallScore", async () => {
      const result = await genomeEngine.analyze("company-1", "client-1", "manufactura")
      expect(result).toHaveProperty("companyId")
      expect(result).toHaveProperty("dimensions")
      expect(result).toHaveProperty("overallScore")
      expect(result.companyId).toBe("company-1")
    })
  })

  describe("getGenome", () => {
    it("returns undefined for unknown company", () => {
      const result = genomeEngine.getGenome("unknown-company")
      expect(result).toBeUndefined()
    })
  })
})
