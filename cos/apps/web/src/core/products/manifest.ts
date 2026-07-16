export type ProductStatus = "active" | "inactive" | "coming_soon"

export type LifecycleState =
  | "discovered"
  | "installed"
  | "activated"
  | "configured"
  | "running"
  | "disabled"
  | "uninstalled"
  | "failed"

export interface ProductManifest {
  id: string
  name: string
  tagline: string
  description: string
  version: string
  status: ProductStatus
  icon: string
  audience: string
  objective: string
  price: number

  agents: ProductAgent[]
  rules: ProductRule[]
  dashboards: ProductDashboard[]
  reports: ProductReport[]
  workflows: ProductWorkflow[]
  kpis: ProductKPI[]
  permissions: string[]
  dependencies: string[]

  configSchema?: Record<string, ConfigField>
}

export interface ConfigField {
  type: "string" | "number" | "boolean" | "select"
  label: string
  description: string
  default?: any
  options?: { label: string; value: string }[]
  required?: boolean
}

export interface ProductAgent {
  name: string
  description: string
  tools: string[]
  memory: boolean
  model: string
}

export interface ProductRule {
  name: string
  description: string
  category: string
  count: number
}

export interface ProductDashboard {
  name: string
  description: string
  route: string
}

export interface ProductReport {
  name: string
  description: string
  format: string
}

export interface ProductWorkflow {
  name: string
  description: string
  steps: number
}

export interface ProductKPI {
  name: string
  description: string
  formula: string
  unit: string
}

export interface ProductPackage {
  manifest: ProductManifest
  dna: any
  lifecycle: LifecycleState
  installedAt: string | null
  activatedAt: string | null
  configuredAt: string | null
  config: Record<string, any>
  migrationVersion: string | null
}
