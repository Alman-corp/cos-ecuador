# RULE ENGINE

## Motor de reglas de negocio sin código

El Rule Engine permite a los directores de consultora definir **reglas de negocio sin escribir código**. Cada regla sigue el patrón `SI [condición] → ENTONCES [acción]` y se ejecuta automáticamente cuando se cumplen las condiciones.

---

## 1. Arquitectura

```
Evento entrante
    │
    ▼
┌────────────────────────────────────────┐
│ RULE ENGINE                             │
│                                         │
│  Evalúa todas las reglas activas:      │
│                                         │
│  ┌──────────┐  ┌──────────┐  ┌───────┐ │
│  │ CONDITION│→ │ OPERATOR│→ │ ACTION│ │
│  │ EVAL     │  │ GATE    │  │ EXEC  │ │
│  └──────────┘  └──────────┘  └───────┘ │
│       │             │           │       │
│       ▼             ▼           ▼       │
│  Fact/Event     AND/OR/      Ejecuta   │
│  + Context      NOT/ANY     acción     │
└─────────────────────────────────────────┘
    │
    ▼
Acción: notificar, crear, actualizar, workflow, etc.
```

---

## 2. Estructura de una regla

```json
{
  "id": "rule_01J2X...",
  "name": "Liquidez crítica → alerta director",
  "description": "Cuando la liquidez de un cliente cae bajo 1.0, notificar al director",
  "enabled": true,
  "priority": 1,
  "event": "financial.ratio.alert",
  "conditions": [
    {
      "field": "ratio",
      "operator": "equals",
      "value": "liquidez"
    },
    {
      "field": "value",
      "operator": "less_than",
      "value": 1.0
    },
    {
      "field": "tendencia",
      "operator": "equals",
      "value": "deteriorating"
    }
  ],
  "operator": "AND",
  "actions": [
    {
      "type": "notification",
      "config": {
        "channel": "in_app",
        "title": "Alerta: Cliente con liquidez crítica",
        "template": "{{clientName}} tiene liquidez de {{value}}. Requiere atención inmediata.",
        "targetRole": "director"
      }
    },
    {
      "type": "create_risk",
      "config": {
        "severity": "high",
        "title": "Riesgo de liquidez - {{clientName}}",
        "autoAssign": true
      }
    }
  ],
  "cooldown": 86400,
  "lastFiredAt": null
}
```

---

## 3. Catálogo de condiciones

### Operadores
```
Operator        │ Tipo        │ Ejemplo
────────────────┼─────────────┼─────────────────────────
equals          │ cualquier   │ ratio = "liquidez"
not_equals      │ cualquier   │ status ≠ "healthy"
greater_than    │ número      │ valor > 1.5
less_than       │ número      │ valor < 1.0
between         │ rango       │ 1.0 < valor < 2.5
in              │ lista       │ industry IN ["comercio", "manufactura"]
not_in          │ lista       │ status NOT IN ["churned", "inactive"]
contains        │ string      │ name CONTAINS "Pérez"
starts_with     │ string      │ taxId STARTS_WITH "179"
is_null         │ boolean     │ assignedTo IS NULL
date_after      │ fecha       │ contractEnd AFTER today + 30d
date_before     │ fecha       │ createdAt BEFORE 2026-01-01
changed         │ boolean     │ score CHANGED from last period
threshold       │ umbral      │ value EXCEEDED threshold by 20%
```

### Fuentes de datos (fact/event context)
```
Fuente              │ Campos disponibles
────────────────────┼───────────────────────────────────
event               │ type, timestamp, data.*
cliente             │ name, industry, segment, score, status
ratio financiero    │ name, value, threshold, trend
documento           │ type, status, size, confidence
proyecto            │ type, status, progress, budget
ticket              │ priority, category, status, age
usuario             │ role, department, isActive
tiempo              │ now(), today(), dayOfWeek, month
```

---

## 4. Catálogo de acciones

