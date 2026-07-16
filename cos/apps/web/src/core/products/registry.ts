import type { ProductManifest, ProductPackage, LifecycleState } from "./manifest"
import { lifecycleManager } from "./lifecycle"
import { configEngine } from "./config"
import { consultingManifest } from "./manifests/consulting"
import { financialManifest } from "./manifests/financial"
import { accountingManifest } from "./manifests/accounting"
import { legalManifest } from "./manifests/legal"
import { investmentManifest } from "./manifests/investment"
import { getVerticalDNA } from "@/core/vertical-dnas"

class ProductRegistry {
  private products: Map<string, ProductPackage> = new Map()

  register(manifest: ProductManifest, initialLifecycle: LifecycleState = "discovered") {
    const pkg: ProductPackage = {
      manifest,
      dna: getVerticalDNA(`vip-${manifest.id}`),
      lifecycle: initialLifecycle,
      installedAt: null,
      activatedAt: null,
      configuredAt: null,
      config: {},
      migrationVersion: null,
    }
    this.products.set(manifest.id, pkg)
  }

  get(id: string): ProductPackage | undefined {
    return this.products.get(id)
  }

  getAll(): ProductPackage[] {
    return Array.from(this.products.values())
  }

  getByLifecycle(state: LifecycleState): ProductPackage[] {
    return this.getAll().filter((p) => p.lifecycle === state)
  }

  getAvailable(): ProductPackage[] {
    return this.getAll().filter((p) => p.manifest.status !== "coming_soon")
  }

  getActive(): ProductPackage[] {
    return this.getByLifecycle("running")
  }

  install(id: string): { pkg?: ProductPackage; error?: string } {
    const pkg = this.get(id)
    if (!pkg) return { error: `Product '${id}' not found` }
    const result = lifecycleManager.transition(pkg, "install")
    if (result.error) return { error: result.error }
    this.products.set(id, result.pkg)
    return { pkg: result.pkg }
  }

  activate(id: string): { pkg?: ProductPackage; error?: string } {
    const pkg = this.get(id)
    if (!pkg) return { error: `Product '${id}' not found` }
    const result = lifecycleManager.transition(pkg, "activate")
    if (result.error) return { error: result.error }
    this.products.set(id, result.pkg)
    return { pkg: result.pkg }
  }

  configure(id: string, config: Record<string, any>): { pkg?: ProductPackage; error?: string; errors?: string[] } {
    const pkg = this.get(id)
    if (!pkg) return { error: `Product '${id}' not found` }

    const validation = configEngine.validate(pkg, config)
    if (!validation.valid) return { error: "Config validation failed", errors: validation.errors }

    const merged = configEngine.mergeWithDefaults(pkg, config)
    const updated = { ...pkg, config: merged }
    const result = lifecycleManager.transition(updated, "configure")
    if (result.error) return { error: result.error }
    this.products.set(id, result.pkg)
    return { pkg: result.pkg }
  }

  start(id: string): { pkg?: ProductPackage; error?: string } {
    const pkg = this.get(id)
    if (!pkg) return { error: `Product '${id}' not found` }
    const mustConfigure = lifecycleManager.getAvailableActions(pkg.lifecycle).includes("configure")
    if (mustConfigure && pkg.manifest.configSchema && Object.keys(pkg.manifest.configSchema).length > 0) {
      const defaults = configEngine.getDefaults(pkg)
      const merged = configEngine.mergeWithDefaults(pkg, defaults)
      const configured = { ...pkg, config: merged, lifecycle: "configured" as LifecycleState }
      const result = lifecycleManager.transition(configured, "start")
      if (result.error) return { error: result.error }
      this.products.set(id, result.pkg)
      return { pkg: result.pkg }
    }
    const result = lifecycleManager.transition(pkg, "start")
    if (result.error) return { error: result.error }
    this.products.set(id, result.pkg)
    return { pkg: result.pkg }
  }

  disable(id: string): { pkg?: ProductPackage; error?: string } {
    const pkg = this.get(id)
    if (!pkg) return { error: `Product '${id}' not found` }
    const result = lifecycleManager.transition(pkg, "disable")
    if (result.error) return { error: result.error }
    this.products.set(id, result.pkg)
    return { pkg: result.pkg }
  }

  enable(id: string): { pkg?: ProductPackage; error?: string } {
    const pkg = this.get(id)
    if (!pkg) return { error: `Product '${id}' not found` }
    const result = lifecycleManager.transition(pkg, "enable")
    if (result.error) return { error: result.error }
    this.products.set(id, result.pkg)
    return { pkg: result.pkg }
  }

  uninstall(id: string): { pkg?: ProductPackage; error?: string } {
    const pkg = this.get(id)
    if (!pkg) return { error: `Product '${id}' not found` }
    const result = lifecycleManager.transition(pkg, "uninstall")
    if (result.error) return { error: result.error }
    this.products.set(id, result.pkg)
    return { pkg: result.pkg }
  }

  getSummary() {
    const all = this.getAll()
    return {
      total: all.length,
      running: this.getByLifecycle("running").length,
      installed: this.getByLifecycle("installed").length + this.getByLifecycle("activated").length + this.getByLifecycle("configured").length + this.getByLifecycle("running").length,
      disabled: this.getByLifecycle("disabled").length,
      discovered: this.getByLifecycle("discovered").length,
      products: all.map((p) => ({
        id: p.manifest.id,
        name: p.manifest.name,
        status: p.manifest.status,
        lifecycle: p.lifecycle,
        version: p.manifest.version,
        agents: p.manifest.agents.length,
        rules: p.manifest.rules.length,
        dashboards: p.manifest.dashboards.length,
        reports: p.manifest.reports.length,
        workflows: p.manifest.workflows.length,
        kpis: p.manifest.kpis.length,
        price: p.manifest.price,
        migrationVersion: p.migrationVersion,
      })),
    }
  }
}

export const productRegistry = new ProductRegistry()

// Register all products
productRegistry.register(consultingManifest, "running")
productRegistry.register(financialManifest, "discovered")
productRegistry.register(accountingManifest, "discovered")
productRegistry.register(legalManifest, "discovered")
productRegistry.register(investmentManifest, "discovered")
