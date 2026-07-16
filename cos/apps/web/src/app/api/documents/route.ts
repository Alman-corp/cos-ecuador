import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { withTenant } from "@/lib/db/with-tenant"
import { getSessionFromRequest } from "@/lib/auth/token"
import { DomainError } from "@/core"
import { validateBody } from "@/lib/validate"
import { CreateDocumentSchema } from "@/lib/api-schemas"

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get("clientId") || undefined
  const documentType = searchParams.get("documentType") || undefined
  const status = searchParams.get("status") || undefined
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "20")

  const [documents, total] = await withTenant(session.companyId, async (tx) =>
    Promise.all([
      tx.document.findMany({
        where: {
          ...(clientId && { clientId }),
          ...(documentType && { documentType }),
          ...(status && { status }),
        },
        skip: (page - 1) * limit, take: limit,
        orderBy: { createdAt: "desc" },
      }),
      tx.document.count({ where: {} }),
    ])
  )

  return NextResponse.json({ data: documents, total, page, limit, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { data, errors } = validateBody(CreateDocumentSchema, body)
    if (errors) return NextResponse.json({ error: errors }, { status: 400 })
    const document = await withTenant(session.companyId, (tx) =>
      tx.document.create({
        data: {
          clientId: data.clientId,
          title: data.title,
          documentType: data.documentType || "general",
          fileUrl: data.fileUrl || "",
          uploadedBy: session.userId,
        },
      })
    )

    return NextResponse.json(document, { status: 201 })
  } catch (err: any) {
    if (err instanceof DomainError) return NextResponse.json({ error: err.message }, { status: 400 })
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 })
  }
}
