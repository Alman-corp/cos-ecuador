import type { LifecycleState, ProductPackage } from "./manifest"

interface LifecycleTransition {
  from: LifecycleState[]
  to: LifecycleState
  action: string
}

const transitions: LifecycleTransition[] = [
  { from: ["discovered"], to: "installed", action: "install" },
  { from: ["installed"], to: "activated", action: "activate" },
  { from: ["activated"], to: "configured", action: "configure" },
  { from: ["configured"], to: "running", action: "start" },
  { from: ["running", "configured", "activated", "installed"], to: "disabled", action: "disable" },
  { from: ["disabled"], to: "activated", action: "enable" },
  { from: ["disabled", "installed", "failed"], to: "uninstalled", action: "uninstall" },
  { from: ["installed", "activated", "configured", "running", "disabled"], to: "failed", action: "fail" },
  { from: ["failed"], to: "installed", action: "retry" },
]

export class ProductLifecycleManager {
  private eventListeners: Map<string, ((pkg: ProductPackage) => void)[]> = new Map()

  on(event: string, fn: (pkg: ProductPackage) => void) {
    const listeners = this.eventListeners.get(event) || []
    listeners.push(fn)
    this.eventListeners.set(event, listeners)
  }

  private emit(event: string, pkg: ProductPackage) {
    const listeners = this.eventListeners.get(event) || []
    for (const fn of listeners) fn(pkg)
  }

  canTransition(current: LifecycleState, action: string): boolean {
    return transitions.some((t) => t.from.includes(current) && t.action === action)
  }

  getAvailableActions(current: LifecycleState): string[] {
    return transitions.filter((t) => t.from.includes(current)).map((t) => t.action)
  }

  getNextState(current: LifecycleState, action: string): LifecycleState | null {
    const t = transitions.find((tr) => tr.from.includes(current) && tr.action === action)
    return t ? t.to : null
  }

  transition(pkg: ProductPackage, action: string): { pkg: ProductPackage; error?: string } {
    const next = this.getNextState(pkg.lifecycle, action)
    if (!next) {
      return {
        pkg,
        error: `Cannot '${action}' from state '${pkg.lifecycle}'. Available: ${this.getAvailableActions(pkg.lifecycle).join(", ")}`,
      }
    }

    const now = new Date().toISOString()
    const updated: ProductPackage = {
      ...pkg,
      lifecycle: next,
      installedAt: action === "install" ? now : pkg.installedAt,
      activatedAt: action === "activate" ? now : pkg.activatedAt,
      configuredAt: action === "configure" ? now : pkg.configuredAt,
    }

    this.emit(`lifecycle:${action}`, updated)
    this.emit(`lifecycle:state:${next}`, updated)

    return { pkg: updated }
  }
}

export const lifecycleManager = new ProductLifecycleManager()
