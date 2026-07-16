# Plan Maestro COS 35% → 100% (v2.0)
## Consulting Operating System — Hoja de Ruta a Producto Comercial

**Documento:** PLAN_MAESTRO_100_PORCIENTO_v2.0.md
**Versión:** 2.0 — Julio 2026
**Autor:** Carlos Alman Vidal + revisión técnica Mavis
**Cambios vs v1.0:** ver CHANGELOG al final

---

## CHANGELOG v1.0 → v2.0

### Correcciones de números
- Fase 0: 480h → 448h (corregido +40h nuevas tareas críticas)
- Fase 1: 720h → 748h (+16h T1.0 LOPDP)
- Fase 2: 960h → 820h (corregido y +60h Tributario Lite)
- Fase 3: 960h → 920h
- Fase 4: 960h → 800h
- Fase 5: 720h → 720h
- Fase 6: 960h → 960h
- **Pre-0 Discovery (nuevo): 60h**
- **Total: 5,476h** + 15% buffer = **6,297h**

### Contenido nuevo
- **Fase Pre-0: Discovery Sprint** (4 semanas, validacion de mercado antes de construir)
- **Sección 3.5: GTM Strategy** completa con ICP, canales, pricing tiers, sales motion
- **Sección 4.x: Critical Path** identificado con bottlenecks
- **Tareas T0.21 a T0.25** (Secret Management, Feature Flags, Playwright, Branching, Env Separation)
- **Tarea T1.0** (LOPDP Ecuador en Fase 1)
- **Tareas T2.17 a T2.19** (Tributario Lite)
- **Sección 9.5: Stack Simplificado para Plan Solo** con triggers de migración
- **Métricas corregidas** con proyecciones conservadoras (80 clientes mes 24 → 25-40)

### Cambios de fase/orden
- Secret Management movido de Fase 6 → **Fase 0** (T0.21 = primer task)
- LOPDP Ecuador movido de Fase 6 → **Fase 1** (T1.0)
- GDPR básico movido de Fase 6 → **Fase 2**
- WAF/DDoS movido de Fase 6 → **Fase 2**
- M10 lite dividido: 60h en Fase 2, resto en Fase 4
- ISO 27001 gap analysis arranca en Fase 3, certificación en Fase 5

### Decisiones técnicas revisadas
- Para plan solo: Clerk sobre Keycloak, pgvector sobre Qdrant, Meilisearch sobre Elasticsearch, BullMQ sobre Temporal (con triggers de migración)

---

## 0. Resumen Ejecutivo

| Dimensión | Valor |
|-----------|-------|
| **Estado actual** | 35% (~8,500 LOC, 55 tablas, 7 microservicios, 3 portales) |
| **Meta** | 100% = producto comercial vendible a consultoras mid-market en Latam |
| **Fase 0 obligatoria** | Pre-0 Discovery Sprint (4 semanas, validacion mercado) |
| **Plazo con equipo de 3-5 devs** | 14-18 meses (60-72 semanas) |
| **Plazo con Carlos solo + contractors** | 30-40 meses (130-175 semanas) |
| **Inversión estimada (equipo)** | USD $250,000 - $300,000 |
| **Inversión mínima viable (solo)** | USD $50,000 - $80,000 (corregido: subcontratos + infra + compliance) |
| **Revenue objetivo mes 12** | USD $2,000 - $5,000 MRR (3-8 clientes pioneros) |
| **Revenue objetivo mes 24** | USD $10,000 - $25,000 MRR (25-40 clientes) |
| **Revenue objetivo mes 36** | USD $40,000 - $80,000 MRR (60-120 clientes) |
| **Break-even estimado** | Mes 18-24 (equipo) / Mes 28-36 (solo) |

### Decisión estratégica crítica

El plan se ejecuta bajo el principio **"Discovery antes que código"**. Antes de gastar $5,000+ horas de desarrollo, se ejecutan 4 semanas de validación de mercado con consultoras reales. Si el Discovery no valida, el plan se ajusta o se aborta. No hay code-first sin validación.

El segundo principio es **"Producto vendible en semana 26"**, aunque módulos como M10 (Tributario completo) o M11 (Legal) estén al 60-70%. Se vende con lo que esté al 75%+, no con el 100%.

---

## 1. Estado Actual (35%) — Resumen Auditado

### 1.1 Por módulo

| # | Módulo | % Actual | % Meta Fase 3 (Vendible) | % Meta 100% |
|---|--------|----------|--------------------------|-------------|
| M1 | Identidad Corporativa | 90% | 100% | 100% |
| M2 | Clientes | 50% | 95% | 100% |
| M3 | Motor Documental | 50% | 90% | 100% |
| M4 | Motor IA | 20% | 70% | 100% |
| M5 | Workflow Engine | 15% | 50% | 95% |
| M6 | Business Intelligence | 30% | 80% | 100% |
| M7 | Gestión de Proyectos | 20% | 60% | 95% |
| M8 | Automatizaciones | 0% | 40% | 90% |
| M9 | Motor Financiero | 25% | 75% | 100% |
| M10 | Motor Tributario | 0% | 30% lite + 50% full = 80% | 90% |
| M11 | Motor Legal | 0% | 20% lite | 80% |
| M12 | Centro de Inteligencia | 10% | 40% | 90% |
| M13 | Portal Cliente | 70% | 95% | 100% |
| M14 | Portal Consultor | 80% | 95% | 100% |
| M15 | Portal Director | 70% | 90% | 100% |
| — | Infraestructura | 20% | 80% | 100% |
| — | Testing | 0% | 50% | 90% |
| — | Seguridad | 30% | 75% | 100% |

### 1.2 Activos reutilizables (NO reconstruir)

- 55 tablas Prisma con schema coherente
- 3 portales frontend con layouts y temas
- Sala de Guerra (Stress Simulator)
- Data Hub (CSV upload)
- Valuación M&A (UI con cálculos básicos)
- Identity Service NestJS (CRUD completo)
- 7 microservicios con estructura base
- 4 archivos de blueprint

---

## 2. Definición de "100%" — Criterios de Aceptación

El sistema está al 100% cuando cumple:

### 2.1 Funcionalidad
- 15 módulos con cobertura funcional ≥ 90% sobre casos de uso del blueprint
- 3 portales operativos con datos reales
- Multi-tenancy con RLS verificado
- Flujos end-to-end: onboarding → carga doc → análisis IA → informe → facturación

### 2.2 Calidad técnica
- Cobertura tests ≥ 80%
- 0 vulnerabilidades críticas
- ≤ 5 hallazgos severidad alta
- LCP < 2.5s, INP < 200ms, CLS < 0.1
- Uptime ≥ 99.9%
- TypeScript strict sin `any`

### 2.3 Seguridad y compliance
- LOPDP Ecuador registrado y compliant
- GDPR: consent, data export, right to be forgotten
- ISO 27001 controles A.5-A.18 implementados (certificación objetivo Fase 5)
- SOC2 Type 1 ready
- Penetration test sin críticos
- WAF + DDoS protection
- Secretos en vault, rotación automática
- Auditoría completa de accesos

### 2.4 Operación
- Runbooks para 10+ escenarios de incidente
- Monitoring 24/7 (Grafana + Prometheus)
- APM configurado
- Backups automatizados (RPO ≤ 1h, RTO ≤ 4h)
- Disaster recovery probado

### 2.5 Comercial
- Pricing público de 3-4 tiers
- Self-service signup o trial de 14 días
- Onboarding interactivo
- Documentación usuario y admin
- API pública documentada
- Status page pública
- SLA contractual

---

## 3. Estrategia General

### 3.1 Principios rectores

1. **Discovery antes que código.** 4 semanas de validación de mercado antes de la primera línea de Fase 0.
2. **Vertical slice primero.** Cada workflow crítico end-to-end antes del siguiente módulo.
3. **Datos reales antes que features nuevas.** Cero hardcoded al cierre de Fase 0.
4. **Tests desde día 1.** Cobertura mínima 30% Fase 0, 50% Fase 3, 80% Fase 6.
5. **Seguridad embebida.** Cada feature pasa por threat modeling.
6. **Compliance proporcional al cliente.** LOPDP desde primer cliente ecuatoriano. ISO 27001 cuando hay 5+ clientes pagando.

### 3.2 Enfoque de priorización — ICE Matrix recurrente

Cada sprint se re-evalúa con ICE:

```
Score = Impact × Confidence × Ease (1-5 cada uno)
P0: score ≥ 50 → entra obligatoriamente al sprint
P1: score 25-49 → entra si no bloquea un P0
P2: score 15-24 → entra si quedan horas
P3: score < 15 → backlog frío
```

