# FASE 0 — ORDEN DE BATALLA (REVISIÓN PROMPT MAESTRO COS)
## Command Center → COS Producto Comercial
**Versión:** 2.0 — Julio 2026 | **Alineado a:** PROMPT_MAESTRO_COS.md

---

## ESTADO ACTUAL (Checkpoint ~35%)

### ✅ Completado (herencia)

| Módulo | Entregables | Agente responsable |
|--------|-------------|-------------------|
| **DD Module** | 17 archivos: Wizard, ChatPanel, ConfigStep, comandos, dashboard cliente | A5 (Frontend) |
| **Build** | `npm run build` verde (26 rutas, 0 errores) | — |
| **Shadcn/ui** | 14 componentes instalados (Button, Input, Card, Badge, Dialog, DropdownMenu, Select, Tabs, Table, Sheet, Skeleton, Sonner, Progress, Pagination) | A5 |
| **Error Boundaries** | `error.tsx` + `not-found.tsx` en dashboard, landing, auth, DD | A5 |
| **Loading Skeletons** | 7 `loading.tsx` con shadcn Skeleton en dashboard, landing, auth, DD routes | A5 |
| **Zustand Stores** | `session-store.ts` (persistida) + `sidebar-store.ts` | A5 |
| **TanStack Query** | `QueryProvider` con staleTime=30s | A5 |
| **Rate Limiter** | `rate-limiter.ts` completo con rateLimit() + sweepStale() | A2 |
| **Auth Middleware** | `middleware.ts` con extracción tenant + rate limiting | A2 |
| **Server Actions** | 6 acciones DD con Zod validation (createEngagement, list, get, update, delete, submitReport) | A2 |
| **Zod Schemas** | DD schemas + EngagementIdSchema | A2 |
| **Query Hooks** | `use-clients-query.ts`, `use-documents-query.ts`, `use-company-query.ts` | A2 |
| **Docker** | `Dockerfile` multi-stage, `docker-compose.yml`, `.dockerignore` | A6 |
| **CI/CD** | `.github/workflows/ci.yml` + `deploy.yml` | A6 |
| **Vitest** | Configurado con jsdom, coverage thresholds 30% | A7 |
| **MSW** | `src/test/mocks/server.ts` + `handlers.ts` | A7 |
| **Playwright** | Config con 4 specs (home, login, dashboard, data-hub) = 12 tests | A7 |
| **Unit Tests** | 10 tests pasando (cn(), KPICard, getFinancialStatements) | A7 |
| **AI Client** | `openai-client.ts` singleton + hasValidKey() | A4 |
| **Eval Suite** | 5 golden questions en `eval-suite.ts` | A4 |
| **Orchestrator** | LLM routing con fallback simulado | A4 |
| **Prompts** | DD_SUGGESTION_QUESTIONS + tax prompts | A4 |
| **AI Migration Map** | `docs/ai-migration-map.md` (A/B/C priorities) | A4 |
| **LangGraph Contracts** | `docs/langgraph-contracts.md` (10 agentes) | A4 |
| **Eval Guide** | `docs/eval-suite-guide.md` | A4 |
| **CODEOWNERS** | `.github/CODEOWNERS` protegiendo AI/RAG files | A4 |
| **Tax Engine** | 7 archivos: types, rates, calculator, calendar, validators, index, dd-adapter | A3 |
| **Tax Calendar Docs** | `docs/tax-calendar.md` con SRI 2024-2025 | A8 |
| **Tax Prisma Schema** | `prisma/tax-schema.prisma` (TaxCalendar, TaxObligation, TaxProfile) | A1 |
| **Migration 00002** | `supabase/migrations/00002_dd_schema.sql` (3 tablas + RLS) | A1 |
| **CONTRIBUTING.md** | Branch strategy, merge rules, code review checklist | — |
| **PULL_REQUEST_TEMPLATE.md** | `.github/PULL_REQUEST_TEMPLATE.md` | — |
| **RELEASE.md** | Release checklist con smoke test + rollback | — |
| **Hardcoded Inventory** | `docs/hardcoded-data-inventory.md` | — |
| **Shared Types** | `src/lib/shared-types.ts` (DashboardData, AgentStatus, etc.) | — |
| **Husky** | `husky` + `lint-staged` configurados | — |
| **Security Headers** | En `next.config.ts` | A6 |

### ⏳ Pendiente de Fase 0

