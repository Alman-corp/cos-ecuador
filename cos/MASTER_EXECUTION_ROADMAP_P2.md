# MASTER EXECUTION ROADMAP — PARTE 2: CAPAS 4-7 + BACKLOG

---

# CAPA 4 — AI PLATFORM

**Objetivo:** Todos los motores cognitivos funcionando con contexto completo, RAG, embeddings, memoria persistente y un copiloto que entiende el negocio.

**Duración:** 4-6 semanas  
**Depende de:** Capa 3 terminada (el conocimiento debe existir antes que la IA)  
**Hito:** El usuario puede hacer cualquier pregunta de negocio y el sistema responde con datos reales, contexto histórico y confianza calibrada

**Regla crítica:** No se conecta ningún LLM externo hasta que el Knowledge Lake esté poblado. Una IA sin contexto alucina. Una IA con contexto resuelve.

---

## 4.1 Executive AI

```
T-400: Executive Brief con datos de DB
  Estado: [PAR] existe en memoria
  Depende de: T-125, T-126, T-127
  Esfuerzo: 12 horas
  Criterio: GET /api/executive consolida memory + plans + cases desde DB
  Riesgo: Medio
  Archivos: app/api/executive/route.ts, components/executive/ExecutiveBriefPanel.tsx

T-401: Context Assembler (recopila estado completo del negocio)
  Estado: [PEN]
  Depende de: T-400
  Esfuerzo: 16 horas
  Criterio: assembler produce un contexto JSON con: KPIs actuales, alertas, planes activos, últimos eventos, benchmark
  Riesgo: Alto — es la pieza central del contexto para la IA
  Archivos: core/ai/context.ts
```

---

## 4.2 Reasoning Engine

```
T-405: Reasoning con datos de DB
  Estado: [IMP] existe en memoria
  Depende de: T-125, T-330
  Esfuerzo: 12 horas
  Criterio: reasoning consulta DB + DNA para diagnóstico
  Riesgo: Medio
  Archivos: core/reasoning/engine.ts

T-406: Ampliar diagnóstico con correlación de múltiples fuentes
  Estado: [PAR] diagnóstico simple
  Depende de: T-405
  Esfuerzo: 16 horas
  Criterio: diagnóstico cruza: ratios + KPIs + benchmarks + casos similares + DNA
  Riesgo: Alto — lógica de diagnóstico compleja
```

---

## 4.3 Planning Engine

```
T-410: Planning con datos de DB
  Estado: [IMP] existe en memoria con auto-save
  Depende de: T-126
  Esfuerzo: 8 horas
  Criterio: generatePlan consulta DB para KPIs, benchmarks, casos similares
  Riesgo: Medio
  Archivos: core/planning/engine.ts

T-411: Planes con datos reales de clientes
  Estado: [PAR] planes con KPIs mock
  Depende de: T-410
  Esfuerzo: 12 horas
  Criterio: plan generado usa KPIs reales del cliente desde DB
  Riesgo: Medio
```

---

## 4.4 Prediction Engine (con Enhanced ML)

```
T-415: Prediction con datos históricos de DB
  Estado: [IMP] existe en memoria
  Depende de: T-125
  Esfuerzo: 8 horas
  Criterio: predict() consulta histórico de memory store desde DB
  Riesgo: Bajo
  Archivos: core/prediction/engine.ts

T-416: Integrar EnhancedPredictionEngine como modelo default
  Estado: [IMP] enhanced existe separado
  Depende de: T-415
  Esfuerzo: 8 horas
  Criterio: predict() usa enhanced (ARIMA/Seasonal/Holt-Winters) automáticamente
  Riesgo: Medio — cambio de algoritmo

T-417: Confidence Engine con calibración real
  Estado: [PAR] existe con heurísticas
  Depende de: T-416
  Esfuerzo: 16 horas
  Criterio: confidence correlaciona con error histórico (no heurísticas fijas)
  Riesgo: Alto — requiere datos históricos para calibrar
```

---

## 4.5 Learning Engine (Auto-aprendizaje)

