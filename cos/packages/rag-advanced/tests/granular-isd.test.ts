import { GranularISD } from "../src/citations/granular-isd"

describe("GranularISD", () => {
  let isd: GranularISD

  beforeEach(() => {
    isd = new GranularISD()
  })

  it("should find citations matching query terms", () => {
    const results = isd.find("EBITDA margin 2025")
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].confidence).toBeGreaterThan(0)
  })

  it("should return top K results", () => {
    const results = isd.find("revenue", 2)
    expect(results.length).toBeLessThanOrEqual(2)
  })

  it("should format citation with page and paragraph", () => {
    const results = isd.find("EBITDA")
    const formatted = isd.format(results[0])
    expect(formatted).toContain("p.")
  })

  it("should generate preview URL", () => {
    const results = isd.find("revenue")
    const url = isd.generatePreviewUrl(results[0])
    expect(url).toContain("/api/documents/")
    expect(url).toContain("page=")
  })

  it("should parse numeric citations [cite:N]", () => {
    const parsed = GranularISD.parse("The EBITDA was $14.6B [cite:1] in FY 2025")
    expect(parsed.length).toBeGreaterThan(0)
    expect(parsed[0].reference).toBe("cite:1")
  })

  it("should parse cell references [cite:B15]", () => {
    const parsed = GranularISD.parse("Energy storage grew 85% [cite:B15]")
    expect(parsed.length).toBeGreaterThan(0)
  })

  it("should parse page references [cite:p.5]", () => {
    const parsed = GranularISD.parse("See margin details [cite:p.5]")
    expect(parsed.length).toBeGreaterThan(0)
  })

  it("should return stats", () => {
    const stats = isd.getStats()
    expect(stats.total).toBeGreaterThan(0)
    expect(stats.sources["10-K"]).toBeDefined()
  })
})
