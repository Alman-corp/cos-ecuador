# API SPECIFICATION

## Contratos REST para Consulting OS

Este documento define todos los endpoints de la API REST de Consulting OS, organizados por bounded context. Cada endpoint incluye método, ruta, parámetros, request/response, validaciones y códigos de error.

---

## Convenciones

```
Base URL:     /api/v1
Formato:      JSON (application/json)
Auth:         Bearer token (JWT) + X-Company-ID header
Pagginación:  ?page=1&limit=20 (default: page=1, limit=20)
Sort:         ?sort=createdAt&order=desc
Filtros:      ?status=active&type=financial
Idioma:       Accept-Language: es (default), en
Zona horaria: X-Timezone: America/Guayaquil
```

### Formato de respuesta

```json
// Éxito
{
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}

// Error
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "El campo email es requerido",
    "details": [
      { "field": "email", "message": "Requerido", "code": "required" }
    ],
    "requestId": "req_01J2X..."
  }
}
```

### Códigos de error estándar

```
Código                     │ HTTP  │ Descripción
───────────────────────────┼───────┼──────────────────────────────
VALIDATION_ERROR           │ 400   │ Datos inválidos
UNAUTHORIZED               │ 401   │ No autenticado
FORBIDDEN                  │ 403   │ Sin permisos
NOT_FOUND                  │ 404   │ Recurso no existe
CONFLICT                   │ 409   │ Conficto (duplicado, estado)
RATE_LIMITED               │ 429   │ Demasiadas solicitudes
INTERNAL_ERROR             │ 500   │ Error interno
SERVICE_UNAVAILABLE        │ 503   │ Servicio temporalmente no disponible
TENANT_REQUIRED            │ 400   │ X-Company-ID requerido
TENANT_NOT_FOUND           │ 404   │ Tenant no encontrado
LIMIT_EXCEEDED             │ 403   │ Límite del plan excedido
AI_QUOTA_EXCEEDED          │ 403   │ Créditos IA agotados
```

---

## 1. IDENTITY API

### 1.1 Auth

```
POST   /api/v1/auth/register          Registro inicial (crea company + admin)
POST   /api/v1/auth/login             Inicio de sesión
POST   /api/v1/auth/logout            Cerrar sesión
POST   /api/v1/auth/refresh           Refrescar token
POST   /api/v1/auth/magic-link        Enviar link mágico
POST   /api/v1/auth/reset-password    Solicitar reset
POST   /api/v1/auth/change-password   Cambiar contraseña
GET    /api/v1/auth/me                Perfil del usuario actual
```

#### POST /api/v1/auth/register
```json
// Request
{
  "company": {
    "name": "Consultora XYZ S.A.",
    "taxId": "1790012345001",
    "industry": "financial",
    "country": "EC"
  },
  "user": {
    "firstName": "Carlos",
    "lastName": "Pérez",
    "email": "carlos@consultoraxyz.com",
    "phone": "+593 4 259 8000"
  },
  "plan": "professional"  // starter, professional, enterprise
}

// Response 201
{
  "companyId": "uuid",
  "userId": "uuid",
  "token": "jwt...",
  "setupSteps": ["create_first_client", "upload_document", "run_analysis"]
}
```

### 1.2 Company

```
GET    /api/v1/company                   Obtener empresa actual
PUT    /api/v1/company                   Actualizar empresa
GET    /api/v1/company/settings          Obtener configuración
PUT    /api/v1/company/settings          Actualizar configuración
GET    /api/v1/company/branches          Listar sucursales
POST   /api/v1/company/branches          Crear sucursal
PUT    /api/v1/company/branches/:id      Actualizar sucursal
DELETE /api/v1/company/branches/:id      Eliminar sucursal
GET    /api/v1/company/departments       Listar departamentos
POST   /api/v1/company/departments       Crear departamento
PUT    /api/v1/company/departments/:id   Actualizar departamento
DELETE /api/v1/company/departments/:id   Eliminar departamento
```

### 1.3 Users

