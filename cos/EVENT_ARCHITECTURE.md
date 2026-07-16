# EVENT ARCHITECTURE

## Sistema basado en eventos

Consulting OS utiliza una arquitectura orientada a eventos (Event-Driven Architecture) para desacoplar servicios, permitir procesamiento asíncrono y crear un sistema reactivo donde cada acción relevante propaga cambios a través de toda la plataforma.

---

## 1. Principios

```
1. Todo cambio de estado significativo es un evento
2. Los eventos son inmutables (registro de auditoría)
3. Un evento puede tener N consumidores
4. Los consumidores son independientes entre sí
5. El productor no conoce a los consumidores
6. Los eventos se persisten para replay
7. Los eventos tienen un schema versionado
```

---

## 2. Event Bus central

```
                    ┌───────────────────┐
                    │   EVENT BUS       │
                    │   (RabbitMQ)      │
                    └────────┬──────────┘
                             │
           ┌─────────────────┼──────────────────┐
           │                 │                   │
           ▼                 ▼                   ▼
    ┌────────────┐   ┌────────────┐   ┌────────────────┐
    │ Exchange   │   │ Exchange   │   │ Exchange       │
    │ domain.*   │   │ system.*   │   │ tenant.{id}.*  │
    └─────┬──────┘   └─────┬──────┘   └───────┬────────┘
          │                │                   │
          ▼                ▼                   ▼
    ┌────────────┐   ┌────────────┐   ┌────────────────┐
    │ Queue      │   │ Queue      │   │ Queue          │
    │ document.* │   │ audit.*    │   │ notification.* │
    │ workflow.* │   │ metrics.*  │   │ knowledge.*    │
    │ client.*   │   │            │   │                │
    └────────────┘   └────────────┘   └────────────────┘
```

---

## 3. Catálogo de eventos

### 3.1 Eventos de dominio (domain.*)

```
DOCUMENTOS
──────────
document.uploaded         { tenantId, clientId, documentId, fileName, fileSize, type }
document.processed        { tenantId, documentId, status, data, confidence }
document.classified       { tenantId, documentId, category, period, confidence }
document.validation.failed { tenantId, documentId, errors[] }
document.deleted          { tenantId, documentId }

CLIENTES
────────
client.created            { tenantId, clientId, name, industry, segment }
client.updated            { tenantId, clientId, changes{} }
client.status.changed     { tenantId, clientId, from, to, reason }
client.risk.updated       { tenantId, clientId, score, factors[] }
client.contract.expiring  { tenantId, clientId, contractId, daysLeft }

CRM
───
lead.created              { tenantId, leadId, source, score }
lead.status.changed       { tenantId, leadId, from, to }
opportunity.created       { tenantId, opportunityId, value, probability }
opportunity.won           { tenantId, opportunityId, value }
opportunity.lost          { tenantId, opportunityId, reason }
contract.signed           { tenantId, clientId, contractId, plan }

PROYECTOS
─────────
project.created           { tenantId, clientId, projectId, type }
project.status.changed    { tenantId, projectId, from, to }
task.completed            { tenantId, projectId, taskId }
milestone.reached         { tenantId, projectId, milestoneId }
risk.detected             { tenantId, projectId, riskId, severity }

WORKFLOWS
─────────
workflow.started          { tenantId, instanceId, definitionId, clientId }
workflow.step.completed   { tenantId, instanceId, stepKey, result }
workflow.completed        { tenantId, instanceId }
workflow.failed           { tenantId, instanceId, error }

FINANZAS
────────
financial.statement.added     { tenantId, clientId, statementId, period }
financial.ratio.alert         { tenantId, clientId, ratio, value, threshold }
financial.forecast.generated  { tenantId, clientId, forecastId }
financial.anomaly.detected    { tenantId, clientId, statementId, anomaly{} }

IA
──
ai.analysis.started       { tenantId, clientId, sessionId, agent }
ai.analysis.completed     { tenantId, clientId, sessionId, agent, tokens, cost }
ai.analysis.failed        { tenantId, clientId, sessionId, agent, error }
ai.recommendation.generated { tenantId, clientId, recommendationId }
ai.cost.threshold.exceeded   { tenantId, month, current, limit }

NOTIFICACIONES
──────────────
notification.sent         { tenantId, userId, channel, type, status }
notification.bounced      { tenantId, userId, channel, error }

KNOWLEDGE
─────────
knowledge.node.created    { tenantId, nodeId, type, source }
knowledge.relation.created { tenantId, fromId, toId, relationType }
knowledge.recommendation  { tenantId, clientId, similarCases[] }

SEGURIDAD
─────────
user.login                { tenantId, userId, ip, userAgent }
user.login.failed         { tenantId, email, ip, reason }
user.role.changed         { tenantId, userId, oldRole, newRole }
permission.denied         { tenantId, userId, resource, action }
```

