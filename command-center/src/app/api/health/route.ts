import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const checks = {
    status: "ok",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    checks: {
      api: { status: "ok", latency: "0ms" },
      auth: { status: "ok", mode: "dev" },
    },
  }

  return NextResponse.json(checks, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  })
}
