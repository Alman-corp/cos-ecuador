import { http, HttpResponse } from "msw"

const SUPABASE_URL = "https://mock.supabase.co"

export const handlers = [
  http.get(`${SUPABASE_URL}/rest/v1/financial_statements`, () => {
    return HttpResponse.json([
      {
        id: "1",
        period: "Q4 2025",
        revenue: 14160000000,
        cogs: 11750000000,
        gross_profit: 2410000000,
        opex: 0,
        ebitda: 2445000000,
        depreciation: 965000000,
        ebit: 1480000000,
        interest: 200000000,
        tax: 756000000,
        net_income: 524000000,
      },
      {
        id: "2",
        period: "Q3 2025",
        revenue: 24830000000,
        cogs: 20280000000,
        gross_profit: 4550000000,
        opex: 0,
        ebitda: 3291000000,
        depreciation: 930000000,
        ebit: 2361000000,
        interest: 180000000,
        tax: 1261000000,
        net_income: 920000000,
      },
    ])
  }),

  http.get(`${SUPABASE_URL}/rest/v1/transactions`, () => {
    return HttpResponse.json([
      { id: "t1", date: "2025-12-01", description: "Venta de vehículos", amount: 1200000000, type: "inflow", category: "Revenue" },
      { id: "t2", date: "2025-12-02", description: "Pago proveedores", amount: 850000000, type: "outflow", category: "COGS" },
    ])
  }),

  http.get(`${SUPABASE_URL}/rest/v1/projections`, () => {
    return HttpResponse.json([
      { id: "p1", projection_date: "2026-01-01", scenario: "base", cash_balance: 44059000000, months_runway: 36, metadata: {} },
      { id: "p2", projection_date: "2026-01-01", scenario: "optimistic", cash_balance: 52000000000, months_runway: 42, metadata: {} },
      { id: "p3", projection_date: "2026-01-01", scenario: "pessimistic", cash_balance: 35000000000, months_runway: 28, metadata: {} },
    ])
  }),

  http.post(`${SUPABASE_URL}/auth/v1/token`, () => {
    return HttpResponse.json({
      access_token: "mock-access-token",
      token_type: "bearer",
      expires_in: 3600,
      refresh_token: "mock-refresh-token",
      user: { id: "user-1", email: "test@example.com" },
    })
  }),

  http.get(`${SUPABASE_URL}/auth/v1/user`, () => {
    return HttpResponse.json({
      id: "user-1",
      email: "test@example.com",
      user_metadata: { name: "Test User" },
    })
  }),

  http.post("https://localhost:3000/api/dev-login", () => {
    return HttpResponse.json({ success: true })
  }),

  http.get("https://localhost:3000/api/health", () => {
    return HttpResponse.json({ status: "healthy" })
  }),
]
