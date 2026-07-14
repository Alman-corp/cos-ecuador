export type Operation = "SELECT" | "INSERT" | "UPDATE" | "DELETE"

export interface RlsPolicy {
  table: string
  operation: Operation
  using: string
  withCheck?: string
  enabled: boolean
}

export const RLS_POLICIES: RlsPolicy[] = [
  { table: "financial_reports", operation: "SELECT", using: "tenant_id = current_setting('app.current_tenant_id')", enabled: true },
  { table: "financial_reports", operation: "INSERT", using: "tenant_id = current_setting('app.current_tenant_id')", enabled: true },
  { table: "financial_reports", operation: "UPDATE", using: "tenant_id = current_setting('app.current_tenant_id')", withCheck: "tenant_id = current_setting('app.current_tenant_id')", enabled: true },
  { table: "financial_reports", operation: "DELETE", using: "tenant_id = current_setting('app.current_tenant_id')", enabled: true },
  { table: "users", operation: "SELECT", using: "id = current_setting('app.current_user_id')::uuid OR current_setting('app.is_admin') = 'true'", enabled: true },
  { table: "users", operation: "UPDATE", using: "id = current_setting('app.current_user_id')::uuid OR current_setting('app.is_admin') = 'true'", withCheck: "id = current_setting('app.current_user_id')::uuid OR current_setting('app.is_admin') = 'true'", enabled: true },
  { table: "documents", operation: "SELECT", using: "tenant_id = current_setting('app.current_tenant_id')", enabled: true },
  { table: "documents", operation: "INSERT", using: "tenant_id = current_setting('app.current_tenant_id')", enabled: true },
  { table: "documents", operation: "UPDATE", using: "tenant_id = current_setting('app.current_tenant_id')", withCheck: "tenant_id = current_setting('app.current_tenant_id')", enabled: true },
  { table: "documents", operation: "DELETE", using: "tenant_id = current_setting('app.current_tenant_id')", enabled: true },
  { table: "audit_log", operation: "SELECT", using: "tenant_id = current_setting('app.current_tenant_id') OR current_setting('app.is_auditor') = 'true'", enabled: true },
  { table: "audit_log", operation: "INSERT", using: "true", enabled: true },
  { table: "api_keys", operation: "SELECT", using: "tenant_id = current_setting('app.current_tenant_id')", enabled: true },
  { table: "api_keys", operation: "UPDATE", using: "tenant_id = current_setting('app.current_tenant_id')", withCheck: "tenant_id = current_setting('app.current_tenant_id')", enabled: true },
  { table: "api_keys", operation: "DELETE", using: "tenant_id = current_setting('app.current_tenant_id')", enabled: true },
]

export function getPoliciesForTable(table: string): RlsPolicy[] {
  return RLS_POLICIES.filter((p) => p.table === table)
}

export function generateRlsSql(table: string): string {
  const policies = getPoliciesForTable(table)
  return policies
    .map(
      (p) =>
        `CREATE POLICY "${p.table}_${p.operation.toLowerCase()}" ON "${p.table}"\n` +
        `  FOR ${p.operation}\n` +
        `  USING (${p.using})\n` +
        (p.withCheck ? `  WITH CHECK (${p.withCheck})\n` : "") +
        `;`
    )
    .join("\n\n")
}

export function generateAllRlsSql(): string {
  const tables = [...new Set(RLS_POLICIES.map((p) => p.table))]
  return tables.map(generateRlsSql).join("\n\n---\n\n")
}
