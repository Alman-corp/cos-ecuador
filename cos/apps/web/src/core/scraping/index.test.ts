import { describe, it, expect, vi } from "vitest"

vi.mock("@/core/knowledge/benchmarks/data", () => ({
  benchmarkData: { industries: [] },
}))

import { scrapingService } from "./index"

describe("ScrapingService", () => {
  describe("scrapeSupercias", () => {
    it("returns data for valid industry", async () => {
      const result = await scrapingService.scrapeSupercias("construcción")
      expect(result).toBeDefined()
    })
  })
})