Reviews: al inicio de cada Fase, re-scorear backlog con aprendizajes reales. "Confidence" cambia con feedback de clientes.

### 3.3 Decisiones de buy vs. build

| Componente | Decisión | Razón |
|------------|----------|-------|
| Auth/SSO | **Buy** (Clerk MVP, Keycloak Fase 5) | Commodity, alto riesgo construirlo |
| Vector DB | **Buy** (pgvector Fase 0-3, Qdrant Fase 4+) | pgvector suficiente hasta 50K vectores |
| Object storage | **Buy** (S3 / MinIO) | Commodity |
| Email | **Buy** (Resend) | Costo marginal cero |
| Monitoring | **Buy** (Grafana Cloud) | Setup inicial alto |
| DCF engine | **Build** | Core IP |
| Motor tributario | **Build** | Diferenciador Ecuador |
| Multi-agent orchestrator | **Build** | Core IP |
| Workflow engine | **Build** (BullMQ Fase 0-3, Temporal Fase 4+) | Core IP |
| UI components | **Buy** (shadcn) | Estándar de mercado |
| Search | **Buy** (Meilisearch Fase 0-3, Elasticsearch Fase 4+) | Suficiente hasta 1M docs |
| Reporting PDFs | **Build** (Puppeteer) | Plantillas custom |

### 3.4 Equipo ideal vs. mínimo

**Equipo ideal (5 personas, 14-18 meses):**
- 1 Tech Lead / arquitecto
- 2 Full-stack senior
- 1 Backend senior (Python + ML)
- 1 DevOps / SRE
- + 1 diseñador UX/UI (contractor)

**Equipo mínimo (2 personas, 22-28 meses):**
- Carlos (full-stack + arquitectura)
- 1 Full-stack mid (subcontratado, part-time)

**Plan solo Carlos (30-40 meses):** ver sección 9

### 3.5 GTM Strategy (Go-To-Market) — NUEVO

#### 3.5.1 ICP (Ideal Customer Profile)

**Cliente ideal v1 (Fases 0-3):**
- Firma consultora Ecuador, 5-15 consultores
- Ingresos anuales: $200,000 - $2,000,000
- Servicios: consultoría financiera + tributaria + legal (combinados preferidos)
- Pain: procesos manuales en Excel + múltiples herramientas desconectadas
- Tech savvy: Director usa WhatsApp Business y apps móviles
- Presupuesto: $300-600/mes sin aprobación comité directivo

**Cliente ideal v2 (Fases 4-6):**
- Firmas medianas, 15-50 consultores
- Ingresos: $2M - $20M anuales
- Requieren: SOC2, SLA contractual, soporte dedicado
- Precio: $1,500 - $5,000/mes

#### 3.5.2 Canales de adquisición (priorizados)

| Canal | Fase | Costo | Potencial | Cómo |
|-------|------|-------|-----------|------|
| **"The PhD Mindset" YouTube** | 0→∞ | $0 | Alto | Videos de finanzas/consultoría → CTA al COS. Carlos YA tiene la audiencia. |
| **Outreach directo LinkedIn** | 0-2 | $0 | Medio | 10 mensajes/día a directores de consultoras Ecuador |
| **Comunidades de contadores** | 1-3 | $0 | Alto | ICPEC, grupos NIIF Ecuador, comunidades SRI |
| **Partners de referidos** | 2-4 | 15% comisión | Alto | Consultoras aliadas que recomienden COS |
| **Content SEO** | 3-6 | $200/mes | Alto LP | "Cómo calcular IVA Ecuador", "Plantilla DCF PYME" |
| **Demostraciones en gremios** | 2-4 | $500/evento | Medio | Cámara de Comercio Quito/Guayaquil |

#### 3.5.3 Apalancamiento de "The PhD Mindset" (asset más subestimado)

```
Video gratuito sobre finanzas/consultoría
    ↓
Lead magnet: "Plantilla DCF para consultoras" (descarga gratis)
    ↓
Email sequence de 5 emails (valor + caso de uso)
    ↓
Invitación a demo de COS
    ↓
Trial de 30 días asistido
    ↓
Cliente pagando
```

El canal YouTube elimina casi todo el CAC si se activa correctamente. No requiere nuevo presupuesto. Setup: 8h + 2h/semana en contenido.

#### 3.5.4 Pricing Strategy (4 tiers)

| Tier | Precio/mes | Usuarios | Features | Target |
|------|-----------|----------|----------|--------|
| **Starter** | $199 | 3 | M1, M2, M3, M13 | Consultora individual o dupla |
| **Professional** | $499 | 10 | + M4 (IA), M7, M9, M10 Lite | Firma 5-15 consultores |
| **Business** | $999 | 25 | + M10 Full, M11, M12 | Firma mediana |
| **Enterprise** | $2,500+ | Ilimitado | Todo + SLA, soporte dedicado | Firma grande |

Nota: precios en USD, facturación en Ecuador vía Deuna/Kushki o PayPal/Stripe con link de pago.

#### 3.5.5 Sales Motion (Primeros 20 clientes)

```
Día 0: Demo personalizada (30 min, video)
     ↓
Día 1-2: Propuesta con caso de uso específico del cliente
     ↓
Día 3-10: Trial gratuito asistido (Carlos onboarding manual)
     ↓
Día 11-14: Follow-up + cierre
     ↓
Día 15: Contrato + primer pago
```

Primeros 20 clientes: Carlos hace el onboarding personalmente. No self-service. Aprendizaje máximo sobre qué falla y qué valoran.

#### 3.5.6 Anti-customer (a evitar)

- Empresas con < 3 personas (no pagarán $200/mes)
- Consultoras unipersonales que solo hacen declaración IVA (rotación alta, margen bajo)
- Firmas que ya están enamoradas de un SaaS internacional (costo de cambio altísimo)
- Empresas que piden "personalización total antes de pagar" (scope creep garantizado)

---

## 4. Fases del Plan

### Visión general

| Fase | Nombre | Semanas | Horas | Entregable clave |
|------|--------|---------|-------|------------------|
| **Pre-0** | Discovery Sprint (NUEVO) | -4 a 0 | 60h | 3 cartas de intención, ICP validado, módulos priorizados |
| **0** | Estabilización y Cimientos | 1-4 | 448h | Producto conectado a datos reales, sin críticos |
| **1** | Núcleo M1-M3 + LOPDP | 5-10 | 748h | Multi-tenancy + Auth + LOPDP compliant |
| **2** | AI Core + Tributario Lite + GDPR | 11-18 | 820h | 4 agentes IA + calendario SRI funcionando |
| **3** | Motor Financiero + Workflows v1 | 19-26 | 920h | **🎯 Primer cliente pagando** |
| **4** | Motor Tributario + Legal | 27-36 | 800h | Diferenciador Ecuador completo |
| **5** | BI + Inteligencia + ISO 27001 | 37-44 | 720h | Insights cross-module, ISO ready |
| **6** | Hardening, Compliance, Escala | 45-60 | 960h | **🎯 COS 100%** |
| **TOTAL** | | **64 semanas** | **5,476h** | |

Con equipo de 5 devs = ~15 meses calendario. Con Carlos solo + contractors = 30-40 meses.

---

## FASE PRE-0 — Discovery Sprint (Semanas −4 a 0) — NUEVO

**Objetivo:** Validar que el COS resuelve un dolor real que las consultoras ecuatorianas PAGARÍAN por resolver, en el orden y al precio correcto. Antes de gastar $5,000+ horas.

### 4.0.1 Entregables obligatorios

- [ ] 10 entrevistas con consultoras ecuatorianas
- [ ] ICP documentado
- [ ] Problem-Solution Fit validado
- [ ] Ranking de módulos por valor percibido (pueden reordenar la Fase 0-2)
- [ ] Willingness to pay validada
- [ ] 3 cartas de intención de cliente pionero
- [ ] Competitive landscape
- [ ] Go/No-Go decision para arrancar Fase 0

### 4.0.2 Tareas

