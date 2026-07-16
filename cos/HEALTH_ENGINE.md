# HEALTH ENGINE

## Panel de operaciones y salud del sistema

Toda plataforma SaaS necesita visibilidad en tiempo real de su estado operativo. Este documento define el sistema de health checks, métricas técnicas y paneles de operaciones.

---

## 1. Health Checks

### Endpoints de health
```
GET /api/v1/health                    ← Health general
GET /api/v1/health/ready              ← Readiness (todo listo para tráfico)
GET /api/v1/health/live               ← Liveness (aplicación viva)
GET /api/v1/health/dependencies       ← Estado de dependencias
```

### Response format
```json
GET /api/v1/health
{
  "status": "healthy",
  "version": "2.1.0",
  "uptime": 345600,
  "timestamp": "2026-06-26T22:30:00Z",
  "checks": {
    "database": { "status": "healthy", "latency": 3 },
    "redis":    { "status": "healthy", "latency": 1 },
    "minio":    { "status": "healthy", "latency": 5 },
    "queue":    { "status": "degraded", "depth": 234, "oldest": 120 },
    "ai_api":   { "status": "healthy", "latency": 340 }
  }
}
```

### Dependencies monitored
```
Dependencia        │ Check                           │ Latency esperada
───────────────────┼─────────────────────────────────┼────────────────
PostgreSQL         │ SELECT 1                        │ < 10ms
Redis              │ PING                            │ < 5ms
MinIO              │ HEAD bucket                     │ < 50ms
RabbitMQ (future)  │ queue.status                    │ < 10ms
OpenAI API         │ models.list (cache)              │ < 500ms
Supabase Auth      │ GET user                        │ < 200ms
```

---

## 2. Métricas técnicas

### 2.1 Rendimiento
```
Métrica                    │ Donde              │ Alerta
───────────────────────────┼────────────────────┼───────────────────────
CPU promedio               │ Servidor           │ > 80% por 5 min
Memoria RAM                │ Servidor           │ > 85%
Conexiones PostgreSQL      │ Base de datos      │ > 150
Latencia p99 endpoints     │ API               │ > 500ms
Requests por minuto        │ API               │ — (crecimiento)
Tasa de error HTTP 5xx     │ API               │ > 1%
Tiempo de respuesta IA     │ AI Orchestrator    │ > 30s
Jobs fallados              │ Bull/Jobs          │ > 5% en 1h
Queue depth                │ Bull/Jobs          │ > 1,000
```

### 2.2 Métricas de IA
```
Métrica                    │ Donde              │ Alerta
───────────────────────────┼────────────────────┼───────────────────────
Costo diario IA            │ AiTrace            │ > $50/día
Costo por consulta         │ AiTrace            │ > $0.50
Tokens por consulta        │ AiTrace            │ > 10,000
Tasa de cache hit          │ AiTrace            │ < 20%
Tasa de fallo              │ AiTrace            │ > 5%
Feedback promedio          │ AiTrace            │ < 3.0
Modelo más usado           │ AiTrace            │ — (optimización)
Tenant más costoso         │ AiTrace            │ — (facturación)
```

### 2.3 Métricas de negocio
```
Métrica                    │ Donde              │ Alerta
───────────────────────────┼────────────────────┼───────────────────────
MRR                        │ Billing            │ — (reporte semanal)
ARR                        │ Billing            │ —
Clientes activos           │ Clients            │ —
Churn mensual              │ Clients            │ > 5%
Utilización consultores    │ Projects           │ < 60% o > 90%
Documentos procesados/día  │ Documents          │ —
Usuarios activos/día       │ Auth               │ —
Tenants activos            │ Company            │ —
```

---

## 3. Dashboard de operaciones

### Ruta: /admin/operaciones

```
┌─────────────────────────────────────────────────────────────┐
│   OPERATIONS DASHBOARD          Última hora: 12:00 - 13:00  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [🟢 Sistema saludable]  99.2% uptime   7d sin incidentes  │
│                                                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ p99 Latency  │ │ Requests/min │ │ Error Rate   │        │
│  │ 245 ms       │ │ 1,234        │ │ 0.3%         │        │
│  │ ▲ 12% vs ayer│ │ ▲ 8% vs ayer │ │ ✅ Normal    │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ DEPENDENCIES                                         │  │
│  │                                                      │  │
│  │ 🟢 PostgreSQL  3.2ms  ▲ 0.5ms                        │  │
│  │ 🟢 Redis       1.1ms  ✓                              │  │
│  │ 🟢 MinIO       8.4ms  ▲ 2.1ms                        │  │
│  │ 🟡 AI API      342ms  ▲ 120ms  (degradado)           │  │
│  │ 🟢 Queue       12 jobs waiting                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ AI Cost Today│ │ AI Calls Today│ │ Cache Hit    │        │
│  │ $23.45       │ │ 342          │ │ 28%          │        │
│  │ Budget: $50  │ │ Avg: $0.07   │ │ Target: >30% │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ TOP CONSUMERS (IA Cost)                              │  │
│  │                                                      │  │
│  │ 1. Consultora XYZ      $8.45   345 consultas        │  │
│  │ 2. Firma ABC           $5.20   210 consultas        │  │
│  │ 3. Grupo Financiero Q  $3.80   156 consultas        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Alertas

### Canales
```
Críticas:   PagerDuty / Opsgenie (teléfono + SMS)
Warning:    Slack / Teams (canal #ops-alerts)
Info:       Email semanal (resumen)
```

### Reglas de alerta
```
Alerta                    │ Severidad │ Condición
──────────────────────────┼───────────┼────────────────────────────
PostgreSQL down           │ CRITICAL  │ Health check falla > 30s
Redis down                │ CRITICAL  │ Health check falla > 30s
p99 > 1s                  │ WARNING   │ Más de 5 minutos
Error rate > 5%           │ CRITICAL  │ Más de 2 minutos
AI API failing > 10%      │ WARNING   │ Más de 5 minutos
Queue depth > 5,000       │ WARNING   │ Persiste > 10 minutos
Costo IA diario > $80     │ WARNING   │ Primera vez del mes
Tenant nuevo > 50/día     │ INFO      │ Escalado
Jobs stuck > 1h           │ WARNING   │ Cualquier job
```
