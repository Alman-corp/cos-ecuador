export interface FeatureFlag {
  id: string
  flag: string
  isEnabled: boolean
  companyId?: string
  config?: Record<string, unknown>
}

const DEFAULT_FLAGS: Record<string, boolean> = {
  "due-diligence": true,
  "ai-copilot": false,
  "graphrag": false,
  "batch-import": true,
  "export-pdf": true,
  "export-ppt": false,
  "multi-tenant": true,
  "analytics-advanced": false,
  "webhooks": false,
  "api-public": false,
}

let flags: Map<string, FeatureFlag> = new Map()

export function initFeatureFlags(overrides?: Record<string, boolean>) {
  flags.clear()
  for (const [flag, enabled] of Object.entries({ ...DEFAULT_FLAGS, ...overrides })) {
    flags.set(`default_${flag}`, { id: `default_${flag}`, flag, isEnabled: enabled })
  }
}

export function isFeatureEnabled(flag: string, companyId?: string): boolean {
  const key = companyId ? `${companyId}_${flag}` : `default_${flag}`
  const f = flags.get(key) || flags.get(`default_${flag}`)
  return f?.isEnabled ?? DEFAULT_FLAGS[flag] ?? false
}

export function setFeatureFlag(flag: string, isEnabled: boolean, companyId?: string): FeatureFlag {
  const key = companyId ? `${companyId}_${flag}` : `default_${flag}`
  const f: FeatureFlag = { id: key, flag, isEnabled, companyId }
  flags.set(key, f)
  return f
}

export function getAllFlags(companyId?: string): FeatureFlag[] {
  const result: FeatureFlag[] = []
  const seen = new Set<string>()
  for (const [, f] of flags) {
    if (!companyId || !f.companyId || f.companyId === companyId) {
      if (!seen.has(f.flag)) {
        result.push(f)
        seen.add(f.flag)
      }
    }
  }
  for (const [flag, enabled] of Object.entries(DEFAULT_FLAGS)) {
    if (!seen.has(flag)) {
      result.push({ id: `default_${flag}`, flag, isEnabled: enabled })
    }
  }
  return result.sort((a, b) => a.flag.localeCompare(b.flag))
}

export function getKillSwitches(): FeatureFlag[] {
  return getAllFlags().filter((f) => !f.isEnabled)
}

initFeatureFlags()
