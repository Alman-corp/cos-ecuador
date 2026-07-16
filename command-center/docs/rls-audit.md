# RLS Audit Report

> Fecha: 2026-07-11  
> Owner: prisma-data  
> Alcance: `supabase/migrations/00001_schema.sql` + `00002_dd_schema.sql`

## Resumen

| Estado | Cantidad |
|--------|----------|
| Tablas con RLS habilitado | 13 |
| Tablas que deben tener RLS | 13 |
| Políticas totales | 29 |

## Detalle por tabla

### `00001_schema.sql` — Core schema (10 tablas)

| Tabla | RLS | Políticas | Faltantes |
|-------|-----|-----------|-----------|
| `companies` | ✅ | `select` | `insert`, `update`, `delete` (se gestionan con `service_role`) |
| `profiles` | ✅ | `select`, `update` | `insert` (manejado por trigger `on_auth_user_created`), `delete` |
| `financial_statements` | ✅ | `select`, `insert`, `update` | `delete` |
| `transactions` | ✅ | `select`, `insert` | `update`, `delete` |
| `projections` | ✅ | `select`, `insert` | `update`, `delete` |
| `documents` | ✅ | `select`, `insert` | `update`, `delete` |
| `document_chunks` | ✅ | `select` | `insert`, `update`, `delete` ⚠️ |
| `agent_sessions` | ✅ | `select`, `insert` | `update`, `delete` |
| `audit_log` | ✅ | `select` (solo admin) | `insert`/`update`/`delete` (inmutable por diseño) |
| `macro_indicators` | ✅ | `select` (público) | `insert`/`update`/`delete` (seeds gestionados aparte) |

### `00002_dd_schema.sql` — Due Diligence (3 tablas)

| Tabla | RLS | Políticas | Faltantes |
|-------|-----|-----------|-----------|
| `dd_engagements` | ✅ | `select`, `insert`, `update`, `delete` | Ninguna |
| `dd_reports` | ✅ | `select`, `insert`, `update`, `delete` | Ninguna |
| `dd_documents` | ✅ | `select`, `insert`, `update`, `delete` | Ninguna |

## Hallazgos

1. ✅ **13/13 tablas tienen RLS habilitado** — cobertura total.
2. ✅ **Aislamiento multi-tenant correcto**: todas las tablas con `company_id` filtran por `current_company_id()`.
3. ✅ **DD schema tiene CRUD completo** en las 3 tablas.
4. ⚠️ `document_chunks` carece de políticas `insert`/`update`/`delete`. Si la app necesita insertar chunks desde el cliente, **fallará**. Solución potencial: agregar políticas que hereden el tenant via `documents.company_id`.
5. ⚠️ Varias tablas del core schema no tienen `delete` policy. Confirmar si la baja la hace siempre el backend con `service_role`.

## Recomendaciones

- Agregar políticas `insert`/`update`/`delete` a `document_chunks` si se insertan desde el cliente.
- Revisar si `financial_statements` necesita `delete` policy para los frontend users.
- Considerar agregar `delete` policies a `documents` y `transactions` si los operadores eliminan registros desde la UI.
