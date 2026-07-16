import { Injectable, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { createClient, SupabaseClient } from "@supabase/supabase-js"

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

@Injectable()
export class VaultService {
  private readonly logger = new Logger(VaultService.name)
  private supabase: SupabaseClient
  private readonly table = "vault_secrets"

  constructor(private config: ConfigService) {
    this.supabase = createClient(
      this.config.get<string>("SUPABASE_URL")!,
      this.config.get<string>("SUPABASE_SERVICE_KEY")!
    )
  }

  async getSecret(name: string, environment = "production"): Promise<string | null> {
    const { data, error } = await this.supabase
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
    const env = options?.environment ?? "production"
    const { error } = await this.supabase.from(this.table).upsert(
      {
        name,
        value,
        description: options?.description ?? null,
        tags: options?.tags ?? [],
        environment: env,
      },
      { onConflict: "name,environment" }
    )
    if (error) throw new Error(`Vault setSecret failed: ${error.message}`)
  }

  async deleteSecret(name: string, environment = "production"): Promise<void> {
    const { error } = await this.supabase
      .from(this.table)
      .delete()
      .eq("name", name)
      .eq("environment", environment)
    if (error) throw new Error(`Vault deleteSecret failed: ${error.message}`)
  }

  async listSecrets(environment = "production"): Promise<VaultSecret[]> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select("*")
      .eq("environment", environment)
      .order("name")
    if (error) throw new Error(`Vault listSecrets failed: ${error.message}`)
    return (data ?? []) as VaultSecret[]
  }

  async rotateSecret(name: string, environment = "production"): Promise<string> {
    const current = await this.getSecret(name, environment)
    if (!current) throw new Error(`Secret "${name}" not found`)

    const { randomBytes } = await import("crypto")
    const newValue = randomBytes(32).toString("hex")
    await this.setSecret(name, newValue, { environment })
    return newValue
  }
}
