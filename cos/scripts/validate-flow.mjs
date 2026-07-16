#!/usr/bin/env node

/**
 * Prime Experience — End-to-End Validation Suite
 *
 * Usage: node scripts/validate-flow.mjs
 *
 * Tests the complete commercial flow:
 *   Register → Login → Create Client → Upload Docs → Create FS → Analyze → Dashboard
 */

const BASE = process.env.API_URL || "http://localhost:3000/api"

let passed = 0
let failed = 0
const errors = []

async function test(name, fn) {
  process.stdout.write(`  ${name} ... `)
  try {
    await fn()
    passed++
    process.stdout.write("\x1b[32mPASS\x1b[0m\n")
  } catch (e) {
    failed++
    errors.push({ name, error: e.message })
    process.stdout.write(`\x1b[31mFAIL\x1b[0m — ${e.message}\n`)
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg)
}

async function api(path, options = {}) {
  const url = `${BASE}${path}`
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok && !options.allowError) throw new Error(`${res.status}: ${data.error || JSON.stringify(data)}`)
  return { status: res.status, data, headers: res.headers }
}

let sessionCookie = ""

console.log("\n\x1b[1m🔍 Prime Experience — Validation Suite\x1b[0m\n")

// ── Registration ──
console.log("\n\x1b[1m📋 Registration\x1b[0m")
{
  const ts = Date.now()
  let companyId, userId

  await test("POST /auth/register — creates company + admin + roles", async () => {
    const { data } = await api("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: `Test Corp ${ts}`,
        taxId: `179${ts.toString().slice(-10)}`,
        email: `admin${ts}@test.co`,
        phone: "+593 99 999 9999",
        firstName: "Test",
        lastName: "Admin",
      }),
    })
    companyId = data.companyId
    userId = data.userId
    assert(companyId, "Missing companyId")
    assert(data.slug, "Missing slug")
  })

  await test("POST /auth/register — rejects duplicate", async () => {
    const { status } = await api("/auth/register", {
      method: "POST",
      allowError: true,
      body: JSON.stringify({
        name: `Test Corp ${ts}`,
        taxId: `179${ts.toString().slice(-10)}`,
        email: `admin${ts}@test.co`,
        firstName: "Test", lastName: "Admin",
      }),
    })
    assert(status === 409 || status === 400, `Expected 409/400 got ${status}`)
  })

  // Save credentials for later
  const credentials = { email: `admin${ts}@test.co`, companyId, userId }

  // ── Login ──
  console.log("\n\x1b[1m🔐 Login\x1b[0m")

  await test("POST /auth/login — returns session cookie", async () => {
    const { data, headers } = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: credentials.email }),
    })
    assert(data.userId, "Missing userId")
    assert(data.companyId, "Missing companyId")
    const cookies = headers.getSetCookie?.() || []
    sessionCookie = cookies.find((c) => c.startsWith("cos_session="))
    assert(sessionCookie, "Missing session cookie")
  })

  await test("POST /auth/login — rejects unknown email", async () => {
    const { status } = await api("/auth/login", {
      method: "POST",
      allowError: true,
      body: JSON.stringify({ email: "nobody@nowhere.com" }),
    })
    assert(status === 404, `Expected 404 got ${status}`)
  })

  // ── Clients ──
  console.log("\n\x1b[1m👥 Clients\x1b[0m")

  let clientId

  await test("POST /api/clients — creates client with contact", async () => {
    const { data } = await api("/clients", {
      method: "POST",
      headers: { cookie: sessionCookie },
      body: JSON.stringify({
        name: `Cliente Test ${ts}`,
        taxId: `099${ts.toString().slice(-9)}`,
        industry: "comercio",
        email: `cliente${ts}@test.co`,
        contactFirstName: "Juan",
        contactLastName: "Perez",
        contactEmail: `juan${ts}@test.co`,
      }),
    })
    clientId = data.clientId
    assert(clientId, "Missing clientId")
  })

  await test("GET /api/clients — returns list", async () => {
    const { data } = await api(`/clients?companyId=${credentials.companyId}`, {
      headers: { cookie: sessionCookie },
    })
    assert(data.data?.length > 0, "No clients returned")
    assert(data.total > 0, "Total is 0")
  })

  await test("GET /api/clients/{id} — returns detail", async () => {
    const { data } = await api(`/clients/${clientId}`, {
      headers: { cookie: sessionCookie },
    })
    assert(data.id === clientId, "Wrong client returned")
    assert(data.contacts?.length > 0, "No contacts returned")
  })

  await test("PUT /api/clients/{id} — updates client", async () => {
    const { data } = await api(`/clients/${clientId}`, {
      method: "PUT",
      headers: { cookie: sessionCookie },
      body: JSON.stringify({ name: `Updated Client ${ts}` }),
    })
    assert(data.name.includes("Updated"), "Name not updated")
  })

  // ── Documents ──
  console.log("\n\x1b[1m📄 Documents\x1b[0m")

  let docId

  await test("POST /api/documents — uploads document", async () => {
    const { data } = await api("/documents", {
      method: "POST",
      headers: { cookie: sessionCookie },
      body: JSON.stringify({
        clientId,
        title: `Balance Sheet ${ts}.pdf`,
        documentType: "financial_statement",
        fileUrl: "https://example.com/test.pdf",
        status: "pending",
      }),
    })
    docId = data.id
    assert(docId, "Missing document id")
  })

  await test("GET /api/documents — returns list", async () => {
    const { data } = await api(`/documents?clientId=${clientId}`, {
      headers: { cookie: sessionCookie },
    })
    assert(data.data?.length > 0, "No documents returned")
  })

  // ── Financial Statements ──
  console.log("\n\x1b[1m💰 Financial Statements\x1b[0m")

  let fsId

  await test("POST /api/financial-statements — creates statement", async () => {
    const { data } = await api("/financial-statements", {
      method: "POST",
      headers: { cookie: sessionCookie },
      body: JSON.stringify({
        clientId,
        periodStart: "2025-01-01",
        periodEnd: "2025-12-31",
        statementType: "comprehensive",
        data: {
          current_assets: 500000, cash: 80000, accounts_receivable: 200000, inventory: 150000,
          non_current_assets: 800000, total_assets: 1300000,
          current_liabilities: 300000, long_term_debt: 400000, total_liabilities: 700000,
          equity: 600000, revenue: 1200000, cogs: 720000, gross_profit: 480000,
          opex: 300000, ebitda: 180000, net_income: 120000,
        },
      }),
    })
    fsId = data.id
    assert(fsId, "Missing statement id")
    assert(data.data?.current_assets === 500000, "Data not stored correctly")
  })

  await test("GET /api/financial-statements — returns list", async () => {
    const { data } = await api(`/financial-statements?clientId=${clientId}`, {
      headers: { cookie: sessionCookie },
    })
    assert(data.data?.length > 0, "No statements returned")
  })

  // ── Analysis ──
  console.log("\n\x1b[1m📊 Analysis\x1b[0m")

  let analysisResult

  await test("POST /api/consulting/analyze — returns ratios + health + risk", async () => {
    const { data } = await api("/consulting/analyze", {
      method: "POST",
      headers: { cookie: sessionCookie },
      body: JSON.stringify({ clientId, financialStatementIds: [fsId] }),
    })
    analysisResult = data
    assert(data.ratios?.liquidity?.current > 0, "Missing liquidity ratio")
    assert(data.ratios?.solvency?.debtToEquity > 0, "Missing solvency ratio")
    assert(data.ratios?.profitability?.netMargin > 0, "Missing profitability ratio")
    assert(data.healthScore >= 0, "Missing health score")
    assert(data.healthScore <= 100, "Health score out of range")
    assert(data.riskAssessment?.overallScore >= 0, "Missing risk assessment")
    assert(data.recommendations?.length > 0, "No recommendations")
  })

  await test("POST /api/consulting/analyze — financial data sanity", async () => {
    const { data } = analysisResult
    // With assets=1.3M, liabilities=700K, equity=600K: D/E = 1.17
    assert(data.ratios.solvency.debtToEquity > 1.0, `D/E too low: ${data.ratios.solvency.debtToEquity}`)
    assert(data.ratios.solvency.debtToEquity < 1.3, `D/E too high: ${data.ratios.solvency.debtToEquity}`)
    // Current ratio = 500K/300K = 1.67
    assert(data.ratios.liquidity.current > 1.5, `Current ratio too low: ${data.ratios.liquidity.current}`)
    assert(data.ratios.liquidity.current < 1.8, `Current ratio too high: ${data.ratios.liquidity.current}`)
  })

  // ── Compliance ──
  console.log("\n\x1b[1m✅ Compliance\x1b[0m")

  await test("POST /api/consulting/compliance — evaluates compliance", async () => {
    const { data } = await api("/consulting/compliance", {
      method: "POST",
      headers: { cookie: sessionCookie },
      body: JSON.stringify({ clientId, checklistType: "tax" }),
    })
    assert(data.overallScore >= 0, "Missing compliance score")
    assert(data.overallScore <= 100, "Compliance score out of range")
    assert(data.status, "Missing compliance status")
  })

  // ── Dashboard ──
  console.log("\n\x1b[1m📈 Dashboard\x1b[0m")

  await test("GET /api/dashboard/{companyId} — returns KPIs", async () => {
    const { data } = await api(`/dashboard/${credentials.companyId}`)
    assert(data.totalClients >= 1, "Missing total clients")
    assert(typeof data.healthAvg === "number", "Missing health avg")
    assert(data.topClients?.length > 0, "Missing top clients")
    assert(data._tenant === credentials.companyId, "Wrong tenant")
  })

  // ── Roles ──
  console.log("\n\x1b[1m🛡️ Roles & Identity\x1b[0m")

  await test("GET /api/identity/roles — returns company roles", async () => {
    const { data } = await api("/identity/roles", {
      headers: { cookie: sessionCookie },
    })
    assert(data.length >= 4, `Expected at least 4 default roles, got ${data.length}`)
    const admin = data.find((r) => r.name === "admin")
    assert(admin, "Missing admin role")
  })

  await test("POST /api/identity/roles — creates custom role", async () => {
    const { data } = await api("/identity/roles", {
      method: "POST",
      headers: { cookie: sessionCookie },
      body: JSON.stringify({
        name: `custom_role_${ts}`,
        permissions: ["clients.read", "reports.read"],
      }),
    })
    assert(data.roleId, "Missing role id")
  })
}

// ── Summary ──
console.log("\n\x1b[1m═══════════════════════════════\x1b[0m")
console.log(`  \x1b[1mResults:\x1b[0m`)
console.log(`    \x1b[32mPassed: ${passed}\x1b[0m`)
console.log(`    \x1b[31mFailed: ${failed}\x1b[0m`)
if (errors.length > 0) {
  console.log(`\n  \x1b[1mErrors:\x1b[0m`)
  errors.forEach((e) => console.log(`    \x1b[31m• ${e.name}: ${e.error}\x1b[0m`))
}
console.log(`\n  ${failed === 0 ? "\x1b[32m✓ All checks passed\x1b[0m" : "\x1b[31m✗ Some checks failed\x1b[0m"}\n`)

process.exit(failed > 0 ? 1 : 0)
