import { NextRequest, NextResponse } from "next/server"
import { MarginsDataSchema } from "@/lib/schemas"

const MOCK_MARGINS = {
  periods: [
    { month: "Ene", revenue: 380_000, cogs: 220_000, grossProfit: 160_000, grossMargin: 42.1, opex: 72_000, ebitda: 88_000, ebitdaMargin: 23.2, depreciation: 12_000, ebit: 76_000, interest: 8_500, tax: 20_250, netIncome: 47_250, netMargin: 12.4 },
    { month: "Feb", revenue: 395_000, cogs: 231_000, grossProfit: 164_000, grossMargin: 41.5, opex: 75_000, ebitda: 89_000, ebitdaMargin: 22.5, depreciation: 12_000, ebit: 77_000, interest: 8_500, tax: 20_550, netIncome: 47_950, netMargin: 12.1 },
    { month: "Mar", revenue: 410_000, cogs: 233_000, grossProfit: 177_000, grossMargin: 43.2, opex: 71_000, ebitda: 106_000, ebitdaMargin: 25.9, depreciation: 12_000, ebit: 94_000, interest: 8_500, tax: 25_650, netIncome: 59_850, netMargin: 14.6 },
    { month: "Abr", revenue: 405_000, cogs: 232_000, grossProfit: 173_000, grossMargin: 42.7, opex: 73_000, ebitda: 100_000, ebitdaMargin: 24.7, depreciation: 12_000, ebit: 88_000, interest: 8_500, tax: 23_850, netIncome: 55_650, netMargin: 13.7 },
    { month: "May", revenue: 430_000, cogs: 241_000, grossProfit: 189_000, grossMargin: 44.0, opex: 76_000, ebitda: 113_000, ebitdaMargin: 26.3, depreciation: 12_000, ebit: 101_000, interest: 8_500, tax: 27_750, netIncome: 64_750, netMargin: 15.1 },
    { month: "Jun", revenue: 425_000, cogs: 240_000, grossProfit: 185_000, grossMargin: 43.5, opex: 74_000, ebitda: 111_000, ebitdaMargin: 26.1, depreciation: 12_000, ebit: 99_000, interest: 8_500, tax: 27_150, netIncome: 63_350, netMargin: 14.9 },
  ],
  budgetComparison: [
    { month: "Ene", actual: 380_000, budget: 370_000, variance: 2.7 },
    { month: "Feb", actual: 395_000, budget: 375_000, variance: 5.3 },
    { month: "Mar", actual: 410_000, budget: 400_000, variance: 2.5 },
    { month: "Abr", actual: 405_000, budget: 410_000, variance: -1.2 },
    { month: "May", actual: 430_000, budget: 415_000, variance: 3.6 },
    { month: "Jun", actual: 425_000, budget: 420_000, variance: 1.2 },
  ],
  benchmarks: {
    grossMargin: 38.0,
    ebitdaMargin: 20.0,
    netMargin: 10.0,
  },
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  const { tenantId } = await params
  const parsed = MarginsDataSchema.safeParse(MOCK_MARGINS)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 500 })
  }
  return NextResponse.json({ ...parsed.data, _tenant: tenantId })
}
