# SAAS ARCHITECTURE

## Visión general

Consulting OS es una plataforma SaaS multi-tenant para firmas de consultoría financiera. Cada tenant (empresa consultora) opera en un espacio de datos completamente aislado, con su propia configuración, usuarios, clientes y procesos.

---

## 1. Modelo de Multi-Tenancy

### Nivel actual (MVP — Nivel 2)
```
Aislamiento: Base de datos compartida, esquema compartido
            Filtro por companyId en cada consulta
Seguridad:   Middleware + Prisma scope wrappers
Costo:       Bajo (1 base de datos PostgreSQL)
```

### Evolución planeada
```
Nivel 2 (MVP):   DB compartida + companyId filter   ← AHORA
Nivel 3:         DB compartida + RLS (Row-Level Security)
Nivel 4:         Schema por tenant (PostgreSQL schemas)
Nivel 5:         DB por tenant (alto aislamiento, alto costo)
```

### Estrategia de migración
```
companyId filter  →  RLS policies  →  schema-per-tenant  →  db-per-tenant
    (ahora)          (3-6 meses)       (6-12 meses)         (12-18 meses)

Criterio de ascenso:
- Nivel 2→3: Cuando tengamos > 50 tenants activos
- Nivel 3→4: Cuando tengamos > 200 tenants activos
- Nivel 4→5: Cuando tengamos > 1,000 tenants activos
```

---

## 2. Arquitectura de Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                         DNS (Cloudflare)                     │
│                    app.consultingos.com                      │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    LOAD BALANCER                             │
│                 (HAProxy / Nginx / Cloudflare)               │
└────────────────────────┬────────────────────────────────────┘
                         │
            ┌────────────┼────────────┬────────────┐
            ▼            ▼            ▼            ▼
     ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
     │ Next.js  │ │ Next.js  │ │ Next.js  │ │ Next.js  │
     │ Instance │ │ Instance │ │ Instance │ │ Instance │
     │   (web)  │ │   (web)  │ │   (web)  │ │   (web)  │
     └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘
          │            │            │            │
          └────────────┼────────────┼────────────┘
                       │            │
              ┌────────▼────────┐  │
              │   PostgreSQL    │  │
              │   (Primary)     │◄─┤
              │   Supabase      │  │
              └────────┬────────┘  │
                       │           │
              ┌────────▼────────┐  │
              │   PostgreSQL    │  │
              │   (Replica)     │  │
              └─────────────────┘  │
                                    │
                       ┌────────────▼────────────┐
                       │      Redis (Cache)       │
                       │  + Bull Queue (Jobs)    │
                       └─────────────────────────┘
```

### Stack de infraestructura (actual)
```
Servicio          │ Tecnología          │ Puerto
──────────────────┼─────────────────────┼───────
Web App           │ Next.js             │ 3000
Database          │ PostgreSQL 16       │ 5432
Cache / Queue     │ Redis 7             │ 6379
Auth              │ Supabase            │ API
Auth (futuro)     │ Keycloak 26         │ 8080
File Storage      │ MinIO               │ 9000
Search (futuro)   │ Elasticsearch 8     │ 9200
Message Broker    │ RabbitMQ 4          │ 5672
```

---

## 3. Estructura del Monorepo

```
cos/
├── apps/
│   ├── web/                  ← Next.js 14 (App Router)
│   │   ├── src/
│   │   │   ├── app/          ← Rutas, páginas, API routes
│   │   │   ├── components/   ← UI components
│   │   │   ├── lib/          ← Lógica compartida
│   │   │   │   ├── db/       ← Prisma client
│   │   │   │   ├── tenant/   ← Multi-tenancy
│   │   │   │   └── stripe/   ← Payments
│   │   │   ├── hooks/        ← React hooks
│   │   │   ├── types/        ← TypeScript types
│   │   │   └── utils/        ← Utilities
│   │   └── ...
│   ├── api-gateway/          ← (futuro) BFF / API Gateway
│   ├── identity-service/     ← (futuro) NestJS auth service
│   ├── consulting-service/   ← (futuro) NestJS consulting service
│   └── ai-orchestrator/      ← (futuro) Python AI service
│
├── packages/
│   ├── prisma-schema/        ← Prisma schema + migrations
│   ├── shared-types/         ← TypeScript interfaces compartidos
│   ├── ui/                   ← (futuro) Design system components
│   └── eslint-config/        ← ESLint config
│
└── docker-compose.yml        ← Infra services
```

### Estrategia de evolución
```
Fase 1 (MVP):   Monolito Next.js + Prisma directo
                5-10 tenants, < 100 usuarios
                Feature flag para servicios futuros

Fase 2 (Growth): API Gateway + Servicios NestJS
                10-100 tenants, 100-1,000 usuarios
                Servicios: identity, consulting, documents

Fase 3 (Scale):  Microservicios + Eventos
                100-1,000 tenants, 1,000-10,000 usuarios
                AI Orchestrator en Python
