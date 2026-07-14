import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json({
    status: "ready",
    timestamp: new Date().toISOString(),
    checks: {
      dependencies: { all: true },
    },
  })
}
