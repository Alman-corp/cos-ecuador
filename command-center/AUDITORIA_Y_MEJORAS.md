# Auditoría y Lista de Mejoras — Command Center

**Fecha:** Junio 2026 · **Archivos auditados:** 24 · **Build:** ✅ Exitoso

---

## 1. HALLAZGOS CRÍTICOS (Ejecución Inmediata)

| # | Hallazgo | Archivo | Acción Requerida |
|---|----------|---------|------------------|
| C1 | Sin `error.tsx` ni `global-error.tsx` | — | Crear error boundaries en cada segmento de ruta para evitar crash total |
| C2 | Funciones `queries.ts` sin try/catch | `src/lib/db/queries.ts:36-108` | Envolver toda llamada a Supabase en try/catch con fallback controlado |
| C3 | Sin sistema de testing (0 tests, 0 test runner) | — | Configurar Vitest + React Testing Library + MSW |
| C4 | Sin CI/CD pipeline | — | Crear `.github/workflows/` con lint, type-check, build, test |
| C5 | Sin monitoreo de errores (Sentry) | — | Integrar Sentry para backend y frontend |
| C6 | Sin motor real DCF / Monte Carlo / MIDAS | blueprint §3.1-3.3 | Implementar backends en Python (FastAPI) para los motores de cálculo |
| C7 | Sin orquestación de agentes (LangGraph) | `agents/page.tsx` | Reemplazar respuestas hardcodeadas con LangGraph + RAG real |
| C8 | Sin RAG/ISD para trazabilidad de fuentes | blueprint §3.4.2.1 | Implementar chunking → embeddings → Qdrant → ISD tracing |

---

## 2. HALLAZGOS DE ALTA PRIORIDAD (Semana 1-2)

### 2.1 Seguridad

| # | Hallazgo | Archivo | Acción |
|---|----------|---------|--------|
| H1 | Faltan políticas RLS de UPDATE/DELETE en transactions, projections, documents, chunks, sessions | `migrations/00001.sql:205-249` | Agregar policies faltantes |
| H2 | Sin validación de tipo de archivo en Data Hub (solo extensión) | `data-hub/page.tsx:98` | Validar MIME type + magic bytes en server |
| H3 | Sin rate limiting en login | `auth/login/page.tsx` | Implementar rate limiting vía middleware o Supabase |
| H4 | Error message crudo de Supabase expuesto al usuario | `auth/login/page.tsx:28,42` | Mapear errores a mensajes genéricos en español |

### 2.2 Arquitectura

| # | Hallazgo | Acción |
|---|----------|--------|
| H5 | Sin TanStack Query (React Query) | Instalar `@tanstack/react-query` y configurar QueryClientProvider |
| H6 | Sin Zustand para estado global | Instalar `zustand` para estado compartido (sidebar, filtros, sesión) |
| H7 | Sin Shadcn/ui | Instalar y configurar Shadcn/ui como librería de componentes base |
| H8 | Sin librería de gráficos (D3.js/Recharts) | Instalar `recharts` y reemplazar todos los placeholders de charts |
| H9 | Datos hardcodeados en todas las páginas | Conectar `queries.ts` a las páginas usando TanStack Query |
| H10 | Lógica de negocio incrustada en componentes UI | Extraer `computeProjection` a `src/lib/financial.ts` |

### 2.3 Rendimiento

| # | Hallazgo | Archivo | Acción |
|---|----------|---------|--------|
| H11 | Sin `loading.tsx` en ningún segmento | — | Agregar archivos `loading.tsx` con skeleton loaders |
| H12 | Sin `Suspense` boundaries | — | Envolver secciones asíncronas con `<Suspense>` |
| H13 | SliderControl causa re-render de todo el panel | `stress-simulator/page.tsx` | Aplicar `React.memo` + `useMemo` en `computeProjection` |
| H14 | Sin `useCallback` en handlers de formularios | `agents/page.tsx`, `data-hub/page.tsx` | Envolver handlers con `useCallback` |

---

## 3. HALLAZGOS DE PRIORIDAD MEDIA (Semana 3-4)

### 3.1 Accesibilidad

| # | Hallazgo | Acción |
|---|----------|--------|
| M1 | Chat area sin `role="log"` ni `aria-live="polite"` | Los nuevos mensajes no son anunciados por lectores de pantalla |
| M2 | Drop zone sin `role="button"` ni keyboard accessibility | Usuarios de teclado no pueden activar el upload |
| M3 | Sidebar sin `aria-label` ni `aria-current="page"` | Navegación no identificable para screen readers |
| M4 | Sin skip-to-content link | Tab key cicla toda la sidebar antes del contenido principal |
| M5 | Tablas sin `scope="col"` en headers | Relación header/columna no explícita |
| M6 | Slider custom sin focus indicator visible | El input nativo está con `opacity-0` |

### 3.2 Blueprint — Funcionalidades Pendientes

| # | Componente | Prioridad en Blueprint |
|---|-----------|------------------------|
| M7 | Synergy Quantifier (M&A) | §3.1.2.3 |
| M8 | Gov. Audit Module | §3.1.2.4 |
| M9 | Capital Optimization Engine | §3.1.2.5 |
| M10 | Social Listening Engine | §3.3.2.1 |
| M11 | Macroeconomic ETL pipeline (BCE, SRI, INEC, FRED) | §3.2.2.1 |
| M12 | Conjoint Analysis Engine | §3.3.2.2 |
| M13 | Competitive Intelligence Tracker | §3.3.2.4 |
| M14 | Generación automática de CIMs y reportes PDF | §3.4.2.3 |
| M15 | Tablas faltantes: `market_intel`, `deliverables` | §2.3 |
| M16 | Waterfall chart (proyección de caja) | §3.5.1.1 |
| M17 | Alertas en tiempo real vía WebSocket | §3.5.1.1 |
| M18 | Upload de documentos para análisis de agentes | §3.5.1.5 |

