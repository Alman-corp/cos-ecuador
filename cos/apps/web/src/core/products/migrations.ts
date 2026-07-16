type MigrationDirection = "up" | "down"

interface Migration {
  version: string
  description: string
  up: () => Promise<void>
  down: () => Promise<void>
}

export class ProductVersionManager {
  private migrations: Map<string, Migration[]> = new Map()

  register(productId: string, migration: Migration) {
    const list = this.migrations.get(productId) || []
    if (list.some((m) => m.version === migration.version)) return
    list.push(migration)
    list.sort((a, b) => compareSemVer(a.version, b.version))
    this.migrations.set(productId, list)
  }

  getMigrations(productId: string): Migration[] {
    return this.migrations.get(productId) || []
  }

  getPendingMigrations(productId: string, currentVersion: string | null): Migration[] {
    return this.getMigrations(productId).filter((m) => {
      if (!currentVersion) return true
      return compareSemVer(m.version, currentVersion) > 0
    })
  }

  async migrate(productId: string, currentVersion: string | null, targetVersion?: string): Promise<{ success: boolean; version: string; applied: string[] }> {
    const pending = this.getPendingMigrations(productId, currentVersion)
    const applied: string[] = []

    for (const m of pending) {
      if (targetVersion && compareSemVer(m.version, targetVersion) > 0) break
      try {
        await m.up()
        applied.push(m.version)
      } catch (err) {
        return { success: false, version: currentVersion || "0.0.0", applied }
      }
    }

    const latest = applied.length > 0 ? applied[applied.length - 1] : currentVersion || "0.0.0"
    return { success: true, version: latest, applied }
  }

  async rollback(productId: string, currentVersion: string, targetVersion: string): Promise<{ success: boolean; version: string; reverted: string[] }> {
    const all = this.getMigrations(productId)
    const toRevert = all.filter((m) => {
      const cmpCurrent = compareSemVer(m.version, currentVersion)
      const cmpTarget = compareSemVer(m.version, targetVersion)
      return cmpCurrent <= 0 && cmpTarget > 0
    })
    toRevert.sort((a, b) => compareSemVer(b.version, a.version))

    const reverted: string[] = []
    for (const m of toRevert) {
      try {
        await m.down()
        reverted.push(m.version)
      } catch (err) {
        return { success: false, version: currentVersion, reverted }
      }
    }

    return { success: true, version: targetVersion, reverted }
  }
}

function compareSemVer(a: string, b: string): number {
  const pa = a.split(".").map(Number)
  const pb = b.split(".").map(Number)
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0)
    if (diff !== 0) return diff
  }
  return 0
}

export const versionManager = new ProductVersionManager()
