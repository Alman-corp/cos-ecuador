import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { withTenant } from "@/lib/db/with-tenant"
import { getSessionFromRequest } from "@/lib/auth/token"
import { NotFoundError, DomainError } from "@/core"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const statement = await withTenant(session.companyId, (tx) =>
    tx.financialStatement.findFirst({ where: { id } })
  )
  if (!statement) return NextResponse.json({ error: "Statement not found" }, { status: 404 })

  return NextResponse.json(statement)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const deleted = await withTenant(session.companyId, async (tx) => {
      const existing = await tx.financialStatement.findFirst({ where: { id } })
      if (!existing) throw new NotFoundError("Statement not found")
      await tx.financialStatement.delete({ where: { id } })
      return true
    })
    return NextResponse.json({ deleted: true })
  } catch (err: any) {
    if (err instanceof DomainError) return NextResponse.json({ error: err.message }, { status: 404 })
    return NextResponse.json({ error: err.message || "Failed to delete" }, { status: 500 })
  }
}
