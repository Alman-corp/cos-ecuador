# MASTER EXECUTION ROADMAP

## PLAN DE IMPLEMENTACIÓN — 8 CAPAS SECUENCIALES

**Versión:** 1.0  
**Clasificación:** CONFIDENCIAL — Solo para equipo de desarrollo  
**Propósito:** Única fuente de verdad para la ejecución del proyecto  
**Dependencia:** MASTER_BLUEPRINT_PARTE_1..4 (documento de arquitectura de referencia)  
**Regla de oro:** Cada capa solo comienza cuando la anterior está 100% terminada

---

## ESTRUCTURA DEL ROADMAP

```
CAPA 0 — Fundación técnica         (3-4 sem) ← ESTAMOS AQUÍ
CAPA 1 — Core Platform             (4-6 sem)
CAPA 2 — Business Platform         (4-5 sem)
CAPA 3 — Knowledge Platform        (3-4 sem)
CAPA 4 — AI Platform               (4-6 sem)
CAPA 5 — Automation Platform       (3-4 sem)
CAPA 6 — Enterprise Platform       (4-5 sem)
CAPA 7 — Global Platform           (6-8 sem)
```

Cada capa produce un **hito verificable**. No se avanza sin hito cumplido.

---

## CONVENCIONES DEL DOCUMENTO

```
[IMP]    = Ya implementado (existe en código, puede necesitar migración)
[PAR]    = Parcialmente implementado (existe esqueleto, falta lógica)
[PEN]    = Pendiente (no existe, hay que construirlo)
[OPT]    = Optimización futura (mejora sobre algo existente)
```

Cada tarea incluye:

```
T-XXX: Nombre de la tarea
  Estado: [IMP/PAR/PEN/OPT]
  Depende de: T-YYY
  Esfuerzo: X horas/días
  Criterio de aceptación: condición medible
  Riesgo: descripción del riesgo
  Archivos afectados: ruta/de/archivos
```

---

# CAPA 0 — FUNDACIÓN TÉCNICA

**Objetivo:** La plataforma puede arrancar desde cero con base de datos real, logging, seguridad, tests y CI/CD.

**Duración:** 3-4 semanas  
**Dependencias:** Ninguna (es la base)  
**Hito:** `make foundation` → plataforma corriendo con DB + tests + CI → verde

---

## 0.1 Base de Datos (PostgreSQL + Prisma)

Actualmente la plataforma usa persistencia JSON en `data/*.json`. Esto debe migrarse a PostgreSQL.

```
T-001: Instalar PostgreSQL + configurar conexión
  Estado: [PEN]
  Depende de: —
  Esfuerzo: 4 horas
  Criterio: psql -c "SELECT 1" desde terminal funciona
  Riesgo: Bajo
  Archivos: .env.local, docker-compose.yml

T-002: Definir Prisma schema completo (~50 modelos)
  Estado: [PEN]
  Depende de: T-001
  Esfuerzo: 40 horas
  Criterio: npx prisma validate → sin errores, todos los modelos de blueprint presentes
  Riesgo: Medio — modelos pueden cambiar durante desarrollo
  Archivos: prisma/schema.prisma

T-003: Generar migración inicial
  Estado: [PEN]
  Depende de: T-002
  Esfuerzo: 4 horas
  Criterio: npx prisma migrate dev → migración aplicada, tablas visibles en psql
  Riesgo: Bajo

T-004: Seed de datos base (industrias, roles, taxonomía IFRS, KPIs)
  Estado: [PEN]
  Depende de: T-003
  Esfuerzo: 16 horas
  Criterio: npx prisma db seed → todos los datos maestros cargados (400+ IFRS, 100+ KPIs, 9 industrias, roles default)
  Riesgo: Medio — volumen alto de datos maestros
  Archivos: prisma/seed.ts

T-005: Migrar persistence.json a PostgreSQL
  Estado: [PEN]
  Depende de: T-003
  Esfuerzo: 24 horas
  Criterio: al arrancar, los datos de memory/plans/cases se cargan desde DB (no JSON)
  Riesgo: Alto — es el cambio más riesgoso de la capa 0
  Archivos: core/persistence/index.ts, core/memory/store.ts, core/planning/engine.ts, core/learning/engine.ts
```

**Definición de terminado (DoD) para Base de Datos:**
- [ ] Prisma schema cubre todos los modelos del dominio
- [ ] Migración inicial aplicada limpia
- [ ] Seed carga todos los datos maestros
- [ ] Datos demo se cargan en DB (POST /api/beta)
- [ ] Consultas Prisma funcionan en API routes
- [ ] npm run build → sin errores

---

## 0.2 Docker

```
T-010: Docker Compose para PostgreSQL + Redis + app
  Estado: [PEN]
  Depende de: T-001
  Esfuerzo: 8 horas
  Criterio: docker compose up → PostgreSQL responde en :5432, app en :3000
  Riesgo: Bajo
  Archivos: docker-compose.yml, Dockerfile

T-011: Perfiles de Docker (dev, test, prod)
  Estado: [PEN]
  Depende de: T-010
  Esfuerzo: 4 horas
  Criterio: docker compose --profile test up → solo levanta DB de test
  Riesgo: Bajo
```