| ID | Tarea | Horas | Acceptance Criteria |
|----|-------|-------|---------------------|
| P0.1 | Identificar y contactar 20 consultoras target | 8 | Lista con nombre, contacto, pain point conocido |
| P0.2 | Script de entrevista (15 preguntas estructuradas) | 4 | Documento validado |
| P0.3 | Ejecutar 10 entrevistas (45 min c/u) | 16 | Notas transcritas, insights clave |
| P0.4 | Análisis de pain points + ranking | 4 | Top 5 dolores priorizados |
| P0.5 | Validar willingness to pay ($200/mes mínimo) | 4 | 5+ confirman WTP |
| P0.6 | Documentar ICP v1 | 4 | Tamaño, industria, pain, presupuesto |
| P0.7 | Analizar competencia (qué usan hoy) | 4 | Excel, SRI tools, SaaS, etc. |
| P0.8 | 3 cartas de intención firmadas | 8 | "Si esto funciona, lo pagamos a $X/mes" |
| P0.9 | Go/No-Go decision documentada | 4 | Informe con recomendación |
| P0.10 | Ajustar plan de fases según aprendizajes | 4 | Plan v2.1 si cambia priorización |
| **TOTAL** | | **60h** | |

### 4.0.3 Script de entrevista (estructura sugerida)

```
1. ¿Qué herramientas usan actualmente para gestión de clientes / tributario / documentos?
2. ¿Cuál es el proceso más doloroso que hacen manualmente hoy?
3. ¿Cuánto pagan actualmente en software o personal para ese proceso?
4. Si pudieran automatizar UNA cosa, ¿qué sería?
5. ¿Quién en su empresa toma decisiones de software? ¿Cuál es su presupuesto?
6. Hipótesis: mostramos wireframe de COS. ¿Qué les llama más la atención?
7. ¿Qué precio pagarían por esto al mes?
8. ¿Hay algún competidor que consideren?
9. ¿Firmarían una carta de intención para ser cliente pionero con 50% descuento?
```

### 4.0.4 Go/No-Go Gate

**ARRANCAR FASE 0 SOLO SI:**
- ≥ 8 de 10 consultoras confirman pain point real (no curiosidad pasajera)
- ≥ 5 confirman willingness to pay > $200/mes
- ≥ 3 firman carta de intención escrita
- El ranking de módulos confirma (o justifica reordenar) la priorización del plan

**Si NO se cumple:** ajustar scope, pivotar módulo principal, o no construir. La honestidad aquí ahorra $250K+.

### 4.0.5 Riesgos del Discovery

| Riesgo | Mitigación |
|--------|------------|
| Sesgo de confirmación (Carlos habla solo con gente que confirma su idea) | Incluir al menos 3 consultoras "escépticas" conocidas |
| Consultoras dicen "sí" por cortesía, no por intención real | Pedir carta escrita + firma, no solo verbal |
| Falsos positivos por novelty effect | Preguntar "¿qué hacen HOY sin esto?", no "¿usarías esto?" |

---

## FASE 0 — Estabilización y Cimientos (Semanas 1-4) — ACTUALIZADA

**Objetivo:** Eliminar deuda técnica crítica, conectar frontend a datos reales, sentar bases de seguridad y compliance desde día 1.

### 4.0.6 Entregables verificables

- [ ] 0 hallazgos críticos de seguridad
- [ ] 3 portales consumen datos de backend
- [ ] Error boundaries en cada segmento
- [ ] **Secretos en vault (NO en .env)** ← PRIMERA TAREA
- [ ] Feature flags operativos
- [ ] Test runner + Playwright E2E configurados
- [ ] CI pipeline ejecutándose
- [ ] Sentry capturando errores
- [ ] Cobertura de tests ≥ 30%
- [ ] LOPDP registro iniciado (preparación para Fase 1)
- [ ] Doc OpenAPI para M1

### 4.0.7 Tareas detalladas (corregidas y con nuevas)

| ID | Tarea | Horas | Dep | Acceptance Criteria |
|----|-------|-------|-----|---------------------|
| **T0.21** | **Secret Management (Infisical o Doppler) — PRIMER TASK** | 8 | — | 0 secrets en .env de producción, rotación configurada, acceso por rol |
| T0.1 | Error boundaries + global-error.tsx + not-found.tsx | 16 | — | Cada layout con error.tsx, no rompen la app |
| T0.2 | Configurar TanStack Query + QueryClient | 16 | — | QueryClient configurado, devtools activos |
| T0.3 | Configurar Zustand (sidebar, filtros, sesión) | 8 | — | Store global, persistencia selectiva |
| T0.4 | Conectar command-center a datos reales | 40 | T0.2 | 8 páginas reemplazan hardcoded con queries |
| T0.5 | Conectar Portal Cliente a datos reales | 32 | T0.4 | Dashboard + eventos + documentos reales |
| T0.6 | Conectar Portal Director a datos reales | 32 | T0.4 | Rentabilidad + alertas + KPIs reales |
| T0.7 | Prisma migrations completas + seed data | 24 | — | Scripts idempotentes, demo data sembrada |
| T0.8 | RLS policies UPDATE/DELETE faltantes | 16 | T0.7 | Tests verifican aislamiento por tenant |
| T0.9 | Vitest + RTL + MSW configurados | 24 | — | Test runner, 1 test por módulo de ejemplo |
| T0.10 | GitHub Actions CI (lint, typecheck, test, build) | 16 | T0.9 | PR no mergea si falla cualquier check |
| T0.11 | Sentry setup (frontend + backend) | 8 | — | Errores visibles, source maps configurados |
| T0.12 | Zod schemas para inputs de M1-M3 | 24 | T0.2 | Validación server-side, no más `as any` |
| T0.13 | Rate limiting + auth middleware | 24 | T0.12 | Login rate-limited, API con auth check |
| T0.14 | Shadcn/ui + refactor componentes base | 40 | — | 10 componentes base migrados |
| T0.15 | React.memo + useCallback en simulador | 16 | T0.4 | Stress Simulator re-render optimizado |
| T0.16 | Loading.tsx + Suspense en todos los segmentos | 16 | T0.4 | Skeleton loaders, Suspense boundaries |
| T0.17 | Accesibilidad base (aria-labels, skip link) | 16 | T0.14 | WCAG 2.1 AA en 5 páginas principales |
| T0.18 | Docker compose funcional end-to-end | 16 | T0.7 | `docker-compose up` levanta todo |
| T0.19 | Documentación OpenAPI M1 (auto-gen) | 8 | T0.2 | Swagger UI en `/api/docs` |
| T0.20 | Code review + pair programming setup | 16 | — | PRs con review, Conventional Commits |
| **T0.22** | **Feature Flags (Unleash self-hosted)** | 8 | T0.18 | Flag system operativo, 2 flags de ejemplo |
| **T0.23** | **Playwright E2E framework** | 12 | T0.9 | Framework, 3 tests E2E (login, dashboard, upload) |
| **T0.24** | **Branching strategy + release process** | 4 | T0.10 | main/develop/feature/hotfix + release checklist |
| **T0.25** | **Environment separation (dev/staging/prod)** | 8 | T0.7 | Vars por entorno, seeds por entorno, URLs separadas |
| **TOTAL FASE 0** | | **448h** | | |

### 4.0.8 Riesgos y mitigación

| Riesgo | Prob | Impacto | Mitigación |
|--------|------|---------|------------|
| Migración de hardcoded a real introduce regresiones | Alta | Medio | Feature flags + tests E2E antes de desactivar mocks |
| Shadcn/ui refactor rompe UI existente | Media | Alto | Branches separados, merge incremental |
| RLS policies permisivas accidentalmente | Media | Crítico | Tests automatizados cross-tenant access |
| Secrets migration a vault genera downtime | Media | Alto | Dual-write temporal, cutover en fin de semana |

### 4.0.9 Salida de fase (Go/No-Go)

- ✅ Build verde, typecheck verde, lint verde
- ✅ 0 críticos en security scan
- ✅ Cobertura ≥ 30%
- ✅ 3 portales con datos reales
- ✅ Error boundaries probados
- ✅ Secretos en vault
- ✅ Feature flags funcionando

---

## FASE 1 — Núcleo Identidad + Clientes + Documental (Semanas 5-10) — ACTUALIZADA

**Objetivo:** M1, M2, M3 al 95%. CRUDs completos. Auth production-ready. **LOPDP Ecuador compliant desde primer cliente real.**

### 4.1.1 Entregables

- [ ] Identity, Clients, Documents Services con 100% endpoints
- [ ] Auth con Clerk (MVP) o Keycloak (si se justifica)
- [ ] **LOPDP Ecuador registrado ante SPDP** ← NUEVO
- [ ] Onboarding wizard multi-tenant
- [ ] Búsqueda semántica de documentos funcional
- [ ] Auditoría de accesos
- [ ] Cobertura de tests ≥ 45%

### 4.1.2 Tareas

#### Compliance + Foundations (32h)

