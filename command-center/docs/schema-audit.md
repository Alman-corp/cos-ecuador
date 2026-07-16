# Schema Audit — Command Center

> Fecha: 2026-07-12 | Total tablas: **16**

## Inventario completo

| # | Tabla | Existe en SQL? | Tiene RLS? | Tiene Queries? | Tiene companyId? | Notas |
|---|-------|---------------|------------|----------------|-------------------|-------|
| 1 | `companies` | ✅ 00001 | ✅ solo SELECT | ✅ (vía profiles join) | ❌ es el tenant | Faltan INSERT/UPDATE/DELETE |
| 2 | `profiles` | ✅ 00001 | ✅ SELECT, UPDATE | ✅ `getCompanyProfile` | ✅ | Faltan INSERT (trigger), DELETE |
| 3 | `financial_statements` | ✅ 00001 | ✅ SELECT, INSERT, UPDATE | ✅ `getFinancialStatements` | ✅ | Falta DELETE |
| 4 | `transactions` | ✅ 00001 | ✅ SELECT, INSERT | ✅ `getRecentTransactions` | ✅ | Faltan UPDATE, DELETE |
| 5 | `projections` | ✅ 00001 | ✅ SELECT, INSERT | ✅ `getLatestProjection`, `getProjectionsByScenario` | ✅ | Faltan UPDATE, DELETE |
| 6 | `macro_indicators` | ✅ 00001 | ✅ SELECT (público) | ✅ `getMacroIndicators` | ❌ datos compartidos | Solo SELECT, OK por ahora |
| 7 | `documents` | ✅ 00001 | ✅ SELECT, INSERT | ❌ | ✅ | Faltan UPDATE, DELETE |
| 8 | `document_chunks` | ✅ 00001 | ✅ SELECT | ❌ | ❌ (hereda vía FK) | Faltan INSERT, UPDATE, DELETE |
| 9 | `agent_sessions` | ✅ 00001 | ✅ SELECT, INSERT | ❌ | ✅ | Faltan UPDATE, DELETE |
| 10 | `audit_log` | ✅ 00001 | ✅ SELECT (admin) | ❌ | ✅ | Faltan INSERT, DELETE (inmutable por diseño) |
| 11 | `dd_engagements` | ✅ 00002 | ✅ CRUD completo | ✅ `getDdEngagements`, `getDdEngagement`, `createDdEngagement` | ✅ | Completo |
| 12 | `dd_reports` | ✅ 00002 | ✅ CRUD completo | ❌ (referenciado en join) | ❌ (hereda vía FK) | Completo |
| 13 | `dd_documents` | ✅ 00002 | ✅ CRUD completo | ❌ (referenciado en join) | ❌ (hereda vía FK) | Completo |
| 14 | `tax_calendar` | ❌ solo Prisma | ❌ | ❌ | ❌ | **GAP**: migración faltante |
| 15 | `tax_obligations` | ❌ solo Prisma | ❌ | ❌ | ✅ | **GAP**: migración faltante |
| 16 | `tax_profiles` | ❌ solo Prisma | ❌ | ❌ | ✅ | **GAP**: migración faltante |

## Gaps detectados

### RLS faltantes (cubierto en `00003_rls_policies.sql`)
| Tabla | Políticas faltantes |
|-------|---------------------|
| `companies` | INSERT, UPDATE, DELETE |
| `profiles` | DELETE |
| `financial_statements` | DELETE |
| `transactions` | UPDATE, DELETE |
| `projections` | UPDATE, DELETE |
| `documents` | UPDATE, DELETE |
| `document_chunks` | INSERT, UPDATE, DELETE |
| `agent_sessions` | UPDATE, DELETE |
| `audit_log` | INSERT (inmutable, vía función), DELETE (solo admin) |

### Tablas solo en Prisma (sin migración SQL)
- `tax_calendar` — calendario tributario
- `tax_obligations` — obligaciones por empresa
- `tax_profiles` — perfiles tributarios por empresa

Estas 3 tablas existen en `prisma/tax-schema.prisma` pero **no tienen migración SQL**. Se requiere `00004_tax_schema.sql` para crearlas en la BD.

### Queries sin implementar
- `documents` — no se consulta desde `queries.ts`
- `document_chunks` — no se consulta desde `queries.ts`
- `agent_sessions` — no se consulta desde `queries.ts`
- `audit_log` — no se consulta desde `queries.ts`

## Resumen
- **Tablas en SQL**: 13 (00001: 10 + 00002: 3)
- **Tablas solo en Prisma**: 3 (tax_calendar, tax_obligations, tax_profiles)
- **Tablas con RLS completo**: dd_engagements, dd_reports, dd_documents
- **Tablas con RLS parcial**: companies, profiles, financial_statements, transactions, projections, documents, document_chunks, agent_sessions, audit_log
- **Tablas con RLS ausente**: macro_indicators (solo SELECT), tax_calendar, tax_obligations, tax_profiles