**DoD Docker:**
- [ ] docker compose up -d funciona
- [ ] Hot reload dentro del contenedor
- [ ] Volumen persistente para PostgreSQL
- [ ] Variables de entorno por perfil

---

## 0.3 Variables de Entorno y Configuración

Actualmente las variables están en `.env.local` y hay fallbacks hardcodeados (ej: `TOKEN_SECRET`).

```
T-015: Archivo .env.example con todas las variables documentadas
  Estado: [PEN]
  Depende de: —
  Esfuerzo: 3 horas
  Criterio: .env.example contiene todas las variables requeridas con comentarios
  Riesgo: Bajo
  Archivos: .env.example

T-016: Validación de variables al arrancar (env-var o Zod)
  Estado: [PEN]
  Depende de: T-015
  Esfuerzo: 4 horas
  Criterio: si falta DATABASE_URL → error claro al arrancar, no fallback silencioso
  Riesgo: Bajo
  Archivos: lib/env.ts

T-017: Eliminar fallbacks hardcodeados de seguridad
  Estado: [PEN]
  Depende de: T-016
  Esfuerzo: 2 horas
  Criterio: TOKEN_SECRET sin fallback "a".repeat(32), arroja error si no está definida
  Riesgo: Medio — requiere regenerar tokens existentes
  Archivos: lib/auth/token.ts
```

**DoD Variables:**
- [ ] .env.example completo
- [ ] Error al arrancar si falta variable crítica
- [ ] Sin fallbacks hardcodeados de seguridad
- [ ] Process.env tipado

---

## 0.4 Logging

Actualmente todo usa `console.log`. Necesita logging estructurado.

```
T-020: Instalar Pino + configurar logger
  Estado: [PEN]
  Depende de: —
  Esfuerzo: 4 horas
  Criterio: logger.info("server started", { port: 3000 }) → JSON en stdout
  Riesgo: Bajo
  Archivos: lib/logger.ts

T-021: Reemplazar todos los console.log con logger
  Estado: [PEN]
  Depende de: T-020
  Esfuerzo: 8 horas
  Criterio: grep -r "console.log" src/ → 0 resultados
  Riesgo: Medio — puede haber casos borde
  Archivos: src/**/*.ts (50+ archivos)

T-022: Niveles de log por entorno
  Estado: [PEN]
  Depende de: T-020
  Esfuerzo: 2 horas
  Criterio: dev → debug, prod → info, test → silent
  Riesgo: Bajo
```

**DoD Logging:**
- [ ] Pino instalado y configurado
- [ ] Cero console.log en producción
- [ ] Niveles por entorno
- [ ] Request IDs en cada log de API

---

## 0.5 Seguridad

```
T-025: Rate limiting en APIs
  Estado: [PEN]
  Depende de: —
  Esfuerzo: 8 horas
  Criterio: 100 requests/min → 429 Too Many Requests
  Riesgo: Bajo
  Archivos: middleware.ts, lib/rate-limit.ts

T-026: Cabeceras de seguridad (Helmet)
  Estado: [PEN]
  Depende de: —
  Esfuerzo: 3 horas
  Criterio: curl -I → Content-Security-Policy, X-Frame-Options, etc. presentes
  Riesgo: Bajo
  Archivos: next.config.ts, middleware.ts

T-027: Validación de input con Zod en todas las APIs
  Estado: [PEN] (existen schemas en lib/schemas.ts para dashboard)
  Depende de: —
  Esfuerzo: 16 horas
  Criterio: cada POST/PUT valida body con Zod, errores 400 con mensajes claros
  Riesgo: Medio — 63 endpoints
  Archivos: src/app/api/**/route.ts

T-028: Sanitización de output (escapado XSS)
  Estado: [PEN]
  Depende de: —
  Esfuerzo: 4 horas
  Criterio: <script>alert(1)</script> en input → escapado en output
  Riesgo: Bajo
```

**DoD Seguridad:**
- [ ] Rate limiting activo
- [ ] Cabeceras de seguridad presentes
- [ ] 100% de endpoints POST/PUT validan input
- [ ] Sin XSS vectors conocidos

---

## 0.6 Testing

Actualmente: **cero tests**.