| ID | Tarea | Horas | Acceptance Criteria |
|----|-------|-------|---------------------|
| **T1.0** | **LOPDP Ecuador: registro SPDP + políticas + consent flow** | 16 | Empresa registrada, política de privacidad en portal, consentimiento en onboarding |
| T1.0b | DPA (Data Processing Agreement) firmado con proveedores cloud | 8 | AWS/Supabase/Vercel firman DPA, evidencia archivada |
| T1.0c | Registro de actividades de tratamiento | 8 | Inventario completo, base legal por actividad |

#### M1 — Identidad (160h, igual a v1.0)

| ID | Tarea | Horas | Acceptance Criteria |
|----|-------|-------|---------------------|
| T1.1 | Identity Service: completar CRUD (Branch, Brand, Dept, Permission) | 40 | 100% endpoints REST con validación, RBAC checks |
| T1.2 | Clerk setup + connection (o Keycloak si se justifica) | 24 | Login funcional, JWT validado en backend |
| T1.3 | Onboarding wizard multi-tenant | 32 | 5 pasos: empresa → usuarios → roles → branding → go-live |
| T1.4 | UI Identity completa | 32 | CRUD visual, drag&drop org chart, búsqueda |
| T1.5 | Audit log de accesos M1 | 8 | Tabla audit_log con retention policy |
| T1.6 | Tests M1 | 24 | Cobertura ≥ 70% |

#### M2 — Clientes (212h, corregido)

| ID | Tarea | Horas | Acceptance Criteria |
|----|-------|-------|---------------------|
| T1.7 | Clients Service: CRUD 8 entidades | 60 | 100% endpoints |
| T1.8 | UI Clientes: ficha 360° | 48 | Timeline, contratos, tickets, facturación, IA |
| T1.9 | Búsqueda + filtros | 16 | Full-text, filtros por estado/tipo/industria |
| T1.10 | Importación masiva CSV | 16 | Upload, validación Zod, preview |
| T1.11 | Portal Cliente con login | 32 | Cliente ve su ficha, sube docs, ve tickets |
| T1.12 | Sistema de invitaciones | 16 | Email con magic link, expiración 24h |
| T1.13 | Auditoría accesos a clientes | 8 | Log quién vio qué |
| T1.14 | Tests M2 | 16 | Cobertura ≥ 70% |

#### M3 — Motor Documental (360h, igual a v1.0)

| ID | Tarea | Horas | Acceptance Criteria |
|----|-------|-------|---------------------|
| T1.15 | Documents Service: upload a S3/MinIO, metadata en Postgres | 40 | Upload, descarga, versionado, soft delete |
| T1.16 | Meilisearch indexing pipeline (Fase 0-3) | 40 | Docs indexados con metadata |
| T1.17 | pgvector setup + embedding pipeline (Fase 0-3) | 40 | Chunks vectorizados, retrieval semántico |
| T1.18 | RAG con ISD (Iterative Source Decomposition) | 60 | Trazabilidad: archivo + página + chunk ID |
| T1.19 | UI Documental: explorador + viewer + upload | 48 | Drag&drop, preview PDF, viewer Office |
| T1.20 | Permisos por documento (RBAC granular) | 24 | Quién puede ver/editar/bajar cada documento |
| T1.21 | Data Hub: validación MIME + magic bytes | 16 | Server-side, no solo extensión |
| T1.22 | Versionado con diff | 24 | Ver cambios entre versiones, restaurar |
| T1.23 | OCR para PDFs escaneados | 32 | PDFs escaneados buscables |
| T1.24 | Auditoría accesos a documentos | 8 | Log completo |
| T1.25 | Tests M3 | 28 | Cobertura ≥ 60% |
| **TOTAL FASE 1** | | **748h** | |

---

## FASE 2 — AI Core + Tributario Lite + GDPR básico (Semanas 11-18) — ACTUALIZADA

**Objetivo:** M4 al 70%. Orquestador multiagente funcional. **Calendario SRI funcionando (diferenciador Ecuador)**. GDPR básico implementado.

### 4.2.1 Entregables

- [ ] LangGraph orchestrator desplegado
- [ ] 4 agentes especializados (Financiero, Tributario, Legal, Comercial)
- [ ] RAG retrieval con ISD
- [ ] **Tributario Lite: calendario SRI + simulador IVA + dashboard obligaciones** ← NUEVO
- [ ] **GDPR: consent management + data export + right to be forgotten** ← NUEVO
- [ ] **WAF + DDoS protection (CloudFlare)** ← NUEVO
- [ ] Latencia p95 < 8s en chat
- [ ] Cobertura de tests ≥ 55%

### 4.2.2 Tareas AI Core (760h, igual a v1.0)

| ID | Tarea | Horas | Acceptance Criteria |
|----|-------|-------|---------------------|
| T2.1 | LangGraph setup + state machine base | 60 | Orchestrator enruta a especialistas |
| T2.2 | Agente Financiero (tools: ratios, DCF, proyecciones) | 80 | Responde con datos reales + fuentes |
| T2.3 | Agente Tributario (tools: calendario SRI, simulador IVA) | 60 | Responde sobre obligaciones tributarias |
| T2.4 | Agente Legal (tools: contratos, cláusulas) | 60 | Responde sobre contratos, riesgos |
| T2.5 | Agente Comercial (tools: pipeline, equalas) | 60 | Responde sobre clientes, oportunidades |
| T2.6 | Router + Planner + Supervisor multiagente | 80 | Decide agente, valida coherencia |
| T2.7 | UI Chat: reemplazar hardcoded con LangGraph real | 40 | Streaming, sources visibles, feedback |
| T2.8 | ISD trazabilidad | 60 | Cada respuesta muestra archivo + página + chunk |
| T2.9 | Memoria conversación corto + largo plazo | 40 | Recuerda contexto entre sesiones |
| T2.10 | Evaluación automatizada (LLM-as-judge + métricas) | 40 | Set 100 preguntas, score ≥ 0.8, hallucination < 5% |
| T2.11 | Rate limiting + cost tracking LLM | 24 | Límite por usuario, alertas de costo |
| T2.12 | Tests M4 | 60 | Cobertura ≥ 60% |
| T2.13 | Prompt versioning + A/B testing | 24 | Cambiar prompts sin redeploy |
| T2.14 | Guardrails: validación inputs/outputs | 24 | No PII leak, fallback seguro |
| T2.15 | Optimización de costos (caching + model routing) | 32 | Cache respuestas frecuentes, modelos pequeños para tareas simples |
| T2.16 | Documentación admin de agentes | 16 | Guía para configurar prompts, tools, modelos |

### 4.2.3 Tributario Lite (60h, NUEVO)

| ID | Tarea | Horas | Valor al cliente |
|----|-------|-------|-----------------|
| **T2.17** | **Calendario SRI con alertas (todas las obligaciones 2024-2025)** | 24 | ⭐⭐⭐⭐⭐ |
| **T2.18** | **Simulador IVA básico (ingresos gravados, crédito tributario)** | 20 | ⭐⭐⭐⭐ |
| **T2.19** | **Dashboard de obligaciones pendientes + estado** | 16 | ⭐⭐⭐⭐⭐ |

### 4.2.4 Compliance + Seguridad (60h, NUEVO)

| ID | Tarea | Horas | Acceptance Criteria |
|----|-------|-------|---------------------|
| T2.20 | GDPR: consent management + data export endpoint | 24 | Exporta todos los datos del usuario en JSON/ZIP |
| T2.21 | GDPR: right to be forgotten | 16 | Endpoint que anonimiza datos de un usuario |
| T2.22 | WAF + DDoS protection (CloudFlare Pro) | 16 | WAF rules activas, rate limit por IP |
| T2.23 | Security headers (CSP, HSTS, X-Frame-Options) | 8 | Headers presentes en todas las responses |

### 4.2.5 Tareas adicionales recomendadas (Fase 2)

| ID | Tarea | Horas | Acceptance Criteria |
|----|-------|-------|---------------------|
| T2.24 | Activar canal YouTube → COS funnel | 16 | Landing page, lead magnet, email sequence, 1 video publicado |
| T2.25 | Multi-model LLM router (GPT-4o + Claude Haiku) | 16 | Router funcional, ahorro 40%+ validado |
| **TOTAL FASE 2** | | **820h** | |

---

## FASE 3 — Motor Financiero + Workflows v1 (Semanas 19-26) — IGUAL

**Objetivo:** M5-M9 al 75%. Producto vendible a cliente pionero.

### 4.3.1 Entregables

