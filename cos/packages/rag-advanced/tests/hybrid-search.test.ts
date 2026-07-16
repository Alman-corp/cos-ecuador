import { BM25Okapi } from "../src/search/bm25"

describe("BM25Okapi", () => {
  const docs = [
    "Tesla reported Q4 2025 revenue of $25.4B exceeding analyst estimates",
    "EBITDA reached $4.2B with a margin of 16.5% driven by operating leverage",
    "Free cash flow was $2.1B in Q4 2025",
    "The company delivered 495,000 vehicles in the quarter",
    "Energy storage business grew 85% YoY to $2.1B",
  ]

  let bm25: BM25Okapi

  beforeEach(() => {
    bm25 = new BM25Okapi()
    bm25.index(docs)
  })

  it("should rank relevant documents higher for financial queries", () => {
    const results = bm25.search("EBITDA margin operating", 3)
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].index).toBe(1)
  })

  it("should find revenue-related documents", () => {
    const results = bm25.search("revenue Tesla Q4", 3)
    expect(results[0].index).toBe(0)
  })

  it("should handle empty corpus gracefully", () => {
    const empty = new BM25Okapi()
    empty.index([])
    const results = empty.search("test", 10)
    expect(results).toEqual([])
  })

  it("should handle financial terms with special characters", () => {
    const results = bm25.search("$25.4B revenue", 5)
    expect(results.length).toBeGreaterThan(0)
  })

  it("should filter stopwords correctly", () => {
    const results = bm25.search("the and of in EBITDA", 5)
    expect(results[0].index).toBe(1)
  })
})
