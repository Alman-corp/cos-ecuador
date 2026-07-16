import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { withTenant } from "@/lib/db/with-tenant"
import { getSessionFromRequest } from "@/lib/auth/token"
import { DomainError } from "@/core"
import { validateBody } from "@/lib/validate"
import { CreateFinancialStatementSchema } from "@/lib/api-schemas"

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get("clientId") || undefined
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "20")

  const [statements, total] = await withTenant(session.companyId, async (tx) =>
    Promise.all([
      tx.financialStatement.findMany({
        where: { ...(clientId && { clientId }) },
        skip: (page - 1) * limit, take: limit,
        orderBy: { periodStart: "desc" },
      }),
      tx.financialStatement.count({ where: {} }),
    ])
  )

  return NextResponse.json({ data: statements, total, page, limit, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { data, errors } = validateBody(CreateFinancialStatementSchema, body)
    if (errors) return NextResponse.json({ error: errors }, { status: 400 })
    const statement = await withTenant(session.companyId, (tx) =>
      tx.financialStatement.create({
        data: {
          clientId: data.clientId,
          periodStart: new Date(data.periodStart),
          periodEnd: new Date(data.periodEnd),
          statementType: data.statementType || "balance_sheet",
          data: data.data || {},
          createdBy: session.userId,
        },
      })
    )

    return NextResponse.json(statement, { status: 201 })
  } catch (err: any) {
    if (err instanceof DomainError) return NextResponse.json({ error: err.message }, { status: 400 })
    return NextResponse.json({ error: err.message || "Failed to create statement" }, { status: 500 })
  }
}
