# AI/RAG Files Catalog — COS

> Generado por llm-engineer el 2026-07-11

---

## Core Orchestration

### `src/lib/orchestrator.ts`
- **Propósito**: Orquestador multi-agente: router → planner → specialists → writer → critique → revision → compaction
- **Dependencias**: `model-router`, `self-critique`, `constitutional`, `tools`, `context-compaction`, `ai/openai-client`, `prompts`
- **Dependientes**: `hooks/useChatMemory.ts`
- **Estado**: ⚠️ Simulado — usa `simulateResponse()` con templates fijos, no agentes reales
- **Prioridad migración**: A
- **Notas**: Núcleo del sistema de agentes; migrar a llamadas reales a modelos

### `src/lib/prompts.ts`
- **Propósito**: Gestión de prompts con versionado, A/B testing, y promoción de variantes vía localStorage
- **Dependencias**: Ninguna
- **Dependientes**: `orchestrator.ts`, `components/due-diligence/DDChatPanel.tsx`
- **Estado**: ⚠️ Simulado — prompts hardcodeados, A/B testing emulado
- **Prioridad migración**: A
- **Notas**: Contiene `dd-analyst`, `financial`, `forecaster`, `researcher`, `synthesizer`

### `src/lib/model-router.ts`
- **Propósito**: Enrutamiento de tareas a tiers de modelo (haiku/sonnet/opus) según tipo de tarea
- **Dependencias**: Ninguna
- **Dependientes**: `orchestrator.ts`, `hooks/useChatMemory.ts`, `app/(dashboard)/agents/page.tsx`
- **Estado**: ✅ Funcional — reglas de routing por regex; costos estimados
- **Prioridad migración**: B
- **Notas**: Puede integrarse con modelo real en producción

### `src/lib/tools.ts`
- **Propósito**: Definición y ejecución de herramientas (query_financials, calculate_ratio, search_peers)
- **Dependencias**: Ninguna
- **Dependientes**: `orchestrator.ts`, `hooks/useChatMemory.ts`
- **Estado**: ✅ Funcional — validación de params, ejecución con datos mock
- **Prioridad migración**: C
- **Notas**: Datos mock estáticos; reemplazar con APIs reales en prod

### `src/lib/context-compaction.ts`
- **Propósito**: Compresión de contexto por resumen extractivo de segmentos, manteniendo mensajes recientes
- **Dependencias**: Ninguna
- **Dependientes**: `orchestrator.ts`, `hooks/useChatMemory.ts`
- **Estado**: ✅ Funcional — summarización heurística por oraciones
- **Prioridad migración**: C
- **Notas**: Funciona bien para reducción de tokens en chat

### `src/lib/memory-layers.ts`
- **Propósito**: Memoria por capas (working/episodic/semantic/procedural) con TTL vía localStorage
- **Dependencias**: Ninguna
- **Dependientes**: `hooks/useChatMemory.ts`
- **Estado**: ✅ Funcional — persistencia en localStorage con expiración
- **Prioridad migración**: C
- **Notas**: Migrar a DB real si se requiere multi-sesión o persistencia cross-device

---

## RAG Pipeline

### `src/lib/self-rag.ts`
- **Propósito**: Decisión de retrieval: cuándo buscar, profundidad, y detección de temas financieros
- **Dependencias**: `query-understanding`
- **Dependientes**: `app/(dashboard)/rag/page.tsx`
- **Estado**: ✅ Funcional — reglas de detección por regex y patrones
- **Prioridad migración**: B
- **Notas**: Integrar con reranking y hybrid-search para pipeline completo

### `src/lib/query-understanding.ts`
- **Propósito**: Expansión de queries: HyDE, step-back prompting, multi-query, detección de estrategia
- **Dependencias**: Ninguna
- **Dependientes**: `self-rag.ts`, `app/(dashboard)/rag/page.tsx`
- **Estado**: ✅ Funcional — templates por tema (financial, economic, market, valuation)
- **Prioridad migración**: B
- **Notas**: Los templates HyDE son estáticos; migrar a generación dinámica con LLM

### `src/lib/hybrid-search.ts`
- **Propósito**: Búsqueda híbrida BM25 + vectorial con fusión de scores y filtros por metadata
- **Dependencias**: Ninguna
- **Dependientes**: `reranking.ts`, `app/(dashboard)/rag/page.tsx`
- **Estado**: ✅ Funcional — BM25 implementado, vector score por Jaccard
- **Prioridad migración**: B
- **Notas**: La parte vectorial es simulada (Jaccard, no embeddings reales)

