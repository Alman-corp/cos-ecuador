import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import type { CookieOptions } from "@supabase/ssr"
import { checkRateLimit } from "@/lib/rate-limiter"

function getClientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "127.0.0.1"
}

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  return (
    url.length > 0 &&
    key.length > 0 &&
    !url.includes("your-project-id") &&
    !key.includes("your-anon-key")
  )
}

function getDevUser(request: NextRequest) {
  const devSession = request.cookies.get("dev_session")?.value
  if (!devSession) return null
  try {
    return JSON.parse(devSession)
  } catch {
    return null
  }
}

// @nextjs-backend

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === "/manifest.json" || pathname === "/sw.js" || pathname === "/icon.svg") {
    return NextResponse.next({ request })
  }

  if (pathname.startsWith("/api/")) {
    if (pathname.startsWith("/api/health") || pathname.startsWith("/api/live") || pathname.startsWith("/api/ready")) {
      return NextResponse.next({ request })
    }

    const ip = getClientIp(request)
    const isLogin = pathname.startsWith("/api/auth/login")
    const maxRequests = isLogin ? 5 : 100
    const { allowed, retryAfter } = checkRateLimit(ip, maxRequests)
    if (!allowed) {
      return new NextResponse(JSON.stringify({ error: "Too Many Requests", retryAfter }), {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "Content-Type": "application/json",
        },
      })
    }
    return NextResponse.next({ request })
  }

  const devUser = getDevUser(request)

  if (devUser) {
    if (pathname.startsWith("/auth")) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
    return NextResponse.next({ request })
  }

  if (!isSupabaseConfigured()) {
    if (pathname === "/" || pathname === "" || pathname.startsWith("/auth") || pathname.startsWith("/status")) {
      return NextResponse.next({ request })
    }
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(
          cookiesToSet: {
            name: string
            value: string
            options?: CookieOptions
          }[]
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let companyId: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single()
    companyId = profile?.company_id ?? null
    if (companyId) {
      request.headers.set("x-company-id", companyId)
    }
  }

  const isAuthRoute = pathname.startsWith("/auth")
  const isLandingPage = pathname === "/" || pathname === ""
  const isStatusPage = pathname.startsWith("/status")

  if (!user && !isAuthRoute && !isLandingPage && !isStatusPage) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  if (user && isLandingPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest\\.json|sw\\.js|icon\\.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
