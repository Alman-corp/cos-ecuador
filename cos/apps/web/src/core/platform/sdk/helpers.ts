import type { ProductManifest, ConfigField, ProductKPI, ProductAgent, ProductRule, ProductDashboard, ProductReport, ProductWorkflow } from "./types"

// ─── Manifest Builder ────────────────────────────────────────

export function createManifest(id: string, name: string, overrides?: Partial<ProductManifest>): ProductManifest {
  return {
    id,
    name,
    tagline: "",
    description: "",
    version: "0.1.0",
    status: "coming_soon",
    icon: "puzzle",
    audience: "",
    objective: "",
    price: 199,
    agents: [],
    rules: [],
    dashboards: [],
    reports: [],
    workflows: [],
    kpis: [],
    permissions: [`${id}.read`, `${id}.manage`],
    dependencies: [],
    configSchema: {},
    ...overrides,
  }
}

// ─── Agent Builder ───────────────────────────────────────────

export function createAgent(name: string, description: string, tools: string[], model = "rule-based"): ProductAgent {
  return { name, description, tools, memory: true, model }
}

// ─── Rule Builder ────────────────────────────────────────────

export function createRule(name: string, description: string, category: string, count = 1): ProductRule {
  return { name, description, category, count }
}

// ─── Dashboard Builder ───────────────────────────────────────

export function createDashboard(name: string, description: string, route: string): ProductDashboard {
  return { name, description, route }
}

// ─── Report Builder ──────────────────────────────────────────

export function createReport(name: string, description: string, format = "A4 PDF"): ProductReport {
  return { name, description, format }
}

// ─── Workflow Builder ────────────────────────────────────────

export function createWorkflow(name: string, description: string, steps: number): ProductWorkflow {
  return { name, description, steps }
}

// ─── KPI Builder ─────────────────────────────────────────────

export function createKPI(name: string, description: string, formula: string, unit: string): ProductKPI {
  return { name, description, formula, unit }
}

// ─── Config Schema Builder ───────────────────────────────────

export function createConfigField(
  type: ConfigField["type"],
  label: string,
  description: string,
  options?: { label: string; value: string }[],
  defaultValue?: any,
  required = false,
): ConfigField {
  return { type, label, description, options, default: defaultValue, required }
}

// ─── Validation ──────────────────────────────────────────────

export function validateVerticalId(id: string): { valid: boolean; error?: string } {
  if (!id) return { valid: false, error: "ID is required" }
  if (!/^[a-z0-9-]+$/.test(id)) return { valid: false, error: "ID must be lowercase alphanumeric with hyphens" }
  if (id.length < 2 || id.length > 32) return { valid: false, error: "ID must be 2-32 characters" }
  return { valid: true }
}

export function validateSemVer(version: string): { valid: boolean; error?: string } {
  if (!/^\d+\.\d+\.\d+$/.test(version)) return { valid: false, error: "Version must be SemVer (X.Y.Z)" }
  return { valid: true }
}
