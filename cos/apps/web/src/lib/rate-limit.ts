import { logger } from "@/lib/logger"

interface RateLimitStore {
  [key: string]: { count: number; resetAt: number }
}

const store: RateLimitStore = {}
const WINDOW_MS = 60_000
const MAX_REQUESTS = 100

function cleanup() {
  const now = Date.now()
  for (const key in store) {
    if (store[key].resetAt <= now) delete store[key]
  }
}

setInterval(cleanup, 60_000)

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

export function checkRateLimit(key: string, maxRequests = MAX_REQUESTS, windowMs = WINDOW_MS): RateLimitResult {
  const now = Date.now()
  const entry = store[key]

  if (!entry || entry.resetAt <= now) {
    store[key] = { count: 1, resetAt: now + windowMs }
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs }
  }

  entry.count++
  const remaining = Math.max(0, maxRequests - entry.count)
  const allowed = entry.count <= maxRequests

  if (!allowed) {
    logger.warn({ key, count: entry.count, maxRequests }, "rate limit exceeded")
  }

  return { allowed, remaining, resetAt: entry.resetAt }
}

export function rateLimitMiddleware(req: Request): RateLimitResult {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
  const key = `ratelimit:${ip}`
  return checkRateLimit(key)
}
