import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface VaultSecret {
  id: string
  name: string
  value: string
  description: string | null
  tags: string[]
  version: number
  environment: string
  createdAt: string
  updatedAt: string
}

export interface VaultService {
  getSecret: (name: string, environment?: string) => Promise<string | null>
  setSecret: (name: string, value: string, options?: {
    description?: string
    tags?: string[]
    environment?: string
  }) => Promise<void>
  deleteSecret: (name: string, environment?: string) => Promise<void>
  listSecrets: (environment?: string) => Promise<VaultSecret[]>
  rotateSecret: (name: string, environment?: string) => Promise<string>
}

class SupabaseVault implements VaultService {
  private table = "vault_secrets"

  async getSecret(name: string, environment = "production"): Promise<string | null> {
    const { data, error } = await supabase
      .from(this.table)
      .select("value")
      .eq("name", name)
      .eq("environment", environment)
      .single()

    if (error || !data) return null
    return data.value as string
  }

  async setSecret(
    name: string,
    value: string,
    options?: { description?: string; tags?: string[]; environment?: string }
  ): Promise<void> {
    const environment = options?.environment ?? "production"

    const { error } = await supabase.from(this.table).upsert(
      {
        name,
        value,
        description: options?.description ?? null,
        tags: options?.tags ?? [],
        environment,
      },
      { onConflict: "name,environment" }
    )

    if (error) throw new Error(`Vault setSecret failed: ${error.message}`)
  }

  async deleteSecret(name: string, environment = "production"): Promise<void> {
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq("name", name)
      .eq("environment", environment)

    if (error) throw new Error(`Vault deleteSecret failed: ${error.message}`)
  }

  async listSecrets(environment = "production"): Promise<VaultSecret[]> {
    const { data, error } = await supabase
      .from(this.table)
      .select("*")
      .eq("environment", environment)
      .order("name")

    if (error) throw new Error(`Vault listSecrets failed: ${error.message}`)
    return (data ?? []) as VaultSecret[]
  }

  async rotateSecret(name: string, environment = "production"): Promise<string> {
    const current = await this.getSecret(name, environment)
    if (!current) throw new Error(`Secret "${name}" not found in environment "${environment}"`)

    const cryptoObj = typeof globalThis.crypto !== "undefined" ? globalThis.crypto : await import("crypto")
    const bytes = new Uint8Array(32)
    cryptoObj.getRandomValues(bytes)
    const newValue = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")

    await this.setSecret(name, newValue, { environment })
    return newValue
  }
}

export const vault: VaultService = new SupabaseVault()
export default vault
