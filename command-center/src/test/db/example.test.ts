import { describe, it, expect, vi, beforeEach } from "vitest"

const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockOrder = vi.fn()
const mockLimit = vi.fn()

mockFrom.mockReturnValue({ select: mockSelect })
mockSelect.mockReturnValue({ order: mockOrder })
mockOrder.mockReturnValue({ limit: mockLimit })
mockLimit.mockResolvedValue({
  data: [
    {
      id: "1",
      period: "Q4 2025",
      revenue: 14160000000,
      cogs: 11750000000,
      gross_profit: 2410000000,
      opex: 0,
      ebitda: 2445000000,
      depreciation: 965000000,
      ebit: 1480000000,
      interest: 200000000,
      tax: 756000000,
      net_income: 524000000,
    },
  ],
  error: null,
})

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}))

describe("getFinancialStatements", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns financial statements from supabase", async () => {
    const { getFinancialStatements } = await import("@/lib/db/queries")
    const result = await getFinancialStatements(1)

    expect(result.error).toBeNull()
    expect(result.data).toHaveLength(1)
    expect(result.data![0].period).toBe("Q4 2025")
    expect(result.data![0].revenue).toBe(14160000000)
  })

  it("calls supabase with correct parameters", async () => {
    const { getFinancialStatements } = await import("@/lib/db/queries")
    await getFinancialStatements(5)

    expect(mockFrom).toHaveBeenCalledWith("financial_statements")
    expect(mockLimit).toHaveBeenCalledWith(5)
  })
})
