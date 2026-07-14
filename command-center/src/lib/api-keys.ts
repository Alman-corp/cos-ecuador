export type Scope =
  | "read:financial"
  | "write:financial"
  | "read:documents"
  | "write:documents"
  | "read:users"
  | "write:users"
  | "admin"
  | "read:reports"
  | "write:reports"

export interface ApiKey {
  id: string
  prefix: string
  hash: string
  name: string
  scopes: Scope[]
  expiresAt: string | null
  createdAt: string
  lastUsedAt: string | null
  enabled: boolean
}

const STORAGE_KEY = "cos-api-keys"

function loadKeys(): ApiKey[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveKeys(keys: ApiKey[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys))
}

async function sha256(msg: string): Promise<string> {
  const enc = new TextEncoder().encode(msg)
  const buf = await crypto.subtle.digest("SHA-256", enc)
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("")
}

function generateApiKeyValue(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  const raw = Array.from(bytes).map((b) => b.toString(36).padStart(2, "0")).join("")
  return `cos_${raw.slice(0, 48)}`
}

export async function createApiKey(name: string, scopes: Scope[], expiresInDays?: number): Promise<{ key: ApiKey; rawKey: string }> {
  const keys = loadKeys()
  const rawKey = generateApiKeyValue()
  const hash = await sha256(rawKey)
  const prefix = rawKey.slice(0, 8)
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 86400000).toISOString()
    : null

  const key: ApiKey = { id, prefix, hash, name, scopes, expiresAt, createdAt, lastUsedAt: null, enabled: true }
  keys.push(key)
  saveKeys(keys)
  return { key, rawKey }
}

export async function validateApiKey(rawKey: string): Promise<{ valid: boolean; scopes: Scope[]; keyId: string } | null> {
  const keys = loadKeys()
  const hash = await sha256(rawKey)
  const match = keys.find((k) => k.hash === hash && k.enabled)
  if (!match) return null
  if (match.expiresAt && new Date(match.expiresAt) < new Date()) return null

  match.lastUsedAt = new Date().toISOString()
  saveKeys(keys)

  return { valid: true, scopes: match.scopes, keyId: match.id }
}

export function hasScope(required: Scope[], provided: Scope[]): boolean {
  if (provided.includes("admin")) return true
  return required.every((s) => provided.includes(s))
}

export function listApiKeys(): Omit<ApiKey, "hash">[] {
  return loadKeys().map(({ hash, ...rest }) => rest)
}

export function revokeApiKey(id: string): boolean {
  const keys = loadKeys()
  const idx = keys.findIndex((k) => k.id === id)
  if (idx === -1) return false
  keys[idx].enabled = false
  saveKeys(keys)
  return true
}
