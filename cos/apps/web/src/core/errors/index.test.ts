import { describe, it, expect } from "vitest"
import { DomainError, NotFoundError, ValidationError, UnauthorizedError, ConflictError } from "./DomainError"

describe("DomainError", () => {
  it("is abstract and cannot be instantiated directly", () => {
    expect(DomainError).toBeDefined()
  })
})

describe("NotFoundError", () => {
  it("creates with NOT_FOUND code", () => {
    const error = new NotFoundError("Client not found")
    expect(error).toBeInstanceOf(DomainError)
    expect(error.message).toBe("Client not found")
    expect(error.code).toBe("NOT_FOUND")
  })
})

describe("ValidationError", () => {
  it("creates with VALIDATION_ERROR code", () => {
    const error = new ValidationError("Invalid input")
    expect(error).toBeInstanceOf(DomainError)
    expect(error.code).toBe("VALIDATION_ERROR")
  })
})

describe("UnauthorizedError", () => {
  it("creates with UNAUTHORIZED code", () => {
    const error = new UnauthorizedError("Access denied")
    expect(error).toBeInstanceOf(DomainError)
    expect(error.code).toBe("UNAUTHORIZED")
  })
})

describe("ConflictError", () => {
  it("creates with CONFLICT code", () => {
    const error = new ConflictError("Resource already exists")
    expect(error).toBeInstanceOf(DomainError)
    expect(error.code).toBe("CONFLICT")
  })
})

describe("Error inheritance", () => {
  it("all subclasses work with instanceof DomainError", () => {
    const errors = [
      new NotFoundError("a"),
      new ValidationError("b"),
      new UnauthorizedError("c"),
      new ConflictError("d"),
    ]
    for (const err of errors) {
      expect(err).toBeInstanceOf(DomainError)
      expect(err).toBeInstanceOf(Error)
    }
  })
})
