export type SsoProvider = "saml" | "oidc" | "google" | "microsoft" | "github"
export type SsoStatus = "configured" | "pending" | "error"

export interface SsoConfig {
  id: string
  provider: SsoProvider
  label: string
  issuerUrl: string
  clientId: string
  clientSecret: string
  metadataUrl?: string
  status: SsoStatus
  enabled: boolean
  defaultRole: string
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = "cos-sso-configs"

function loadConfigs(): SsoConfig[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
  } catch {
    return []
  }
}

function saveConfigs(configs: SsoConfig[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs))
}

export function getSsoConfigs(): SsoConfig[] {
  return loadConfigs()
}

export function saveSsoConfig(
  config: Omit<SsoConfig, "id" | "createdAt" | "updatedAt" | "status">
): SsoConfig {
  const configs = loadConfigs()
  const existing = configs.find((c) => c.provider === config.provider)
  const now = new Date().toISOString()

  const entry: SsoConfig = {
    ...config,
    id: existing?.id || crypto.randomUUID(),
    status: "configured",
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  }

  if (existing) {
    const idx = configs.indexOf(existing)
    configs[idx] = entry
  } else {
    configs.push(entry)
  }

  saveConfigs(configs)
  return entry
}

export function deleteSsoConfig(id: string): boolean {
  const configs = loadConfigs()
  const filtered = configs.filter((c) => c.id !== id)
  if (filtered.length === configs.length) return false
  saveConfigs(filtered)
  return true
}

export function getSsoLoginUrl(provider: SsoProvider): string {
  const configs = loadConfigs()
  const config = configs.find((c) => c.provider === provider && c.enabled)
  if (!config) return ""
  return `/api/auth/sso/${provider}`
}
