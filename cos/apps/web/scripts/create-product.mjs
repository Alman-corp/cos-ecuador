#!/usr/bin/env node

import { mkdirSync, writeFileSync, existsSync, readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..", "src")
const productsDir = join(root, "core", "products", "manifests")
const dnaDir = join(root, "core", "vertical-dnas")
const sdkTypes = join(root, "core", "platform", "sdk", "types.ts")

const [,, productId, productName, productPrice] = process.argv

if (!productId || !productName) {
  console.error("Usage: node scripts/create-product.mjs <id> <name> [price]")
  console.error("Example: node scripts/create-product.mjs manufacturing 'Manufacturing Intelligence Suite' 249")
  console.error("")
  console.error("SDK available at: @/core/platform/sdk")
  console.error("Types: createManifest(), createAgent(), createKPI(), createRule(), etc.")
  process.exit(1)
}

const id = productId.toLowerCase().replace(/\s+/g, "-")
const name = productName
const price = parseInt(productPrice, 10) || 199
const version = "0.1.0"
const className = id.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("")

// ─── Validate ────────────────────────────────────────────────
if (!/^[a-z0-9-]+$/.test(id)) {
  console.error("Error: ID must be lowercase alphanumeric with hyphens (e.g. 'manufacturing')")
  process.exit(1)
}

if (existsSync(join(productsDir, `${id}.ts`))) {
  console.error(`Error: Product '${id}' already exists`)
  process.exit(1)
}

// ─── Manifest ────────────────────────────────────────────────
const manifestContent = `// BI OS SDK: import { createManifest, createAgent, createKPI, createRule } from "@/core/platform/sdk"
import type { ProductManifest } from "../manifest"

const ${id}ConfigSchema: Record<string, any> = {
  defaultCurrency: {
    type: "select",
    label: "Moneda por defecto",
    description: "Moneda para reportes",
    default: "USD",
    options: [{ label: "USD Dólar", value: "USD" }, { label: "EUR Euro", value: "EUR" }],
  },
}

export const ${id}Manifest: ProductManifest = {
  id: "${id}",
  name: "${name}",
  tagline: "",
  description: "",
  version: "${version}",
  status: "coming_soon",
  icon: "puzzle",
  audience: "",
  objective: "",
  price: ${price},

  agents: [],
  rules: [],
  dashboards: [],
  reports: [],
  workflows: [],
  kpis: [],

  permissions: ["${id}.read", "${id}.manage"],
  dependencies: [],
  configSchema: ${id}ConfigSchema,
}
`

// ─── DNA Stub ────────────────────────────────────────────────
const dnaContent = `export const ${id}DNA = {
  version: "${version}",
  lastUpdated: new Date().toISOString().split("T")[0],
  name: "${name} DNA",
  description: "",
  modules: [],
}
`

// ─── UI Page ─────────────────────────────────────────────────
const uiDir = join(root, "app", "director", id)
mkdirSync(uiDir, { recursive: true })

const uiPage = `"use client"

export default function ${className}Page() {
  return (
    <div className="min-h-screen bg-surface-900 p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-100">${name}</h1>
        <p className="text-sm text-surface-400 mt-1">v{version} · ${price}/mes</p>
      </div>
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-surface-700/50 bg-surface-800/20">
        <div className="text-center">
          <p className="text-sm font-medium text-surface-500">Próximamente</p>
          <p className="text-xs text-surface-600 mt-1">Este producto está en desarrollo</p>
        </div>
      </div>
    </div>
  )
}
`

// ─── Write Files ─────────────────────────────────────────────
const manifestPath = join(productsDir, `${id}.ts`)
const dnaPath = join(dnaDir, `${id}-dna.ts`)
const indexPath = join(productsDir, "index.ts")
const uiPath = join(uiDir, "page.tsx")

writeFileSync(manifestPath, manifestContent, "utf-8")
writeFileSync(dnaPath, dnaContent, "utf-8")
writeFileSync(uiPath, uiPage, "utf-8")

// ─── Update manifests/index.ts ───────────────────────────────
const manifestNames = [
  "consulting",
  "financial",
  "accounting",
  "legal",
  "investment",
]

if (manifestNames.includes(id)) {
  console.log("⚠️  Product ID matches existing product — index not modified")
} else {
  const existingIndex = readFileSync(indexPath, "utf-8")
  const exportLine = `export { ${id}Manifest } from "./${id}"`
  if (!existingIndex.includes(exportLine)) {
    writeFileSync(indexPath, `${exportLine}\nexport { consultingManifest } from "./consulting"
export { financialManifest } from "./financial"
export { accountingManifest } from "./accounting"
export { legalManifest } from "./legal"
export { investmentManifest } from "./investment"
`, "utf-8")
  }
}

// ─── Done ────────────────────────────────────────────────────
console.log(`\n✅ Product '${name}' (${id}) created successfully`)
console.log("")
console.log("Files created:")
console.log(`  ${manifestPath}`)
console.log(`  ${dnaPath}`)
console.log(`  ${uiPath}`)
console.log("")
console.log("Next steps:")
console.log(`  1. Edit ${manifestPath}`)
console.log(`     — Use SDK helpers: import { createAgent, createKPI, createRule } from "@/core/platform/sdk"`)
console.log(`     — Add agents, rules, dashboards, reports, workflows, kpis`)
console.log(`     — Set audience, objective, tagline, description`)
console.log("")
console.log(`  2. Edit ${dnaPath}`)
console.log("     — Add domain-specific models, indicators, benchmarks, scenarios")
console.log("")
console.log(`  3. Register in ${join(root, "core", "products", "registry.ts")}`)
console.log(`     import { ${id}Manifest } from "./manifests/${id}"`)
console.log(`     productRegistry.register(${id}Manifest, "discovered")`)
console.log("")
console.log(`  4. Verify with certification:`)
console.log("     GET /api/platform/certification")
console.log("")
console.log("SDK Reference:")
console.log("  import { createManifest, createAgent, createKPI } from \"@/core/platform/sdk\"")
console.log("  import { CoreEvent, platformEvents } from \"@/core/platform\"")
console.log("  import { CORE_VERSION, CORE_COMPATIBILITY_RANGE } from \"@/core/platform\"")
