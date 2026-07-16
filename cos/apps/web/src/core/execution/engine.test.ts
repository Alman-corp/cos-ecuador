import { describe, it, expect, vi } from "vitest"

vi.mock("@/core/memory", () => ({
  memoryStore: {
    add: vi.fn(),
    getByEntity: vi.fn().mockReturnValue([]),
    getRecent: vi.fn().mockReturnValue([]),
  },
}))

import { executionEngine } from "./engine"

describe("ExecutionEngine", () => {
  it("is defined", () => {
    expect(executionEngine).toBeDefined()
  })
})
