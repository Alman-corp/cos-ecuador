export interface FeatureFlag {
  id: string
  key: string
  description: string
  enabled: boolean
  rolloutPercentage: number
  userSegments: string[]
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = "cos-feature-flags"

function loadFlags(): FeatureFlag[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") }
  catch { return [] }
}

function saveFlags(flags: FeatureFlag[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(flags))
}

export function createFlag(key: string, description: string = ""): FeatureFlag {
  const flags = loadFlags()
  if (flags.find((f) => f.key === key)) return flags.find((f) => f.key === key)!
  const flag: FeatureFlag = {
    id: crypto.randomUUID(), key, description, enabled: true, rolloutPercentage: 100,
    userSegments: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  }
  flags.push(flag)
  saveFlags(flags)
  return flag
}

export function isEnabled(key: string, userId?: string): boolean {
  const flags = loadFlags()
  const flag = flags.find((f) => f.key === key)
  if (!flag || !flag.enabled) return false
  if (flag.rolloutPercentage >= 100) return true

  if (!userId) userId = "demo-user"
  const hash = Array.from(userId).reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return (hash % 100) < flag.rolloutPercentage
}

export function updateFlag(key: string, updates: Partial<Omit<FeatureFlag, "id" | "key" | "createdAt">>): FeatureFlag | null {
  const flags = loadFlags()
  const flag = flags.find((f) => f.key === key)
  if (!flag) return null
  Object.assign(flag, updates, { updatedAt: new Date().toISOString() })
  saveFlags(flags)
  return flag
}

export function listFlags(): FeatureFlag[] {
  return loadFlags()
}

export function deleteFlag(id: string): boolean {
  const flags = loadFlags().filter((f) => f.id !== id)
  if (flags.length === loadFlags().length) return false
  saveFlags(flags)
  return true
}