| ID | Tarea | Agente | Horas | Depende de |
|----|-------|--------|-------|------------|
| 0.1 | Sentry frontend + backend integration | A6 | 4 | — |
| 0.2 | Source maps + releases Sentry | A6 | 2 | 0.1 |
| 0.3 | .env.example completo + env-specific | A6 | 3 | — |
| 0.4 | Validate env script | A6 | 2 | 0.3 |
| 0.5 | Schema audit full (55 tablas vs blueprint) | A1 | 3 | — |
| 0.6 | Seed.ts multi-tenant con datos reales | A1 | 4 | 0.5 |
| 0.7 | RLS policies fresh (migration 00003) | A1 | 3 | 0.5 |
| 0.8 | Cross-tenant test automatizado | A7 | 3 | 0.7 |
| 0.9 | Playwright E2E tests extendidos (pago, perfil) | A7 | 3 | — |
| 0.10 | Env separation test | A7 | 2 | 0.3 |
| 0.11 | Conectar Dashboard page a datos reales | A5 | 4 | 0.6 |
| 0.12 | Conectar Agents page a datos reales | A5 | 4 | 0.11 |
| 0.13 | Conectar Sala Guerra a datos reales | A5 | 4 | 0.11 |
| 0.14 | Conectar Data Hub a datos reales | A5 | 3 | 0.11 |
| 0.15 | Conectar Economic Hub | A5 | 3 | 0.11 |
| 0.16 | Conectar Market Research | A5 | 3 | 0.11 |
| 0.17 | Conectar Valuación M&A | A5 | 3 | 0.11 |
| 0.18 | Portal Cliente dashboard con datos reales | A5 | 4 | 0.11 |
| 0.19 | Portal Director KPIs con datos reales | A5 | 4 | 0.11 |
| 0.20 | Suspense boundaries en componentes pesados | A5 | 3 | 0.11 |
| 0.21 | React.memo + useCallback optimización | A5 | 4 | 0.11 |
| 0.22 | SRI/BCE/INEC lookup tables iniciales | A8 | 4 | — |
| 0.23 | Calendario SRI como servicio | A8 | 2 | 0.22 |
| 0.24 | Validadores cédula/RUC Ecuador | A2 | 2 | — |
| 0.25 | Rate limit + auth test E2E | A7 | 2 | 0.4 |
| 0.26 | Auditabilidad final: 0 hardcoded data | A7 | 3 | 0.11-0.19 |

**Total horas pendientes:** ~80h

### 📊 Carga por agente

| Agente | Horas | Prioridad |
|--------|-------|-----------|
| **A5** (Frontend) | 32 | ALTA |
| **A1** (Datos) | 10 | ALTA |
| **A6** (DevOps) | 11 | ALTA |
| **A7** (QA) | 13 | ALTA |
| **A2** (Backend) | 2 | MEDIA |
| **A8** (Ecuador) | 6 | MEDIA |
| **A4** (AI/RAG) | 0 | — (completo Fase 0) |
| **A3** (Quant) | 0 | — (completo Fase 0) |

---

## PLAN DE EJECUCIÓN (PRÓXIMOS DÍAS)

### Día 1: Infraestructura crítica
```
A6: T0.1 Sentry (4h)
A1: T0.5 Schema audit (3h)
A2: T0.24 Validadores cédula/RUC (2h)
A8: T0.22 SRI/BCE lookup tables (4h)
```

### Día 2: Datos + Tests
```
A1: T0.6 Seed.ts + T0.7 RLS policies (7h)
A7: T0.8 Cross-tenant test + T0.9 Playwright (6h)
A6: T0.2 Sentry source maps + T0.3 .env.example (5h)
```

### Día 3: Conexión datos reales (inicio)
```
A5: T0.11 Dashboard real (4h)
A5: T0.12 Agents page real (4h)
A6: T0.4 Validate env script (2h)
A7: T0.10 Env separation test (2h)
```

### Día 4: Conexión datos reales (completo)
```
A5: T0.13 Sala Guerra + T0.14 Data Hub (7h)
A5: T0.15 Economic Hub + T0.16 Market Research (6h)
A8: T0.23 Calendario SRI service (2h)
A7: T0.25 Rate limit + auth test (2h)
```

### Día 5: Portales restantes
```
A5: T0.17 Valuación + T0.18 Portal Cliente (7h)
A5: T0.19 Portal Director + T0.20 Suspense (7h)
```

### Día 6: Optimización + Auditoría
```
A5: T0.21 React.memo/useCallback (4h)
A7: T0.26 Auditoría hardcoded (3h)
```

---

## GATE FASE 0 → FASE 1

- [ ] Build verde (`next build`)
- [ ] Tests pasando (Vitest + Playwright)
- [ ] 0 críticos en security scan
- [ ] Error boundaries en todos los segmentos
- [ ] 3 portales con datos reales
- [ ] Secretos en Infisical / GitHub Secrets
- [ ] Sentry capturando errores frontend + backend
- [ ] CI pipeline ejecutándose en cada PR
- [ ] 3+ tests E2E (login, dashboard, upload)
- [ ] RLS en 100% tablas multi-tenant
- [ ] Cross-tenant test automatizado en CI
- [ ] Seed multi-tenant operativo
- [ ] .env.example completo por entorno
- [ ] Docker compose funcional
- [ ] Validadores Ecuador (cédula, RUC, teléfono)
- [ ] Contratos de datos (shared-types) publicados
- [ ] CODEOWNERS protegiendo AI/RAG
