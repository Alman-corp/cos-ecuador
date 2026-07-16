import { CORE_VERSION, CORE_COMPATIBILITY_RANGE } from "./contracts"

export interface PlatformVersion {
  core: string
  sdk: string
  builtAt: string
  compatibility: string
}

export const platformVersion: PlatformVersion = {
  core: CORE_VERSION,
  sdk: "1.0.0",
  builtAt: "2026-06-28",
  compatibility: CORE_COMPATIBILITY_RANGE,
}

export function checkCompatibility(verticalVersion: string, coreVersion: string = CORE_VERSION): {
  compatible: boolean
  reason?: string
} {
  const vMajor = parseInt(verticalVersion.split(".")[0], 10)
  const cMajor = parseInt(coreVersion.split(".")[0], 10)

  if (vMajor !== cMajor) {
    return {
      compatible: false,
      reason: `Major version mismatch: vertical v${vMajor}, core v${cMajor}. Vertical requires core ${CORE_COMPATIBILITY_RANGE}.`,
    }
  }

  return { compatible: true }
}

export function compareSemVer(a: string, b: string): number {
  const pa = a.split(".").map(Number)
  const pb = b.split(".").map(Number)
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0)
    if (diff !== 0) return diff
  }
  return 0
}