- [ ] DCF engine real (FastAPI)
- [ ] Monte Carlo 10,000 iteraciones
- [ ] Workflow engine ejecutando 5 procesos core
- [ ] M7 (Proyectos) con Kanban funcional
- [ ] M9 (Financiero) conectado a backend
- [ ] Onboarding cliente automatizado
- [ ] **ISO 27001 gap analysis iniciado** ← NUEVO
- [ ] Cobertura de tests ≥ 65%

### 4.3.2 Tareas

#### M9 — Motor Financiero (280h)

| ID | Tarea | Horas | Acceptance Criteria |
|----|-------|-------|---------------------|
| T3.1 | FastAPI service skeleton | 24 | Estructura, conexión Prisma, healthcheck |
| T3.2 | DCF engine: WACC, CAPM, FCFF, terminal value | 80 | API calcula DCF con 10+ inputs |
| T3.3 | Monte Carlo simulation (10K iteraciones) | 60 | Distribución, percentiles, exportable |
| T3.4 | Synergy Quantifier (M&A) | 40 | NPV de combinaciones |
| T3.5 | Stress testing + escenarios | 40 | 10 escenarios predefinidos + custom |
| T3.6 | Conectar Sala de Guerra a backend | 24 | Sliders reales, persistencia |
| T3.7 | UI Valuación M&A completa | 32 | Wizard, comparación de métodos |
| T3.8 | Reportes PDF automáticos (M&A) | 16 | Generación CIM con 1 click |
| T3.9 | Tests M9 | 24 | Cobertura ≥ 75% |

#### M7 — Gestión de Proyectos (160h)

| ID | Tarea | Horas | Acceptance Criteria |
|----|-------|-------|---------------------|
| T3.10 | Projects Service: CRUD completo | 40 | 100% endpoints |
| T3.11 | UI Kanban con drag&drop | 40 | Crear, mover, asignar, comentar |
| T3.12 | UI Gantt con dependencias | 32 | Visualización, edición, critical path |
| T3.13 | Time tracking | 16 | Timer + manual, reportes de horas |
| T3.14 | Risk register | 16 | Matriz probabilidad × impacto |
| T3.15 | Tests M7 | 16 | Cobertura ≥ 70% |

#### M5 — Workflow Engine v1 (280h)

| ID | Tarea | Horas | Acceptance Criteria |
|----|-------|-------|---------------------|
| T3.16 | Workflow engine: definition + execution (BullMQ) | 80 | DSL JSON/YAML, retry, logging |
| T3.17 | 5 workflows core | 80 | Onboarding, doc ingest, alerta cliente, equala, KYC |
| T3.18 | Trigger system | 40 | Eventos, cron, manual |
| T3.19 | UI Diseñador de workflows (low-code) | 60 | Drag&drop de nodos, conditions |
| T3.20 | Monitoring de workflows | 16 | Dashboard estado, logs, retry |
| T3.21 | Tests M5 | 24 | Cobertura ≥ 70% |

#### M8 — Automatizaciones v1 (160h)

| ID | Tarea | Horas | Acceptance Criteria |
|----|-------|-------|---------------------|
| T3.22 | Email automation (Resend + plantillas) | 32 | 10 plantillas, envío masivo, tracking |
| T3.23 | Notificaciones in-app + push | 24 | Centro notificaciones, marcar leído |
| T3.24 | Webhooks | 24 | Sistema de webhooks configurables |
| T3.25 | Scheduler de tareas recurrentes | 16 | Cron jobs, retry policy, alerting |
| T3.26 | Tests M8 | 16 | Cobertura ≥ 70% |

#### Compliance (NUEVO)

| ID | Tarea | Horas | Acceptance Criteria |
|----|-------|-------|---------------------|
| **T3.27** | **ISO 27001 gap analysis (consultora externa)** | 40 | Informe con brechas, plan de remediación |

### 4.3.3 🎯 MILESTONE COMERCIAL — Gate 3→4

**Al cierre de Fase 3, el producto debe ser vendible a clientes pioneros.**

Criterios mínimos para vender:
- M1, M2, M3, M4, M7, M9 al 75%+
- Tributario Lite operativo
- Workflows core funcionando
- Auth, multi-tenancy, LOPDP, GDPR básicos sólidos
- Landing page + pricing + signup self-service
- Documentación usuario y admin
- 1-3 clientes pagando

Pricing objetivo: USD $499/mes (tier Professional)

**Si NO se llega con clientes pagando aquí, replantear antes de Fase 4.**

---

## FASE 4 — Motor Tributario Full + Legal (Semanas 27-36) — REDUCIDA

**Objetivo:** M10 completo + M11 lite. Diferenciador Ecuador robusto.

### 4.4.1 Entregables

- [ ] Motor tributario Ecuador completo (resto de M10)
- [ ] Generación de anexos ATS, ICE, IVA
- [ ] Contratos con versionado
- [ ] Firma digital (DocuSign o FirmaEC) opcional
- [ ] Cobertura de tests ≥ 70%

### 4.4.2 Tareas

#### M10 — Motor Tributario Full (resto de los 480h originales - 60h Lite ya en Fase 2 = 420h)

| ID | Tarea | Horas | Acceptance Criteria |
|----|-------|-------|---------------------|
| T4.1 | Tax Service skeleton FastAPI | 24 | Conexión Prisma, healthcheck |
| T4.2 | Cálculo de IVA mensual completo | 60 | Ingresos gravados, créditos, declaración |
| T4.3 | Cálculo de Impuesto a la Renta | 80 | Conciliación fiscal, anticipos, retenciones |
| T4.4 | Retenciones en la fuente | 40 | Por tipo de servicio, validación |
| T4.5 | Generación de anexos (ATS, XML) | 60 | Formato SRI, validación previa |
| T4.6 | Simulador tributario (what-if completo) | 40 | Impacto de cambios en estructura |
| T4.7 | Cruces de información (ventas vs compras) | 32 | Detección de inconsistencias |
| T4.8 | UI Motor Tributario completa | 60 | Dashboards, simuladores, generación anexos |
| T4.9 | Integración API SRI (facturación electrónica) | 60 | Emisión de facturas, recepción comprobantes |
| T4.10 | Tests M10 | 32 | Cobertura ≥ 75% |

#### M11 — Motor Legal lite (160h, reducido)

| ID | Tarea | Horas | Acceptance Criteria |
|----|-------|-------|---------------------|
| T4.11 | Legal Service: contratos + cláusulas + vencimientos | 40 | CRUD + versionado + alertas |
| T4.12 | Plantillas de contratos con variables | 32 | 15+ plantillas Ecuador |
| T4.13 | Análisis de cláusulas con IA | 24 | Detección de riesgos |
| T4.14 | UI Legal: contratos + obligaciones | 32 | Vista 360°, búsqueda, alertas |
| T4.15 | Cumplimiento normativo (checklist) | 16 | Lista obligaciones por industria |
| T4.16 | Tests M11 | 16 | Cobertura ≥ 70% |
| **TOTAL FASE 4** | | **800h** | |

Nota: Firma digital (DocuSign) queda fuera del MVP. Se agrega en Fase 6 si el cliente lo pide.

---

## FASE 5 — BI + Inteligencia + ISO 27001 cert (Semanas 37-44)

**Objetivo:** M6, M12, M14 al 85%. Insights cross-module. **Certificación ISO 27001 (objetivo).**

### 4.5.1 Entregables

- [ ] BI Dashboard con datos reales
- [ ] ML forecasting
- [ ] Centro de Inteligencia
- [ ] Reportes automáticos programados
- [ ] **ISO 27001 controles A.5-A.18 implementados** (sin certificación formal)
- [ ] Cobertura de tests ≥ 75%

### 4.5.2 Tareas (sin cambios significativos vs v1.0)

| Módulo | Horas |
|--------|-------|
| M6 BI | 320h |
| M12 Centro de Inteligencia | 280h |
| M14 Portal Consultor (completar) | 80h |
| ISO 27001 implementación controles | 40h (auditoría) |
| **TOTAL FASE 5** | **720h** |

---

## FASE 6 — Hardening, Compliance, Escala (Semanas 45-60)

**Objetivo:** Producto comercial completo, certificado, escalable.

### 4.6.1 Entregables

- [ ] **SOC2 Type 1 ready** (controles + políticas + evidencia) ← objetivo
- [ ] Penetration test sin críticos
- [ ] Uptime 99.9% medido
- [ ] Cobertura de tests ≥ 80%
- [ ] Multi-AZ deployment (opcional)
- [ ] DR probado

### 4.6.2 Tareas

#### Compliance & Security (320h, sin cambios vs v1.0)