```
T-030: Configurar Vitest + testing library
  Estado: [PEN]
  Depende de: —
  Esfuerzo: 4 horas
  Criterio: npx vitest run → "No tests found, exiting with code 0"
  Riesgo: Bajo
  Archivos: vitest.config.ts

T-031: Tests unitarios para Domain Errors + Result monad
  Estado: [PEN]
  Depende de: T-030
  Esfuerzo: 4 horas
  Criterio: 10+ tests, 100% coverage en core/errors + core/result
  Riesgo: Bajo
  Archivos: core/errors/*.test.ts, core/result/*.test.ts

T-032: Tests unitarios para ConfidenceEngine
  Estado: [PEN]
  Depende de: T-030
  Esfuerzo: 6 horas
  Criterio: 15+ tests cubriendo todos los factores de confianza
  Riesgo: Bajo
  Archivos: core/confidence/index.test.ts

T-033: Tests unitarios para PredictionEngine
  Estado: [PEN]
  Depende de: T-030
  Esfuerzo: 8 horas
  Criterio: 20+ tests (regresión lineal, proyección, escenarios, alertas)
  Riesgo: Medio — algoritmos matemáticos
  Archivos: core/prediction/engine.test.ts

T-034: Tests unitarios para NLUEngine
  Estado: [PEN]
  Depende de: T-030
  Esfuerzo: 6 horas
  Criterio: 15+ tests (12 intents, 7 entities, sentimiento)
  Riesgo: Bajo
  Archivos: core/nlu/index.test.ts

T-035: Tests unitarios para XBRL Parser
  Estado: [PEN]
  Depende de: T-030
  Esfuerzo: 6 horas
  Criterio: 10+ tests con XML de prueba, cubriendo todos los conceptos IFRS
  Riesgo: Medio — parseo de XML
  Archivos: core/xbrl/index.test.ts

T-036: Tests unitarios para PlanningEngine
  Estado: [PEN]
  Depende de: T-030
  Esfuerzo: 8 horas
  Criterio: 15+ tests (generación, fases, KPIs, presupuesto)
  Riesgo: Medio
  Archivos: core/planning/engine.test.ts

T-037: Tests unitarios para ExecutionEngine
  Estado: [PEN]
  Depende de: T-030
  Esfuerzo: 6 horas
  Criterio: 10+ tests (snapshots, desviaciones, correcciones)
  Riesgo: Medio
  Archivos: core/execution/engine.test.ts

T-038: Tests unitarios para ScrapingService
  Estado: [PEN]
  Depende de: T-030
  Esfuerzo: 4 horas
  Criterio: 8+ tests (SRI, Supercias, benchmarks, caché)
  Riesgo: Bajo
  Archivos: core/scraping/index.test.ts

T-039: Tests unitarios para NotificationService
  Estado: [PEN]
  Depende de: T-030
  Esfuerzo: 4 horas
  Criterio: 8+ tests (templates, canales, markRead)
  Riesgo: Bajo
  Archivos: core/notifications/index.test.ts

T-040: Tests unitarios para GenomeEngine
  Estado: [PEN]
  Depende de: T-030
  Esfuerzo: 6 horas
  Criterio: 10+ tests (14 dimensiones, scores, fortalezas)
  Riesgo: Medio
  Archivos: core/genome/engine.test.ts

T-041: Tests unitarios para EnhancedPrediction
  Estado: [PEN]
  Depende de: T-030
  Esfuerzo: 8 horas
  Criterio: 15+ tests (ARIMA, seasonal, anomalías, descomposición)
  Riesgo: Medio — algoritmos estadísticos
  Archivos: core/prediction/enhanced.test.ts

T-042: Tests de integración para APIs core
  Estado: [PEN]
  Depende de: T-030, T-001
  Esfuerzo: 20 horas
  Criterio: 30+ tests que ejercitan endpoints con DB real de test
  Riesgo: Alto — requiere DB de test
  Archivos: tests/api/*.test.ts

T-043: Configurar coverage mínimo (80%)
  Estado: [PEN]
  Depende de: T-030
  Esfuerzo: 2 horas
  Criterio: npx vitest --coverage → >80% en core/
  Riesgo: Bajo
```

**DoD Testing:**
- [ ] Vitest configurado
- [ ] 170+ tests unitarios (20 archivos × ~8 tests c/u)
- [ ] 30+ tests de integración de APIs
- [ ] Coverage >80% en core/
- [ ] npm test → verde

---

## 0.7 CI/CD

```
T-045: GitHub Actions — lint + typecheck + test en PR
  Estado: [PEN]
  Depende de: T-030
  Esfuerzo: 8 horas
  Criterio: al abrir PR → lint, tsc, vitest se ejecutan automáticamente
  Riesgo: Bajo
  Archivos: .github/workflows/ci.yml

T-046: GitHub Actions — build + deploy a staging
  Estado: [PEN]
  Depende de: T-045, T-010
  Esfuerzo: 8 horas
  Criterio: al merge a main → build + deploy a staging automático
  Riesgo: Medio — requiere servidor staging
  Archivos: .github/workflows/deploy.yml
```

**DoD CI/CD:**
- [ ] CI corre en cada PR (<5 min)
- [ ] Deploy a staging automático
- [ ] Notificaciones de fallo

---

## 📊 PROGRESO CAPA 0

