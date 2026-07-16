import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { withTenant } from "@/lib/db/with-tenant"
import { getSessionFromRequest } from "@/lib/auth/token"
import { DomainError, NotFoundError } from "@/core"
import { validateBody } from "@/lib/validate"
import { CreateLeadSchema } from "@/lib/api-schemas"

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search") || undefined
  const status = searchParams.get("status") || undefined
  const source = searchParams.get("source") || undefined
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "20")

  const [leads, total] = await withTenant(session.companyId, async (tx) =>
    Promise.all([
      tx.lead.findMany({
        where: {
          ...(status && { status }),
          ...(source && { source }),
          ...(search && {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }),
        },
        skip: (page - 1) * limit, take: limit,
        orderBy: { score: "desc" },
        include: { activities: { take: 3, orderBy: { createdAt: "desc" } } },
      }),
      tx.lead.count({ where: {} }),
    ])
  )

  return NextResponse.json({ data: leads, total, page, limit, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { data, errors } = validateBody(CreateLeadSchema, body)
    if (errors) return NextResponse.json({ error: errors }, { status: 400 })
    const lead = await withTenant(session.companyId, (tx) =>
      tx.lead.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName || "",
          email: data.email || "",
          phone: data.phone || "",
          source: data.source || "manual",
          score: data.score || 0,
          status: "new",
          createdBy: session.userId,
        },
      })
    )
    return NextResponse.json(lead, { status: 201 })
  } catch (err: any) {
    if (err instanceof DomainError) return NextResponse.json({ error: err.message }, { status: 400 })
    return NextResponse.json({ error: err.message || "Failed to create lead" }, { status: 500 })
  }
}
