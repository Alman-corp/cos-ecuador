import { describe, it, expect } from "vitest"
import { generateReport } from "./engine"
import { getCompanyById } from "./seed-data"

describe("DueDiligenceEngine", () => {
  it("generates report for a valid company", () => {
    const company = getCompanyById("corp-nac-fin")
    expect(company).toBeDefined()
    const report = generateReport(company!)
    expect(report.company.name).toBe("Corporación Nacional Financiera")
    expect(report.healthScore).toBeGreaterThan(0)
    expect(report.healthScore).toBeLessThanOrEqual(100)
    expect(report.years).toEqual([2024, 2023, 2022])
    expect(report.ratios.length).toBeGreaterThan(0)
    expect(report.executiveSummary).toBeTruthy()
  })

  it("detects risks for low liquidity company", () => {
    const company = getCompanyById("constr-pacifico")
    const report = generateReport(company!)
    expect(report.risks.length).toBeGreaterThan(0)
  })

  it("generates recommendations", () => {
    const company = getCompanyById("tech-solutions")
    const report = generateReport(company!)
    expect(report.recommendations.length).toBeGreaterThan(0)
  })

  it("handles all 5 seed companies", () => {
    const ids = ["corp-nac-fin", "ind-molinera", "constr-pacifico", "agroexport", "tech-solutions"]
    for (const id of ids) {
      const c = getCompanyById(id)
      expect(c).toBeDefined()
      const r = generateReport(c!)
      expect(r.healthScore).toBeGreaterThan(0)
      expect(r.ratios.length).toBe(9)
    }
  })

  it("produces consistent maturity levels", () => {
    const validLevels = ["initial", "defined", "managed", "optimized"]
    const ids = ["corp-nac-fin", "ind-molinera", "constr-pacifico", "agroexport", "tech-solutions"]
    for (const id of ids) {
      const r = generateReport(getCompanyById(id)!)
      expect(validLevels).toContain(r.maturityLevel)
    }
  })
})