| Área | Tareas | Progreso |
|---|---|---|
| Base de Datos | 5 | 0% |
| Docker | 2 | 0% |
| Variables | 3 | 0% |
| Logging | 3 | 0% |
| Seguridad | 4 | 0% |
| Testing | 14 | 0% |
| CI/CD | 2 | 0% |
| **Total** | **33** | **0%** |

**Definición de "CAPA 0 TERMINADA":**
- [ ] Prisma schema + migraciones + seed
- [ ] Docker compose funcional
- [ ] Logging estructurado activo
- [ ] Rate limiting + seguridad
- [ ] 170+ tests unitarios verdes
- [ ] CI/CD en GitHub Actions
- [ ] npm run build → 0 errores
- [ ] npm test → 0 fallos

---

# CAPA 1 — CORE PLATFORM

**Objetivo:** Plataforma empresarial funcional con identidad, clientes, documentos, persistencia real y workflows.

**Duración:** 4-6 semanas  
**Depende de:** Capa 0 terminada  
**Hito:** Un usuario puede registrarse, crear cliente, subir documento, y el sistema persiste todo en DB

---

## 1.1 Identity — Auth Real (reemplazar Supabase)

Actualmente la autenticación usa Supabase SSR con middleware. Para producción independiente, se necesita auth propio.

```
T-100: Modelos de identidad en Prisma (User, Role, Permission, Session)
  Estado: [IMP] en esquema conceptual, [PEN] en DB
  Depende de: T-002
  Esfuerzo: 8 horas
  Criterio: modelo User con email, passwordHash, roleId, companyId, isActive, lastLoginAt
  Riesgo: Medio — migración de datos de Supabase
  Archivos: prisma/schema.prisma

T-101: Hash de contraseñas (bcrypt/argon2)
  Estado: [PEN]
  Depende de: T-100
  Esfuerzo: 4 horas
  Criterio: password almacenada como hash bcrypt, nunca texto plano
  Riesgo: Bajo
  Archivos: lib/auth/password.ts

T-102: Registro + Login + Logout endpoints reales
  Estado: [PAR] existen routes pero usan Supabase
  Depende de: T-101
  Esfuerzo: 16 horas
  Criterio: POST /api/auth/register → crea usuario + empresa en DB. POST /api/auth/login → devuelve JWT. POST /api/auth/logout → invalida sesión
  Riesgo: Alto — cambiar auth en producción es delicado
  Archivos: app/api/auth/*/route.ts, lib/auth/token.ts

T-103: JWT con refresh token
  Estado: [PEN]
  Depende de: T-102
  Esfuerzo: 8 horas
  Criterio: access token 15min, refresh token 7d, refresh endpoint funciona
  Riesgo: Medio
  Archivos: lib/auth/jwt.ts

T-104: Roles y permisos en DB (no en memoria)
  Estado: [PAR] roles existen como API
  Depende de: T-100
  Esfuerzo: 12 horas
  Criterio: policies.ts consultan DB para verificar permisos
  Riesgo: Medio
  Archivos: core/policies/*.ts, api/identity/roles/*.ts

T-105: Middleware de autenticación con JWT
  Estado: [PAR] middleware.ts existe con Supabase
  Depende de: T-103
  Esfuerzo: 8 horas
  Criterio: request sin token → 401, token expirado → 401, token válido → pasa
  Riesgo: Alto — middleware es crítico
  Archivos: middleware.ts
```

**DoD Identity:**
- [ ] Registro + Login + Logout funcionales
- [ ] JWT con refresh token
- [ ] Roles en DB
- [ ] Middleware valida JWT
- [ ] Policies consultan DB
- [ ] Sin dependencia de Supabase Auth

---

## 1.2 Companies (Multi-tenant)

```
T-110: Modelo Company en Prisma
  Estado: [IMP] existe en repositorios
  Depende de: T-002
  Esfuerzo: 4 horas
  Criterio: Company con id, name, taxId, industry, size, subscriptionTier, isActive
  Riesgo: Bajo
  Archivos: prisma/schema.prisma

T-111: Company CRUD endpoints reales (no mock)
  Estado: [PAR] existe registro
  Depende de: T-110
  Esfuerzo: 8 horas
  Criterio: GET/POST/PUT/DELETE /api/companies funcionan contra DB
  Riesgo: Bajo
  Archivos: app/api/companies/route.ts

T-112: Resolución de tenant por subdominio
  Estado: [PEN]
  Depende de: T-111
  Esfuerzo: 12 horas
  Criterio: empresa1.localhost:3000 → companyId = "empresa1"
  Riesgo: Medio — DNS + proxy
  Archivos: middleware.ts, lib/tenant/resolver.ts
```

---

## 1.3 Clientes (CRM)

