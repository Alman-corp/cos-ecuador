import { NextRequest, NextResponse } from "next/server"
import {
  getObligationsSummary,
  getObligationsByCompany,
  updateObligationStatus,
} from "@/lib/tax/obligations"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId")
    const status = searchParams.get("status") || undefined
    const summary = searchParams.get("summary") === "true"

    if (!companyId) {
      return NextResponse.json(
        { error: "companyId is required" },
        { status: 400 }
      )
    }

    if (summary) {
      const data = await getObligationsSummary(companyId)
      return NextResponse.json(data)
    }

    const data = await getObligationsByCompany(companyId, status)
    return NextResponse.json({ obligations: data, total: data.length })
  } catch (error) {
    console.error("Error fetching obligations:", error)
    return NextResponse.json(
      { error: "Failed to fetch obligations" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { obligationId, status, filedAt, amount, notes } = body

    if (!obligationId || !status) {
      return NextResponse.json(
        { error: "obligationId and status are required" },
        { status: 400 }
      )
    }

    const data = await updateObligationStatus(
      obligationId,
      status,
      filedAt,
      amount,
      notes
    )
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error updating obligation:", error)
    return NextResponse.json(
      { error: "Failed to update obligation" },
      { status: 500 }
    )
  }
}