```
Tipo                    │ Descripción                          │ Config
────────────────────────┼──────────────────────────────────────┼─────────────────────
notification            │ Enviar notificación                  │ channel, title, template, targetRole
create_task             │ Crear tarea                          │ title, assignee, priority, dueDate
create_risk             │ Crear riesgo                         │ severity, title, autoAssign
create_ticket           │ Crear ticket                         │ category, priority, assignedTo
start_workflow          │ Iniciar workflow                     │ definitionId, context
update_client_status    │ Cambiar estado cliente               │ newStatus
send_email              │ Enviar email                         │ template, to, cc
send_webhook            │ Llamar webhook externo               │ url, method, body
update_kpi              │ Actualizar KPI                       │ kpiId, value
escalate                │ Escalar al siguiente nivel           │ targetRole, reason
log_audit               │ Registrar en auditoría               │ severity, message
block_action            │ Bloquear acción (prevenir)           │ reason, duration
```

---

## 5. Editor visual (UX)

```
┌─────────────────────────────────────────────────────────────┐
│ NUEVA REGLA                                                  │
│                                                             │
│ Nombre: [_________________________]                        │
│                                                             │
│ Evento disparador: [financial.ratio.alert  ▼]              │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ CONDICIONES                                              │ │
│ │                                                         │ │
│ │ [ratio]  [equals ▼]  [liquidez]              [✕]      │ │
│ │ [AND]                                                    │ │
│ │ [value]  [less_than ▼]  [1.0]                  [✕]      │ │
│ │ [AND]                                                    │ │
│ │ [tendencia]  [equals ▼]  [deteriorating]       [✕]      │ │
│ │                                                         │ │
│ │ [+ Agregar condición]   [OR ▼]  [AND]                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ACCIONES                                                 │ │
│ │                                                         │ │
│ │ [notification ▼] → Canal: [in_app  ▼]                  │ │
│ │   Título: [Alerta: {{clientName}}...]                   │ │
│ │   Dirigido a: [director  ▼]                    [✕]     │ │
│ │                                                         │ │
│ │ [+ Agregar acción]                                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Cooldown: [24] [horas ▼]                                   │
│                                                             │
│ [◀ Cancelar]                                   [Guardar ▶] │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Evaluación y ejecución

### Pipeline de evaluación
```
1. Evento entrante
2. Filtrar reglas: enabled=true, event=match
3. Ordenar por prioridad
4. Evaluar condiciones (árbol lógico)
5. Verificar cooldown
6. Ejecutar acciones
7. Registrar lastFiredAt
8. Audit log
```

### Performance
```
Evaluación: < 5ms por regla (cached)
Máximo: 100 reglas activas por tenant
Disparo: inline para acciones rápidas, queue para pesadas
Cache de reglas: Redis, TTL 5min, invalidación por evento
```

---

## 7. Reglas predefinidas (shipped with product)

```
Regla                               │ Evento disparador       │ Acción
────────────────────────────────────┼─────────────────────────┼────────────────────
Liquidez < 1.0                      │ financial.ratio.alert   │ Notificar director
Margen neto > 15%                   │ financial.ratio.alert   │ Marcar saludable
Documento sin procesar > 48h        │ document.uploaded       │ Escalar al director
Lead sin actividad > 7d             │ lead.created            │ Tarea follow-up
Cliente nuevo sin reunión > 7d      │ client.created          │ Crear tarea
Factura vencida                     │ system.date             │ Recordatorio + bloquear
Score cliente < 30                  │ client.risk.updated     │ Workflow retención
Contrato próximo a vencer > 30d     │ system.date             │ Tarea renovación
Ticket urgente sin respuesta > 4h   │ ticket.created          │ Notificar equipo
Utilización consultor < 60%         │ system.metrics.report   │ Alerta director
Costo IA > 80% del presupuesto      │ ai.cost.threshold       │ Downgrade modelo
```

---

## 8. Modelo de datos

```prisma
model RuleDefinition {
  id          String   @id @default(uuid())
  companyId   String
  name        String
  description String?
  event       String   // event type that triggers this rule
  conditions  Json     // []condition
  logicOp     String   @default("AND") // AND / OR
  actions     Json     // []action
  priority    Int      @default(0)
  cooldown    Int      @default(0)     // seconds between fires
  isActive    Boolean  @default(true)
  lastFiredAt DateTime?
  createdAt   DateTime
  updatedAt   DateTime
}
```
