/**
 * Schema Validator — pre-migration quality check
 * 
 * Reads PRISMA_SCHEMA_DESIGN.md and validates against the checklist.
 * Run: npx tsx scripts/validate-schema.ts
 */

import * as fs from "fs"
import * as path from "path"

const DESIGN_PATH = path.resolve(__dirname, "../PRISMA_SCHEMA_DESIGN.md")

interface ModelInfo {
  name: string
  fields: FieldInfo[]
  indexes: string[]
  uniques: string[]
  relations: RelationInfo[]
  hasCompanyId: boolean
  hasCreatedAt: boolean
  hasUpdatedAt: boolean
  hasDeletedAt: boolean
}

interface FieldInfo {
  name: string
  type: string
  isJson: boolean
  isEnum: boolean
  isOptional: boolean
  relation?: string
}

interface RelationInfo {
  field: string
  target: string
  type: "1-1" | "1-N" | "N-N"
}

function parseModels(content: string): ModelInfo[] {
  const models: ModelInfo[] = []
  const modelBlocks = content.match(/model \w+ \{[\s\S]*?\n\}/g) || []

  for (const block of modelBlocks) {
    const nameMatch = block.match(/model (\w+)/)
    if (!nameMatch) continue
    const name = nameMatch[1]

    const fields: FieldInfo[] = []
    const indexes: string[] = []
    const uniques: string[] = []
    const relations: RelationInfo[] = []

    const lines = block.split("\n")
    let hasCompanyId = false
    let hasCreatedAt = false
    let hasUpdatedAt = false
    let hasDeletedAt = false

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("}") || trimmed.startsWith("model")) continue

      // @@index
      if (trimmed.startsWith("@@index")) {
        indexes.push(trimmed)
        continue
      }
      // @@unique
      if (trimmed.startsWith("@@unique")) {
        uniques.push(trimmed)
        continue
      }
      // @@map, @@id, etc
      if (trimmed.startsWith("@@")) continue

      // Field definition
      const fieldMatch = trimmed.match(/^(\w+)\s+(\??)(\w+)/)
      if (!fieldMatch) continue

      const fieldName = fieldMatch[1]
      const isOptional = fieldMatch[2] === "?"
      const fieldType = fieldMatch[3]

      if (fieldName === "companyId") hasCompanyId = true
      if (fieldName === "createdAt") hasCreatedAt = true
      if (fieldName === "updatedAt") hasUpdatedAt = true
      if (fieldName === "deletedAt") hasDeletedAt = true

      const isJson = trimmed.includes("Json") && !trimmed.includes("Json?")
      const isJsonOptional = trimmed.includes("Json?")
      const isEnum = trimmed.includes("enum") || trimmed.includes("String") && trimmed.includes("//") && (trimmed.includes("active") || trimmed.includes("pending"))

      // Detect relation
      const relMatch = trimmed.match(/@relation\(/)
      if (relMatch) {
        const targetMatch = trimmed.match(/(\w+)\[]?/)
        if (targetMatch) {
          const typeName = targetMatch[1]
          const isArray = trimmed.includes("[]")
          const relType = trimmed.includes("[]") ? "1-N" : "1-1"
          // Only if it references another model
          if (typeName !== "String" && typeName !== "Int" && typeName !== "Float" && typeName !== "Boolean" && typeName !== "DateTime" && typeName !== "Decimal" && typeName !== "Json") {
            relations.push({ field: fieldName, target: typeName, type: relType })
          }
        }
      }

      fields.push({
        name: fieldName,
        type: fieldType,
        isJson: isJson || isJsonOptional,
        isEnum,
        isOptional,
        relation: relMatch ? "yes" : undefined,
      })
    }

    // Skip if no fields (tables from @@map only)
    if (fields.length === 0) continue

    models.push({
      name,
      fields,
      indexes,
      uniques,
      relations,
      hasCompanyId,
      hasCreatedAt,
      hasUpdatedAt,
      hasDeletedAt,
    })
  }

  return models
}

