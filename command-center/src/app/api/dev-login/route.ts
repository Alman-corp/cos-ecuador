import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const response = NextResponse.redirect(`${request.nextUrl.origin}/dashboard`)

  response.cookies.set("dev_session", JSON.stringify({
    email: "dev@cos-platform.com",
    name: "Dev User",
    role: "admin",
  }), {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24,
  })

  return response
}

export async function DELETE() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const response = NextResponse.json({ ok: true })

  response.cookies.set("dev_session", "", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  })

  return response
}
