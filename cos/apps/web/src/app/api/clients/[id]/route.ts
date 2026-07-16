import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { withTenant } from "@/lib/db/with-tenant"
import { getSessionFromRequest } from "@/lib/auth/token"
import { NotFoundError, DomainError } from "@/core"
import { validateBody } from "@/lib/validate"
import { UpdateClientSchema } from "@/lib/api-schemas"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const client = await withTenant(session.companyId, (tx) =>
    tx.client.findFirst({
      where: { id },
      include: { contacts: true, documents: { orderBy: { createdAt: "desc" } }, lead: true },
    })
  )
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 })

  return NextResponse.json(client)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const { data, errors } = validateBody(UpdateClientSchema, body)
    if (errors) return NextResponse.json({ error: errors }, { status: 400 })

    const updated = await withTenant(session.companyId, async (tx) => {
      const existing = await tx.client.findFirst({ where: { id } })
      if (!existing) throw new NotFoundError("Client not found")
      return tx.client.update({
        where: { id },
        data: {
          name: data.name, taxId: data.taxId, industry: data.industry,
          segment: data.segment, email: data.email, phone: data.phone,
          status: data.status, updatedBy: session.userId,
        },
      })
    })
    return NextResponse.json(updated)
  } catch (err: any) {
    if (err instanceof DomainError) return NextResponse.json({ error: err.message }, { status: 404 })
    return NextResponse.json({ error: err.message || "Failed to update client" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    await withTenant(session.companyId, async (tx) => {
      const existing = await tx.client.findFirst({ where: { id } })
      if (!existing) throw new NotFoundError("Client not found")
      await tx.client.update({ where: { id }, data: { deletedAt: new Date() } })
    })
    return NextResponse.json({ deleted: true })
  } catch (err: any) {
    if (err instanceof DomainError) return NextResponse.json({ error: err.message }, { status: 404 })
    return NextResponse.json({ error: err.message || "Failed to delete client" }, { status: 500 })
  }
}