#### Performance & Scale (240h, sin cambios vs v1.0)

#### Operación (200h, sin cambios vs v1.0)

#### Commercial Polish (200h, sin cambios vs v1.0)

### 4.6.3 🎯 MILESTONE FINAL — COS 100%

Criterios de salida:
- Tests ≥ 80%
- 0 críticos en security audit
- LOPDP + GDPR compliant (mantenido)
- ISO 27001 controles implementados (certificación objetivo)
- SOC2 Type 1 ready
- 15+ clientes pagando
- NPS ≥ 40
- Churn < 5% mensual

---

## 5. Recursos Necesarios

### 5.1 Equipo (con presupuesto)

| Rol | Cant | Salario mensual USD (Ecuador) | Meses | Costo |
|-----|------|-------------------------------|-------|-------|
| Tech Lead / Arquitecto | 1 | $4,000 | 15 | $60,000 |
| Full-stack senior (Next.js + NestJS) | 2 | $3,500 c/u | 12 | $84,000 |
| Backend senior (Python + ML) | 1 | $4,000 | 8 | $32,000 |
| DevOps / SRE | 1 | $3,500 | 6 | $21,000 |
| UX/UI Designer (contractor) | 1 | $2,000 | 6 | $12,000 |
| QA (contractor) | 1 | $2,000 | 6 | $12,000 |
| **SUBTOTAL RRHH** | | | | **$221,000** |

### 5.2 Infraestructura y servicios (15 meses, corregido)

| Servicio | Costo mensual | 15 meses |
|----------|---------------|----------|
| Vercel Pro (frontend) | $60 | $900 |
| Railway / Render (backend) | $100 | $1,500 |
| Supabase Pro | $25 → $599 | $4,000 |
| OpenAI API (con model router) | $200 (ahorro 40%) | $3,000 |
| Anthropic API (Haiku) | $50 | $750 |
| pgvector (en Supabase, sin costo extra) | $0 | $0 |
| Meilisearch Cloud | $30 | $450 |
| AWS S3 / MinIO | $50 | $750 |
| Sentry | $26 → $80 | $700 |
| Datadog (APM) | $50 → $300 | $2,500 |
| Resend (email) | $20 | $300 |
| Stripe (pagos, 2.9% de revenue) | variable | $2,000 |
| CloudFlare Pro (WAF + DDoS) | $20 | $300 |
| Infisical Team (secret management) | $20 | $300 |
| Unlehost self-hosted (feature flags) | $0 | $0 |
| **SUBTOTAL INFRA** | | **$17,450** |

### 5.3 Servicios profesionales

| Servicio | Costo |
|----------|-------|
| Auditoría legal + DPA setup | $2,500 |
| Diseñador UX/UI (initial design system) | $5,000 |
| Penetration test | $4,000 |
| ISO 27001 consultancy (gap + implementación) | $12,000 |
| SOC2 Type 1 auditor (readiness audit) | $10,000 |
| Contador / impuestos Ecuador | $2,500 |
| Marketing inicial (video, landing, SEO setup) | $5,000 |
| Discovery Sprint costs (transporte, coffee, etc.) | $500 |
| **SUBTOTAL SERVICIOS** | **$41,500** |

### 5.4 Buffer de contingencia (15%)

Buffer sobre todo lo anterior: $280,000 × 0.15 = **$42,000**

### 5.5 Total estimado

**$221,000 + $17,450 + $41,500 + $42,000 = USD $321,950**

Rango: **USD $280,000 - $350,000** para llegar al 100% con equipo completo en 15-18 meses.

---

## 6. Riesgos del Plan (actualizado)

### 6.1 Riesgos de mercado (los más altos)

| Riesgo | Prob | Impacto | Mitigación |
|--------|------|---------|------------|
| Consultoras ecuatorianas no adoptan SaaS (preferencia on-premise) | Alta | Alto | Discovery Sprint lo detecta; ofrecer self-hosted en Fase 6+ |
| Competidor grande lanza producto similar | Media | Crítico | Velocidad + nichos verticales (SRI Ecuador) |
| Churn alto por complejidad del producto | Media | Alto | Onboarding asistido primeros 3 meses |
| CAC muy alto | Media | Alto | Canal YouTube (CAC ~$0) como motor principal |
| WTP (willingness to pay) es menor al esperado | Media | Alto | Discovery Sprint valida precio ANTES de construir |

### 6.2 Riesgos técnicos

| Riesgo | Prob | Impacto | Mitigación |
|--------|------|---------|------------|
| LangGraph / RAG no alcanza calidad mínima | Media | Alto | Evaluar con set de 100 preguntas, fallback GPT-4 puro |
| OCR falla con documentos escaneados | Alta | Medio | AWS Textract premium, permite upload manual |
| Multi-tenancy RLS tiene gaps | Media | Crítico | Tests automatizados cross-tenant access |
| Performance degrada con > 100 clientes | Media | Alto | Load testing continuo, arquitectura preparada para sharding |
| Costo de LLM explota con uso | Media | Alto | Rate limits, cache, model router (ya en plan) |
| pgvector no escala después de 50K vectores | Baja | Medio | Plan de migración a Qdrant ya definido (trigger: 50K vectores) |

### 6.3 Riesgos de equipo

| Riesgo | Prob | Impacto | Mitigación |
|--------|------|---------|------------|
| Carlos se quema (overwork) | Alta | Crítico | Contratar ayuda temprano (Fase 1), ritmo sostenible |
| Pérdida de knowledge por rotación | Media | Alto | Documentación exhaustiva, pair programming |
| Conflicto de prioridades (tesis vs producto) | Alta | Medio | Discovery Sprint先行; decisión semana 1: tesis primero o producto primero |

---

## 7. Métricas de Éxito (proyecciones corregidas y conservadoras)

### 7.1 Métricas de producto

| Métrica | Mes 6 | Mes 12 | Mes 24 | Mes 36 |
|---------|-------|--------|--------|--------|
| Usuarios activos (MAU) | 30 | 150 | 600 | 2,000 |
| Clientes pagando | 1-3 | 3-8 | 25-40 | 60-120 |
| MRR | $500-$1,500 | $2,000-$5,000 | $10,000-$25,000 | $40,000-$80,000 |
| ARR run-rate | $6K-$18K | $24K-$60K | $120K-$300K | $480K-$960K |
| NPS | 25 | 40 | 50 | 60 |
| Churn mensual | < 10% | < 7% | < 5% | < 3% |
| Cobertura tests | 50% | 65% | 75% | 85% |
| Uptime | 99% | 99.5% | 99.9% | 99.9% |
| Latencia p95 API | < 1s | < 500ms | < 300ms | < 200ms |

**Nota sobre revenue:** las proyecciones asumen que el Discovery Sprint valida WTP > $200/mes y que el canal YouTube genera ~50% del pipeline. Sin YouTube, ajustar a la baja 50%.

### 7.2 Métricas de desarrollo

| Métrica | Target |
|---------|--------|
| Velocity (story points/sprint) | Estable post-mes 3 |
| Bugs críticos en producción | 0 |
| Bugs altos escapados | < 2/sprint |
| PR review turnaround | < 24h |
| Lead time (issue → prod) | < 1 semana |
| MTTR | < 4h |

### 7.3 Métricas financieras

| Métrica | Target mes 24 | Target mes 36 |
|---------|---------------|---------------|
| LTV | $8,000 | $15,000 |
| CAC | $800 (con YouTube) | $1,500 |
| LTV/CAC | 10:1 | 10:1 |
| Payback period | < 6 meses | < 6 meses |
| Gross margin | > 75% | > 80% |
| Burn rate mensual | < $8,000 | < $15,000 |

---

## 8. Decisiones Pendientes (Go/No-Go gates)

### Gate Pre-0 → 0 (Semana 0)
- ✅ Discovery Sprint ejecutado
- ✅ ≥ 8/10 confirman pain point
- ✅ ≥ 5 confirman WTP > $200/mes
- ✅ ≥ 3 cartas de intención firmadas
- ✅ ICP documentado y ranking de módulos validado

**Si falla → ajustar scope, pivotar módulo principal, o no construir.**

### Gate 0→1 (Semana 4)
- ✅ Datos reales en los 3 portales
- ✅ Cobertura tests ≥ 30%
- ✅ Secretos en vault
- ✅ Feature flags funcionando

### Gate 1→2 (Semana 10)
- ✅ Auth funciona con Clerk/Keycloak
- ✅ Multi-tenancy validado con tests
- ✅ RAG retrieval es usable
- ✅ **LOPDP Ecuador registrado**

