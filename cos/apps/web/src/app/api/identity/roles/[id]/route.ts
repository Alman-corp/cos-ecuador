import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSessionFromRequest } from "@/lib/auth/token"
import { DomainError, NotFoundError } from "@/core"
import { validateBody } from "@/lib/validate"
import { UpdateRoleSchema } from "@/lib/api-schemas"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const { data, errors } = validateBody(UpdateRoleSchema, body)
    if (errors) return NextResponse.json({ error: errors }, { status: 400 })

    const role = await prisma.role.findFirst({ where: { id, companyId: session.companyId } })
    if (!role) throw new NotFoundError("Role not found")

    const updated = await prisma.role.update({
      where: { id },
      data: { ...(data.name && { name: data.name }), ...(data.permissions && { permissions: data.permissions }) },
    })
    return NextResponse.json(updated)
  } catch (err: any) {
    if (err instanceof DomainError) return NextResponse.json({ error: err.message }, { status: 404 })
    return NextResponse.json({ error: err.message || "Failed to update role" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const role = await prisma.role.findFirst({ where: { id, companyId: session.companyId } })
    if (!role) throw new NotFoundError("Role not found")
    if (role.isSystem) return NextResponse.json({ error: "Cannot delete system role" }, { status: 400 })

    await prisma.role.delete({ where: { id } })
    return NextResponse.json({ deleted: true })
  } catch (err: any) {
    if (err instanceof DomainError) return NextResponse.json({ error: err.message }, { status: 404 })
    return NextResponse.json({ error: err.message || "Failed to delete role" }, { status: 500 })
  }
}