```
T-420: Learning con DB + recomendaciones automáticas
  Estado: [IMP] existe en memoria
  Depende de: T-325
  Esfuerzo: 8 horas
  Criterio: registerCase → guarda en DB, findSimilar → busca en DB
  Riesgo: Bajo
  Archivos: core/learning/engine.ts

T-421: Matching semántico de casos (embedding-based)
  Estado: [PEN]
  Depende de: T-435 (Embeddings)
  Esfuerzo: 12 horas
  Criterio: findSimilar usa similitud coseno de embeddings, no solo tags
  Riesgo: Medio
```

---

## 4.6 RAG (Retrieval-Augmented Generation)

```
T-425: Knowledge Lake como base de RAG
  Estado: [PEN]
  Depende de: T-300, T-435
  Esfuerzo: 16 horas
  Criterio: consulta en lenguaje natural → recupera documentos relevantes del Knowledge Lake
  Riesgo: Alto — RAG es complejo de implementar bien
  Archivos: core/ai/rag.ts

T-426: RAG sobre Business Cases
  Estado: [PEN]
  Depende de: T-421, T-435
  Esfuerzo: 12 horas
  Criterio: "¿cómo resolviste un caso de liquidez en construcción?" → recupera casos similares
  Riesgo: Medio

T-427: RAG sobre Regulatory
  Estado: [PEN]
  Depende de: T-321, T-435
  Esfuerzo: 12 horas
  Criterio: "¿cuál es el plazo para presentar impuestos?" → responde con artículo de la ley
  Riesgo: Medio
```

---

## 4.7 Embeddings + Vector DB

```
T-430: Instalar pgvector en PostgreSQL
  Estado: [PEN]
  Depende de: T-001
  Esfuerzo: 4 horas
  Criterio: CREATE EXTENSION vector → exitoso
  Riesgo: Bajo

T-435: Generar embeddings para todos los KnowledgeLake documents
  Estado: [PEN]
  Depende de: T-430
  Esfuerzo: 16 horas
  Criterio: 500+ documentos con embeddings 1536d en pgvector
  Riesgo: Medio — requiere API de embeddings (OpenAI/local)

T-436: Búsqueda semántica sobre Knowledge Lake
  Estado: [PEN]
  Depende de: T-435
  Esfuerzo: 12 horas
  Criterio: búsqueda por similitud coseno < 0.5s en 500+ documentos
  Riesgo: Medio
```

---

## 4.8 LLM Integration

```
T-440: Integración con API de OpenAI/Claude
  Estado: [PEN]
  Depende de: T-401 (Context Assembler)
  Esfuerzo: 12 horas
  Criterio: pregunta → context assembler produce contexto → LLM responde con contexto
  Riesgo: Medio — costos de API, latencia
  Archivos: core/ai/llm.ts

T-441: Prompt templates para cada intent NLU
  Estado: [PEN]
  Depende de: T-440
  Esfuerzo: 16 horas
  Criterio: 12 prompts optimizados, uno por intent, con ejemplos few-shot
  Riesgo: Medio — prompt engineering iterativo
  Archivos: core/ai/prompts.ts

T-442: Fallback offline cuando LLM no está disponible
  Estado: [PEN]
  Depende de: T-440
  Esfuerzo: 8 horas
  Criterio: si API de LLM falla → responde con motor de reglas (NLU + DNA)
  Riesgo: Bajo
```

---

## 4.9 AI Copilot

```
T-445: Copilot con contexto real
  Estado: [PAR] existe UI, chat proxy a orquestador
  Depende de: T-440, T-401
  Esfuerzo: 16 horas
  Criterio: chat usa LLM + context assembler + RAG, no proxy externo
  Riesgo: Alto — reemplazar orquestador externo
  Archivos: components/CopilotPanel.tsx, app/api/ai/copilot/route.ts

T-446: Tool execution (el copiloto ejecuta acciones)
  Estado: [PAR] tool registry existe
  Depende de: T-445
  Esfuerzo: 12 horas
  Criterio: "genera un reporte de salud financiera" → copiloto ejecuta generateReport()
  Riesgo: Alto — tool calling es complejo
```

---

## 4.10 Memory Store (IA Memory)

