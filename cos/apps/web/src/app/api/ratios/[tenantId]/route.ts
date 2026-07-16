import { NextRequest, NextResponse } from "next/server"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  const { tenantId } = await params
  return NextResponse.json({
    current_ratio: 1.45,
    quick_ratio: 1.12,
    debt_to_equity: 0.68,
    interest_coverage: 8.5,
    gross_margin_pct: 42.8,
    ebitda_margin_pct: 23.1,
    net_margin_pct: 13.2,
    return_on_assets_pct: 11.4,
    return_on_equity_pct: 18.2,
    _tenant: tenantId,
  })
}
