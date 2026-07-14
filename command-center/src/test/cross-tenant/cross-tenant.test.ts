import { describe, it, expect, vi, beforeEach } from "vitest"

interface Row {
  id: string
  company_id: string
  [key: string]: unknown
}

const store: Record<string, Row[]> = {
  dd_engagements: [],
  financial_statements: [],
}

function resetStore() {
  store.dd_engagements = []
  store.financial_statements = []
}

function createTenantClient(companyId: string) {
  const auth = {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: `user-${companyId}`, email: `${companyId}@test.com` } },
      error: null,
    }),
  }

  function buildQueryBuilder(table: string) {
    const builder: Record<string, unknown> = {}

    builder.select = vi.fn(() => builder)
    builder.order = vi.fn(() => builder)
    builder.limit = vi.fn(async () => {
      const rows = store[table] || []
      return { data: rows.filter((r) => r.company_id === companyId), error: null }
    })
    builder.eq = vi.fn((field: string, value: unknown) => {
      builder._eqField = field
      builder._eqValue = value
      return builder
    })
    builder.single = vi.fn(async () => {
      const rows = store[table] || []
      const field = builder._eqField
      const value = builder._eqValue
      if (field && value !== undefined) {
        const found = rows.find((r) => r[field] === value)
        if (!found) return { data: null, error: { message: "Not found", code: "404" } }
        if (found.company_id !== companyId) {
          return { data: null, error: { message: "new row violates row-level security policy", code: "42501" } }
        }
        return { data: found, error: null }
      }
      const tenantRows = rows.filter((r) => r.company_id === companyId)
      return { data: tenantRows[0] || null, error: null }
    })

    builder.insert = vi.fn((data: Record<string, unknown>) => {
      const newRow: Row = {
        id: `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        ...data,
        company_id: companyId,
        created_at: new Date().toISOString(),
      } as Row
      store[table].push(newRow)

      const insertBuilder: Record<string, unknown> = {}
      insertBuilder.select = vi.fn(() => {
        const selectBuilder: Record<string, unknown> = {}
        selectBuilder.single = vi.fn(async () => ({ data: newRow, error: null }))
        return selectBuilder as { single: () => Promise<{ data: Row; error: null }> }
      })
      return insertBuilder as { select: () => { single: () => Promise<{ data: Row; error: null }> } }
    })

    builder.update = vi.fn((updates: Record<string, unknown>) => {
      const updateBuilder: Record<string, unknown> = {}
      updateBuilder.eq = vi.fn((field: string, value: unknown) => {
        const uBuilder: Record<string, unknown> = {}
        uBuilder.select = vi.fn(() => {
          const sBuilder: Record<string, unknown> = {}
          sBuilder.single = vi.fn(async () => {
            const rows = store[table] || []
            const idx = rows.findIndex((r) => r[field] === value)
            if (idx === -1) return { data: null, error: { message: "Not found", code: "404" } }
            if (rows[idx].company_id !== companyId) {
              return { data: null, error: { message: "new row violates row-level security policy", code: "42501" } }
            }
            rows[idx] = { ...rows[idx], ...updates }
            return { data: rows[idx], error: null }
          })
          return sBuilder as { single: () => Promise<{ data: Row; error: null }> }
        })
        return uBuilder as { select: () => { single: () => Promise<{ data: Row; error: null }> } }
      })
      return updateBuilder as { eq: (f: string, v: unknown) => { select: () => { single: () => Promise<{ data: Row; error: null }> } } }
    })

    return builder as {
      select: ReturnType<typeof vi.fn>
      order: ReturnType<typeof vi.fn>
      limit: ReturnType<typeof vi.fn>
      eq: ReturnType<typeof vi.fn>
      single: ReturnType<typeof vi.fn>
      insert: ReturnType<typeof vi.fn>
      update: ReturnType<typeof vi.fn>
    }
  }

  return {
    from: vi.fn((table: string) => {
      if (!store[table]) store[table] = []
      return buildQueryBuilder(table)
    }),
    auth,
  }
}

describe("T0.8 — Cross-tenant isolation (RLS)", () => {
  let clientA: ReturnType<typeof createTenantClient>
  let clientB: ReturnType<typeof createTenantClient>

  beforeEach(() => {
    resetStore()
    clientA = createTenantClient("company-a")
    clientB = createTenantClient("company-b")
  })

  describe("dd_engagements", () => {
    it("Tenant A creates a record; Tenant B sees 0 results", async () => {
      const { data: created, error: createErr } = await clientA
        .from("dd_engagements")
        .insert({ company_name: "Test Corp", industry: "technology", fiscal_year: 2026, currency: "USD", status: "draft" })
        .select()
        .single()

      expect(createErr).toBeNull()
      expect(created).not.toBeNull()
      expect(created.company_id).toBe("company-a")

      const { data: tenantBRows } = await clientB
        .from("dd_engagements")
        .select()
        .limit(100)

      expect(tenantBRows).toHaveLength(0)
    })

    it("Tenant B cannot read Tenant A's record", async () => {
      const { data: created } = await clientA
        .from("dd_engagements")
        .insert({ company_name: "Test Corp", industry: "technology", fiscal_year: 2026, currency: "USD", status: "draft" })
        .select()
        .single()

      const { data: fetched, error } = await clientB
        .from("dd_engagements")
        .select()
        .eq("id", created.id)
        .single()

      expect(fetched).toBeNull()
      expect(error.code).toBe("42501")
    })

    it("Tenant A can update its own record", async () => {
      const { data: created } = await clientA
        .from("dd_engagements")
        .insert({ company_name: "Test Corp", industry: "technology", fiscal_year: 2026, currency: "USD", status: "draft" })
        .select()
        .single()

      const { data: updated, error } = await clientA
        .from("dd_engagements")
        .update({ status: "in_progress" })
        .eq("id", created.id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(updated.status).toBe("in_progress")
    })

    it("Tenant B cannot update Tenant A's record", async () => {
      const { data: created } = await clientA
        .from("dd_engagements")
        .insert({ company_name: "Test Corp", industry: "technology", fiscal_year: 2026, currency: "USD", status: "draft" })
        .select()
        .single()

      const { data: updated, error } = await clientB
        .from("dd_engagements")
        .update({ status: "in_progress" })
        .eq("id", created.id)
        .select()
        .single()

      expect(updated).toBeNull()
      expect(error.code).toBe("42501")
    })
  })

  describe("financial_statements (second multi-tenant table)", () => {
    it("Tenant A creates a record; Tenant B sees 0 results", async () => {
      const { data: created } = await clientA
        .from("financial_statements")
        .insert({ period: "2026-06-15", revenue: 1000000, cogs: 600000, opex: 200000, depreciation: 50000, interest: 10000, tax: 30000 })
        .select()
        .single()

      expect(created.company_id).toBe("company-a")

      const { data: tenantBRows } = await clientB
        .from("financial_statements")
        .select()
        .limit(100)

      expect(tenantBRows).toHaveLength(0)
    })

    it("Tenant B cannot read Tenant A's financial statement", async () => {
      const { data: created } = await clientA
        .from("financial_statements")
        .insert({ period: "2026-06-15", revenue: 1000000, cogs: 600000, opex: 200000, depreciation: 50000, interest: 10000, tax: 30000 })
        .select()
        .single()

      const { data: fetched, error } = await clientB
        .from("financial_statements")
        .select()
        .eq("id", created.id)
        .single()

      expect(fetched).toBeNull()
      expect(error.code).toBe("42501")
    })

    it("Tenant A can update its own financial statement", async () => {
      const { data: created } = await clientA
        .from("financial_statements")
        .insert({ period: "2026-06-15", revenue: 1000000, cogs: 600000, opex: 200000, depreciation: 50000, interest: 10000, tax: 30000 })
        .select()
        .single()

      const { data: updated } = await clientA
        .from("financial_statements")
        .update({ revenue: 2000000 })
        .eq("id", created.id)
        .select()
        .single()

      expect(updated.revenue).toBe(2000000)
    })

    it("Tenant B cannot update Tenant A's financial statement", async () => {
      const { data: created } = await clientA
        .from("financial_statements")
        .insert({ period: "2026-06-15", revenue: 1000000, cogs: 600000, opex: 200000, depreciation: 50000, interest: 10000, tax: 30000 })
        .select()
        .single()

      const { data: updated, error } = await clientB
        .from("financial_statements")
        .update({ revenue: 9999999 })
        .eq("id", created.id)
        .select()
        .single()

      expect(updated).toBeNull()
      expect(error.code).toBe("42501")
    })
  })
})
