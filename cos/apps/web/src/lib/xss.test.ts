import { describe, it, expect } from "vitest"
import { sanitize } from "./xss"

describe("XSS Sanitize", () => {
  it("strips script tags from strings", () => {
    const result = sanitize("<script>alert('xss')</script>Hello")
    expect(result).not.toContain("<script>")
    expect(result).toContain("Hello")
  })

  it("sanitizes object properties recursively", () => {
    const input = {
      name: "Test <script>alert(1)</script>",
      nested: {
        message: "<img onerror='alert(1)' src='x'>",
      },
    }
    const result = sanitize(input)
    expect(result.name).not.toContain("<script>")
    expect(result.nested.message).not.toContain("onerror")
  })

  it("sanitizes arrays", () => {
    const input = ["<script>alert(1)</script>", "safe"]
    const result = sanitize(input)
    expect(result[0]).not.toContain("<script>")
    expect(result[1]).toBe("safe")
  })

  it("passes through primitive values", () => {
    expect(sanitize(42)).toBe(42)
    expect(sanitize(null)).toBe(null)
    expect(sanitize(true)).toBe(true)
  })
})