```
T-450: MemoryStore como historial de contexto para IA
  Estado: [IMP] existe
  Depende de: T-125
  Esfuerzo: 8 horas
  Criterio: cada interacción con IA se guarda en memory, disponible para contexto futuro
  Riesgo: Bajo

T-451: Memory summary para contexto de LLM
  Estado: [PEN]
  Depende de: T-450
  Esfuerzo: 8 horas
  Criterio: resumen automático de últimos N eventos para incluir en prompt
  Riesgo: Medio — resúmenes efectivos son difíciles
```

---

## 📊 PROGRESO CAPA 4

| Área | Tareas | Esfuerzo |
|---|---|---|
| Executive AI | 2 | 28h |
| Reasoning | 2 | 28h |
| Planning | 2 | 20h |
| Prediction + ML | 3 | 32h |
| Learning | 2 | 20h |
| RAG | 3 | 40h |
| Embeddings + Vector | 3 | 32h |
| LLM Integration | 3 | 36h |
| AI Copilot | 2 | 28h |
| Memory | 2 | 16h |
| **Total** | **24** | **280h (~6 sem)** |

**Definición de "CAPA 4 TERMINADA":**
- [ ] Executive Brief con datos reales
- [ ] Context Assembler funcional
- [ ] Enhanced ML como motor default
- [ ] RAG operativo sobre Knowledge Lake
- [ ] Embeddings + pgvector
- [ ] LLM integrado con fallback offline
- [ ] Copilot responde con contexto real
- [ ] Memory store como historial de IA
- [ ] Confidence calibrado

---

# CAPA 5 — AUTOMATION PLATFORM

**Objetivo:** La IA deja de solo responder. Empieza a actuar. Workflows, notificaciones, email, WhatsApp, scheduler, background jobs.

**Duración:** 3-4 semanas  
**Depende de:** Capa 4 terminada  
**Hito:** El sistema ejecuta acciones automáticas basadas en reglas + IA sin intervención humana

---

## 5.1 Workflow Engine Completo

```
T-500: Workflow engine con steps condicionales
  Estado: [PEN] (T-131 es base mínima)
  Depende de: T-131
  Esfuerzo: 24 horas
  Criterio: workflow con condiciones (if ratio < 1.0 → enviar alerta), loops, paralelo
  Riesgo: Alto — lógica de workflows es compleja
  Archivos: core/workflow/engine.ts

T-501: Workflow visual desde UI
  Estado: [PEN]
  Depende de: T-500
  Esfuerzo: 24 horas
  Criterio: UI drag-drop para definir workflows, no código
  Riesgo: Alto — UX compleja
```

---

## 5.2 Email Real

```
T-505: Servicio de email (Resend/SendGrid)
  Estado: [PEN] (NotificationService tiene stub)
  Depende de: —
  Esfuerzo: 8 horas
  Criterio: enviar email con template a destinatario real
  Riesgo: Bajo
  Archivos: core/notifications/email.ts

T-506: Templates de email HTML
  Estado: [PEN]
  Depende de: T-505
  Esfuerzo: 8 horas
  Criterio: 5 templates responsive (alerta, reporte, hito, tarea, bienvenida)
  Riesgo: Bajo
```

---

## 5.3 WhatsApp Real

```
T-510: Integración WhatsApp Business API
  Estado: [PEN] (NotificationService tiene stub)
  Depende de: —
  Esfuerzo: 16 horas
  Criterio: enviar mensaje WhatsApp a número real
  Riesgo: Alto — requiere aprobación de Meta, número de negocio
  Archivos: core/notifications/whatsapp.ts
```

---

## 5.4 Scheduler + Background Jobs

```
T-515: Bull queue con Redis
  Estado: [PEN]
  Depende de: T-010 (Redis)
  Esfuerzo: 12 horas
  Criterio: job en cola → worker lo procesa → resultado disponible
  Riesgo: Medio
  Archivos: lib/queue.ts

T-516: Scheduler recurrente (cron)
  Estado: [PEN]
  Depende de: T-515
  Esfuerzo: 8 horas
  Criterio: tarea programada (ej: "enviar reporte semanal cada lunes 8am") se ejecuta
  Riesgo: Medio
```

---

## 5.5 Triggers Automáticos

