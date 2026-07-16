import { NextRequest, NextResponse } from "next/server"
import { ValuationDataSchema } from "@/lib/schemas"

const MOCK_VALUATION = {
  enterpriseValue: 4_250_000,
  equityValue: 3_680_000,
  wacc: 12.0,
  terminalGrowth: 3.0,
  dcfResult: {
    pvCashFlows: 1_820_000,
    pvTerminalValue: 2_430_000,
    terminalValue: 3_850_000,
  },
  monteCarlo: {
    medianRunway: 8.2,
    probSurvive6m: 0.92,
    cashP50: 358_000,
    cashP10: 185_000,
    cashP90: 520_000,
  },
  sensitivity: [
    { wacc: 10.0, growth: 2.0, value: 5_120_000 },
    { wacc: 10.0, growth: 3.0, value: 5_680_000 },
    { wacc: 10.0, growth: 4.0, value: 6_420_000 },
    { wacc: 12.0, growth: 2.0, value: 3_850_000 },
    { wacc: 12.0, growth: 3.0, value: 4_250_000 },
    { wacc: 12.0, growth: 4.0, value: 4_780_000 },
    { wacc: 14.0, growth: 2.0, value: 3_120_000 },
    { wacc: 14.0, growth: 3.0, value: 3_450_000 },
    { wacc: 14.0, growth: 4.0, value: 3_890_000 },
  ],
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  const { tenantId } = await params
  const parsed = ValuationDataSchema.safeParse(MOCK_VALUATION)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 500 })
  }
  return NextResponse.json({ ...parsed.data, _tenant: tenantId })
}
