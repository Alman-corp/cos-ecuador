import { describe, it, expect } from "vitest"
import {
  CreateClientSchema, UpdateClientSchema, CreateLeadSchema,
  UpdateLeadSchema, CreateProjectSchema, RegisterCompanySchema,
  LoginSchema, OnboardClientSchema, CreateDocumentSchema,
  SendNotificationSchema, StoreMemorySchema, CreateFinancialStatementSchema,
} from "./api-schemas"

describe("CreateClientSchema", () => {
  it("accepts valid input", () => {
    const result = CreateClientSchema.safeParse({ name: "Test Corp" })
    expect(result.success).toBe(true)
  })

  it("rejects empty name", () => {
    const result = CreateClientSchema.safeParse({ name: "" })
    expect(result.success).toBe(false)
  })

  it("accepts full input", () => {
    const result = CreateClientSchema.safeParse({
      name: "Test Corp", taxId: "123456", industry: "tech",
      segment: "corporate", email: "test@test.com", phone: "555-0100",
      contactFirstName: "John", contactLastName: "Doe", contactEmail: "john@test.com",
    })
    expect(result.success).toBe(true)
  })
})

describe("UpdateClientSchema", () => {
  it("accepts partial update", () => {
    const result = UpdateClientSchema.safeParse({ name: "New Name" })
    expect(result.success).toBe(true)
  })

  it("accepts empty object", () => {
    const result = UpdateClientSchema.safeParse({})
    expect(result.success).toBe(true)
  })
})

describe("CreateLeadSchema", () => {
  it("requires firstName", () => {
    const r = CreateLeadSchema.safeParse({})
    expect(r.success).toBe(false)
  })

  it("defaults lastName to empty", () => {
    const r = CreateLeadSchema.safeParse({ firstName: "John" })
    expect(r.success).toBe(true)
    expect(r.data?.lastName).toBe("")
  })
})

describe("CreateProjectSchema", () => {
  it("requires name, clientId, projectType", () => {
    const r = CreateProjectSchema.safeParse({ name: "P", clientId: "c1", projectType: "consulting" })
    expect(r.success).toBe(true)
  })

  it("rejects missing clientId", () => {
    const r = CreateProjectSchema.safeParse({ name: "P", projectType: "consulting" })
    expect(r.success).toBe(false)
  })
})

describe("RegisterCompanySchema", () => {
  it("requires name", () => {
    const r = RegisterCompanySchema.safeParse({})
    expect(r.success).toBe(false)
  })

  it("accepts optional email as empty string", () => {
    const r = RegisterCompanySchema.safeParse({ name: "Co", email: "" })
    expect(r.success).toBe(true)
  })
})

describe("LoginSchema", () => {
  it("requires valid email", () => {
    const r = LoginSchema.safeParse({ email: "not-an-email" })
    expect(r.success).toBe(false)
  })

  it("accepts valid email", () => {
    const r = LoginSchema.safeParse({ email: "user@test.com" })
    expect(r.success).toBe(true)
  })
})

describe("OnboardClientSchema", () => {
  it("requires name", () => {
    const r = OnboardClientSchema.safeParse({})
    expect(r.success).toBe(false)
  })
})

describe("CreateDocumentSchema", () => {
  it("requires clientId, title, documentType", () => {
    const r = CreateDocumentSchema.safeParse({ clientId: "c1", title: "Doc", documentType: "report" })
    expect(r.success).toBe(true)
  })
})

describe("StoreMemorySchema", () => {
  it("requires companyId, type, title, description, userId", () => {
    const r = StoreMemorySchema.safeParse({
      companyId: "c1", type: "note", title: "T", description: "D", userId: "u1",
    })
    expect(r.success).toBe(true)
  })

  it("provides defaults for optional fields", () => {
    const r = StoreMemorySchema.safeParse({
      companyId: "c1", type: "note", title: "T", description: "D", userId: "u1",
    })
    expect(r.data?.entities).toEqual([])
    expect(r.data?.tags).toEqual([])
    expect(r.data?.importance).toBe("medium")
  })
})

describe("CreateFinancialStatementSchema", () => {
  it("requires clientId, periodStart, periodEnd, statementType, data", () => {
    const r = CreateFinancialStatementSchema.safeParse({
      clientId: "c1", periodStart: "2024-01-01", periodEnd: "2024-12-31",
      statementType: "balance_sheet", data: { revenue: 1000 },
    })
    expect(r.success).toBe(true)
  })
})

describe("SendNotificationSchema", () => {
  it("requires title and body", () => {
    const r = SendNotificationSchema.safeParse({ title: "Alert", body: "Something happened" })
    expect(r.success).toBe(true)
  })

  it("rejects missing body", () => {
    const r = SendNotificationSchema.safeParse({ title: "Alert" })
    expect(r.success).toBe(false)
  })
})