```
T-520: Trigger engine (cuando X → hacer Y)
  Estado: [PEN]
  Depende de: T-500
  Esfuerzo: 16 horas
  Criterio: "cuando KPI cruza umbral crítico → enviar notificación + crear tarea"
  Riesgo: Alto — reglas ECA (Event-Condition-Action)
  Archivos: core/automation/triggers.ts

T-521: Triggers predefinidos (10+ reglas)
  Estado: [PEN]
  Depende de: T-520
  Esfuerzo: 8 horas
  Criterio: 10 triggers listos: KPI crítico, plan vencido, caso completado, etc.
  Riesgo: Bajo
```

---

## 5.6 Notificaciones en Producción

```
T-525: NotificationService con canales reales
  Estado: [PAR] existe en memoria
  Depende de: T-505, T-510
  Esfuerzo: 8 horas
  Criterio: notify() envía por canal configurado (email real, whatsapp real)
  Riesgo: Medio
  Archivos: core/notifications/index.ts

T-526: Preferencias de notificación por usuario
  Estado: [PEN]
  Depende de: T-525
  Esfuerzo: 8 horas
  Criterio: usuario configura qué notificaciones recibe y por qué canal
  Riesgo: Bajo
```

---

## 📊 PROGRESO CAPA 5

| Área | Tareas | Esfuerzo |
|---|---|---|
| Workflow Engine | 2 | 48h |
| Email | 2 | 16h |
| WhatsApp | 1 | 16h |
| Scheduler | 2 | 20h |
| Triggers | 2 | 24h |
| Notificaciones | 2 | 16h |
| **Total** | **11** | **140h (~4 sem)** |

---

# CAPA 6 — ENTERPRISE PLATFORM

**Objetivo:** Producto SaaS completo con multi-tenant real, billing, marketplace, API pública, white label e integraciones enterprise.

**Duración:** 4-5 semanas  
**Depende de:** Capa 5 terminada  
**Hito:** La plataforma puede ser usada por N empresas independientes con sus propios datos

---

## 6.1 Multi-tenant Real

```
T-600: Aislamiento completo por tenant (RLS o schema por tenant)
  Estado: [PAR] x-company-id header
  Depende de: T-112
  Esfuerzo: 24 horas
  Criterio: empresa A no ve datos de empresa B aunque ambos sean admin
  Riesgo: Alto — error de aislamiento = breach de datos
  Archivos: middleware.ts, lib/tenant/scope.ts
```

---

## 6.2 Billing + Stripe

```
T-605: Stripe checkout con tiers reales
  Estado: [IMP] existe, usa datos mock
  Depende de: —
  Esfuerzo: 8 horas
  Criterio: checkout → Stripe session → webhook → actualiza subscription en DB
  Riesgo: Medio — manejo de errores de pago
  Archivos: app/api/stripe/**/route.ts

T-606: Planes de suscripción configurables desde UI
  Estado: [PEN]
  Depende de: T-605
  Esfuerzo: 12 horas
  Criterio: Director puede crear/editar planes de precio desde UI
  Riesgo: Medio
```

---

## 6.3 Marketplace

```
T-610: Marketplace de productos (instalar desde catálogo)
  Estado: [PAR] existe Product OS
  Depende de: T-605
  Esfuerzo: 16 horas
  Criterio: producto disponible en marketplace → click instalar → activo en empresa
  Riesgo: Medio
```

---

## 6.4 API Pública

```
T-615: API Key management
  Estado: [PEN]
  Depende de: T-600
  Esfuerzo: 8 horas
  Criterio: empresa genera API keys → autenticación via Bearer token
  Riesgo: Medio
  Archivos: app/api/public/auth.ts

T-616: OpenAPI 3.0 spec completa
  Estado: [PEN]
  Depende de: T-027 (Zod validación)
  Esfuerzo: 24 horas
  Criterio: spec OpenAPI generada automáticamente desde Zod schemas
  Riesgo: Medio — requiere anotaciones en todas las rutas
```

---

## 6.5 White Label

```
T-620: Custom branding por empresa
  Estado: [PEN]
  Depende de: T-600
  Esfuerzo: 16 horas
  Criterio: empresa configura logo, colores, dominio personalizado
  Riesgo: Medio
```

---