```
GET    /api/v1/users                     Listar usuarios (tenant)
POST   /api/v1/users                     Invitar/crear usuario
GET    /api/v1/users/:id                 Obtener usuario
PUT    /api/v1/users/:id                 Actualizar usuario
DELETE /api/v1/users/:id                 Desactivar usuario
PUT    /api/v1/users/:id/roles           Actualizar roles del usuario
```

### 1.4 Roles

```
GET    /api/v1/roles                     Listar roles
POST   /api/v1/roles                     Crear rol
GET    /api/v1/roles/:id                 Obtener rol
PUT    /api/v1/roles/:id                 Actualizar rol
DELETE /api/v1/roles/:id                 Eliminar rol
```

---

## 2. CRM API

### 2.1 Leads

```
GET    /api/v1/leads                     Listar leads
POST   /api/v1/leads                     Crear lead
GET    /api/v1/leads/:id                 Obtener lead
PUT    /api/v1/leads/:id                 Actualizar lead
DELETE /api/v1/leads/:id                 Eliminar lead
POST   /api/v1/leads/:id/convert         Convertir lead a cliente
GET    /api/v1/leads/:id/activities      Actividades del lead
POST   /api/v1/leads/:id/activities      Registrar actividad
```

#### POST /api/v1/leads
```json
// Request
{
  "firstName": "Juan",
  "lastName": "Martínez",
  "email": "juan@empresa.com",
  "phone": "+593 99 123 4567",
  "companyName": "Empresa Ejemplo S.A.",
  "position": "Gerente Financiero",
  "source": "web",
  "notes": "Contactó a través del formulario de landing page"
}

// Response 201
{
  "id": "uuid",
  "score": 65,
  "status": "new"
}
```

#### POST /api/v1/leads/:id/convert
```json
// Request
{
  "assignedTo": "user-uuid",
  "plan": "professional",
  "contractValue": 1297.00
}

// Response 200
{
  "clientId": "uuid",
  "contractId": "uuid",
  "welcomeMessage": "Cliente creado exitosamente"
}
```

### 2.2 Clients

```
GET    /api/v1/clients                   Listar clientes
POST   /api/v1/clients                   Crear cliente
GET    /api/v1/clients/:id               Obtener cliente (con relaciones)
PUT    /api/v1/clients/:id               Actualizar cliente
DELETE /api/v1/clients/:id               Desactivar cliente
GET    /api/v1/clients/:id/timeline      Timeline del cliente
PATCH  /api/v1/clients/:id/status        Cambiar estado

GET    /api/v1/clients/:id/contacts      Contactos del cliente
POST   /api/v1/clients/:id/contacts      Crear contacto
PUT    /api/v1/clients/:id/contacts/:cid  Actualizar contacto
DELETE /api/v1/clients/:id/contacts/:cid  Eliminar contacto

GET    /api/v1/clients/:id/contracts     Contratos del cliente
POST   /api/v1/clients/:id/contracts     Crear contrato
PUT    /api/v1/clients/:id/contracts/:c  Actualizar contrato

GET    /api/v1/clients/:id/opportunities Oportunidades
POST   /api/v1/clients/:id/opportunities Crear oportunidad
PUT    /api/v1/clients/:id/opportunities/:o Actualizar
```

### 2.3 Interactions

```
GET    /api/v1/clients/:id/interactions  Listar interacciones
POST   /api/v1/clients/:id/interactions  Registrar interacción
GET    /api/v1/clients/:id/meetings      Listar reuniones
POST   /api/v1/clients/:id/meetings      Programar reunión
GET    /api/v1/clients/:id/tickets       Tickets del cliente
```

---

## 3. CONSULTING API

### 3.1 Projects

```
GET    /api/v1/projects                  Listar proyectos
POST   /api/v1/projects                  Crear proyecto
GET    /api/v1/projects/:id              Obtener proyecto
PUT    /api/v1/projects/:id              Actualizar proyecto
PATCH  /api/v1/projects/:id/status       Cambiar estado
DELETE /api/v1/projects/:id              Eliminar proyecto

GET    /api/v1/projects/:id/tasks        Tareas del proyecto
POST   /api/v1/projects/:id/tasks        Crear tarea
PUT    /api/v1/projects/:id/tasks/:t     Actualizar tarea
PATCH  /api/v1/projects/:id/tasks/:t/status  Cambiar estado tarea

GET    /api/v1/projects/:id/milestones   Hitos
POST   /api/v1/projects/:id/milestones   Crear hito
PUT    /api/v1/projects/:id/milestones/:m Actualizar

GET    /api/v1/projects/:id/risks        Riesgos
POST   /api/v1/projects/:id/risks        Crear riesgo
PUT    /api/v1/projects/:id/risks/:r     Actualizar
```

