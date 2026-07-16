import { NextResponse } from "next/server"
import { getSessionFromRequest } from "@/lib/auth/token"

export async function GET(req: Request) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ user: null }, { status: 401 })
  return NextResponse.json({
    user: {
      id: session.userId,
      companyId: session.companyId,
      email: session.email,
      role: session.role,
    },
  })
}

export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.set("cos_session", "", { path: "/", maxAge: 0 })
  return res
}