## 6.6 Integraciones Enterprise

```
T-625: Integración Power BI Embedded
  Estado: [PEN]
  Depende de: —
  Esfuerzo: 16 horas
  Criterio: reportes de BI OS visibles en Power BI
  Riesgo: Medio — requiere licencia Power BI

T-626: Integración Odoo ERP
  Estado: [PEN]
  Depende de: —
  Esfuerzo: 16 horas
  Criterio: clientes, facturas, productos sincronizados con Odoo
  Riesgo: Medio

T-627: Integración SRI real (facturación electrónica)
  Estado: [PEN]
  Depende de: T-315
  Esfuerzo: 16 horas
  Criterio: enviar factura electrónica al SRI desde la plataforma
  Riesgo: Alto — firma electrónica, XML, validación SRI

T-628: Integración bancaria (Kushki/Payphone)
  Estado: [PEN]
  Depende de: —
  Esfuerzo: 12 horas
  Criterio: cobros recurrentes, link de pago, conciliación automática
  Riesgo: Medio
```

---

## 📊 PROGRESO CAPA 6

| Área | Tareas | Esfuerzo |
|---|---|---|
| Multi-tenant | 1 | 24h |
| Billing | 2 | 20h |
| Marketplace | 1 | 16h |
| API Pública | 2 | 32h |
| White Label | 1 | 16h |
| Integraciones | 4 | 60h |
| **Total** | **11** | **168h (~5 sem)** |

---

# CAPA 7 — GLOBAL PLATFORM

**Objetivo:** Plataforma global, escalable, multi-idioma, mobile, con IA agéntica.

**Duración:** 6-8 semanas  
**Depende de:** Capa 6 terminada  
**Hito:** La plataforma puede operar en múltiples países, idiomas y dispositivos con alta disponibilidad

---

## 7.1 Mobile App

```
T-700: React Native (Expo) app
  Estado: [PEN]
  Depende de: T-616
  Esfuerzo: 60 horas
  Criterio: app iOS + Android con dashboard, clientes, reportes, notificaciones push
  Riesgo: Alto — desarrollo mobile completo
```

---

## 7.2 Electron Production

```
T-705: Electron con auto-update
  Estado: [PAR] existe Electron build
  Depende de: —
  Esfuerzo: 16 horas
  Criterio: app se actualiza automáticamente desde GitHub Releases
  Riesgo: Medio
```

---

## 7.3 Internacionalización

```
T-710: i18n framework (next-intl)
  Estado: [PEN]
  Depende de: —
  Esfuerzo: 24 horas
  Criterio: todas las strings de UI en EN/ES, cambio de idioma sin recargar
  Riesgo: Medio — ~1000 strings a traducir

T-711: Benchmarks LATAM (Colombia, Perú, México, Chile)
  Estado: [PEN]
  Depende de: T-310
  Esfuerzo: 24 horas
  Criterio: benchmarks para 5 países, 20 industrias cada uno
  Riesgo: Alto — requiere investigación de fuentes locales
```

---

## 7.4 Escalabilidad

```
T-715: Kubernetes (K3s) + Helm charts
  Estado: [PEN]
  Depende de: T-010
  Esfuerzo: 24 horas
  Criterio: kubectl get pods → todos healthy, escalado horizontal funciona
  Riesgo: Alto — Kubernetes es complejo
  Archivos: infra/k8s/

T-716: Terraform para infraestructura cloud
  Estado: [PEN]
  Depende de: T-715
  Esfuerzo: 16 horas
  Criterio: terraform apply → infraestructura completa en cloud
  Riesgo: Medio
  Archivos: infra/terraform/
```

---

## 7.5 AI Agents

```
T-720: Agentes autónomos (LangGraph)
  Estado: [PEN]
  Depende de: T-440
  Esfuerzo: 24 horas
  Criterio: agente planifica → ejecuta → verifica — sin intervención humana
  Riesgo: Alto — agentes autónomos son frontera de IA

T-721: Agente de diagnóstico financiero autónomo
  Estado: [PEN]
  Depende de: T-720
  Esfuerzo: 16 horas
  Criterio: "diagnostica empresa X" → agente recopila datos → ejecuta engines → produce reporte
  Riesgo: Alto
```