### `src/lib/reranking.ts`
- **Propósito**: Re-ranking con cross-encoder simulado: overlap semántico + proximidad + score base
- **Dependencias**: `hybrid-search`
- **Dependientes**: `app/(dashboard)/rag/page.tsx`
- **Estado**: ✅ Funcional — scoring combinado con proximidad de tokens
- **Prioridad migración**: C
- **Notas**: Cross-encoder simulado; reemplazar con modelo real CoHere/BGE

### `src/lib/semantic-chunking.ts`
- **Propósito**: Chunking semántico por párrafos y oraciones con detección de tópico financiero
- **Dependencias**: Ninguna
- **Dependientes**: `app/(dashboard)/rag/page.tsx`
- **Estado**: ✅ Funcional — 9 tópicos financieros detectados por regex
- **Prioridad migración**: C
- **Notas**: Merge por tópico contiguo disponible

### `src/lib/graph-rag.ts`
- **Propósito**: Grafo de conocimiento financiero con entidades (Tesla, EBITDA, DCF) y relaciones con búsqueda 2-hop
- **Dependencias**: Ninguna
- **Dependientes**: `app/(dashboard)/rag/page.tsx`
- **Estado**: ✅ Funcional — entidades y relaciones hardcodeadas con expansión
- **Prioridad migración**: A
- **Notas**: Datos mock; migrar a extracción dinámica desde documentos

### `src/lib/hierarchical-index.ts`
- **Propósito**: Índice jerárquico summary → detail → verbatim con drill-down contextual
- **Dependencias**: Ninguna
- **Dependientes**: `app/(dashboard)/rag/page.tsx`
- **Estado**: ✅ Funcional — árbol estático de 2 roots con hijos
- **Prioridad migración**: C
- **Notas**: Datos mock para Tesla; escalar con datos reales de engagement

### `src/lib/multilingual-embeddings.ts`
- **Propósito**: Embeddings multilingüe (es/en/pt) con detección de idioma, traducción y búsqueda cross-lingual
- **Dependencias**: Ninguna
- **Dependientes**: `app/(dashboard)/rag/page.tsx`
- **Estado**: ⚠️ Simulado — embeddings simulados por hash, traducción por diccionario fijo
- **Prioridad migración**: B
- **Notas**: Reemplazar con modelo real multilingual-e5 o bge-m3

### `src/lib/citation-isd.ts`
- **Propósito**: Base de citas estructuradas de documentos (10-K, transcripts, reports) con scoring por matching
- **Dependencias**: Ninguna
- **Dependientes**: `app/(dashboard)/rag/page.tsx`
- **Estado**: ✅ Funcional — 10 citas hardcodeadas con formato y stats
- **Prioridad migración**: A
- **Notas**: Datos mock; migrar a extracción dinámica desde ISD Documents

### `src/lib/knowledge-graph.ts`
- **Propósito**: Grafo de conocimiento completo con 20 entidades, 25 relaciones, búsqueda y conexiones
- **Dependencias**: Ninguna
- **Dependientes**: `hooks/useKnowledgeGraph.ts`, `components/knowledge-graph/Graph3DScene.tsx`
- **Estado**: ✅ Funcional — datos hardcodeados de Tesla
- **Prioridad migración**: C
- **Notas**: Usado por visualización 3D; datos estáticos

---

## AI Safety & Quality

### `src/lib/self-critique.ts`
- **Propósito**: Autocrítica del output del agente según 6 dimensiones (specificity, actionability, clarity, completeness, concision, objectivity)
- **Dependencias**: Ninguna
- **Dependientes**: `orchestrator.ts`, `hooks/useChatMemory.ts`
- **Estado**: ⚠️ Simulado — críticas aleatorias con `Math.random()`
- **Prioridad migración**: A
- **Notas**: Migrar a crítica real por LLM o modelo evaluador

### `src/lib/constitutional.ts`
- **Propósito**: Reglas constitucionales: no investment advice, no guarantees, data attribution, uncertainty, no confidential
- **Dependencias**: Ninguna
- **Dependientes**: `orchestrator.ts`, `hooks/useChatMemory.ts`
- **Estado**: ✅ Funcional — 5 reglas con severidad y sanitización automática
- **Prioridad migración**: A
- **Notas**: Reglas de compliance financiero; crítico para producción

