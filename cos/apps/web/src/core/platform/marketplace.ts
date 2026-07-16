import type { ProductPackage } from "@/core/products"
import { productRegistry } from "@/core/products"
import { checkCompatibility } from "./version"

export interface MarketplaceEntry {
  id: string
  name: string
  tagline: string
  description: string
  version: string
  icon: string
  audience: string
  objective: string
  price: number
  status: string
  lifecycle: string
  compatible: boolean
  compatibilityReason?: string
  stats: {
    agents: number
    rules: number
    dashboards: number
    reports: number
    workflows: number
    kpis: number
  }
}

class MarketplaceService {
  getAvailable(): MarketplaceEntry[] {
    const all = productRegistry.getAll()
    return all.map((pkg) => {
      const compatibility = checkCompatibility(pkg.manifest.version)
      return {
        id: pkg.manifest.id,
        name: pkg.manifest.name,
        tagline: pkg.manifest.tagline,
        description: pkg.manifest.description,
        version: pkg.manifest.version,
        icon: pkg.manifest.icon,
        audience: pkg.manifest.audience,
        objective: pkg.manifest.objective,
        price: pkg.manifest.price,
        status: pkg.manifest.status,
        lifecycle: pkg.lifecycle,
        compatible: compatibility.compatible,
        compatibilityReason: compatibility.reason,
        stats: {
          agents: pkg.manifest.agents.length,
          rules: pkg.manifest.rules.length,
          dashboards: pkg.manifest.dashboards.length,
          reports: pkg.manifest.reports.length,
          workflows: pkg.manifest.workflows.length,
          kpis: pkg.manifest.kpis.length,
        },
      }
    })
  }

  getInstalled(): MarketplaceEntry[] {
    return this.getAvailable().filter((e) => e.lifecycle !== "discovered")
  }

  getDiscoverable(): MarketplaceEntry[] {
    return this.getAvailable().filter((e) => e.lifecycle === "discovered")
  }

  getById(id: string): MarketplaceEntry | undefined {
    return this.getAvailable().find((e) => e.id === id)
  }

  async install(id: string): Promise<{ success: boolean; error?: string }> {
    const entry = this.getById(id)
    if (!entry) return { success: false, error: "Product not found" }
    if (entry.lifecycle !== "discovered") return { success: false, error: "Already installed" }
    if (!entry.compatible) return { success: false, error: entry.compatibilityReason || "Incompatible with core" }

    const result = productRegistry.install(id)
    if (result.error) return { success: false, error: result.error }
    return { success: true }
  }

  async uninstall(id: string): Promise<{ success: boolean; error?: string }> {
    const result = productRegistry.uninstall(id)
    if (result.error) return { success: false, error: result.error }
    return { success: true }
  }
}

export const marketplace = new MarketplaceService()
