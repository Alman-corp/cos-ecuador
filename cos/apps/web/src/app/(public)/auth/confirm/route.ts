import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const next = searchParams.get("next") ?? "/"

  if (token_hash) {
    return NextResponse.redirect(next)
  }

  return NextResponse.redirect("/auth/login?error=verification_failed")
}