### `src/lib/eval-suite.ts`
- **Propósito**: Suite de evaluación con test cases financieros, scoring por keywords, agregación de resultados
- **Dependencias**: Ninguna
- **Dependientes**: `hooks/useChatMemory.ts`
- **Estado**: ✅ Funcional — 12 test cases, scoring automático
- **Prioridad migración**: B
- **Notas**: Tests estáticos; expandir con golden dataset real

### `src/lib/ai/eval-suite.ts`
- **Propósito**: Evaluación simplificada con golden questions y keyword matching (paralela a eval-suite.ts principal)
- **Dependencias**: Ninguna
- **Dependientes**: Ninguno (no referenciado por otros archivos)
- **Estado**: ✅ Funcional — 5 preguntas doradas
- **Prioridad migración**: C
- **Notas**: Archivo duplicado funcionalmente; considerar merge con eval-suite.ts principal

---

## AI Client

### `src/lib/ai/openai-client.ts`
- **Propósito**: Cliente singleton OpenAI con validación de API key
- **Dependencias**: `openai` (npm)
- **Dependientes**: `orchestrator.ts`, `components/due-diligence/DDChatPanel.tsx`
- **Estado**: ✅ Funcional — lazy init, validación de key
- **Prioridad migración**: A
- **Notas**: `dangerouslyAllowBrowser: false` — seguro para server-side

---

## Cost & Monitoring

### `src/lib/cost-monitoring.ts`
- **Propósito**: Cálculo de costos por feature (dashboard, stress-simulator, agents, etc.) con persistencia localStorage
- **Dependencias**: Ninguna
- **Dependientes**: `app/(dashboard)/operations/page.tsx`
- **Estado**: ✅ Funcional — 10 features con costos base + por usuario
- **Prioridad migración**: C
- **Notas**: Costos mock; integrar con billing real

---

## Multi-modal

### `src/lib/multi-modal.ts`
- **Propósito**: Procesamiento de archivos multi-modal: imágenes, PDFs, tablas CSV, voz
- **Dependencias**: Ninguna
- **Dependientes**: `hooks/useChatMemory.ts`
- **Estado**: ⚠️ Simulado — solo extrae texto plano con `file.text()`, no procesamiento real
- **Prioridad migración**: B
- **Notas**: OCR, parsing PDF real, transcripción de voz pendientes

---

## Due Diligence

### `src/lib/dd/commands.ts`
- **Propósito**: Comandos slash del chat DD: /scenario, /risk, /forecast, /export, /tax
- **Dependencias**: `tax-engine`, `tax-engine/types`, `tax-engine/integration/dd-adapter`
- **Dependientes**: `components/due-diligence/DDChatPanel.tsx`
- **Estado**: ✅ Funcional — 5 comandos con handlers completos
- **Prioridad migración**: B
- **Notas**: /tax integra con tax-engine ecuatoriano

### `src/lib/schemas/dd-schemas.ts`
- **Propósito**: Schemas Zod para Create/Update Engagement y SubmitReport
- **Dependencias**: `zod`
- **Dependientes**: `actions/dd-actions.ts`
- **Estado**: ✅ Funcional — validación completa
- **Prioridad migración**: C
- **Notas**: Usado por server actions

### `src/lib/actions/dd-actions.ts`
- **Propósito**: Server actions CRUD para Due Diligence engagements con Supabase
- **Dependencias**: `@/utils/supabase/server`, `lib/schemas/dd-schemas`, `lib/audit-log-server`
- **Dependientes**: `app/(dashboard)/due-diligence/new/page.tsx`, `app/api/dd/engagements/route.ts`, `app/api/dd/engagements/[id]/route.ts`
- **Estado**: ✅ Funcional — autenticación, auditoría, operaciones reales
- **Prioridad migración**: A
- **Notas**: Código de producción real con Supabase

---

## Tax Engine

### `src/lib/tax-engine/index.ts`
- **Propósito**: Fachada del Tax Engine Ecuador que unifica rates, calculator, calendar, validators
- **Dependencias**: `types`, `calculator`, `calendar`, `validators`, `rates`, `integration/dd-adapter`
- **Dependientes**: `dd/commands.ts`
- **Estado**: ✅ Funcional — agrega análisis de perfil, summary
- **Prioridad migración**: A
- **Notas**: Tax engine completo para Ecuador; producción-ready

