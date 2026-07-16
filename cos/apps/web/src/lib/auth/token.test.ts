import { describe, it, expect, vi, beforeAll } from "vitest"

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      update: vi.fn().mockResolvedValue({}),
      findUnique: vi.fn().mockResolvedValue({ isActive: true }),
    },
  },
}))

vi.mock("@/lib/env", () => ({
  env: { TOKEN_SECRET: "this-is-a-32-char-test-secret-key!!" },
}))

import { createSession, verifySession, getSessionFromRequest } from "./token"

describe("Token Auth", () => {
  describe("createSession / verifySession", () => {
    it("creates and verifies a valid token", async () => {
      const token = await createSession("user-1", "company-1", "test@test.com", "admin")
      expect(token).toBeTruthy()
      expect(typeof token).toBe("string")

      const payload = verifySession(token)
      expect(payload).not.toBeNull()
      expect(payload!.userId).toBe("user-1")
      expect(payload!.companyId).toBe("company-1")
      expect(payload!.email).toBe("test@test.com")
      expect(payload!.role).toBe("admin")
    })
  })

  describe("verifySession", () => {
    it("returns null for invalid token", () => {
      const payload = verifySession("invalid-token")
      expect(payload).toBeNull()
    })

    it("returns null for tampered token", () => {
      const payload = verifySession("abcdefghijklmnopqrstuvwxyz0123456789abcd")
      expect(payload).toBeNull()
    })
  })

  describe("getSessionFromRequest", () => {
    it("extracts session from cookie header", async () => {
      const token = await createSession("user-1", "company-1", "test@test.com", "admin")

      const req = new Request("http://localhost", {
        headers: { cookie: `cos_session=${token}` },
      })
      const session = await getSessionFromRequest(req)
      expect(session).not.toBeNull()
      expect(session!.userId).toBe("user-1")
    })

    it("returns null without cookie", async () => {
      const req = new Request("http://localhost")
      const session = await getSessionFromRequest(req)
      expect(session).toBeNull()
    })
  })
})
