import { NextRequest, NextResponse } from "next/server"
import { getSessionFromRequest } from "@/lib/auth/token"
import { getTimeToValue } from "@/lib/telemetry"

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const metrics = await getTimeToValue(session.companyId)
  return NextResponse.json(metrics)
}
