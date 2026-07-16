import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { createSession } from "@/lib/auth/token"
import { DomainError } from "@/core"
import { validateBody } from "@/lib/validate"
import { LoginSchema } from "@/lib/api-schemas"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { data, errors } = validateBody(LoginSchema, body)
    if (errors || !data) return NextResponse.json({ error: errors || "Invalid request" }, { status: 400 })

    const user = await prisma.user.findFirst({
      where: { email: data.email, isActive: true },
      include: { roles: { include: { role: true } } },
    })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const primaryRole = user.roles[0]?.role?.name || "viewer"
    const token = await createSession(user.id, user.companyId, user.email, primaryRole)

    const res = NextResponse.json({
      userId: user.id, companyId: user.companyId, email: user.email,
      firstName: user.firstName, lastName: user.lastName, role: primaryRole,
    })
    res.cookies.set("cos_session", token, {
      path: "/", httpOnly: true, sameSite: "lax",
      maxAge: 604800,
    })
    return res
  } catch (err: any) {
    if (err instanceof DomainError) return NextResponse.json({ error: err.message }, { status: 400 })
    return NextResponse.json({ error: err.message || "Login failed" }, { status: 500 })
  }
}