#### POST /api/v1/projects
```json
// Request
{
  "clientId": "uuid",
  "name": "Auditoría Financiera 2026",
  "projectType": "audit",
  "methodology": "kanban",
  "startDate": "2026-07-01",
  "targetEndDate": "2026-09-30",
  "budget": 5000.00,
  "assignedTo": ["user-uuid-1", "user-uuid-2"]
}

// Response 201
{
  "id": "uuid",
  "status": "planning",
  "tasksCreated": 0
}
```

---

## 4. DOCUMENTS API

```
GET    /api/v1/documents                 Listar documentos
POST   /api/v1/documents/upload          Subir documento (multipart)
GET    /api/v1/documents/:id             Obtener documento
DELETE /api/v1/documents/:id             Eliminar (soft)
GET    /api/v1/documents/:id/download    Descargar archivo
GET    /api/v1/documents/:id/versions    Versiones del documento
POST   /api/v1/documents/:id/versions    Nueva versión
GET    /api/v1/documents/:id/extracted   Datos extraídos por IA
```

#### POST /api/v1/documents/upload
```json
// Request (multipart/form-data)
{
  "file": "(binary) .pdf, .xlsx, .xml, .csv, .jpg",
  "clientId": "uuid",
  "projectId": "uuid?",
  "documentType": "financial_statement",
  "notes": "Balance general Q2 2026"
}

// Response 201
{
  "id": "uuid",
  "status": "pending",
  "fileUrl": "/api/v1/documents/uuid/download",
  "fileSize": 2458000
}
```

---

## 5. FINANCE API

```
GET    /api/v1/financials/statements     Listar estados financieros
POST   /api/v1/financials/statements     Crear manualmente
GET    /api/v1/financials/statements/:id Obtener
DELETE /api/v1/financials/statements/:id Eliminar

GET    /api/v1/financials/ratios         Definiciones de ratios
POST   /api/v1/financials/ratios         Crear ratio personalizado
GET    /api/v1/financials/ratios/:id     Obtener con valores
GET    /api/v1/financials/ratios/:id/values  Valores históricos

GET    /api/v1/clients/:id/financials    Dashboard financiero del cliente
GET    /api/v1/clients/:id/ratios        Ratios del cliente
GET    /api/v1/clients/:id/forecast      Proyección (12 meses)
```

---

## 6. AI API

```
POST   /api/v1/ai/analyze               Análisis completo
POST   /api/v1/ai/analyze/financial     Análisis financiero
POST   /api/v1/ai/analyze/tax           Análisis tributario
POST   /api/v1/ai/analyze/risk          Análisis de riesgos
POST   /api/v1/ai/chat                  Conversación con IA
POST   /api/v1/ai/extract               Extraer datos de documento

GET    /api/v1/ai/conversations         Historial de conversaciones
GET    /api/v1/ai/conversations/:id     Obtener conversación
DELETE /api/v1/ai/conversations/:id     Eliminar

GET    /api/v1/ai/agents                Agentes disponibles
PUT    /api/v1/ai/agents/:id/config     Configurar agente

GET    /api/v1/ai/costs                 Reporte de costos
GET    /api/v1/ai/costs/daily           Costos diarios
GET    /api/v1/ai/costs/by-agent        Costos por agente

GET    /api/v1/ai/prompts              Plantillas de prompt
POST   /api/v1/ai/prompts              Crear plantilla
PUT    /api/v1/ai/prompts/:id          Actualizar plantilla
POST   /api/v1/ai/prompts/:id/versions Nueva versión
```