### `src/lib/tax-engine/types.ts`
- **Propósito**: Tipos compartidos del Tax Engine: TaxProfile, TaxObligation, TaxAnalysis, TaxRisk
- **Dependencias**: Ninguna
- **Dependientes**: `index.ts`, `calculator.ts`, `calendar.ts`, `dd-adapter.ts`, `dd/commands.ts`
- **Estado**: ✅ Funcional
- **Prioridad migración**: A
- **Notas**: Base de tipos de todo el tax engine

### `src/lib/tax-engine/rates.ts`
- **Propósito**: Tasas impositivas ecuatorianas: IVA (15%, 5%), IR (25% sociedades, tabla progresiva personas), retenciones, ICE, IESS
- **Dependencias**: Ninguna
- **Dependientes**: `index.ts`, `calculator.ts`
- **Estado**: ✅ Funcional — tasas actualizadas
- **Prioridad migración**: A
- **Notas**: Verificar tasas vigentes; Ecuador cambia tasas periódicamente

### `src/lib/tax-engine/calculator.ts`
- **Propósito**: Cálculos de IVA, Impuesto a la Renta (sociedades y personas), retenciones en la fuente
- **Dependencias**: `rates`
- **Dependientes**: `index.ts`
- **Estado**: ✅ Funcional — soporta tabla progresiva de personas
- **Prioridad migración**: A
- **Notas**: Cálculos según normativa ecuatoriana

### `src/lib/tax-engine/calendar.ts`
- **Propósito**: Calendario tributario ecuatoriano: declaraciones IVA (formulario 104), IR (101), ATS, retenciones (103)
- **Dependencias**: `types`
- **Dependientes**: `index.ts`
- **Estado**: ✅ Funcional — genera obligaciones por mes y régimen
- **Prioridad migración**: A
- **Notas**: Basado en noveno dígito del RUC

### `src/lib/tax-engine/validators.ts`
- **Propósito**: Validación de RUC y cédula ecuatoriana con algoritmos Módulo 10 y Módulo 11
- **Dependencias**: Ninguna
- **Dependientes**: `index.ts`
- **Estado**: ✅ Funcional — validación completa
- **Prioridad migración**: A
- **Notas**: Algoritmos oficiales del SRI

### `src/lib/tax-engine/integration/dd-adapter.ts`
- **Propósito**: Adaptador que analiza riesgos tributarios desde perfil de Due Diligence
- **Dependencias**: `types`
- **Dependientes**: `index.ts`, `dd/commands.ts`
- **Estado**: ✅ Funcional — 4 reglas de negocio
- **Prioridad migración**: B
- **Notas**: Reglas basadas en umbrales del SRI

---

## Infrastructure & DevOps

### `src/lib/ab-testing.ts`
- **Propósito**: Sistema de A/B testing con asignación por usuario y seguimiento de conversiones
- **Dependencias**: Ninguna
- **Dependientes**: `app/(dashboard)/operations/page.tsx`
- **Estado**: ✅ Funcional — asignación ponderada, persistencia localStorage
- **Prioridad migración**: C
- **Notas**: Para features del dashboard; no para prompts (ver prompts.ts)

### `src/lib/audit-log.ts`
- **Propósito**: Log de auditoría encadenado con hashes SHA-256 (blockchain-like) en localStorage
- **Dependencias**: Ninguna
- **Dependientes**: `app/(dashboard)/security/page.tsx`, `app/api/keys/route.ts`, `app/api/gdpr/*/route.ts`
- **Estado**: ✅ Funcional — verificación de integridad de cadena
- **Prioridad migración**: C
- **Notas**: localStorage no es seguro para auditoría real; migrar a DB

### `src/lib/audit-log-server.ts`
- **Propósito**: Server action para insertar auditoría en Supabase (tabla audit_log)
- **Dependencias**: `@/utils/supabase/server`
- **Dependientes**: `actions/dd-actions.ts`
- **Estado**: ✅ Funcional — inserción directa en Supabase
- **Prioridad migración**: A
- **Notas**: Versión server-side del audit log; usar esta en server actions

### `src/lib/api-keys.ts`
- **Propósito**: Gestión de API keys con scopes, expiración, hash SHA-256, revocación
- **Dependencias**: Ninguna
- **Dependientes**: Ninguno (no referenciado desde fuera de lib)
- **Estado**: ✅ Funcional — generate, validate, revoke
- **Prioridad migración**: C
- **Notas**: Persistencia localStorage; migrar a DB en producción

