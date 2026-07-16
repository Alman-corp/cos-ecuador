import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { crmFacade, DomainError } from "@/core"
import { getSessionFromRequest } from "@/lib/auth/token"
import { validateBody } from "@/lib/validate"
import { CreateClientSchema } from "@/lib/api-schemas"

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search") || undefined
  const segment = searchParams.get("segment") || undefined
  const industry = searchParams.get("industry") || undefined
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "20")

  const [clients, total] = await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `SELECT set_config('app.tenant_id', $1, true)`,
      session.companyId,
    )
    return Promise.all([
      tx.client.findMany({
        where: {
          ...(search && { name: { contains: search, mode: "insensitive" } }),
          ...(segment && { segment }),
          ...(industry && { industry }),
        },
        skip: (page - 1) * limit, take: limit,
        orderBy: { createdAt: "desc" },
        include: { contacts: { take: 1 }, documents: { take: 1, orderBy: { createdAt: "desc" } } },
      }),
      tx.client.count({ where: {} }),
    ])
  })

  return NextResponse.json({ data: clients, total, page, limit, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { data, errors } = validateBody(CreateClientSchema, body)
    if (errors) return NextResponse.json({ error: errors }, { status: 400 })
    const result = await crmFacade.createClient({
      type: "crm.createClient",
      companyId: session.companyId,
      name: data.name,
      taxId: data.taxId || "",
      industry: data.industry || "",
      segment: data.segment || "pyme",
      email: data.email || "",
      phone: data.phone || "",
      contactFirstName: data.contactFirstName || "",
      contactLastName: data.contactLastName || "",
      contactEmail: data.contactEmail || "",
      createdBy: session.userId,
    })

    if (result.isFailure()) throw result.error
    return NextResponse.json(result.value, { status: 201 })
  } catch (err: any) {
    if (err instanceof DomainError) return NextResponse.json({ error: err.message }, { status: 400 })
    return NextResponse.json({ error: err.message || "Failed to create client" }, { status: 500 })
  }
}