#### POST /api/v1/ai/analyze
```json
// Request
{
  "clientId": "uuid",
  "type": "comprehensive",  // comprehensive, financial, tax, risk
  "periodStart": "2026-01-01",
  "periodEnd": "2026-06-30",
  "documentIds": ["uuid", "uuid"],
  "options": {
    "includeForecast": true,
    "includeBenchmark": true,
    "model": "gpt-4"
  }
}

// Response 201
{
  "conversationId": "uuid",
  "status": "processing",
  "estimatedCost": 0.35,
  "estimatedTime": 15000  // ms
}

// Webhook cuando completa (o polling GET)
{
  "conversationId": "uuid",
  "status": "completed",
  "result": {
    "ratios": { ... },
    "analysis": "Resumen ejecutivo...",
    "risks": [ ... ],
    "recommendations": [ ... ],
    "forecast": { ... }
  },
  "usage": {
    "totalTokens": 5700,
    "totalCost": 0.042
  }
}
```

---

## 7. DECISION ENGINE API

```
POST   /api/v1/decision/evaluate         Evaluar cliente
GET    /api/v1/decision/:id              Obtener evaluación
POST   /api/v1/decision/:id/select-plan  Seleccionar plan
GET    /api/v1/decision/history          Historial de evaluaciones
GET    /api/v1/decision/:id/recommendations  Recomendaciones
```

#### POST /api/v1/decision/evaluate
```json
// Request
{
  "clientId": "uuid",
  "factors": []  // override opcional de factores
}

// Response 200
{
  "id": "uuid",
  "score": 22,
  "status": "critical",
  "factors": [
    { "name": "liquidez", "value": 0.8, "weight": 0.25, "score": 20, "status": "critical" },
    { "name": "endeudamiento", "value": 2.5, "weight": 0.20, "score": 30, "status": "alert" },
    { "name": "margen_neto", "value": 3.2, "weight": 0.15, "score": 45, "status": "alert" },
    { "name": "tendencia_ventas", "value": -15, "weight": 0.15, "score": 25, "status": "critical" },
    { "name": "flujo_caja", "value": -5000, "weight": 0.10, "score": 15, "status": "critical" },
    { "name": "cumplimiento", "value": 0, "weight": 0.05, "score": 10, "status": "critical" }
  ],
  "plans": [
    {
      "name": "Reestructuración de deuda",
      "probability": 65,
      "impact": "Liquidez +30%",
      "timeline": "6 meses",
      "steps": ["Consolidar deudas", "Negociar tasas", "Extender plazos"]
    },
    {
      "name": "Reducción de gastos",
      "probability": 70,
      "impact": "Margen +15%",
      "timeline": "3 meses",
      "steps": ["Auditar gastos", "Renegociar proveedores", "Optimizar nómina"]
    }
  ]
}
```

---

## 8. WORKFLOW API

```
GET    /api/v1/workflows                 Listar definiciones
POST   /api/v1/workflows                 Crear definición
GET    /api/v1/workflows/:id             Obtener definición
PUT    /api/v1/workflows/:id             Actualizar definición
DELETE /api/v1/workflows/:id             Eliminar definición
POST   /api/v1/workflows/:id/run         Ejecutar instancia

GET    /api/v1/workflow-instances        Listar instancias
GET    /api/v1/workflow-instances/:id    Obtener instancia
POST   /api/v1/workflow-instances/:id/pause    Pausar
POST   /api/v1/workflow-instances/:id/resume   Reanudar
POST   /api/v1/workflow-instances/:id/cancel   Cancelar
GET    /api/v1/workflow-instances/:id/steps    Pasos ejecutados
```

---

## 9. RULES API

```
GET    /api/v1/rules                     Listar reglas
POST   /api/v1/rules                     Crear regla
GET    /api/v1/rules/:id                 Obtener regla
PUT    /api/v1/rules/:id                 Actualizar regla
DELETE /api/v1/rules/:id                 Eliminar regla
POST   /api/v1/rules/:id/test            Probar regla (dry-run)
GET    /api/v1/rules/:id/executions      Historial de ejecuciones
```

---

## 10. KNOWLEDGE API

