import { createClient } from "@supabase/supabase-js"
import * as fs from "fs"
import * as path from "path"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TABLE = "vault_secrets"

interface SeedEntry {
  name: string
  value: string
  description: string
  tags: string[]
  environment: string
}

async function ensureTable(): Promise<void> {
  const { error } = await supabase.from(TABLE).select("id").limit(1)
  if (error && error.code === "42P01") {
    console.log("Creating vault_secrets table via Supabase SQL...")
    const { error: sqlError } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS vault_secrets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          value TEXT NOT NULL,
          description TEXT,
          tags JSONB DEFAULT '[]',
          version INT DEFAULT 1,
          environment TEXT DEFAULT 'production',
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now(),
          UNIQUE(name, environment)
        );

        ALTER TABLE vault_secrets ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Service role full access on vault_secrets"
          ON vault_secrets
          FOR ALL
          TO service_role
          USING (true)
          WITH CHECK (true);
      `,
    })
    if (sqlError) throw new Error(`Failed to create table: ${sqlError.message}`)
    console.log("vault_secrets table created successfully.")
  }
}

async function migrateFromEnv(): Promise<void> {
  const envPath = path.resolve(__dirname, "..", ".env.local")
  if (!fs.existsSync(envPath)) {
    console.log("No .env.local found, skipping env migration.")
    return
  }

  const envContent = fs.readFileSync(envPath, "utf-8")
  const lines = envContent.split("\n")

  const secrets: SeedEntry[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue

    const eqIndex = trimmed.indexOf("=")
    if (eqIndex === -1) continue

    const name = trimmed.slice(0, eqIndex).trim()
    let value = trimmed.slice(eqIndex + 1).trim()

    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1)
    }

    if (name.startsWith("NEXT_PUBLIC_")) continue

    secrets.push({
      name,
      value,
      description: `Migrated from .env.local`,
      tags: ["migrated", "env"],
      environment: "production",
    })
  }

  if (secrets.length === 0) {
    console.log("No secrets to migrate.")
    return
  }

  console.log(`Migrating ${secrets.length} secrets to vault...`)

  for (const secret of secrets) {
    const { error } = await supabase.from(TABLE).upsert(
      {
        name: secret.name,
        value: secret.value,
        description: secret.description,
        tags: secret.tags,
        environment: secret.environment,
      },
      { onConflict: "name,environment" }
    )

    if (error) {
      console.error(`  Failed to migrate ${secret.name}: ${error.message}`)
    } else {
      console.log(`  Migrated ${secret.name}`)
    }
  }

  console.log("Migration complete.")
}

async function main() {
  console.log("=== Vault Migration Script ===")
  await ensureTable()
  await migrateFromEnv()
}

main().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})
