import { NextResponse } from "next/server"
import { crmFacade, DomainError } from "@/core"
import { getSessionFromRequest } from "@/lib/auth/token"
import { validateBody } from "@/lib/validate"
import { OnboardClientSchema } from "@/lib/api-schemas"

export async function POST(req: Request) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { data, errors } = validateBody(OnboardClientSchema, body)
    if (errors) return NextResponse.json({ error: errors }, { status: 400 })
    const result = await crmFacade.onboardClient({
      companyId: session.companyId,
      leadId: data.leadId,
      clientData: {
        name: data.name,
        taxId: data.taxId || "",
        industry: data.industry || "",
        email: data.email || "",
        phone: data.phone || "",
      },
      initialDocs: data.initialDocs,
      contactName: data.contactName || "",
      contactEmail: data.contactEmail || "",
      createdBy: session.userId,
    })

    if (result.isFailure()) throw result.error
    return NextResponse.json(result.value, { status: 201 })
  } catch (err: any) {
    if (err instanceof DomainError) return NextResponse.json({ error: err.message }, { status: 400 })
    return NextResponse.json({ error: err.message || "Onboarding failed" }, { status: 500 })
  }
}