```
T-115: Modelo Client en Prisma (con campos ecuatorianos)
  Estado: [IMP] existe en repositorios
  Depende de: T-002
  Esfuerzo: 4 horas
  Criterio: Client con ruc, businessName, industry, segment, status, healthScore
  Riesgo: Bajo

T-116: Client CRUD contra DB (reemplazar mock/listas en memoria)
  Estado: [PAR] endpoints existen
  Depende de: T-115, T-005
  Esfuerzo: 16 horas
  Criterio: GET /api/clients → lista de DB, POST → guarda en DB, etc.
  Riesgo: Medio — migración de datos demo
  Archivos: app/api/clients/**/route.ts

T-117: Onboarding flow (registro → carga docs → análisis → plan)
  Estado: [IMP] existe route
  Depende de: T-116
  Esfuerzo: 8 horas
  Criterio: onboarding completo persiste en DB con estado tracking
  Riesgo: Medio
```

---

## 1.4 Documentos

```
T-120: Modelo Document en Prisma
  Estado: [IMP] existe en repositorios
  Depende de: T-002
  Esfuerzo: 2 horas
  Criterio: Document con fileName, fileType, fileUrl, clientId, companyId, uploadedBy
  Riesgo: Bajo

T-121: File storage (S3/MinIO/local)
  Estado: [PEN]
  Depende de: T-120
  Esfuerzo: 12 horas
  Criterio: upload → archivo en storage, download → stream desde storage
  Riesgo: Medio
  Archivos: lib/storage/*.ts

T-122: Document CRUD endpoints reales
  Estado: [PAR] endpoints existen
  Depende de: T-121
  Esfuerzo: 12 horas
  Criterio: subida, listado, descarga, eliminación funcionales
  Riesgo: Medio
  Archivos: app/api/documents/route.ts
```

---

## 1.5 Persistencia Real

```
T-125: Migrar MemoryStore de JSON a PostgreSQL
  Estado: [PEN]
  Depende de: T-005, T-002
  Esfuerzo: 16 horas
  Criterio: MemoryEntry[] se guarda en tabla memory_entries, getAll/restoreAll usan DB
  Riesgo: Alto — memory es usado por todos los engines
  Archivos: core/memory/store.ts

T-126: Migrar BusinessPlan de JSON a PostgreSQL
  Estado: [PEN]
  Depende de: T-005, T-002
  Esfuerzo: 12 horas
  Criterio: BusinessPlan[] se guarda en tabla plans con phases como JSONB
  Riesgo: Medio
  Archivos: core/planning/engine.ts

T-127: Migrar BusinessCase de JSON a PostgreSQL
  Estado: [PEN]
  Depende de: T-005, T-002
  Esfuerzo: 8 horas
  Criterio: BusinessCase[] se guarda en tabla business_cases
  Riesgo: Medio
  Archivos: core/learning/engine.ts

T-128: Auditoría (tabla audit_log con quien/cuándo/qué cambió)
  Estado: [PEN]
  Depende de: T-002
  Esfuerzo: 12 horas
  Criterio: cada modificación importante registra audit log
  Riesgo: Bajo
  Archivos: lib/audit.ts
```

---

## 1.6 Workflow Engine (Base)

Actualmente los workflows existen como proxy a un orquestador externo. Para la capa 1 se construye un workflow engine mínimo.

```
T-130: Modelos Workflow en Prisma (WorkflowDefinition, WorkflowInstance, WorkflowStep)
  Estado: [PEN]
  Depende de: T-002
  Esfuerzo: 8 horas
  Criterio: schema con definiciones + instancias + steps
  Riesgo: Medio

T-131: Workflow engine básico (definir, instanciar, ejecutar paso a paso)
  Estado: [PEN]
  Depende de: T-130
  Esfuerzo: 24 horas
  Criterio: definir workflow → crear instancia → ejecutar paso 1 → avanzar al paso 2
  Riesgo: Alto — es lógica nueva, compleja
  Archivos: core/workflow/engine.ts

T-132: Reemplazar proxy de /api/workflows con engine real
  Estado: [PEN]
  Depende de: T-131
  Esfuerzo: 8 horas
  Criterio: POST /api/workflows → ejecuta workflow real
  Riesgo: Medio
```

---

## 1.7 Portales con Auth Real

```
T-135: Portal Cliente con autenticación JWT
  Estado: [PAR] existe UI, auth es Supabase
  Depende de: T-105
  Esfuerzo: 8 horas
  Criterio: login JWT → dashboard cliente con datos reales de DB
  Riesgo: Medio

T-136: Portal Consultor con autenticación JWT
  Estado: [PAR] existe UI, auth es Supabase
  Depende de: T-105
  Esfuerzo: 8 horas
  Criterio: login JWT → dashboard consultor con datos reales
  Riesgo: Medio

T-137: Portal Director con autenticación JWT
  Estado: [PAR] existe UI, auth es Supabase
  Depende de: T-105
  Esfuerzo: 8 horas
  Criterio: login JWT → dashboard director con datos reales
  Riesgo: Medio

T-138: Beta Welcome con seed en DB real
  Estado: [PAR] existe en memória
  Depende de: T-004
  Esfuerzo: 4 horas
  Criterio: POST /api/beta → seed en DB + muestra stats desde DB
  Riesgo: Bajo
  Archivos: core/beta/seed.ts
```

