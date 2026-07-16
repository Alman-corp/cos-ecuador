import { prisma } from "@/lib/db/prisma"
import { logger } from "@/lib/logger"
import type { PersistableStore } from "./index"

const SCOPE = "persistence"

export class DbPersistenceManager {
  private companyId: string
  private dirty = false
  private timer: ReturnType<typeof setTimeout> | null = null
  private storeRegistry: PersistableStore<any>[] = []

  constructor(companyId: string) {
    this.companyId = companyId
  }

  register(store: PersistableStore<any>) {
    this.storeRegistry.push(store)
  }

  count() { return this.storeRegistry.length }

  async loadAll(): Promise<void> {
    if (!this.companyId || this.storeRegistry.length === 0) return
    const entries = await prisma.configEntry.findMany({
      where: { companyId: this.companyId, scope: SCOPE },
    })
    const map = new Map(entries.map((e) => [e.key, e.value as any]))
    for (const store of this.storeRegistry) {
      try {
        const data = map.get(store.getKey())
        if (data) store.restoreAll(data)
      } catch (e) {
        logger.warn({ key: store.getKey(), err: e }, "db-persist load error")
      }
    }
  }

  async saveAll(): Promise<void> {
    if (!this.companyId) return
    for (const store of this.storeRegistry) {
      try {
        const data = store.getAll()
        await prisma.configEntry.upsert({
          where: {
            companyId_scope_key: {
              companyId: this.companyId,
              scope: SCOPE,
              key: store.getKey(),
            },
          },
          update: { value: data as any },
          create: {
            id: crypto.randomUUID(),
            companyId: this.companyId,
            scope: SCOPE,
            key: store.getKey(),
            value: data as any,
            isSystem: true,
          },
        })
      } catch (e) {
        logger.warn({ key: store.getKey(), err: e }, "db-persist save error")
      }
    }
    this.dirty = false
  }

  scheduleSave(): void {
    this.dirty = true
    if (this.timer) return
    this.timer = setTimeout(() => {
      this.timer = null
      if (this.dirty) this.saveAll()
    }, 2000)
  }

  saveNow(): Promise<void> {
    if (this.timer) { clearTimeout(this.timer); this.timer = null }
    return this.saveAll()
  }
}