```

---

## 4. Escalabilidad

### Estrategia de escalado horizontal

| Componente    | Estrategia                              | Trigger                          |
|---------------|-----------------------------------------|----------------------------------|
| Next.js       | Múltiples instancias + LB               | CPU > 70% o > 100 req/s         |
| PostgreSQL    | Read replicas + connection pooling      | Conexiones > 200                 |
| Redis         | Cluster mode                            | Memoria > 70%                    |
| File Storage  | MinIO distributed mode                  | Storage > 1TB                    |
| Workers       | Bull queue + worker processes           | Backlog > 1,000 tareas           |

### Connection Pooling
```
Aplicación → PgBouncer (transaction mode) → PostgreSQL
                          │
                    Pool: 25 conexiones
                    Max: 100 conexiones
                    Timeout: 30s idle
```

### Caching strategy
```
Nivel 1 (In Memory):   Datos de sesión, config, roles
                        TTL: 5 minutos

Nivel 2 (Redis):        Consultas frecuentes (clientes, KPIs)
                        TTL: 1 minuto
                        Invalidación por evento

Nivel 3 (CDN):          Assets estáticos, imágenes
                        TTL: 1 hora
```

---

## 5. Feature Flags

Control de despliegue para funcionalidades en desarrollo.

```
Sistema de feature flags (base de datos + Redis):

Flag                        │ Default │ Descripción
────────────────────────────┼─────────┼─────────────────────
crm.enabled                 │ false   │ CRM completo
ai.orchestrator.v2          │ false   │ Nuevo orquestador
marketplace.enabled         │ false   │ Marketplace
plugins.enabled             │ false   │ Plugin system
simulation.engine           │ false   │ Simulation engine
knowledge.graph             │ false   │ Knowledge graph
data.lake                   │ false   │ Data lake
```

---

## 6. Observabilidad

```
Sistema                  │ Herramienta         │ Métricas clave
─────────────────────────┼─────────────────────┼────────────────────────
Logs                     │ Loki / ELK          │ Errores, warnings
Métricas                 │ Prometheus          │ CPU, memoria, req/s
Trazas                   │ OpenTelemetry       │ Latencia entre servicios
APM (futuro)             │ Sentry / DataDog    │ Errores de aplicación
Uptime                   │ Better Uptime       │ 99.9% SLA
Alertas                  │ AlertManager        │ Pager por severidad
```

### Logging structure
```
{
  tenant: "company-slug",
  user: "user-id",
  action: "document.upload",
  entity: "client_document",
  entityId: "uuid",
  duration: 1240,           // ms
  status: "success",
  ip: "...",
  userAgent: "...",
  timestamp: "2026-06-26T..."
}
```

---

## 7. Seguridad (resumen)

```
Autenticación:      Supabase Auth → Keycloak (futuro)
Autorización:       RBAC (Role-Based Access Control)
                    Permisos por: rol + workspace + recurso
Multi-tenancy:      companyId filter mandatory
                    RLS (future)
Datos en tránsito:  TLS 1.3 (todas las comunicaciones)
Datos en reposo:    PostgreSQL encryption at rest
                    Secrets en Vault / environment
API Keys:           Rate limiting por tenant
                    Audit logging de todas las operaciones
CORS:               Dominios permitidos configurables
```

---

## 8. Estrategia de deployment

### Ambientes
```
Ambiente    │ URL                              │ Base de datos
────────────┼──────────────────────────────────┼───────────────
Local       │ localhost:3000                   │ Local PostgreSQL
Staging     │ staging.consultingos.com         │ Supabase staging
Production  │ app.consultingos.com             │ Supabase production
```

### CI/CD Pipeline
```
Commit → Tests → Lint → Build → Deploy staging → Tests E2E → Deploy prod
                     │                                              │
                Docker image                                   Blue/Green
```

---

## 9. Gestión de costos SaaS

### Costos estimados por fase
```
Fase        │ Servidores  │ DB      │ Storage  │ Total/mes
────────────┼─────────────┼─────────┼──────────┼──────────
MVP         │ 1 VPS ($20) │ $15     │ $5       │ ~$40
Growth      │ 3 VPS ($60) │ $50     │ $20      │ ~$130
Scale       │ 10+ VPS     │ $200    │ $100     │ ~$500+
```

### Revenue por tenant (target)
```
Plan        │ Precio     │ Clientes meta │ Revenue/tenant/año
────────────┼────────────┼───────────────┼────────────────────
Starter     │ $497/mes   │ 5-10 empleados│ $5,964
Professional│ $1,297/mes │ 10-30 empleados│ $15,564
Enterprise  │ $3,497/mes │ 30-50 empleados│ $41,964
```

### Break-even analysis
```
Costo fijo/mes:    $40 (MVP)
Costo variable:    $1/tenant (storage + compute)
Revenue medio:     $1,297/tenant/mes
Break-even:        1 tenant
Profit @ 10 tenants: ~$12,500/mes
Profit @ 50 tenants: ~$64,000/mes
```