---

## 📊 PROGRESO CAPA 1

| Área | Tareas | Esfuerzo |
|---|---|---|
| Identity | 6 | 56h |
| Companies | 3 | 24h |
| Clientes | 3 | 28h |
| Documentos | 3 | 26h |
| Persistencia | 4 | 48h |
| Workflow Engine | 3 | 40h |
| Portales | 4 | 28h |
| **Total** | **26** | **250h (~6 sem)** |

**Definición de "CAPA 1 TERMINADA":**
- [ ] Auth propia sin Supabase
- [ ] CRUD de clientes en DB
- [ ] Documentos con file storage
- [ ] Persistencia real (no JSON)
- [ ] Workflow engine mínimo funcional
- [ ] 3 portales con auth real
- [ ] Auditoría operativa
- [ ] npm test → verde

---

# CAPA 2 — BUSINESS PLATFORM

**Objetivo:** Core financiero funcional — estados financieros, XBRL, ratios, KPIs, IFRS, cash flow.

**Duración:** 4-5 semanas  
**Depende de:** Capa 1 terminada  
**Hito:** Un cliente puede subir estados financieros (manual o XBRL) y recibir análisis completo con ratios, KPIs y diagnóstico

---

## 2.1 Estados Financieros

```
T-200: Modelo FinancialStatement en Prisma
  Estado: [IMP] existe en repositorios
  Depende de: T-002
  Esfuerzo: 4 horas
  Criterio: FinancialStatement con periodStart, periodEnd, type, currency, lineItems (JSONB)
  Riesgo: Bajo

T-201: Financial Statement CRUD real contra DB
  Estado: [PAR] endpoints existen, con datos mock
  Depende de: T-200
  Esfuerzo: 12 horas
  Criterio: GET/POST /api/financial-statements → DB real
  Riesgo: Medio
  Archivos: app/api/financial-statements/**/route.ts

T-202: Líneas de estado financiero (concepto, valor, tipo)
  Estado: [PEN]
  Depende de: T-200
  Esfuerzo: 8 horas
  Criterio: cada estado financiero contiene N líneas (activo, pasivo, ingreso, gasto)
  Riesgo: Bajo
```

---

## 2.2 XBRL Parser

```
T-205: Conectar XBRL parser a DB
  Estado: [IMP] parser existe, guarda en memoria
  Depende de: T-201
  Esfuerzo: 8 horas
  Criterio: POST /api/xbrl → parsea XML → guarda en DB → ratios calculados almacenados
  Riesgo: Medio
  Archivos: core/xbrl/index.ts, app/api/xbrl/route.ts

T-206: Ampliar mapeo IFRS (de 30 a 100+ conceptos)
  Estado: [IMP] 30 mapeados
  Depende de: —
  Esfuerzo: 16 horas
  Criterio: 100+ conceptos XBRL mapeados a IFRS IDs
  Riesgo: Medio — requiere investigación de taxonomías XBRL
  Archivos: core/xbrl/index.ts

T-207: Validación de balance (activos = pasivos + patrimonio)
  Estado: [PEN]
  Depende de: T-205
  Esfuerzo: 4 horas
  Criterio: error claro si activos ≠ pasivos + patrimonio
  Riesgo: Bajo
```

---

## 2.3 Ratios + KPIs

```
T-210: Conectar cálculo de ratios a DB
  Estado: [IMP] ratios se calculan en memoria
  Depende de: T-201
  Esfuerzo: 8 horas
  Criterio: al subir estado financiero → 12 ratios calculados y almacenados
  Riesgo: Bajo
  Archivos: core/xbrl/index.ts (getFinancialRatiosFromXBRL)

T-211: 100+ KPIs desde Knowledge Lake a DB
  Estado: [IMP] KPIs existen en conocimiento
  Depende de: T-002
  Esfuerzo: 12 horas
  Criterio: tabla kpi_definitions con 100+ registros (nombre, fórmula, unidad, benchmark)
  Riesgo: Medio
  Archivos: prisma/seed.ts

T-212: Evaluación automática de KPIs contra benchmarks
  Estado: [PAR] existe en consulting-dna
  Depende de: T-211
  Esfuerzo: 12 horas
  Criterio: POST /api/knowledge → evalúa KPIs contra benchmarks → percentil + diagnóstico
  Riesgo: Medio
  Archivos: core/knowledge/kpis/index.ts
```

---

## 2.4 IFRS

```
T-215: Taxonomía IFRS completa en DB (400+ conceptos)
  Estado: [IMP] existe en código
  Depende de: T-002
  Esfuerzo: 8 horas
  Criterio: tabla ifrs_concepts con 400+ registros (id, label, category, type, level)
  Riesgo: Bajo
  Archivos: prisma/seed.ts, core/knowledge/ifrs/taxonomy.ts

T-216: Validador IFRS con DB (no en memoria)
  Estado: [IMP] existe en código
  Depende de: T-215
  Esfuerzo: 8 horas
  Criterio: validador consulta DB, no constantes en memoria
  Riesgo: Bajo
  Archivos: core/knowledge/ifrs/validator.ts
```