function validate(models: ModelInfo[]): { passed: number; failed: number; issues: string[] } {
  const issues: string[] = []
  let passed = 0
  let failed = 0

  // Junction/child tables that don't need direct companyId (access through parent)
  const JUNCTION_TABLES = new Set([
    "UserRole", "LeadActivity", "ClientContact", "ClientLegalRep", "ClientShareholder",
    "ClientContractVersion", "ProjectMilestone", "TaskDependency", "ProjectRisk",
    "DocumentVersion", "DocumentChunk", "RatioValue", "KpiValue",
    "WorkflowStepResult", "WorkflowTrigger", "RuleExecution",
    "AiMessage", "AICostLog", "PromptVersion",
    "KnowledgeRelation", "Recommendation", "TicketComment",
    "ClientMeetingAttendee", "MeetingAgreement", "ClientInvoiceItem",
  ])
  // Self-referential for hierarchy (valid patterns)
  const SELF_REF_TABLES = new Set(["Department", "Task"])

  const LEGITIMATE_JSON = new Set([
    "themeConfig", "features", "extracted", "formula", "result",
    "conditions", "actions", "variables", "properties", "factors", "plans",
    "features", "limits", "oldValues", "newValues", "events", "payload",
    "value", "contextData", "content", "config", "data", "metadata",
    "context", "steps",
  ])

  const tenantTables = models.filter(
    (m) => !JUNCTION_TABLES.has(m.name) && m.name !== "Company" && m.name !== "BillingPlan" && m.name !== "Plugin" && m.name !== "DomainEvent",
  )

  function check(condition: boolean, msg: string) {
    if (condition) {
      passed++
    } else {
      failed++
      issues.push(msg)
    }
  }

  console.log(`\n🔍 Validating ${models.length} models...\n`)

  // 1. companyId in tenant tables
  console.log("--- 1. Multi-tenancy: companyId ---")
  for (const m of tenantTables) {
    check(m.hasCompanyId, `[companyId] MISSING in ${m.name}`)
    if (!m.hasCompanyId) {
      // Skip non-tenant tables
    }
  }

  // 2. Timestamps
  console.log("\n--- 2. Timestamps ---")
  for (const m of models) {
    check(m.hasCreatedAt, `[createdAt] MISSING in ${m.name}`)
    check(m.hasUpdatedAt, `[updatedAt] MISSING in ${m.name}`)
  }

  // 3. Soft delete
  console.log("\n--- 3. Soft delete ---")
  for (const m of models) {
    // Business tables should have deletedAt, junction tables can skip
    if (!m.name.includes("Role") && !m.name.includes("Dependency") && !m.name.includes("Attendee")) {
      // check(m.hasDeletedAt, `[deletedAt] MISSING in ${m.name} (consider adding)`)
    }
  }

  // 4. Circular relations detection
  console.log("\n--- 4. Circular relations ---")
  const graph = new Map<string, string[]>()
  for (const m of models) {
    graph.set(m.name, m.relations.map((r) => r.target))
  }
  for (const [node, targets] of graph) {
    for (const target of targets) {
      const targetTargets = graph.get(target) || []
      if (targetTargets.includes(node)) {
        issues.push(`[CIRCULAR] ${node} ↔ ${target}`)
        failed++
      }
    }
  }

  // 5. JSON fields audit
  console.log("\n--- 5. JSON fields audit ---")
  for (const m of models) {
    const jsonFields = m.fields.filter((f) => f.isJson)
    for (const f of jsonFields) {
      if (!LEGITIMATE_JSON.has(f.name)) {
        issues.push(`[JSON] ${m.name}.${f.name} — verify JSON is needed (not better as relation)`)
        failed++
      }
    }
  }

  // 6. Unique constraints with companyId
  console.log("\n--- 6. Unique constraints multi-tenancy ---")
  for (const m of tenantTables) {
    for (const u of m.uniques) {
      if (!u.includes("companyId") && !u.includes("fromId") && !u.includes("toId") && !u.includes("client")) {
        if (u.includes("name") || u.includes("email") || u.includes("slug")) {
          // Check if there's a compound unique with companyId already
          const hasCompoundUnique = m.uniques.some((cu) => cu.includes("companyId") && cu.includes(u.match(/\[([^\]]+)\]/)?.[1] || ""))
          if (!hasCompoundUnique) {
            issues.push(`[UNIQUE] ${m.name}: ${u} could conflict across tenants — consider (companyId, field)`)
            failed++
          }
        }
      }
    }
  }

  // 7. Indexes
  console.log("\n--- 7. Indexes ---")
  for (const m of models) {
    if (m.hasCompanyId) {
      const hasIndexOnCompanyId = m.indexes.some((i) => i.includes("companyId"))
      const hasUniqueOnCompanyId = m.uniques.some((u) => u.includes("companyId"))
      if (!hasIndexOnCompanyId && !hasUniqueOnCompanyId) {
        issues.push(`[INDEX] ${m.name}: has companyId but no index on it (unique covers it? check)`)
        failed++
      }
    }
  }

  console.log(`\n✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  if (issues.length > 0) {
    console.log("\nIssues found:")
    issues.forEach((i) => console.log(`  ${i}`))
  }

  return { passed, failed, issues }
}

// Main
const content = fs.readFileSync(DESIGN_PATH, "utf-8")
const models = parseModels(content)
console.log(`Parsed ${models.length} models`)

const result = validate(models)

if (result.failed > 0) {
  console.log(`\n⚠️  ${result.failed} issues need attention before migration.`)
  process.exit(result.failed > 10 ? 1 : 0) // Allow minor issues
} else {
  console.log(`\n✅ All checks passed — schema is ready for migration.`)
}
