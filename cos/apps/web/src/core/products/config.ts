import type { ProductPackage } from "./manifest"
import type { ConfigField } from "./manifest"

export class ProductConfigEngine {
  getDefaults(pkg: ProductPackage): Record<string, any> {
    const schema = pkg.manifest.configSchema
    if (!schema) return {}

    const defaults: Record<string, any> = {}
    for (const [key, field] of Object.entries(schema)) {
      if (field.default !== undefined) {
        defaults[key] = field.default
      }
    }
    return defaults
  }

  validate(pkg: ProductPackage, config: Record<string, any>): { valid: boolean; errors: string[] } {
    const schema = pkg.manifest.configSchema
    if (!schema) return { valid: true, errors: [] }

    const errors: string[] = []

    for (const [key, field] of Object.entries(schema)) {
      const value = config[key]

      if (value === undefined || value === null || value === "") {
        if (field.required) {
          errors.push(`${field.label} (${key}) es requerido`)
        }
        continue
      }

      if (field.type === "select" && field.options) {
        const validValues = field.options.map((o) => o.value)
        if (!validValues.includes(value)) {
          errors.push(`${field.label} debe ser uno de: ${validValues.join(", ")}`)
        }
      }
    }

    return { valid: errors.length === 0, errors }
  }

  mergeWithDefaults(pkg: ProductPackage, config: Record<string, any>): Record<string, any> {
    return { ...this.getDefaults(pkg), ...config }
  }
}

export const configEngine = new ProductConfigEngine()
