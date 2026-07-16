import { NextRequest, NextResponse } from "next/server"
import { getAllFlags, setFeatureFlag, isFeatureEnabled } from "@/core/feature-flags/service"

export async function GET() {
  const flags = getAllFlags()
  return NextResponse.json({ flags })
}

export async function POST(req: NextRequest) {
  const { flag, isEnabled, companyId } = await req.json()
  if (!flag) return NextResponse.json({ error: "flag es requerido" }, { status: 400 })
  const updated = setFeatureFlag(flag, isEnabled, companyId)
  return NextResponse.json({ flag: updated })
}

export async function PUT(req: NextRequest) {
  const { flag, companyId } = await req.json()
  if (!flag) return NextResponse.json({ error: "flag es requerido" }, { status: 400 })
  const enabled = isFeatureEnabled(flag, companyId)
  return NextResponse.json({ flag, isEnabled: enabled })
}
