export interface SecretEntry {
  id: string
  name: string
  value: string
  version: number
  createdAt: string
  rotatedAt: string | null
  nextRotationAt: string | null
  enabled: boolean
  rotatedBy: string | null
}

const STORAGE_KEY = "cos-secrets"
const ROTATION_INTERVAL_DAYS = 90

function loadSecrets(): SecretEntry[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
  } catch {
    return []
  }
}

function saveSecrets(secrets: SecretEntry[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(secrets))
}

export function addSecret(name: string, value: string): SecretEntry {
  const secrets = loadSecrets()
  secrets.forEach((s) => { if (s.name === name) s.enabled = false })

  const now = new Date()
  const nextRotation = new Date(now.getTime() + ROTATION_INTERVAL_DAYS * 86400000)

  const entry: SecretEntry = {
    id: crypto.randomUUID(),
    name,
    value,
    version: secrets.filter((s) => s.name === name).length + 1,
    createdAt: now.toISOString(),
    rotatedAt: null,
    nextRotationAt: nextRotation.toISOString(),
    enabled: true,
    rotatedBy: null,
  }

  secrets.push(entry)
  saveSecrets(secrets)
  return entry
}

export function getSecret(name: string): string | null {
  const secrets = loadSecrets()
  const active = secrets.filter((s) => s.name === name && s.enabled).sort((a, b) => b.version - a.version)
  return active.length > 0 ? active[0].value : null
}

export function listSecrets(): Omit<SecretEntry, "value">[] {
  return loadSecrets().map(({ value, ...rest }) => rest)
}

export function rotateSecret(name: string, newValue: string, rotatedBy?: string): SecretEntry | null {
  const secrets = loadSecrets()
  const active = secrets.find((s) => s.name === name && s.enabled)
  if (!active) return null

  active.enabled = false
  active.rotatedAt = new Date().toISOString()

  const now = new Date()
  const nextRotation = new Date(now.getTime() + ROTATION_INTERVAL_DAYS * 86400000)
  const entry: SecretEntry = {
    id: crypto.randomUUID(),
    name,
    value: newValue,
    version: secrets.filter((s) => s.name === name).length + 1,
    createdAt: now.toISOString(),
    rotatedAt: now.toISOString(),
    nextRotationAt: nextRotation.toISOString(),
    enabled: true,
    rotatedBy: rotatedBy || null,
  }

  secrets.push(entry)
  saveSecrets(secrets)
  return entry
}

export function getSecretsDueForRotation(): Omit<SecretEntry, "value">[] {
  const now = new Date()
  return loadSecrets()
    .filter((s) => s.enabled && s.nextRotationAt && new Date(s.nextRotationAt) <= now)
    .map(({ value, ...rest }) => rest)
}

export function getRotationIntervalDays(): number {
  return ROTATION_INTERVAL_DAYS
}
