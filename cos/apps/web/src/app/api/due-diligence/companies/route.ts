import { NextResponse } from "next/server"
import { getCompanyProfiles } from "@/core/due-diligence/seed-data"

export async function GET() {
  const companies = getCompanyProfiles()
  return NextResponse.json({ companies })
}
