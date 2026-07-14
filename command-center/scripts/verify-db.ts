import { createClient } from "@supabase/supabase-js"
import * as fs from "fs"
import * as path from "path"

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const TABLES = ["dd_engagements", "dd_reports", "dd_documents"] as const

async function verifyTables(): Promise<boolean> {
  console.log("\n── Verifying DD tables ──\n")

  let allOk = true

  for (const table of TABLES) {
    const { error } = await supabase.from(table).select("id").limit(1)
    if (error && error.code === "PGRST116") {
      console.error(`  ✗ ${table} — EXISTS (table found, no rows)`)
    } else if (error) {
      console.error(`  ✗ ${table} — ${error.message}`)
      allOk = false
    } else {
      console.log(`  ✓ ${table} — OK`)
    }
  }

  return allOk
}

async function verifyRLS(): Promise<boolean> {
  console.log("\n── Verifying RLS policies ──\n")

  let allOk = true

  for (const table of TABLES) {
    const { data, error } = await supabase.rpc("get_rls_policies", {
      table_name: table,
    })

    if (error) {
      // fallback: query pg_policies directly
      const { data: policies, error: e2 } = await supabase
        .from("pg_policies")
        .select("schemaname, policyname, permissive, cmd, qual, with_check")
        .eq("tablename", table)

      if (e2 || !policies || policies.length === 0) {
        console.error(`  ✗ ${table} — no RLS policies found or cannot query`)
        allOk = false
      } else {
        console.log(`  ✓ ${table} — ${policies.length} policy(ies)`)
        for (const p of policies) {
          console.log(`       ${p.policyname} (${p.cmd})`)
        }
      }
    } else {
      console.log(`  ✓ ${table} — ${data?.length ?? 0} policy(ies)`)
    }
  }

  return allOk
}

async function main() {
  console.log("Supabase DD Schema Verification")
  console.log("===============================")

  const tablesOk = await verifyTables()
  const rlsOk = await verifyRLS()

  console.log("\n── Summary ──\n")
  if (tablesOk && rlsOk) {
    console.log("  ✓ All DD tables and RLS policies verified successfully")
    process.exit(0)
  } else {
    if (!tablesOk) console.error("  ✗ Some tables are missing")
    if (!rlsOk) console.error("  ✗ Some RLS policies are missing")
    process.exit(1)
  }
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
