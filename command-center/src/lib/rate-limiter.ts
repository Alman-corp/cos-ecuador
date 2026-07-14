interface RateEntry {
  count: number
  resetAt: number
}

const rateMap = new Map<string, RateEntry>()

const WINDOW_MS = 60_000
const SWEEP_INTERVAL_MS = 300_000

let lastSweep = Date.now()

function sweepStale(): void {
  const now = Date.now()
  if (now - lastSweep < SWEEP_INTERVAL_MS) return
  lastSweep = now
  for (const [key, entry] of rateMap) {
    if (now > entry.resetAt) rateMap.delete(key)
  }
}

export function checkRateLimit(
  ip: string,
  maxRequests = 60
): { allowed: boolean; retryAfter: number } {
  sweepStale()
  const now = Date.now()
  const entry = rateMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, retryAfter: 0 }
  }

  entry.count++

  if (entry.count > maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return { allowed: false, retryAfter }
  }

  return { allowed: true, retryAfter: 0 }
}

export function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number = 60_000
): { success: boolean; remaining: number; resetAt: number } {
  sweepStale()
  const now = Date.now()
  const entry = rateMap.get(key)

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: maxRequests - 1, resetAt: now + windowMs }
  }

  entry.count++
  const remaining = Math.max(0, maxRequests - entry.count)

  if (entry.count > maxRequests) {
    return { success: false, remaining: 0, resetAt: entry.resetAt }
  }

  return { success: true, remaining, resetAt: entry.resetAt }
}

export function exponentialBackoff(attempt: number): number {
  return Math.min(1000 * Math.pow(2, attempt), 30_000)
}