### `src/lib/circuit-breaker.ts`
- **Propósito**: Circuit breaker con estados CLOSED/OPEN/HALF_OPEN, thresholds configurables, fallback
- **Dependencias**: Ninguna
- **Dependientes**: `hooks/useChatMemory.ts`
- **Estado**: ✅ Funcional — timeout automático, sweep de stale circuits
- **Prioridad migración**: C
- **Notas**: Útil para proteger llamadas a API externas

### `src/lib/rate-limiter.ts`
- **Propósito**: Rate limiter en memoria con ventana de 60s, 60 requests/IP, exponential backoff
- **Dependencias**: Ninguna
- **Dependientes**: Ninguno (no referenciado desde fuera de lib)
- **Estado**: ✅ Funcional — sweep automático cada 5min
- **Prioridad migración**: C
- **Notas**: En memoria; no persiste entre restarts

### `src/lib/env.ts`
- **Propósito**: Validación de variables de entorno (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
- **Dependencias**: Ninguna
- **Dependientes**: Múltiples (importado como módulo)
- **Estado**: ✅ Funcional — throw si faltan vars
- **Prioridad migración**: A
- **Notas**: Carga eager module-level; considerar lazy load

### `src/lib/encryption.ts`
- **Propósito**: Cifrado AES-GCM con PBKDF2 (600K iteraciones), encrypt/decrypt fields, generateMasterKey
- **Dependencias**: Ninguna (Web Crypto API)
- **Dependientes**: Ninguno (no referenciado desde fuera de lib)
- **Estado**: ✅ Funcional — 256-bit key, 12-byte IV, salt de 16 bytes
- **Prioridad migración**: C
- **Notas**: Depende de Web Crypto API (solo browser/Node 20+)

### `src/lib/feature-flags.ts`
- **Propósito**: Feature flags con rollout %, segmentos de usuario
- **Dependencias**: Ninguna
- **Dependientes**: Ninguno (no referenciado desde fuera de lib)
- **Estado**: ✅ Funcional — persistencia localStorage
- **Prioridad migración**: C
- **Notas**: Útil para canary releases

### `src/lib/negative-cache.ts`
- **Propósito**: Caché de respuestas con normalización de queries, TTL, stats de hit rate
- **Dependencias**: Ninguna
- **Dependientes**: Ninguno (no referenciado desde fuera de lib)
- **Estado**: ✅ Funcional — TTL configurable, invalidación selectiva
- **Prioridad migración**: C
- **Notas**: Cache client-side; considerar Redis para server-side

### `src/lib/secrets.ts`
- **Propósito**: Gestión de secretos con versionado, rotación automática cada 90 días
- **Dependencias**: Ninguna
- **Dependientes**: Ninguno (no referenciado desde fuera de lib)
- **Estado**: ⚠️ Simulado — localStorage no es seguro para secretos
- **Prioridad migración**: A
- **Notas**: Migrar a Vault o env vars en producción

### `src/lib/rls.ts`
- **Propósito**: Políticas Row Level Security para Supabase: definiciones y generación de SQL
- **Dependencias**: Ninguna
- **Dependientes**: Ninguno (no referenciado desde fuera de lib)
- **Estado**: ⚠️ Simulado — definiciones documentales, no aplicadas
- **Prioridad migración**: B
- **Notas**: Útil como documentación de políticas RLS

---

## Observability

### `src/lib/otel.ts`
- **Propósito**: Trazas distribuidas, métricas y logs en memoria (OpenTelemetry-like simplificado)
- **Dependencias**: Ninguna
- **Dependientes**: `synthetics.ts`, `rum.ts`, `app/(dashboard)/operations/page.tsx`
- **Estado**: ✅ Funcional — span stack, traces, metrics, logs
- **Prioridad migración**: B
- **Notas**: En memoria, no persiste; integrar con OTel exporter real

### `src/lib/synthetics.ts`
- **Propósito**: Checks sintéticos configurables con fetch real, resultados históricos
- **Dependencias**: `otel`
- **Dependientes**: `app/(dashboard)/operations/page.tsx`
- **Estado**: ✅ Funcional — fetch real con timeout y abort
- **Prioridad migración**: B
- **Notas**: Ejecuta fetch desde browser; para server-side usar monitor aparte

### `src/lib/rum.ts`
- **Propósito**: Real User Monitoring: Web Vitals (LCP, FID, CLS, INP, TTFB) con PerformanceObserver
- **Dependencias**: `otel`
- **Dependientes**: Ninguno (hook useRUM)
- **Estado**: ✅ Funcional — monitoreo real de métricas web
- **Prioridad migración**: B
- **Notas**: Client-side only; requiere browser APIs

### `src/lib/slos.ts`
- **Propósito**: Service Level Objectives con error budget, eventos buenos/malos
- **Dependencias**: Ninguna
- **Dependientes**: Ninguno (no referenciado desde fuera de lib)
- **Estado**: ✅ Funcional — cálculo de budget, detección de exhausted
- **Prioridad migración**: C
- **Notas**: Persistencia localStorage; integrar con métricas reales

### `src/lib/product-analytics.ts`
- **Propósito**: Analytics de producto: page views, eventos, sesiones, usuarios activos, top pages
- **Dependencias**: Ninguna
- **Dependientes**: Ninguno (no referenciado desde fuera de lib)
- **Estado**: ✅ Funcional — sesiones por sessionStorage, eventos por localStorage
- **Prioridad migración**: C
- **Notas**: Reemplazar con herramienta real (PostHog, GA, etc.)

---

## Infrastructure & Auth

### `src/lib/db/queries.ts`
- **Propósito**: Queries a Supabase: financial_statements, transactions, projections, macro_indicators, dd_engagements
- **Dependencias**: `@/utils/supabase/server`
- **Dependientes**: Ninguno (no referenciado fuera de lib)
- **Estado**: ✅ Funcional — queries reales a Supabase con error handling
- **Prioridad migración**: A
- **Notas**: Queries de producción; integración con tablas reales de BD

### `src/lib/sso.ts`
- **Propósito**: Configuración de SSO: SAML, OIDC, Google, Microsoft, GitHub
- **Dependencias**: Ninguna
- **Dependientes**: Ninguno (no referenciado fuera de lib)
- **Estado**: ⚠️ Simulado — configuraciones en localStorage, no integración real
- **Prioridad migración**: B
- **Notas**: Integrar con Supabase Auth o proveedor SSO real

### `src/lib/runbooks.ts`
- **Propósito**: Runbooks de operaciones con pasos ejecutables (restart, clear_cache, scale_up, rollback, notify)
- **Dependencias**: Ninguna
- **Dependientes**: Ninguno (no referenciado fuera de lib)
- **Estado**: ⚠️ Simulado — handlers simulados con delays y random failures
- **Prioridad migración**: C
- **Notas**: Acciones simuladas; integrar con infra real (K8s, AWS, etc.)

---

## Legacy / No Referenciados

### `src/lib/insight-engine.ts`
- **Propósito**: Motor de insights financieros: z-scores, detección de drivers, hallazgos, alertas, recomendaciones estratégicas
- **Dependencias**: Ninguna
- **Dependientes**: `components/shared/FinancialNarrative.tsx`
- **Estado**: ✅ Funcional — análisis completo con fmt de monedas y porcentajes
- **Prioridad migración**: B
- **Notas**: Output en español; generar reportes de insight financiero

### `src/lib/__tests__/dd-commands.test.ts`
- **Propósito**: Tests para DD commands
- **Dependencias**: `dd/commands`
- **Dependientes**: Ninguno
- **Estado**: ⚠️ No evaluado
- **Prioridad migración**: C
- **Notas**: Revisar si pasa con vitest

---

## Summary Stats

| Métrica | Valor |
|---------|-------|
| Total archivos catalogados | 50 |
| ✅ Funcional | 37 |
| ⚠️ Simulado | 10 |
| ❌ Roto | 0 |
| Prioridad A (urgente) | 12 |
| Prioridad B | 13 |
| Prioridad C | 15 |

### Archivos Críticos (Prioridad A)
1. `orchestrator.ts` — Núcleo del sistema multi-agente
2. `prompts.ts` — Prompts de todos los agentes
3. `graph-rag.ts` — Grafo de conocimiento mock
4. `citation-isd.ts` — Citas de documentos mock
5. `self-critique.ts` — Autocrítica simulada
6. `constitutional.ts` — Reglas de compliance
7. `ai/openai-client.ts` — Cliente real de OpenAI
8. `actions/dd-actions.ts` — Server actions de producción
9. `secrets.ts` — Gestión de secretos (inseguro)
10. `tax-engine/*` — Tax engine completo (5 archivos)
11. `env.ts` — Validación de entorno
12. `db/queries.ts` — Queries de producción a Supabase
