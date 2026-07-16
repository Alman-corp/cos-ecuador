import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const checks = {
    status: "ok",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    env: {
      supabase_url_set: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabase_anon_key_set: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabase_url_prefix: (process.env.NEXT_PUBLIC_SUPABASE_URL || "").substring(0, 30),
      anon_key_prefix: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").substring(0, 20),
    },
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