---

## 7.6 Analytics + Data Warehouse

```
T-725: ClickHouse para analytics
  Estado: [PEN]
  Depende de: —
  Esfuerzo: 16 horas
  Criterio: queries analíticas sub-second en millones de registros
  Riesgo: Medio

T-726: Dashboard de uso del producto
  Estado: [PEN]
  Depende de: T-725
  Esfuerzo: 12 horas
  Criterio: métricas de uso: usuarios activos, features usadas, tiempo de sesión
  Riesgo: Bajo
```

---

## 7.7 High Availability

```
T-730: Multi-región (US + EU + LATAM)
  Estado: [PEN]
  Depende de: T-715
  Esfuerzo: 24 horas
  Criterio: failover automático entre regiones
  Riesgo: Alto

T-731: CDN (Cloudflare)
  Estado: [PEN]
  Depende de: —
  Esfuerzo: 8 horas
  Criterio: assets servidos desde CDN, latencia <100ms global
  Riesgo: Bajo
```

---

## 📊 PROGRESO CAPA 7

| Área | Tareas | Esfuerzo |
|---|---|---|
| Mobile | 1 | 60h |
| Electron Prod | 1 | 16h |
| i18n | 2 | 48h |
| Escalabilidad | 2 | 40h |
| AI Agents | 2 | 40h |
| Analytics | 2 | 28h |
| HA | 2 | 32h |
| **Total** | **12** | **264h (~7 sem)** |

---

# BACKLOG COMPLETO PRIORIZADO

## Total general del roadmap

| Capa | Tareas | Esfuerzo | Semanas (1 dev) | Semanas (2 devs) |
|---|---|---|---|---|
| **Capa 0** — Fundación | 33 | ~160h | 4 | 2 |
| **Capa 1** — Core Platform | 26 | ~250h | 6 | 3 |
| **Capa 2** — Business Platform | 16 | ~148h | 4 | 2 |
| **Capa 3** — Knowledge Platform | 15 | ~188h | 4 | 2 |
| **Capa 4** — AI Platform | 24 | ~280h | 6 | 3 |
| **Capa 5** — Automation Platform | 11 | ~140h | 4 | 2 |
| **Capa 6** — Enterprise Platform | 11 | ~168h | 5 | 3 |
| **Capa 7** — Global Platform | 12 | ~264h | 7 | 4 |
| **TOTAL** | **148** | **~1,598h** | **~40 sem** | **~21 sem** |

## Backlog priorizado (Top 20 por valor/esfuerzo)

| # | Tarea | Capa | Valor | Esfuerzo | Ratio V/E |
|---|---|---|---|---|---|
| 1 | T-002: Prisma schema completo | 0 | Crítico | 40h | ∞ (base) |
| 2 | T-003: Migración inicial + seed | 0 | Crítico | 20h | ∞ (base) |
| 3 | T-030: Configurar Vitest + tests | 0 | Máximo | 4h | 100 |
| 4 | T-045: CI/CD en GitHub Actions | 0 | Máximo | 8h | 50 |
| 5 | T-020: Logging con Pino | 0 | Alto | 4h | 40 |
| 6 | T-025: Rate limiting + seguridad | 0 | Alto | 11h | 30 |
| 7 | T-102: Auth real (JWT) | 1 | Máximo | 16h | 25 |
| 8 | T-125: Migrar MemoryStore a DB | 1 | Máximo | 16h | 20 |
| 9 | T-017: Eliminar fallbacks de seguridad | 0 | Alto | 2h | 20 |
| 10 | T-205: Conectar XBRL a DB | 2 | Alto | 8h | 15 |
| 11 | T-210: Ratios desde DB | 2 | Alto | 8h | 15 |
| 12 | T-116: Client CRUD en DB | 1 | Alto | 16h | 12 |
| 13 | T-330: DNA en DB | 3 | Alto | 12h | 12 |
| 14 | T-040: Tests GenomeEngine | 0 | Medio | 6h | 10 |
| 15 | T-105: Middleware JWT | 1 | Alto | 8h | 10 |
| 16 | T-415: Prediction con DB | 4 | Alto | 8h | 10 |
| 17 | T-325: Business Cases en DB | 3 | Alto | 8h | 10 |
| 18 | T-121: File storage | 1 | Alto | 12h | 8 |
| 19 | T-310: Scraping real (Puppeteer) | 3 | Alto | 24h | 6 |
| 20 | T-440: LLM integration | 4 | Máximo | 12h | 6 |

