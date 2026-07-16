import * as fs from "fs"
import * as path from "path"
import { logger } from "@/lib/logger"
import { DbPersistenceManager } from "./db-persistence"

export interface PersistableStore<T> {
  getAll(): T
  restoreAll(data: T): void
  getKey(): string
}

export class PersistenceManager {
  private dataDir: string
  private dirty = false
  private timer: ReturnType<typeof setTimeout> | null = null
  private storeRegistry: PersistableStore<any>[] = []

  constructor(dataDir?: string) {
    this.dataDir = dataDir || path.join(process.cwd(), "data")
  }

  register(store: PersistableStore<any>) {
    this.storeRegistry.push(store)
  }

  count() { return this.storeRegistry.length }

  async loadAll(): Promise<void> {
    if (!fs.existsSync(this.dataDir)) return this.ensureDir()
    for (const store of this.storeRegistry) {
      const filePath = path.join(this.dataDir, `${store.getKey()}.json`)
      if (fs.existsSync(filePath)) {
        try {
          const raw = fs.readFileSync(filePath, "utf-8")
          store.restoreAll(JSON.parse(raw))
        } catch (e) {
          logger.warn({ key: store.getKey(), err: e }, "persist load error")
        }
      }
    }
  }

  async saveAll(): Promise<void> {
    this.ensureDir()
    for (const store of this.storeRegistry) {
      try {
        const data = store.getAll()
        const filePath = path.join(this.dataDir, `${store.getKey()}.json`)
        fs.writeFileSync(filePath, JSON.stringify(data), "utf-8")
      } catch (e) {
        logger.warn({ key: store.getKey(), err: e }, "persist save error")
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

  private ensureDir() {
    if (!fs.existsSync(this.dataDir)) fs.mkdirSync(this.dataDir, { recursive: true })
  }
}

export const persistence = new PersistenceManager()

export async function initDbPersistence(companyId: string): Promise<DbPersistenceManager> {
  const mgr = new DbPersistenceManager(companyId)
  const { memoryStore } = await import("@/core/memory")
  mgr.register({
    getKey: () => "memory",
    getAll: () => memoryStore.getAll(),
    restoreAll: (data) => memoryStore.restoreAll(data),
  })
  const { planningEngine } = await import("@/core/planning")
  mgr.register({
    getKey: () => "plans",
    getAll: () => planningEngine.getAllPlansRaw(),
    restoreAll: (data) => planningEngine.restoreAllPlans(data),
  })
  const { learningEngine } = await import("@/core/learning")
  mgr.register({
    getKey: () => "cases",
    getAll: () => learningEngine.getAllCasesRaw(),
    restoreAll: (data) => learningEngine.restoreAllCases(data),
  })
  await mgr.loadAll()
  return mgr
}

let initialized = false
let dbManager: DbPersistenceManager | null = null

export async function initAppPersistence(companyId?: string): Promise<void> {
  if (initialized) return
  initialized = true

  if (companyId) {
    dbManager = await initDbPersistence(companyId)
    return
  }

  const { memoryStore } = await import("@/core/memory")
  persistence.register({
    getKey: () => "memory",
    getAll: () => memoryStore.getAll(),
    restoreAll: (data) => memoryStore.restoreAll(data),
  })
  const { planningEngine } = await import("@/core/planning")
  persistence.register({
    getKey: () => "plans",
    getAll: () => planningEngine.getAllPlansRaw(),
    restoreAll: (data) => planningEngine.restoreAllPlans(data),
  })
  const { learningEngine } = await import("@/core/learning")
  persistence.register({
    getKey: () => "cases",
    getAll: () => learningEngine.getAllCasesRaw(),
    restoreAll: (data) => learningEngine.restoreAllCases(data),
  })
  await persistence.loadAll()
}

export function ensurePersistence(companyId?: string) {
  if (initialized) return
  initialized = true
  if (companyId) {
    Promise.resolve().then(async () => {
      dbManager = await initDbPersistence(companyId)
    })
  } else {
    Promise.resolve().then(async () => {
      const { memoryStore } = await import("@/core/memory")
      persistence.register({
        getKey: () => "memory",
        getAll: () => memoryStore.getAll(),
        restoreAll: (data) => memoryStore.restoreAll(data),
      })
      const { planningEngine } = await import("@/core/planning")
      persistence.register({
        getKey: () => "plans",
        getAll: () => planningEngine.getAllPlansRaw(),
        restoreAll: (data) => planningEngine.restoreAllPlans(data),
      })
      const { learningEngine } = await import("@/core/learning")
      persistence.register({
        getKey: () => "cases",
        getAll: () => learningEngine.getAllCasesRaw(),
        restoreAll: (data) => learningEngine.restoreAllCases(data),
      })
      await persistence.loadAll()
    })
  }
}

export function getDbManager(): DbPersistenceManager | null {
  return dbManager
}
