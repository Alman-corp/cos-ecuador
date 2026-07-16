import { describe, it, expect } from "vitest"
import { success, failure, fromThrowable, fromPromise, Success, Failure } from "./index"

describe("Result monad", () => {
  describe("success", () => {
    it("creates a Success result", () => {
      const result = success(42)
      expect(result).toBeInstanceOf(Success)
      expect(result.isSuccess()).toBe(true)
      expect(result.isFailure()).toBe(false)
      expect(result.getOrThrow()).toBe(42)
    })
  })

  describe("failure", () => {
    it("creates a Failure result", () => {
      const error = new Error("test error")
      const result = failure(error)
      expect(result).toBeInstanceOf(Failure)
      expect(result.isSuccess()).toBe(false)
      expect(result.isFailure()).toBe(true)
      expect(() => result.getOrThrow()).toThrow("test error")
    })
  })

  describe("fromThrowable", () => {
    it("returns Success when fn succeeds", () => {
      const result = fromThrowable(() => "hello")
      expect(result.isSuccess()).toBe(true)
      if (result.isSuccess()) expect(result.value).toBe("hello")
    })

    it("returns Failure when fn throws", () => {
      const result = fromThrowable(() => { throw new Error("boom") })
      expect(result.isFailure()).toBe(true)
      if (result.isFailure()) expect(result.error.message).toBe("boom")
    })
  })

  describe("fromPromise", () => {
    it("returns Success when promise resolves", async () => {
      const result = await fromPromise(Promise.resolve(99))
      expect(result.isSuccess()).toBe(true)
      if (result.isSuccess()) expect(result.value).toBe(99)
    })

    it("returns Failure when promise rejects", async () => {
      const result = await fromPromise(Promise.reject(new Error("fail")))
      expect(result.isFailure()).toBe(true)
      if (result.isFailure()) expect(result.error.message).toBe("fail")
    })
  })

  describe("type narrowing", () => {
    it("narrows Success type correctly", () => {
      const result = success("hello")
      if (result.isSuccess()) {
        expect(result.value).toBeTypeOf("string")
      }
    })

    it("narrows Failure type correctly", () => {
      const result = failure(new Error("err"))
      if (result.isFailure()) {
        expect(result.error).toBeInstanceOf(Error)
      }
    })
  })
})
