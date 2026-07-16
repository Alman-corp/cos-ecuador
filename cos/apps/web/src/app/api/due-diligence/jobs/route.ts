import { NextResponse } from "next/server"
import { getAllJobs } from "@/core/due-diligence/orchestrator"

export async function GET() {
  const jobs = await getAllJobs()
  return NextResponse.json({ jobs })
}
