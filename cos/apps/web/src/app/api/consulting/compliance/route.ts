import { NextResponse } from "next/server"
import { consultingFacade, DomainError } from "@/core"
import { getSessionFromRequest } from "@/lib/auth/token"
import { validateBody } from "@/lib/validate"
import { ConsultingComplianceSchema } from "@/lib/api-schemas"

export async function POST(req: Request) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { data, errors } = validateBody(ConsultingComplianceSchema, body)
    if (errors) return NextResponse.json({ error: errors }, { status: 400 })

    const result = await consultingFacade.generateComplianceReport(
      session.companyId, data.clientId, data.checklistType || "general", session.userId,
    )

    if (result.isFailure()) throw result.error
    return NextResponse.json(result.value)
  } catch (err: any) {
    if (err instanceof DomainError) return NextResponse.json({ error: err.message }, { status: 400 })
    return NextResponse.json({ error: err.message || "Compliance check failed" }, { status: 500 })
  }
}