---

## 2.5 Cash Flow

```
T-220: Cash flow forecast con datos reales
  Estado: [IMP] existe en predictionEngine
  Depende de: T-201
  Esfuerzo: 8 horas
  Criterio: forecast usa datos de DB, no parámetros mock
  Riesgo: Bajo
  Archivos: core/prediction/engine.ts

T-221: Proyección de balance + P&L
  Estado: [PEN]
  Depende de: T-220
  Esfuerzo: 16 horas
  Criterio: proyección de balance mensual a 12 meses con P&L integrado
  Riesgo: Alto — modelo financiero complejo
```

---

## 2.6 Dashboard Financiero (datos reales)

```
T-225: Dashboard financiero con datos de DB
  Estado: [PAR] dashboard existe con datos mock
  Depende de: T-210
  Esfuerzo: 16 horas
  Criterio: gráficos de ratios, KPIs, tendencias usan datos reales
  Riesgo: Medio
  Archivos: consultor/dashboard/page.tsx, api/dashboard/[tenantId]/route.ts

T-226: Ratios API contra DB
  Estado: [PAR] existe con mock
  Depende de: T-210
  Esfuerzo: 4 horas
  Criterio: GET /api/ratios/[tenantId] → ratios de DB
  Riesgo: Bajo
  Archivos: api/ratios/[tenantId]/route.ts

T-227: Margins API contra DB
  Estado: [PAR] existe con mock
  Depende de: T-210
  Esfuerzo: 4 horas
  Criterio: GET /api/margins/[tenantId] → márgenes de DB
  Riesgo: Bajo
  Archivos: api/margins/[tenantId]/route.ts
```

---

## 📊 PROGRESO CAPA 2

| Área | Tareas | Esfuerzo |
|---|---|---|
| Estados Financieros | 3 | 24h |
| XBRL | 3 | 28h |
| Ratios + KPIs | 3 | 32h |
| IFRS | 2 | 16h |
| Cash Flow | 2 | 24h |
| Dashboard Financiero | 3 | 24h |
| **Total** | **16** | **148h (~4 sem)** |

**Definición de "CAPA 2 TERMINADA":**
- [ ] Estados financieros en DB
- [ ] XBRL parsea y almacena en DB
- [ ] 12 ratios calculados automáticamente
- [ ] 100+ KPIs en DB con benchmarks
- [ ] IFRS taxonomy en DB
- [ ] Cash flow forecast con datos reales
- [ ] Dashboard financiero con datos reales

---

# CAPA 3 — KNOWLEDGE PLATFORM

**Objetivo:** El activo de conocimiento más valioso de la plataforma — Knowledge Lake completo, ontología, DNA, benchmarks, regulatory, business cases, genoma.

**Duración:** 3-4 semanas  
**Depende de:** Capa 2 terminada  
**Hito:** El sistema puede responder cualquier consulta de conocimiento financiero/regulatorio con datos actualizados

---

## 3.1 Knowledge Lake en DB

```
T-300: Migrar KnowledgeService a DB
  Estado: [IMP] existe en memoria
  Depende de: T-002
  Esfuerzo: 16 horas
  Criterio: GET /api/knowledge → consulta DB, no constantes en memoria
  Riesgo: Medio — es el corazón del conocimiento
  Archivos: core/knowledge/index.ts

T-301: API de consulta unificada de conocimiento
  Estado: [IMP] existe con múltiples modos (summary, kpi, ifrs, benchmark)
  Depende de: T-300
  Esfuerzo: 8 horas
  Criterio: POST /api/knowledge → query unificada que cruza IFRS + KPIs + Benchmarks
  Riesgo: Medio
```

---

## 3.2 Knowledge Graph + Ontología

```
T-305: Ontología empresarial en DB
  Estado: [IMP] existe en memoria
  Depende de: T-002
  Esfuerzo: 8 horas
  Criterio: tabla ontology con (sourceNode, relation, targetNode, properties)
  Riesgo: Bajo
  Archivos: core/knowledge/graph/index.ts

T-306: Graph query engine
  Estado: [PEN]
  Depende de: T-305
  Esfuerzo: 16 horas
  Criterio: "dame todas las empresas del sector construcción con ROE > 15%" → SQL recursivo
  Riesgo: Medio — queries recursivos en PostgreSQL
```

---

## 3.3 Benchmarks Reales

Actualmente los benchmarks son datos embebidos. Para la capa 3 se conectan a fuentes reales.

