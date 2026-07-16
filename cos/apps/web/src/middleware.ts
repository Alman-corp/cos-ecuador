import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const RATE_LIMIT_WINDOW = 60_000
const RATE_LIMIT_MAX = 100
const ipRequests = new Map<string, { count: number; reset: number }>()

const KILL_SWITCHES: Record<string, string[]> = {
  "/api/ai": ["ai-copilot"],
  "/api/webhooks": ["webhooks"],
  "/api/public": ["api-public"],
}

function getFlagForPath(pathname: string): string | null {
  for (const [prefix, flags] of Object.entries(KILL_SWITCHES)) {
    if (pathname.startsWith(prefix)) return flags[0]
  }
  return null
}

async function verifyPortalToken(token: string): Promise<boolean> {
  try {
    const { jwtVerify } = await import("jose")
    const secret = new TextEncoder().encode(
      process.env.PORTAL_JWT_SECRET || "cos-due-diligence-portal-secret-2026"
    )
    const { payload } = await jwtVerify(token, secret)
    return !!payload.sub
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const { pathname } = request.nextUrl

  // Portal auth protection
  if (pathname.startsWith("/portal") && !pathname.startsWith("/portal/login")) {
    const token = request.cookies.get("portal_token")?.value
    if (!token || !(await verifyPortalToken(token))) {
      const loginUrl = new URL("/portal/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // CORS
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
  }

  // Rate limiting
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
  const now = Date.now()
  const record = ipRequests.get(ip)
  if (record && now < record.reset) {
    record.count++
    if (record.count > RATE_LIMIT_MAX) {
      response.headers.set("Retry-After", `${Math.ceil((record.reset - now) / 1000)}`)
      return new NextResponse(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: { "Content-Type": "application/json", "Retry-After": `${Math.ceil((record.reset - now) / 1000)}` },
      })
    }
  } else {
    ipRequests.set(ip, { count: 1, reset: now + RATE_LIMIT_WINDOW })
  }

  // Kill switch check via header (set by feature flag service)
  const flag = getFlagForPath(pathname)
  if (flag && request.headers.get("x-kill-switch") === flag) {
    return new NextResponse(JSON.stringify({ error: "This feature is disabled", code: "FEATURE_DISABLED" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    })
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