### Gate 2→3 (Semana 18)
- ✅ LangGraph funciona end-to-end
- ✅ Tributario Lite operativo
- ✅ GDPR básico implementado
- ✅ Demo de 5 min que impresione
- ✅ 1+ cliente pionero confirmado

### Gate 3→4 (Semana 26) — **MILESTONE COMERCIAL**
- ✅ 1+ cliente pagando (no solo confirmado)
- ✅ MRR > $500
- ✅ Feedback de clientes positivo
- ✅ ISO 27001 gap analysis completado

### Gate 4→5 (Semana 36)
- ✅ Motor tributario completo
- ✅ MRR > $3,000
- ✅ Churn < 7%

### Gate 5→6 (Semana 44)
- ✅ Centro de inteligencia operativo
- ✅ ISO 27001 controles implementados
- ✅ MRR > $10,000

### Gate 6→ DONE (Semana 60)
- ✅ Todos los criterios de "100%" cumplidos
- ✅ SOC2 Type 1 ready
- ✅ MRR > $25,000

**Si un gate falla, se itera la fase anterior, no se avanza.**

---

## 9. Plan Alternativo: Solo Carlos (30-40 meses)

### 9.1 Diferencias con el plan completo

| Decisión | Plan completo | Plan solo |
|----------|---------------|-----------|
| Fase Pre-0 (Discovery) | 4 semanas, Carlos | 4 semanas, Carlos (idéntico) |
| Fase 0 | 4 semanas, equipo | 6-8 semanas, Carlos |
| Multi-tenancy desde día 1 | Sí | **Sí** (decidido, no se recorta) |
| M10 Tributario lite | Fase 2 | **Fase 2** (sí, no se recorta) |
| M11 Legal lite | Fase 4 reducida | **Fase 4 lite** (sin firma digital) |
| M12 Centro de Inteligencia | Sí | **Diferido** a Fase 6 o nunca |
| Compliance ISO 27001 | Sí, certificación | **Implementación de controles sin certificación formal** |
| Multi-región | Sí | **No** — single region |
| Equipo | 5 personas | 1 persona + contractors puntuales |
| **Duración total** | 15 meses | 30-40 meses |

### 9.2 Subcontrataciones clave (corregido)

| Cuándo | Qué | Costo | Vendor |
|--------|-----|-------|--------|
| Pre-0 | (Carlos solo ejecuta Discovery) | $500 (logística) | — |
| Mes 1 | Setup LangGraph + RAG | $3,500 | Contractor ML |
| Mes 2 | Diseño UX/UI (3 portales) | $4,000 | Diseñador |
| Mes 3 | Auditoría seguridad inicial | $2,500 | Firma pentest |
| Mes 4 | LOPDP + compliance setup legal | $2,000 | Abogado |
| Mes 5 | Migración a Clerk + pgvector | $1,500 | Contractor DevOps |
| Mes 6 | ISO 27001 gap analysis | $5,000 | Consultora |
| Mes 9 | ML forecasting (Prophet) | $3,000 | Contractor ML |
| Mes 12 | Auditoría SOC2 readiness | $6,000 | Auditor |
| **Total subcontratos** | | **$28,000** | |

### 9.3 Stack Simplificado Plan Solo (decisiones revisadas)

| Capa | Stack Original | Stack Simplificado (Fases 0-3) | Triggers de migración |
|------|----------------|-------------------------------|----------------------|
| **Auth** | Keycloak (self-hosted) | **Clerk** ($25/mes hasta 10K MAU) | Migrar a Keycloak cuando se necesite SSO enterprise / SAML (Fase 5+) |
| **Vector DB** | Qdrant Cloud | **pgvector en Supabase** ($0, ya tenés Postgres) | Migrar a Qdrant cuando corpus > 50K vectores o latencia > 200ms |
| **Search** | Elasticsearch | **Meilisearch self-hosted** ($0) | Migrar a ES cuando se necesite percolation queries o > 1M docs |
| **Workflow engine** | Temporal.io | **BullMQ** (Redis-based) | Migrar a Temporal cuando workflows > 50+ steps o 10K ejecuciones/día |
| **LLM** | Solo OpenAI GPT-4 | **Router: GPT-4o + Claude Haiku** | 40-60% ahorro en costos LLM |
| **Email** | Resend | Resend (sin cambio) | — |
| **Monitoring** | Grafana + Prometheus | Grafana Cloud free tier | Migrar a Pro cuando > 50K métricas |
| **APM** | Datadog | Datadog free trial o SigNoz self-hosted | Migrar a Datadog cuando MRR > $10K |
| **Error tracking** | Sentry | Sentry free tier | Migrar a Team cuando MAU > 5K |

### 9.4 Foco del solo dev

1. **Producto, no infra.** Servicios managed (Vercel, Supabase, Clerk, pgvector) en vez de self-hosted.
2. **Vertical slice > módulo completo.** Construir el path crítico end-to-end.
3. **Outsource lo que no es core IP.** UX/UI, compliance, infra → contractors.
4. **Documentar todo.** Si Carlos se enferma 2 meses, otro dev debe poder continuar.
5. **Discovery Sprint es OBLIGATORIO.** El plan solo tiene éxito si valida mercado antes.

### 9.5 Ritmo sostenible (corregido)

- Lunes a viernes: 5-6 horas de código focused + 1-2 horas de negocio
- Sábado: 3-4 horas
- Domingo: descanso total
- 1 semana de vacaciones cada 8 semanas
- **Total realista: ~120 horas/mes** (vs 160 en plan con equipo)

---

## 10. Critical Path Identificado (NUEVO)

Los 10 bloqueadores más importantes del plan:

```
[T0.21 Secret Management] ← DEBE SER PRIMERA TAREA
    ↓
[T0.7 Prisma migrations] → bloquea todo lo de DB
    ↓
[T0.8 RLS policies] → bloquea multi-tenancy seguro
    ↓
[T1.0 LOPDP] → bloquea primer cliente real
    ↓
[T1.15 Documents Service]
    ↓
[T1.17 pgvector] (Plan Solo) o [Qdrant] (Plan Equipo)
    ↓
[T1.18 RAG + ISD] ← BLOQUEADOR DE TODA LA FASE 2
    ↓
[T2.1 LangGraph setup]
    ↓
[T2.2-T2.5 Agentes] ← pueden hacerse en paralelo
    ↓
[T2.6 Router multiagente]
    ↓
[Gate Comercial: Semana 26]

Notas:
- T1.18 es el cuello de botella más peligroso
- T3.16 (Workflow engine) puede desarrollarse en paralelo desde Fase 1
- T0.21 (Secrets) debe ser el PRIMER task del plan
- T1.0 (LOPDP) es prerrequisito legal para vender en Ecuador
```

**Riesgos del critical path:**
- Si T1.18 (RAG + ISD) se atrasa, toda la Fase 2 se atrasa
- Mitigación: empezar diseño de T1.18 en paralelo con T1.15-T1.17, no después
- Si T2.1 (LangGraph) tiene problemas de adopción, tener plan B con implementación manual de agentes

---

## 11. Roadmap Visual (actualizado)

```
SEMANA:  -4  -3  -2  -1   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15  16  17  18
         ├─── Pre-0 Discovery ───┤├── Fase 0 ───┤├──── Fase 1: M1-M3 + LOPDP ───────────┤
                                                                            [LOPDP Ready]
                                                                                              ├ Fase 2 ───┤
                                                                                            [Tributario Lite]
                                                                                                          [MVP AI]

SEMANA: 19  20  21  22  23  24  25  26  27  28  29  30  31  32  33  34  35  36
         ├──── Fase 3: M5-M7-M9 ─────┤├──── Fase 4: M10-M11 lite ─────────────────┤
                                                  [🎯 PRIMER CLIENTE PAGANDO]

SEMANA: 37  38  39  40  41  42  43  44  45  46  47  48  49  50  51  52  53  54  55  56  57  58  59  60
         ├── Fase 5: M6-M12 + ISO ─────┤├──── Fase 6: Hardening ──────────────────────┤
                                                                     [🎯 COS 100%]
```

### Hitos clave

- **Semana 0:** Discovery validado, Go/No-Go para construir
- **Semana 4:** Datos reales + secretos en vault
- **Semana 10:** LOPDP + Multi-tenancy production
- **Semana 18:** Tributario Lite + MVP AI
- **Semana 26:** **Primer cliente pagando** 🎯
- **Semana 36:** Motor tributario completo
- **Semana 44:** ISO 27001 controles
- **Semana 60:** **COS 100%** 🎯

---