```
T-310: Web scraping real con Puppeteer/Playwright
  Estado: [PAR] existe scrapingService simulado
  Depende de: —
  Esfuerzo: 24 horas
  Criterio: scrapeSupercias() descarga datos reales de supercias.gob.ec
  Riesgo: Alto — sitios web pueden cambiar, bloqueos, CAPTCHA
  Archivos: core/scraping/index.ts

T-311: Pipeline de actualización periódica de benchmarks
  Estado: [PEN]
  Depende de: T-310
  Esfuerzo: 12 horas
  Criterio: cron semanal actualiza benchmarks desde Supercias
  Riesgo: Medio

T-312: Ampliar a 20+ industrias
  Estado: [IMP] 9 industrias
  Depende de: T-310
  Esfuerzo: 8 horas
  Criterio: 20 industrias con benchmarks reales
  Riesgo: Bajo
```

---

## 3.4 SRI Real

```
T-315: Web scraping real de SRI
  Estado: [PAR] existe simulado
  Depende de: —
  Esfuerzo: 16 horas
  Criterio: scrapeSRI() descarga tasas impositivas reales desde sri.gob.ec
  Riesgo: Alto — SRI puede cambiar estructura del sitio
  Archivos: core/scraping/index.ts

T-316: Calculadora de impuestos real
  Estado: [PAR] existe taxCalculationService
  Depende de: T-315
  Esfuerzo: 12 horas
  Criterio: calcula impuesto a la renta + IVA + patente con tasas actualizadas
  Riesgo: Medio
```

---

## 3.5 Regulatory Platform

Actualmente `core/knowledge/regulatory/` está vacío.

```
T-320: Modelo Regulatory en Prisma (normas, artículos, sanciones)
  Estado: [PEN]
  Depende de: T-002
  Esfuerzo: 8 horas
  Criterio: tabla regulatory_norms con jurisdicción, categoría, texto, vigencia
  Riesgo: Medio

T-321: Módulo regulatorio ecuatoriano (Ley de Compañías, Código Tributario, NIFF)
  Estado: [PEN]
  Depende de: T-320
  Esfuerzo: 24 horas
  Criterio: 50+ normas cargadas con búsqueda por palabra clave
  Riesgo: Alto — requiere investigación legal
```

---

## 3.6 Business Cases + Genome

```
T-325: Business Case Library con DB
  Estado: [IMP] existe en memoria
  Depende de: T-002
  Esfuerzo: 8 horas
  Criterio: casos se guardan en DB, búsqueda semántica desde DB
  Riesgo: Bajo
  Archivos: core/learning/engine.ts

T-326: Enterprise Genome con DB
  Estado: [PAR] existe en memoria
  Depende de: T-002
  Esfuerzo: 8 horas
  Criterio: genomas se guardan en DB, histórico de análisis
  Riesgo: Bajo
  Archivos: core/genome/engine.ts
```

---

## 3.7 Consulting DNA desde DB

```
T-330: DNA rules en DB (no en código)
  Estado: [IMP] existe en consulting-dna/index.ts
  Depende de: T-002
  Esfuerzo: 12 horas
  Criterio: reglas, thresholds, patrones se cargan desde DB
  Riesgo: Medio — DNA es crítico para diagnósticos
  Archivos: core/consulting-dna/index.ts

T-331: Editor de DNA desde UI
  Estado: [PAR] existe ADN page
  Depende de: T-330
  Esfuerzo: 8 horas
  Criterio: Director puede editar reglas DNA desde UI y se guardan en DB
  Riesgo: Bajo
  Archivos: director/adn/page.tsx
```

---

## 📊 PROGRESO CAPA 3

| Área | Tareas | Esfuerzo |
|---|---|---|
| Knowledge Lake | 2 | 24h |
| Knowledge Graph | 2 | 24h |
| Benchmarks reales | 3 | 44h |
| SRI real | 2 | 28h |
| Regulatory | 2 | 32h |
| Business Cases + Genome | 2 | 16h |
| Consulting DNA | 2 | 20h |
| **Total** | **15** | **188h (~4 sem)** |

**Definición de "CAPA 3 TERMINADA":**
- [ ] Knowledge Lake en DB
- [ ] Benchmarks reales desde Supercias
- [ ] SRI real desde sri.gob.ec
- [ ] Regulatory con 50+ normas
- [ ] Business Cases + Genoma en DB
- [ ] DNA configurable desde UI
- [ ] Knowledge Graph consultable

---

## RESUMEN DE ESFUERZO TOTAL (CAPAS 0-3)

| Capa | Tareas | Horas | Semanas |
|---|---|---|---|
| Capa 0 — Fundación | 33 | ~160h | 4 |
| Capa 1 — Core Platform | 26 | ~250h | 6 |
| Capa 2 — Business Platform | 16 | ~148h | 4 |
| Capa 3 — Knowledge Platform | 15 | ~188h | 4 |
| **Total Capas 0-3** | **90** | **~746h** | **~18 sem** |

*Nota: asumiendo 1 desarrollador full-time (40h/sem). Con 2 desarrolladores: ~9 semanas.*
