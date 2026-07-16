import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { withTenant } from "@/lib/db/with-tenant"
import { getSessionFromRequest } from "@/lib/auth/token"
import { DomainError } from "@/core"
import { validateBody } from "@/lib/validate"
import { CreateProjectSchema } from "@/lib/api-schemas"

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status") || undefined
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "20")

  const [projects, total] = await withTenant(session.companyId, async (tx) =>
    Promise.all([
      tx.project.findMany({
        where: { ...(status && { status }) },
        skip: (page - 1) * limit, take: limit,
        orderBy: { createdAt: "desc" },
      }),
      tx.project.count({ where: {} }),
    ])
  )

  return NextResponse.json({ data: projects, total, page, limit, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { data, errors } = validateBody(CreateProjectSchema, body)
    if (errors) return NextResponse.json({ error: errors }, { status: 400 })

    const project = await withTenant(session.companyId, (tx) =>
      tx.project.create({
        data: {
          clientId: data.clientId,
          name: data.name,
          description: data.description || null,
          projectType: data.projectType,
          methodology: data.methodology || "kanban",
          status: "planning",
          priority: data.priority || "medium",
          startDate: data.startDate ? new Date(data.startDate) : new Date(),
          targetEndDate: data.targetEndDate ? new Date(data.targetEndDate) : null,
          createdBy: session.userId,
        },
      })
    )
    return NextResponse.json(project, { status: 201 })
  } catch (err: any) {
    if (err instanceof DomainError) return NextResponse.json({ error: err.message }, { status: 400 })
    return NextResponse.json({ error: err.message || "Failed to create project" }, { status: 500 })
  }
}