```
POST   /api/v1/knowledge/search          Buscar en knowledge graph
GET    /api/v1/knowledge/nodes           Listar nodos
GET    /api/v1/knowledge/nodes/:id       Obtener nodo con relaciones
POST   /api/v1/knowledge/index           Indexar proyecto en KG
POST   /api/v1/knowledge/recommend       Recomendar basado en casos
GET    /api/v1/knowledge/graph           Obtener grafo completo (para visualización)
```

#### POST /api/v1/knowledge/search
```json
// Request
{
  "query": "cliente con liquidez baja en sector comercio",
  "filters": {
    "industry": "comercio",
    "type": ["problem", "strategy"]
  },
  "limit": 5
}

// Response 200
{
  "results": [
    {
      "node": {
        "id": "uuid",
        "type": "problem",
        "title": "Liquidez insuficiente",
        "description": "Cliente del sector comercio con liquidez 0.8..."
      },
      "similarity": 0.92,
      "relations": [
        { "type": "produced", "to": { "id": "uuid", "title": "Reestructuración de deuda" } }
      ]
    }
  ]
}
```

---

## 11. SIMULATION API

```
POST   /api/v1/simulation/run            Ejecutar simulación
GET    /api/v1/simulation/:id            Obtener resultado
POST   /api/v1/simulation/compare        Comparar dos escenarios
```

#### POST /api/v1/simulation/run
```json
// Request
{
  "clientId": "uuid",
  "scenario": {
    "name": "Subida de IVA",
    "variables": [
      { "name": "iva", "current": 12, "newValue": 15, "type": "percentage" },
      { "name": "ventas", "change": -10, "type": "percentage" }
    ],
    "horizon": 12  // meses
  }
}

// Response 200
{
  "id": "uuid",
  "status": "completed",
  "baseline": {
    "liquidez": 1.2,
    "margenNeto": 8,
    "deudaPatrimonio": 1.5,
    "scoreRiesgo": 45
  },
  "simulated": {
    "liquidez": 0.9,
    "margenNeto": 5,
    "deudaPatrimonio": 2.1,
    "scoreRiesgo": 68
  },
  "impact": "RIESGO ALTO — No recomendado sin plan de mitigación"
}
```

---

## 12. BILLING API

```
GET    /api/v1/billing/plans             Listar planes disponibles
GET    /api/v1/billing/subscription      Suscripción actual
POST   /api/v1/billing/checkout          Crear sesión de checkout
POST   /api/v1/billing/portal            Abrir portal de facturación
POST   /api/v1/billing/cancel            Cancelar suscripción
POST   /api/v1/billing/change-plan       Cambiar de plan
GET    /api/v1/billing/invoices          Historial de facturas
GET    /api/v1/billing/invoices/:id      Obtener factura
```

---

## 13. NOTIFICATIONS API

```
GET    /api/v1/notifications             Listar notificaciones
PATCH  /api/v1/notifications/:id/read    Marcar como leída
POST   /api/v1/notifications/read-all    Marcar todas como leídas
GET    /api/v1/notifications/unread-count Contador no leídas
```

---

## 14. ADMIN API

```
GET    /api/v1/admin/metrics             Métricas del sistema
GET    /api/v1/admin/audit-logs          Logs de auditoría
GET    /api/v1/admin/events              Eventos del sistema
GET    /api/v1/admin/feature-flags       Feature flags
PUT    /api/v1/admin/feature-flags/:flag  Actualizar flag
```

---

## Versionado

```
URL: /api/v1/{resource}
Headers de versionado opcionales:
  Accept-Version: 2026-06-01  (fecha de corte)

Política de cambios:
  - Additivo: nuevos campos/endpoints no rompen
  - Breaking: nuevo endpoint, viejo deprecated por 3 meses
  - Deprecation header: Warning: 299 api/v1 "El endpoint será deprecado en..."
```

---

## Rate Limiting

```
Límite por tenant:
  Free:       100 req/min
  Starter:    500 req/min
  Professional: 2000 req/min
  Enterprise: 10000 req/min

Headers de respuesta:
  X-RateLimit-Limit: 500
  X-RateLimit-Remaining: 423
  X-RateLimit-Reset: 1624780800

Código 429: {
  error: { code: "RATE_LIMITED", message: "Demasiadas solicitudes. Límite: 500/min", retryAfter: 45 }
}
```