### 3.3 Infraestructura

| # | Hallazgo | Acción |
|---|----------|--------|
| M19 | Sin Dockerfile | Crear Dockerfile multi-stage para producción |
| M20 | Sin configuración de Kubernetes | Agregar manifiestos básicos (deployment, service, ingress) |
| M21 | Sin Terraform/Pulumi | IaC para infraestructura cloud |
| M22 | Sin vercel.json | Configurar deployment en Vercel como alternativa rápida |
| M23 | Sin `.env.example` | Crear archivo de ejemplo con todas las vars documentadas |

### 3.4 TypeScript y Calidad de Código

| # | Hallazgo | Archivo | Acción |
|---|----------|---------|--------|
| M24 | Type assertions `as T` sin validación previa | `queries.ts:46,59,71,82,97` | Usar zod para validar response de Supabase |
| M25 | Sin zod instalado/importado | — | Instalar `zod` y crear schemas para todas las entidades |
| M26 | `getCompanyProfile()` sin tipo de retorno | `queries.ts:100-108` | Definir interfaz `CompanyProfile` |
| M27 | Opciones de cookie tipadas como `{ [key: string]: unknown }` | `server.ts:17` | Usar `CookieOptions` de `@supabase/ssr` |

---

## 4. HALLAZGOS DE BAJA PRIORIDAD (Ongoing)

| # | Hallazgo | Acción |
|---|----------|--------|
| L1 | 20+ SVGs inline duplicados | Instalar lucide-react o heroicons y refactorizar |
| L2 | Sin Prettier config | Agregar `.prettierrc` con reglas del equipo |
| L3 | Sin husky + lint-staged | Pre-commit hooks para lint + format |
| L4 | Sin `prefers-reduced-motion` | Respetar preferencias de movimiento reducido |
| L5 | Sin Conventional Commits | Definir convención en CONTRIBUTING.md |
| L6 | Sin página de configuración de usuario | Profile settings con cambio de password |
| L7 | Sin página de invitación de usuarios | Gestión de roles y miembros del equipo |
| L8 | Sin vista de audit log UI | Interfaz para consultar `audit_log` |

---

## 5. PLAN DE ACCIÓN RECOMENDADO

```
SEMANA 1 (Críticos)
├── error.tsx + global-error.tsx + not-found.tsx
├── try/catch en todas las queries
├── Instalar: @tanstack/react-query, zustand, recharts, zod
├── Conectar datos reales vía TanStack Query (eliminar hardcode)
├── RLS policies faltantes (UPDATE/DELETE)
└── Configurar Sentry

SEMANA 2 (Alta)
├── loading.tsx + Suspense boundaries
├── React.memo + useCallback + useMemo
├── Shadcn/ui + refactorizar componentes base
├── Rate limiting + validación de archivos
├── Extraer lógica de negocio a lib/
└── Extraer CSV parse a utils/

SEMANA 3 (Media)
├── ARIA attributes + keyboard nav + skip-to-content
├── Dockerfile + docker-compose
├── .github/workflows (CI)
├── .env.example
└── Backend Python: DCF Engine API

SEMANA 4 (Blueprint)
├── Synergy Quantifier + Gov. Audit
├── Social Listening + Macro ETL
├── LangGraph agent orchestration + RAG/ISD
├── Waterfall chart + alertas WebSocket
└── Tablas faltantes: market_intel, deliverables

ONGOING
├── Tests (Vitest + RTL + MSW)
├── Accesibilidad continua
├── Icon system (lucide-react)
├── Prettier + husky
└── User settings + team management
```

---

## 6. ESTADO ACTUAL VS. BLUEPRINT

| Categoría | Implementado | Pendiente | Progreso |
|-----------|-------------|-----------|----------|
| Frontend (Next.js, Tailwind, temas) | 10/10 | 0 | ██████████ 100% |
| Auth (login, magic link, middleware) | 5/5 | 0 | ██████████ 100% |
| Layout (sidebar, header, dashboard) | 4/4 | 0 | ██████████ 100% |
| Database Schema + RLS | 8/10 tablas | market_intel, deliverables | ████████░░ 80% |
| Módulo Finanzas (DCF, MC, Synergy) | 1/4 | DCF real, Monte Carlo, Synergy | ██░░░░░░░░ 25% |
| Hub Económico (MIDAS, BVAR) | 0/4 | Todo | ░░░░░░░░░░ 0% |
| Market Research (Social, Conjoint) | 0/5 | Todo | ░░░░░░░░░░ 0% |
| Razonamiento Agéntico (LangGraph, RAG) | 0/3 | Todo | ░░░░░░░░░░ 0% |
| Sala de Guerra | 8/10 | Chart real, escenarios dinámicos | ████████░░ 80% |
| Data Hub | 7/10 | validación server-side, react-dropzone | ███████░░░ 70% |
| Agentes IA | 5/10 | LangGraph real, RAG, ISD, upload docs | █████░░░░░ 50% |
| Infraestructura (Docker, CI/CD, IaC) | 0/6 | Todo | ░░░░░░░░░░ 0% |
| Testing | 0/5 | Todo | ░░░░░░░░░░ 0% |
| Accesibilidad | 0/10 | Todo | ░░░░░░░░░░ 0% |

**Progreso General:** ~35%