---

# MÉTRICAS DE AVANCE

## Progress Dashboard (ejemplo)

```
CAPA 0: ████████░░░░░░░░░░ 33% (11/33 tareas)
  DB:       ████████████████ 100% ✓
  Docker:   ████████░░░░░░░░ 50%
  Variables:████████████░░░░ 66%
  Logging:  ░░░░░░░░░░░░░░░░ 0%
  Security: ████░░░░░░░░░░░░ 16%
  Testing:  ████░░░░░░░░░░░░ 14%
  CI/CD:    ░░░░░░░░░░░░░░░░ 0%

CAPA 1: ░░░░░░░░░░░░░░░░░░ 0%
CAPA 2: ░░░░░░░░░░░░░░░░░░ 0%
CAPA 3: ░░░░░░░░░░░░░░░░░░ 0%
CAPA 4: ░░░░░░░░░░░░░░░░░░ 0%
CAPA 5: ░░░░░░░░░░░░░░░░░░ 0%
CAPA 6: ░░░░░░░░░░░░░░░░░░ 0%
CAPA 7: ░░░░░░░░░░░░░░░░░░ 0%

GLOBAL: ██░░░░░░░░░░░░░░░░ 5%
```

## Definition of Done (cada capa)

```
CAPA COMPLETADA cuando:
  [ ] 100% de tareas cerradas
  [ ] npm run build → 0 errores
  [ ] npm test → 100% verde
  [ ] Coverage mínimo 80%
  [ ] CI/CD pipeline verde
  [ ] Documentación actualizada
  [ ] Sin console.log en producción
  [ ] Sin any en TypeScript (strict mode)
```

---

# RIESGOS DEL ROADMAP

| Riesgo | Capa | Impacto | Mitigación |
|---|---|---|---|
| Prisma schema cambia frecuentemente | 0 | Alto | Migraciones pequeñas y frecuentes, no grandes |
| Auth migration (quitar Supabase) | 1 | Alto | Feature flag: convivir ambos sistemas 1 semana |
| Datos demo se pierden al migrar a DB | 1 | Alto | Script de migración probado 3 veces |
| Scraping real falla por cambios en sitios | 3 | Alto | Circuit breaker + fallback a datos embebidos |
| Embeddings de OpenAI tienen costo alto | 4 | Medio | Usar modelo open-source local (BGE-small) |
| LLM API costs se disparan | 4 | Alto | Límites por tenant, caching, modelo local |
| Workflow engine es más complejo de lo estimado | 5 | Alto | MVP con 3 tipos de step, iterar después |
| Multi-tenant RLS tiene fuga de datos | 6 | Crítico | Tests de seguridad automáticos en CI |
| Mobile app duplica el esfuerzo | 7 | Alto | React Native con Expo, compartir lógica |

---

# CONCLUSIÓN

Este documento reemplaza el enfoque de "construir todo" por un enfoque de "construir en orden".

**En orden significa:**
1. Primero la base (DB, tests, CI/CD, seguridad)
2. Luego el núcleo (auth, clientes, documentos, persistencia)
3. Luego el valor financiero (estados, XBRL, ratios, KPIs)
4. Luego el conocimiento (Knowledge Lake, benchmarks, regulatory)
5. Luego la inteligencia (IA, RAG, LLM, copiloto)
6. Luego la automatización (workflows, notificaciones, triggers)
7. Luego el producto (multi-tenant, billing, marketplace)
8. Luego la escala global (mobile, i18n, K8s, AI agents)

**Cada capa entrega un hito verificable.**
**No se avanza sin hito cumplido.**
**El proyecto se puede pausar después de cualquier capa y el producto es útil.**

---

*Documento generado el 4 de Julio de 2026.*  
*MASTER EXECUTION ROADMAP v1.0*  
*Clasificación: CONFIDENCIAL — Solo para toma de decisiones*
