import { describe, it, expect, vi, afterEach } from "vitest"

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { checkRateLimit, rateLimitMiddleware } from "./rate-limit"

describe("RateLimit", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  describe("checkRateLimit", () => {
    it("allows first request", () => {
      const result = checkRateLimit("test-key", 5, 60000)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4)
    })

    it("blocks when limit exceeded", () => {
      const key = "exceed-key"
      for (let i = 0; i < 6; i++) {
        const result = checkRateLimit(key, 5, 60000)
        if (i < 5) expect(result.allowed).toBe(true)
        else expect(result.allowed).toBe(false)
      }
    })

    it("resets after window expires", () => {
      vi.useFakeTimers()
      const key = "reset-key"
      for (let i = 0; i < 6; i++) checkRateLimit(key, 5, 60000)
      expect(checkRateLimit(key, 5, 60000).allowed).toBe(false)

      vi.advanceTimersByTime(60001)
      const result = checkRateLimit(key, 5, 60000)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4)
    })
  })

  describe("rateLimitMiddleware", () => {
    it("works with request object", () => {
      const req = new Request("http://localhost/api/test", {
        headers: { "x-forwarded-for": "127.0.0.1" },
      })
      const result = rateLimitMiddleware(req)
      expect(result).toHaveProperty("allowed")
      expect(result).toHaveProperty("remaining")
      expect(result).toHaveProperty("resetAt")
    })
  })
})
