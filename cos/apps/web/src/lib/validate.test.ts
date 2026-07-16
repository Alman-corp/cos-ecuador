import { describe, it, expect, vi } from "vitest"
import { z } from "zod"

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock("@/lib/xss", () => ({
  sanitize: <T>(input: T): T => input,
}))

import { validateBody, validateQuery } from "./validate"

describe("validateBody", () => {
  const schema = z.object({ name: z.string().min(1), age: z.number().min(0) })

  it("returns data for valid input", () => {
    const { data, errors } = validateBody(schema, { name: "Test", age: 25 })
    expect(data).toBeDefined()
    expect(errors).toBeUndefined()
    expect(data!.name).toBe("Test")
    expect(data!.age).toBe(25)
  })

  it("returns errors for invalid input", () => {
    const { data, errors } = validateBody(schema, { name: "", age: -1 })
    expect(data).toBeUndefined()
    expect(errors).toBeDefined()
    expect(errors!.length).toBeGreaterThan(0)
  })
})

describe("validateQuery", () => {
  const schema = z.object({ page: z.coerce.number().min(1), limit: z.coerce.number().min(1).max(100) })

  it("returns data for valid query params", () => {
    const params = new URLSearchParams("page=1&limit=20")
    const { data, errors } = validateQuery(schema, params)
    expect(data).toBeDefined()
    expect(errors).toBeUndefined()
    expect(data!.page).toBe(1)
    expect(data!.limit).toBe(20)
  })

  it("returns errors for invalid query params", () => {
    const params = new URLSearchParams("page=0&limit=200")
    const { data, errors } = validateQuery(schema, params)
    expect(data).toBeUndefined()
    expect(errors).toBeDefined()
  })
})
