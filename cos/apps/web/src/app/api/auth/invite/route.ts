import { NextResponse } from "next/server"
import { identityFacade, DomainError } from "@/core"
import { getSessionFromRequest } from "@/lib/auth/token"
import { validateBody } from "@/lib/validate"
import { InviteUserSchema } from "@/lib/api-schemas"

export async function POST(req: Request) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { data, errors } = validateBody(InviteUserSchema, body)
    if (errors) return NextResponse.json({ error: errors }, { status: 400 })
    const result = await identityFacade.inviteUser({
      companyId: session.companyId, email: data.email, roleId: data.roleId, invitedBy: session.userId,
    })

    if (result.isFailure()) throw result.error
    return NextResponse.json(result.value, { status: 201 })
  } catch (err: any) {
    if (err instanceof DomainError) return NextResponse.json({ error: err.message }, { status: 400 })
    return NextResponse.json({ error: err.message || "Invitation failed" }, { status: 500 })
  }
}
