import { createClient, SupabaseClient } from "@supabase/supabase-js"

// ── Configuration ───────────────────────────────────────────
// Tenant A: legit user
const TENANT_A_URL = process.env.SUPABASE_URL ?? ""
const TENANT_A_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? ""
const TENANT_A_ACCESS_TOKEN = process.env.USER_A_TOKEN ?? ""

// Tenant B: other tenant's data we should NOT be able to read
const TENANT_B_COMPANY_ID = process.env.TENANT_B_COMPANY_ID ?? ""

// ── Helpers ─────────────────────────────────────────────────

function red(text: string): string {
  return `\x1b[31m${text}\x1b[0m`
}
function green(text: string): string {
  return `\x1b[32m${text}\x1b[0m`
}
function yellow(text: string): string {
  return `\x1b[33m${text}\x1b[0m`
}

function clientAs(userToken: string): SupabaseClient {
  return createClient(TENANT_A_URL, TENANT_A_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${userToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

type TestResult = { table: string; operation: string; passed: boolean; detail: string }

async function testSelect(
  supabase: SupabaseClient,
  table: string,
  companyFilter: string,
): Promise<TestResult> {
  const { data, error, status } = await supabase
    .from(table)
    .select("id, company_id")
    .eq("company_id", companyFilter)
    .limit(5)

  if (error) {
    return {
      table,
      operation: "SELECT (tenant B)",
      passed: true, // error means RLS blocked it — good!
      detail: `Error (RLS bloqueó): ${error.message} (code=${error.code})`,
    }
  }

  if (data && data.length > 0) {
    // We got data from a tenant we shouldn't see — isolation BROKEN
    return {
      table,
      operation: "SELECT (tenant B)",
      passed: false,
      detail: red(`FALLO DE AISLAMIENTO: obtuvo ${data.length} fila(s) del tenant B`),
    }
  }

  // Empty result is ambiguous but acceptable if tenant B has no data
  return {
    table,
    operation: "SELECT (tenant B)",
    passed: true,
    detail: "Sin datos (0 filas devueltas — tenant B puede no tener datos, OK)",
  }
}

async function testInsertOtherTenant(
  supabase: SupabaseClient,
  table: string,
  payload: Record<string, unknown>,
): Promise<TestResult> {
  const { error } = await supabase.from(table).insert(payload).select("id").single()

  if (error) {
    return {
      table,
      operation: "INSERT (other tenant)",
      passed: true,
      detail: `Error (RLS bloqueó): ${error.message}`,
    }
  }

  return {
    table,
    operation: "INSERT (other tenant)",
    passed: false,
    detail: red("FALLO DE AISLAMIENTO: pudo insertar datos en otro tenant"),
  }
}

// ── Tables to test ──────────────────────────────────────────

interface TableTest {
  table: string
  insertPayload?: Record<string, unknown>
}

const CORE_TABLES: TableTest[] = [
  { table: "companies" },
  { table: "financial_statements" },
  { table: "transactions" },
  { table: "projections" },
  { table: "documents" },
  { table: "document_chunks" },
  { table: "agent_sessions" },
]

const DD_TABLES: TableTest[] = [
  { table: "dd_engagements" },
  { table: "dd_reports" },
  { table: "dd_documents" },
]

// ── Main ────────────────────────────────────────────────────

async function main(): Promise<void> {
  const missing: string[] = []
  if (!TENANT_A_URL) missing.push("SUPABASE_URL")
  if (!TENANT_A_ANON_KEY) missing.push("SUPABASE_ANON_KEY")
  if (!TENANT_A_ACCESS_TOKEN) missing.push("USER_A_TOKEN")
  if (!TENANT_B_COMPANY_ID) missing.push("TENANT_B_COMPANY_ID")

  if (missing.length > 0) {
    console.error(`${red("✗")} Faltan variables de entorno: ${missing.join(", ")}`)
    console.error("")
    console.error("  SUPABASE_URL          — URL del proyecto Supabase")
    console.error("  SUPABASE_ANON_KEY     — anon key (pública)")
    console.error("  USER_A_TOKEN          — JWT de un usuario del TENANT A")
    console.error("  TENANT_B_COMPANY_ID   — UUID de company de otro tenant (TENANT B)")
    console.error("")
    console.error("  Ejemplo:")
    console.error(`  $env:SUPABASE_URL="https://xxx.supabase.co"`)
    console.error(`  $env:SUPABASE_ANON_KEY="eyJ..."`)
    console.error(`  $env:USER_A_TOKEN="eyJ..."`)
    console.error(`  $env:TENANT_B_COMPANY_ID="<uuid>"`)
    console.error(`  npx tsx scripts/verify-rls.ts`)
    process.exit(1)
  }

  console.log("══════════════════════════════════════════════")
  console.log("  Cross-Tenant RLS Isolation Verification")
  console.log("══════════════════════════════════════════════")
  console.log(`  Tenant A: ${yellow(TENANT_A_URL)}`)
  console.log(`  Tenant B company ID: ${yellow(TENANT_B_COMPANY_ID)}`)
  console.log("")

  const supabase = clientAs(TENANT_A_ACCESS_TOKEN)
  const results: TestResult[] = []
  const allTables = [...CORE_TABLES, ...DD_TABLES]

  // 1. SELECT tests — try to read tenant B's data
  console.log(yellow("── SELECT isolation (reading tenant B's data) ──"))
  for (const { table } of allTables) {
    const result = await testSelect(supabase, table, TENANT_B_COMPANY_ID)
    results.push(result)
    const icon = result.passed ? green("✓") : red("✗")
    console.log(`  ${icon} ${table}: ${result.detail}`)
  }

  // 2. DELETE test — try to delete from tenant B
  console.log("")
  console.log(yellow("── DELETE isolation ──"))
  for (const { table } of allTables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("company_id", TENANT_B_COMPANY_ID)
      .limit(1)

    const passed = error != null
    const icon = passed ? green("✓") : red("✗")
    results.push({
      table,
      operation: "DELETE (tenant B)",
      passed,
      detail: passed
        ? `Error (RLS bloqueó): ${error!.message}`
        : red("FALLO DE AISLAMIENTO: pudo eliminar datos de otro tenant"),
    })
    console.log(`  ${icon} ${table}: ${error ? error.message : red("ELIMINÓ DATOS")}`)
  }

  // ── Summary ──
  console.log("")
  console.log("══════════════════════════════════════════════")
  console.log("  Resultados")
  console.log("══════════════════════════════════════════════")

  const passed = results.filter((r) => r.passed)
  const failed = results.filter((r) => !r.passed)

  console.log(`  ${green(`✓ ${passed.length} tests pasaron (RLS bloqueó correctamente)`)}`)
  if (failed.length > 0) {
    console.log(`  ${red(`✗ ${failed.length} tests FALLARON (posible fuga de datos)`)}`)
    for (const f of failed) {
      console.log(`     ${f.table} — ${f.operation}: ${f.detail}`)
    }
    process.exit(1)
  } else {
    console.log(`  ${green("✓ Todos los tests de aislamiento pasaron")}`)
    process.exit(0)
  }
}

main().catch((err) => {
  console.error("Fatal:", err)
  process.exit(1)
})
