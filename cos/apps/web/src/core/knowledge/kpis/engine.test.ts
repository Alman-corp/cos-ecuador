import { describe, it, expect } from "vitest"
import { kpiLibrary } from "./engine"

describe("KPILibraryEngine", () => {
  describe("evaluate", () => {
    it("evaluates KPI values and returns interpretation", () => {
      const result = kpiLibrary.evaluate("kpi-fin-020", 0.55)
      expect(result).toHaveProperty("status")
      expect(result).toHaveProperty("interpretation")
      expect(result).toHaveProperty("recommendations")
      expect(["excellent", "good", "moderate", "critical", "unknown"]).toContain(result.status)
    })

    it("flags critical KPI values", () => {
      const result = kpiLibrary.evaluate("kpi-fin-022", 0.01)
      expect(result.status).toBe("critical")
    })

    it("returns unknown for nonexistent KPI", () => {
      const result = kpiLibrary.evaluate("nonexistent.kpi", 10)
      expect(result.status).toBe("unknown")
    })
  })

  describe("getKPIs", () => {
    it("returns all KPI definitions when no filter", () => {
      const kpis = kpiLibrary.getKPIs()
      expect(Array.isArray(kpis)).toBe(true)
      expect(kpis.length).toBeGreaterThan(0)
    })

    it("filters by domain", () => {
      const kpis = kpiLibrary.getKPIs("liquidity")
      expect(kpis.every((k) => k.domain === "liquidity")).toBe(true)
    })

    it("searches by text", () => {
      const kpis = kpiLibrary.getKPIs(undefined, "margen")
      expect(kpis.length).toBeGreaterThan(0)
    })
  })

  describe("getKPI", () => {
    it("returns a specific KPI definition", () => {
      const kpi = kpiLibrary.getKPI("kpi-fin-022")
      expect(kpi).toBeDefined()
      expect(kpi!.name).toBe("Margen Neto")
    })
  })

  describe("getDomains", () => {
    it("returns domain list", () => {
      const domains = kpiLibrary.getDomains()
      expect(Array.isArray(domains)).toBe(true)
      if (domains.length > 0) {
        expect(domains[0]).toHaveProperty("domain")
        expect(domains[0]).toHaveProperty("label")
        expect(domains[0]).toHaveProperty("count")
      }
    })
  })

  describe("getTotalCount", () => {
    it("returns a positive count", () => {
      expect(kpiLibrary.getTotalCount()).toBeGreaterThan(0)
    })
  })

  describe("evaluateMultiple", () => {
    it("evaluates multiple KPIs at once", () => {
      const results = kpiLibrary.evaluateMultiple({
        "profitability.net_margin": 15,
        "liquidity.current_ratio": 2,
      })
      expect(results.length).toBe(2)
      results.forEach((r) => {
        expect(r).toHaveProperty("status")
        expect(r).toHaveProperty("interpretation")
      })
    })
  })

  describe("getRelatedKPIs", () => {
    it("returns related KPIs", () => {
      const related = kpiLibrary.getRelatedKPIs("profitability.net_margin")
      expect(Array.isArray(related)).toBe(true)
    })
  })

  describe("suggestKPIsForIndustry", () => {
    it("suggests KPIs for an industry", () => {
      const suggested = kpiLibrary.suggestKPIsForIndustry("manufactura")
      expect(Array.isArray(suggested)).toBe(true)
    })
  })
})