### 3.2 Eventos de sistema (system.*)
```
system.metrics.report     { cpu, memory, connections, queueDepth }
system.error.logged       { service, error, stack, context }
system.tenant.created     { tenantId }
system.tenant.suspended   { tenantId, reason }
system.backup.completed   { type, size, duration }
```

---

## 4. Consumidores de eventos

Cada suscriptor escucha eventos y ejecuta acciones.

```
SUSCRIPTOR           │ ESCUCHA                          │ ACCIÓN
─────────────────────┼──────────────────────────────────┼──────────────────────────
Workflow Engine      │ document.*, client.*             │ Avanzar workflow
Notification Service│ workflow.*, document.*, risk.*   │ Enviar notificación
Dashboard Updater   │ client.*, financial.*, ai.*      │ Refrescar dashboard
Knowledge Indexer   │ document.processed, project.*    │ Indexar en KG
Audit Logger        │ * (todos)                        │ Persistir audit log
AI Cost Tracker     │ ai.*                             │ Registrar costo
Metrics Collector   │ system.*, ai.cost.*             │ Actualizar métricas
Email Service       │ notification.sent                │ Enviar email
Webhook Dispatcher  │ client.*, workflow.*             │ Llamar webhooks externos
```

---

## 5. Formato de evento

```json
{
  "id": "evt_01J2X...",
  "type": "document.uploaded",
  "version": 1,
  "source": "web-app",
  "tenantId": "company-uuid",
  "userId": "user-uuid",
  "timestamp": "2026-06-26T22:30:00Z",
  "correlationId": "corr_01J2X...",
  "causationId": "evt_01J2W...",
  "data": {
    "clientId": "client-uuid",
    "documentId": "doc-uuid",
    "fileName": "balance_2026_Q2.pdf",
    "fileSize": 2458000,
    "type": "financial_statement"
  },
  "metadata": {
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0..."
  }
}
```

---

## 6. Manejo de errores

```
Dead Letter Queue (DLQ):
┌─────────────────────────────────────────────────────────────┐
│ DQL — Eventos que fallaron después de N reintentos          │
│                                                             │
│ Cada evento en DLQ tiene:                                   │
│   - Evento original completo                                │
│   - Error (mensaje + stack)                                │
│   - Número de reintentos                                   │
│   - Timestamp del primer fallo                             │
│                                                             │
│ Estrategias:                                                │
│   - Reintentar con backoff exponencial (3, 9, 27s)        │
│   - Máximo 3 reintentos                                    │
│   - DLQ → alerta al equipo técnico                         │
│   - Replay manual desde DLQ                                │
└─────────────────────────────────────────────────────────────┘

Estrategia por tipo de error:
├── Transitorio (timeout, conexión): reintentar 3 veces
├── Permanente (validación, schema): DLQ inmediato
└── Desconocido: reintentar 1 vez, luego DLQ
```

---

## 7. Event Sourcing (futuro)

Para contextos donde el historial completo es crítico:

```
Contextos candidatos:
├── CRM (cada cambio en lead/oportunidad)
├── Proyectos (cada cambio de estado)
├── Financiero (cada statement cargado)
└── Workflows (cada paso ejecutado)

Beneficios:
├── Auditoría completa sin tabla separada
├── Time-travel (reconstruir estado en cualquier momento)
├── Replay para debugging
└── Proyecciones múltiples (diferentes vistas del mismo historial)

Cuándo implementar:
├── Cuando audit_log exceda 50M registros
├── Cuando se necesite reconstruir estados pasados regularmente
└── Cuando múltiples servicios necesiten la misma fuente de verdad
```

---

## 8. Integración con el stack actual

```
Fase 1 (MVP):  Eventos inline + Redis Bull queues
               Sin event bus externo
               Eventos como logs en PostgreSQL (audit_logs)
               Procesamiento síncrono para flujos simples
               Bull queues para: IA, notificaciones, reportes

Fase 2 (Growth): RabbitMQ como event bus
                 Productores publican eventos
                 Consumidores procesan asíncronamente
                 DLQ para errores
                 Replay desde audit_logs

Fase 3 (Scale):  Event Sourcing para contextos críticos
                  Kafka para alto throughput
                  Proyecciones en PostgreSQL + Warehouse
```

### Diagrama de transición
```
Fase 1:
┌─────────┐     ┌──────────┐     ┌──────────┐
│ Request │────▶│ Prisma   │────▶│ Response │
└─────────┘     │ (same tx)│     └──────────┘
                └──────────┘
                      │
                      ▼
                ┌──────────┐
                │ Bull Q   │──▶ Worker (IA, notif, etc.)
                └──────────┘

Fase 2:
┌─────────┐     ┌──────────┐     ┌──────────┐
│ Request │────▶│ Prisma   │────▶│ Response │
└─────────┘     └────┬─────┘     └──────────┘
                      │
                      ▼
                ┌──────────────┐
                │ RabbitMQ     │──▶ Consumer 1 (Workflow)
                │ Event Bus    │──▶ Consumer 2 (Notif)
                └──────────────┘──▶ Consumer 3 (KG)
                                  ▶ Consumer N
```
