import { checkCompatibility } from "./version"
import { CORE_VERSION } from "./contracts"
import type { ProductManifest, ProductPackage } from "@/core/products"

export interface CertificationTest {
  id: string
  name: string
  description: string
  category: "contract" | "manifest" | "lifecycle" | "dna" | "security" | "compatibility"
  run: (pkg: ProductPackage) => Promise<CertificationResult>
}

export interface CertificationResult {
  testId: string
  passed: boolean
  message: string
  details?: string
}

export interface CertificationReport {
  productId: string
  productName: string
  productVersion: string
  coreVersion: string
  testedAt: string
  total: number
  passed: number
  failed: number
  results: CertificationResult[]
  certified: boolean
}

class CertificationSuite {
  private tests: CertificationTest[] = []

  register(test: CertificationTest) {
    if (!this.tests.find((t) => t.id === test.id)) {
      this.tests.push(test)
    }
  }

  getTests(): CertificationTest[] {
    return this.tests
  }

  async certify(pkg: ProductPackage): Promise<CertificationReport> {
    const results: CertificationResult[] = []

    for (const test of this.tests) {
      const result = await test.run(pkg)
      results.push(result)
    }

    const passed = results.filter((r) => r.passed).length
    const failed = results.filter((r) => !r.passed).length

    return {
      productId: pkg.manifest.id,
      productName: pkg.manifest.name,
      productVersion: pkg.manifest.version,
      coreVersion: CORE_VERSION,
      testedAt: new Date().toISOString(),
      total: results.length,
      passed,
      failed,
      results,
      certified: failed === 0,
    }
  }
}

export const certification = new CertificationSuite()

// ─── Built-in Certification Tests ────────────────────────────

certification.register({
  id: "manifest-exists",
  name: "Manifest existe",
  description: "El producto debe tener un manifest con todos los campos requeridos",
  category: "manifest",
  run: async (pkg) => {
    const m = pkg.manifest
    const required: (keyof ProductManifest)[] = ["id", "name", "version", "status", "audience", "objective"]
    const missing = required.filter((f) => !m[f])
    return {
      testId: "manifest-exists",
      passed: missing.length === 0,
      message: missing.length === 0 ? "Manifest completo" : `Faltan campos: ${missing.join(", ")}`,
    }
  },
})

certification.register({
  id: "manifest-version-valid",
  name: "Versión SemVer válida",
  description: "La versión del producto debe seguir el formato SemVer (X.Y.Z)",
  category: "manifest",
  run: async (pkg) => {
    const valid = /^\d+\.\d+\.\d+$/.test(pkg.manifest.version)
    return {
      testId: "manifest-version-valid",
      passed: valid,
      message: valid ? `Versión ${pkg.manifest.version} válida` : `Versión ${pkg.manifest.version} no es SemVer`,
    }
  },
})

certification.register({
  id: "compatibility-core",
  name: "Compatibilidad con Core",
  description: "La versión major del producto debe coincidir con la del Core",
  category: "compatibility",
  run: async (pkg) => {
    const result = checkCompatibility(pkg.manifest.version, CORE_VERSION)
    return {
      testId: "compatibility-core",
      passed: result.compatible,
      message: result.compatible ? "Compatible con Core 1.x" : result.reason || "Incompatible",
    }
  },
})

certification.register({
  id: "lifecycle-valid",
  name: "Estado de lifecycle válido",
  description: "El producto debe estar en un estado de lifecycle reconocido",
  category: "lifecycle",
  run: async (pkg) => {
    const valid = ["discovered", "installed", "activated", "configured", "running", "disabled", "uninstalled", "failed"]
    const ok = valid.includes(pkg.lifecycle)
    return {
      testId: "lifecycle-valid",
      passed: ok,
      message: ok ? `Lifecycle: ${pkg.lifecycle}` : `Estado inválido: ${pkg.lifecycle}`,
    }
  },
})

certification.register({
  id: "permissions-defined",
  name: "Permisos definidos",
  description: "El producto debe tener al menos un permiso definido",
  category: "security",
  run: async (pkg) => {
    return {
      testId: "permissions-defined",
      passed: pkg.manifest.permissions.length > 0,
      message: pkg.manifest.permissions.length > 0
        ? `${pkg.manifest.permissions.length} permisos definidos`
        : "No hay permisos definidos",
    }
  },
})

certification.register({
  id: "agents-named",
  name: "Agentes con nombre",
  description: "Todos los agentes deben tener nombre y descripción",
  category: "contract",
  run: async (pkg) => {
    const unnamed = pkg.manifest.agents.filter((a) => !a.name || !a.description)
    return {
      testId: "agents-named",
      passed: unnamed.length === 0,
      message: unnamed.length === 0
        ? `${pkg.manifest.agents.length} agentes válidos`
        : `${unnamed.length} agentes sin nombre o descripción`,
    }
  },
})

certification.register({
  id: "kpis-defined",
  name: "KPIs definidos",
  description: "El producto debe tener al menos un KPI",
  category: "manifest",
  run: async (pkg) => {
    return {
      testId: "kpis-defined",
      passed: pkg.manifest.kpis.length > 0,
      message: pkg.manifest.kpis.length > 0
        ? `${pkg.manifest.kpis.length} KPIs definidos`
        : "No hay KPIs definidos",
    }
  },
})

certification.register({
  id: "dna-module-linked",
  name: "Módulo DNA vinculado",
  description: "El producto debe tener un módulo DNA asociado",
  category: "dna",
  run: async (pkg) => {
    return {
      testId: "dna-module-linked",
      passed: pkg.dna !== null && pkg.dna !== undefined,
      message: pkg.dna
        ? `DNA: ${pkg.dna.name} v${pkg.dna.version}`
        : "No hay módulo DNA vinculado",
    }
  },
})

certification.register({
  id: "dashboards-have-routes",
  name: "Dashboards con rutas",
  description: "Todos los dashboards deben tener una ruta definida",
  category: "contract",
  run: async (pkg) => {
    const noRoute = pkg.manifest.dashboards.filter((d) => !d.route)
    return {
      testId: "dashboards-have-routes",
      passed: noRoute.length === 0,
      message: noRoute.length === 0
        ? `${pkg.manifest.dashboards.length} dashboards con ruta`
        : `${noRoute.length} dashboards sin ruta`,
    }
  },
})