## 12. Quick Wins (actualizado)

Para mantener motivación, logros visibles al cierre de cada fase:

### Semana 4 (Fase 0)
- ✅ Todos los portales muestran datos reales
- ✅ Secretos en vault (no más .env)
- ✅ Feature flags funcionando
- ✅ Onboarding de nuevo tenant funciona

### Semana 10 (Fase 1)
- ✅ Multi-tenancy con RLS verificado
- ✅ Búsqueda semántica de documentos funcional
- ✅ **Empresa registrada ante SPDP Ecuador**

### Semana 18 (Fase 2)
- ✅ Agente responde UNA pregunta real con LangGraph + RAG
- ✅ **Calendario SRI con alertas funcionando**
- ✅ 1 video de YouTube publicado con funnel de captura

### Semana 26 (Fase 3)
- ✅ **Cliente pagando primera factura**
- ✅ Stress Simulator con datos reales persistidos
- ✅ Workflow de onboarding ejecutándose

---

## 13. Anti-Patterns a Evitar (sin cambios significativos)

| Anti-pattern | Por qué | Qué hacer en su lugar |
|--------------|---------|------------------------|
| Construir todo el módulo antes de vender | Nunca llegás a vender | 75% del módulo + vender |
| Skip tests "por ahora" | Después es nunca | Tests desde día 1 |
| Custom auth cuando hay Clerk/Keycloak | Re-descubrir la rueda | Managed services |
| Construir infra en AWS a mano | Meses de trabajo | Railway/Vercel para MVP |
| Hardcodear para "avanzar más rápido" | Deuda técnica inmediata | Conectar a DB desde día 1 |
| Diseñar UI perfecta antes de implementar | Nunca termina | shadcn básico, refinar después |
| Agregar features cuando hay crítico | Bugs se acumulan | Críticos bloquean nuevas features |
| Decir "sí" a todo del cliente | Scope creep | ICE matrix + decir "no" |
| Vender sin Discovery previo | $250K de feature sin mercado | 4 semanas Discovery primero |
| Certificar ISO 27001 antes de tener clientes | Gasto sin ROI | Implementar controles, certificar cuando haya 5+ clientes |

---

## 14. Próximos Pasos Inmediatos

### Esta semana (CRÍTICO)
1. ✅ Aprobar este plan v2.0 (o ajustarlo)
2. ✅ Crear GitHub Project con todas las tareas como issues
3. ✅ **Empezar el Pre-0 Discovery Sprint esta misma semana**
4. ✅ Identificar las 20 consultoras target para entrevistas

### Semana -4 a 0 (Pre-0)
1. Ejecutar Discovery Sprint completo
2. Recopilar 3 cartas de intención
3. Go/No-Go decision documentada
4. **Si Go:** ajustar Fases 0-2 según aprendizajes antes de empezar

### Semana 1-4 (Fase 0, si Go)
1. T0.21 Secret Management como PRIMER task (8h)
2. T0.22 Feature Flags
3. T0.23 Playwright
4. Continuar con T0.1-T0.20 en orden
5. Primer demo interno con datos reales al cierre

### Semana 5+ (Fase 1+)
1. Si Discovery reveló que M10 (Tributario) es el módulo #1 → ajustar Fases 2-4
2. Si Discovery reveló otro orden → repriorizar
3. Si Discovery reveló que no hay mercado → PIVOTAR o no construir

---

## Anexo A — Stack Tecnológico Final (actualizado)

| Capa | Plan Equipo | Plan Solo (Fases 0-3) | Triggers de migración |
|------|-------------|----------------------|----------------------|
| Frontend | Next.js 16 | Next.js 16 | — |
| UI components | shadcn/ui | shadcn/ui | — |
| Backend | NestJS (TypeScript) | NestJS | — |
| ML/AI | Python (FastAPI) | Python (FastAPI) | — |
| Database | PostgreSQL (Supabase) | PostgreSQL (Supabase) | — |
| Vector DB | Qdrant Cloud | **pgvector** (Supabase) | 50K+ vectores o latencia > 200ms |
| Object storage | S3 / MinIO | S3 (via Supabase) | — |
| Cache | Redis | Redis (via Upstash) | — |
| Search | Elasticsearch | **Meilisearch self-hosted** | 1M+ docs o percolation queries |
| Auth | Keycloak | **Clerk** | SSO/SAML enterprise |
| Workflow engine | Temporal | **BullMQ** | 50+ steps/workflows o 10K ejecuciones/día |
| Email | Resend | Resend | — |
| Monitoring | Grafana + Prometheus | Grafana Cloud free | > 50K métricas |
| APM | Datadog | SigNoz self-hosted | MRR > $10K |
| Error tracking | Sentry | Sentry free | MAU > 5K |
| Hosting | Vercel + Railway | Vercel + Railway | Migrar a AWS cuando MRR > $15K |
| CI/CD | GitHub Actions | GitHub Actions | — |
| Secret management | **Infisical** | Infisical free tier | — |
| Feature flags | **Unleash** | Unleash self-hosted | — |
| LLM | OpenAI + Anthropic (router) | OpenAI + Anthropic (router) | — |
| Payment | Stripe + Deuna/Kushki | Stripe + Deuna/Kushki | — |
| WAF/DDoS | CloudFlare Pro | CloudFlare Pro | — |

---

## Anexo B — Glosario (sin cambios)

COS, RLS, ISD, ICE, MRR, ARR, CAC, LTV, NPS, HA, RTO, RPO, WCAG, LCP, INP, CLS, K8s, JWT, DPIA, DPO, WTP.

---

## Anexo C — Referencias

- `analysis_results.md` — Análisis técnico
- `cos/AUDITORIA_COS.md` — Auditoría monorepo
- `command-center/AUDITORIA_Y_MEJORAS.md` — Auditoría demo
- `cos/COS_BLUEPRINT.md` — Blueprint maestro
- `Lo que planteas no es desarrollar u.txt` — Visión fundacional

---

## Anexo D — Changelog Detallado v1.0 → v2.0

### Cambios críticos
1. **Fase Pre-0 Discovery Sprint** (NUEVA, 60h): validación de mercado ANTES de construir
2. **T0.21 Secret Management** movido de Fase 6 → PRIMER task de Fase 0
3. **T0.22 Feature Flags** agregado a Fase 0
4. **T0.23 Playwright E2E** agregado a Fase 0
5. **T1.0 LOPDP Ecuador** movido de Fase 6 → Fase 1
6. **Tributario Lite (T2.17-T2.19)** movido de Fase 4 → Fase 2
7. **GDPR básico (T2.20-T2.21)** movido de Fase 6 → Fase 2
8. **WAF + DDoS (T2.22)** movido de Fase 6 → Fase 2
9. **Sección 3.5 GTM Strategy** completa (NUEVA): ICP, canales, pricing 4 tiers, sales motion
10. **Sección 10 Critical Path** identificado con bottlenecks (NUEVA)
11. **Sección 9.3 Stack Simplificado** con triggers de migración (NUEVA)
12. **Stack tecnológico** simplificado para plan solo (Clerk, pgvector, Meilisearch, BullMQ)
13. **Proyecciones de revenue** corregidas a rangos realistas (conservadoras)
14. **Presupuesto plan solo** corregido de $15-30K → $50-80K
15. **Total horas** recalculado: 5,760h → 5,476h + 15% buffer = 6,297h

### Cambios menores
- Multi-tenant desde día 1 confirmado para plan solo (no se recorta)
- T1.0a DPA con proveedores cloud agregado
- T1.0b Registro de actividades de tratamiento agregado
- T2.10 ampliado con métricas de IA (hallucination rate, source attribution, cost per query)
- T2.25 Multi-model LLM router agregado a Fase 2
- ISO 27001 split: gap analysis en Fase 3, implementación de controles en Fase 5
- SOC2 Type 1 movido de "Fase 6 certificación" → "Fase 6 ready"
- Sección 13 Anti-Patterns ampliada con 2 nuevos patrones

### Lo que NO cambió
- Estructura general de 6 fases (Pre-0 + 0-6)
- Tech stack base (Next.js, NestJS, PostgreSQL, Prisma)
- Arquitectura de microservicios
- Plan con equipo completo (solo agregados, no restas)
- Sección 14 de próximos pasos
- Anexos B y C

---

**FIN DEL DOCUMENTO v2.0**

*Este plan es un documento vivo. Se actualiza cada 2 semanas con progreso real, ajustes de scope, y lecciones aprendidas. Próxima revisión obligatoria: al cierre de Fase Pre-0 (semana 0).*
