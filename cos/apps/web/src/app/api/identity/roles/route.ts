import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { withTenant } from "@/lib/db/with-tenant"
import { identityFacade, DomainError } from "@/core"
import { getSessionFromRequest } from "@/lib/auth/token"
import { validateBody } from "@/lib/validate"
import { CreateRoleSchema } from "@/lib/api-schemas"

export async function GET(req: Request) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const roles = await withTenant(session.companyId, (tx) =>
    tx.role.findMany({ orderBy: { name: "asc" } })
  )
  return NextResponse.json(roles)
}

export async function POST(req: Request) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { data, errors } = validateBody(CreateRoleSchema, body)
    if (errors) return NextResponse.json({ error: errors }, { status: 400 })
    const result = await identityFacade.createRole({
      companyId: session.companyId, name: data.name, permissions: data.permissions, createdBy: session.userId,
    })

    if (result.isFailure()) throw result.error
    return NextResponse.json(result.value, { status: 201 })
  } catch (err: any) {
    if (err instanceof DomainError) return NextResponse.json({ error: err.message }, { status: 400 })
    return NextResponse.json({ error: err.message || "Failed to create role" }, { status: 500 })
  }
}
