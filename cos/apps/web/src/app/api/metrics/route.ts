import { NextResponse } from "next/server"
import { getMetrics } from "@/lib/monitoring/metrics"

export async function GET() {
  return NextResponse.json({ metrics: getMetrics() })
}
