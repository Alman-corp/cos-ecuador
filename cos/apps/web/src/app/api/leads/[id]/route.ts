import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { withTenant } from "@/lib/db/with-tenant"
import { crmFacade, DomainError, NotFoundError } from "@/core"
import { getSessionFromRequest } from "@/lib/auth/token"
import { validateBody } from "@/lib/validate"
import { UpdateLeadSchema } from "@/lib/api-schemas"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const lead = await withTenant(session.companyId, (tx) =>
    tx.lead.findFirst({
      where: { id },
      include: { activities: { orderBy: { createdAt: "desc" } } },
    })
  )
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 })

  return NextResponse.json(lead)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const { data, errors } = validateBody(UpdateLeadSchema, body)
    if (errors) return NextResponse.json({ error: errors }, { status: 400 })

    const updated = await withTenant(session.companyId, async (tx) => {
      const existing = await tx.lead.findFirst({ where: { id } })
      if (!existing) throw new NotFoundError("Lead not found")
      return tx.lead.update({
        where: { id },
        data: {
          firstName: data.firstName, lastName: data.lastName,
          email: data.email, phone: data.phone,
          source: data.source, score: data.score, status: data.status,
          updatedBy: session.userId,
        },
      })
    })
    return NextResponse.json(updated)
  } catch (err: any) {
    if (err instanceof DomainError) return NextResponse.json({ error: err.message }, { status: 404 })
    return NextResponse.json({ error: err.message || "Failed to update lead" }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const { action } = await req.json()

    if (action === "convert") {
      const result = await crmFacade.convertLead({
        leadId: id, companyId: session.companyId, convertedBy: session.userId,
      })
      if (result.isFailure()) throw result.error
      return NextResponse.json(result.value)
    }

    const activity = await withTenant(session.companyId, (tx) =>
      tx.leadActivity.create({
        data: { leadId: id, type: action || "note", notes: "Actualizado", performedBy: session.userId },
      })
    )
    return NextResponse.json(activity)
  } catch (err: any) {
    if (err instanceof DomainError) return NextResponse.json({ error: err.message }, { status: 400 })
    return NextResponse.json({ error: err.message || "Operation failed" }, { status: 500 })
  }
}
