# AUTHORIZATION MATRIX

## RBAC/ABAC: Permisos por rol y recurso

Este documento define qué puede hacer cada rol en cada recurso del sistema. La matriz cubre todas las operaciones CRUD por contexto delimitado.

---

## Roles del sistema

### Roles por defecto (system)

```
ADMIN
├── Acceso total al tenant
├── Configuración, usuarios, roles, facturación
└── No aplican restricciones

DIRECTOR
├── Visión completa de la firma
├── Asigna proyectos y consultores
├── Revisa KPIs del negocio
├── Configura workflows, reglas y BPM
└── No ejecuta tareas operativas

CONSULTOR_SENIOR
├── Clientes complejos y estratégicos
├── Proyectos de alta criticidad
├── Aprueba informes
└── Mentor de consultores junior

CONSULTOR
├── Clientes asignados
├── Proyectos asignados
├── Documentos, análisis, informes
└── Tickets

VIEWER
├── Solo lectura
├── Dashboards, informes, clientes
└── Sin acciones de escritura

CLIENT
├── Solo su propia empresa
├── Subir documentos
├── Ver su dashboard
├── Tickets
└── No ve datos de otros clientes
```

---

## 1. IDENTITY

```
Recurso         │ Acción    │ Admin │ Director │ Cons.Senior │ Consultor │ Viewer │ Client
────────────────┼───────────┼───────┼──────────┼─────────────┼───────────┼────────┼────────
Company         │ read      │ ✅    │ ✅       │ ✅          │ ✅        │ ✅     │ —
Company         │ write     │ ✅    │ ✅       │ —           │ —         │ —      │ —
CompanySettings │ read      │ ✅    │ ✅       │ ✅          │ ✅        │ ✅     │ —
CompanySettings │ write     │ ✅    │ ✅       │ —           │ —         │ —      │ —
Branch          │ read      │ ✅    │ ✅       │ ✅          │ ✅        │ ✅     │ —
Branch          │ write     │ ✅    │ ✅       │ —           │ —         │ —      │ —
Department      │ read      │ ✅    │ ✅       │ ✅          │ ✅        │ ✅     │ —
Department      │ write     │ ✅    │ ✅       │ —           │ —         │ —      │ —
User            │ list      │ ✅    │ ✅       │ ✅          │ ✅        │ ✅     │ —
User            │ read      │ ✅    │ ✅       │ ✅          │ ✅        │ ✅     │ —
User            │ create    │ ✅    │ —        │ —           │ —         │ —      │ —
User            │ update    │ ✅    │ ✅       │ —           │ —         │ —      │ —
User            │ delete    │ ✅    │ —        │ —           │ —         │ —      │ —
User            │ roles     │ ✅    │ ✅       │ —           │ —         │ —      │ —
Role            │ crud      │ ✅    │ —        │ —           │ —         │ —      │ —
```

---

## 2. CRM

```
Recurso         │ Acción    │ Admin │ Director │ Cons.Senior │ Consultor │ Viewer │ Client
────────────────┼───────────┼───────┼──────────┼─────────────┼───────────┼────────┼────────
Lead            │ list      │ ✅    │ ✅       │ ✅          │ ✅        │ ✅     │ —
Lead            │ read      │ ✅    │ ✅       │ ✅          │ ✅        │ ✅     │ —
Lead            │ create    │ ✅    │ ✅       │ ✅          │ ✅        │ —      │ —
Lead            │ update    │ ✅    │ ✅       │ ✅          │ ✅ (own)  │ —      │ —
Lead            │ delete    │ ✅    │ ✅       │ ✅          │ —         │ —      │ —
Lead            │ convert   │ ✅    │ ✅       │ ✅          │ —         │ —      │ —

Client          │ list      │ ✅    │ ✅       │ ✅          │ ✅        │ ✅     │ —
Client          │ read      │ ✅    │ ✅       │ ✅          │ ✅ (own)  │ ✅     │ ✅ (own)
Client          │ create    │ ✅    │ ✅       │ ✅          │ ✅        │ —      │ —
Client          │ update    │ ✅    │ ✅       │ ✅          │ ✅ (own)  │ —      │ —
Client          │ delete    │ ✅    │ ✅       │ —           │ —         │ —      │ —
Client          │ status    │ ✅    │ ✅       │ ✅          │ —         │ —      │ —

ClientContact   │ crud      │ ✅    │ ✅       │ ✅          │ ✅ (own)  │ ✅ (r) │ ✅ (r, own)
ClientContract  │ crud      │ ✅    │ ✅       │ ✅          │ ✅ (r)    │ ✅ (r) │ ✅ (r, own)

Opportunity     │ list      │ ✅    │ ✅       │ ✅          │ ✅        │ ✅     │ —
Opportunity     │ create    │ ✅    │ ✅       │ ✅          │ ✅        │ —      │ —
Opportunity     │ update    │ ✅    │ ✅       │ ✅          │ ✅ (own)  │ —      │ —
Opportunity     │ close     │ ✅    │ ✅       │ ✅          │ —         │ —      │ —

Interaction     │ crud      │ ✅    │ ✅       │ ✅          │ ✅ (own)  │ ✅ (r) │ ✅ (r, own)
Meeting         │ crud      │ ✅    │ ✅       │ ✅          │ ✅ (own)  │ ✅ (r) │ ✅ (r, own)
```

---

## 3. CONSULTING

```
Recurso         │ Acción    │ Admin │ Director │ Cons.Senior │ Consultor │ Viewer │ Client
────────────────┼───────────┼───────┼──────────┼─────────────┼───────────┼────────┼────────
Project         │ list      │ ✅    │ ✅       │ ✅          │ ✅        │ ✅     │ ✅ (own)
Project         │ read      │ ✅    │ ✅       │ ✅          │ ✅ (own)  │ ✅     │ ✅ (own)
Project         │ create    │ ✅    │ ✅       │ ✅          │ ✅        │ —      │ —
Project         │ update    │ ✅    │ ✅       │ ✅          │ ✅ (own)  │ —      │ —
Project         │ delete    │ ✅    │ —        │ —           │ —         │ —      │ —
Project         │ status    │ ✅    │ ✅       │ ✅          │ ✅ (own)  │ —      │ —

Task            │ list      │ ✅    │ ✅       │ ✅          │ ✅        │ ✅     │ ✅ (own)
Task            │ read      │ ✅    │ ✅       │ ✅          │ ✅ (own)  │ ✅     │ ✅ (own)
Task            │ create    │ ✅    │ ✅       │ ✅          │ ✅        │ —      │ —
Task            │ update    │ ✅    │ ✅       │ ✅          │ ✅ (own)  │ —      │ —
Task            │ status    │ ✅    │ ✅       │ ✅          │ ✅ (own)  │ —      │ —

Milestone       │ crud      │ ✅    │ ✅       │ ✅          │ ✅ (own)  │ ✅ (r) │ ✅ (r, own)
Risk            │ crud      │ ✅    │ ✅       │ ✅          │ ✅ (own)  │ ✅ (r) │ —
```

---

## 4. DOCUMENTS

```
Recurso         │ Acción    │ Admin │ Director │ Cons.Senior │ Consultor │ Viewer │ Client
────────────────┼───────────┼───────┼──────────┼─────────────┼───────────┼────────┼────────
Document        │ list      │ ✅    │ ✅       │ ✅          │ ✅        │ ✅     │ ✅ (own)
Document        │ read      │ ✅    │ ✅       │ ✅          │ ✅ (own)  │ ✅     │ ✅ (own)
Document        │ upload    │ ✅    │ ✅       │ ✅          │ ✅        │ —      │ ✅
Document        │ update    │ ✅    │ ✅       │ ✅          │ ✅ (own)  │ —      │ —
Document        │ delete    │ ✅    │ ✅       │ ✅          │ —         │ —      │ —
Document        │ download  │ ✅    │ ✅       │ ✅          │ ✅ (own)  │ ✅     │ ✅ (own)
DocumentVersion │ crud      │ ✅    │ ✅       │ ✅          │ ✅ (own)  │ ✅ (r) │ ✅ (r, own)
```

---

## 5. FINANCE

```
Recurso              │ Acción    │ Admin │ Director │ Cons.Senior │ Consultor │ Viewer │ Client
─────────────────────┼───────────┼───────┼──────────┼─────────────┼───────────┼────────┼────────
FinancialStatement   │ list      │ ✅    │ ✅       │ ✅          │ ✅        │ ✅     │ ✅ (own)
FinancialStatement   │ read      │ ✅    │ ✅       │ ✅          │ ✅ (own)  │ ✅     │ ✅ (own)
FinancialStatement   │ create    │ ✅    │ ✅       │ ✅          │ ✅        │ —      │ —
FinancialStatement   │ delete    │ ✅    │ ✅       │ ✅          │ —         │ —      │ —

RatioDefinition      │ read      │ ✅    │ ✅       │ ✅          │ ✅        │ ✅     │ —
RatioDefinition      │ create    │ ✅    │ ✅       │ ✅          │ —         │ —      │ —
RatioDefinition      │ write     │ ✅    │ ✅       │ ✅          │ —         │ —      │ —

KpiDefinition        │ crud      │ ✅    │ ✅       │ ✅          │ —         │ —      │ —
KpiValue             │ list      │ ✅    │ ✅       │ ✅          │ ✅        │ ✅     │ ✅ (own)
```

---

## 6. AI

```
Recurso              │ Acción    │ Admin │ Director │ Cons.Senior │ Consultor │ Viewer │ Client
─────────────────────┼───────────┼───────┼──────────┼─────────────┼───────────┼────────┼────────
AiAgent              │ read      │ ✅    │ ✅       │ ✅          │ ✅        │ —      │ —
AiAgent              │ config    │ ✅    │ ✅       │ ✅          │ —         │ —      │ —
AiConversation       │ list      │ ✅    │ ✅       │ ✅          │ ✅ (own)  │ ✅ (r) │ —
AiConversation       │ create    │ ✅    │ ✅       │ ✅          │ ✅        │ —      │ —
AiMessage            │ read      │ ✅    │ ✅       │ ✅          │ ✅ (own)  │ ✅ (r) │ —
AiCostLog            │ read      │ ✅    │ ✅       │ ✅          │ —         │ —      │ —
PromptTemplate       │ crud      │ ✅    │ ✅       │ ✅          │ —         │ —      │ —
AiAnalyze            │ execute   │ ✅    │ ✅       │ ✅          │ ✅        │ —      │ —
AiChat               │ execute   │ ✅    │ ✅       │ ✅          │ ✅        │ —      │ —
AiExtract            │ execute   │ ✅    │ ✅       │ ✅          │ ✅        │ —      │ —
```

---

## 7. DECISION

```
Recurso              │ Acción    │ Admin │ Director │ Cons.Senior │ Consultor │ Viewer │ Client
─────────────────────┼───────────┼───────┼──────────┼─────────────┼───────────┼────────┼────────
Decision             │ evaluate  │ ✅    │ ✅       │ ✅          │ ✅        │ —      │ —
Decision             │ read      │ ✅    │ ✅       │ ✅          │ ✅ (own)  │ ✅     │ ✅ (own)
Decision             │ select    │ ✅    │ ✅       │ ✅          │ ✅ (own)  │ —      │ —
Recommendation       │ list      │ ✅    │ ✅       │ ✅          │ ✅ (own)  │ ✅     │ ✅ (own)
Recommendation       │ approve   │ ✅    │ ✅       │ ✅          │ —         │ —      │ —
Recommendation       │ reject    │ ✅    │ ✅       │ ✅          │ —         │ —      │ —
```

---

## 8. WORKFLOW

```
Recurso              │ Acción    │ Admin │ Director │ Cons.Senior │ Consultor │ Viewer │ Client
─────────────────────┼───────────┼───────┼──────────┼─────────────┼───────────┼────────┼────────
WorkflowDefinition   │ crud      │ ✅    │ ✅       │ ✅          │ —         │ —      │ —
WorkflowInstance     │ list      │ ✅    │ ✅       │ ✅          │ ✅ (own)  │ ✅     │ ✅ (own)
WorkflowInstance     │ run       │ ✅    │ ✅       │ ✅          │ ✅        │ —      │ —
WorkflowInstance     │ pause/res │ ✅    │ ✅       │ ✅          │ ✅ (own)  │ —      │ —
WorkflowStepResult   │ read      │ ✅    │ ✅       │ ✅          │ ✅ (own)  │ ✅     │ ✅ (own)
WorkflowTrigger      │ crud      │ ✅    │ ✅       │ ✅          │ —         │ —      │ —
```

---

## 9. RULES

```
Recurso              │ Acción    │ Admin │ Director │ Cons.Senior │ Consultor │ Viewer │ Client
─────────────────────┼───────────┼───────┼──────────┼─────────────┼───────────┼────────┼────────
RuleDefinition       │ crud      │ ✅    │ ✅       │ ✅          │ —         │ —      │ —
RuleExecution        │ read      │ ✅    │ ✅       │ ✅          │ ✅        │ ✅     │ —
RuleTest             │ execute   │ ✅    │ ✅       │ ✅          │ —         │ —      │ —
```

---

## 10. KNOWLEDGE

```
Recurso              │ Acción    │ Admin │ Director │ Cons.Senior │ Consultor │ Viewer │ Client
─────────────────────┼───────────┼───────┼──────────┼─────────────┼───────────┼────────┼────────
KnowledgeNode        │ search    │ ✅    │ ✅       │ ✅          │ ✅        │ ✅     │ —
KnowledgeNode        │ read      │ ✅    │ ✅       │ ✅          │ ✅ (own)  │ ✅     │ —
KnowledgeNode        │ index     │ ✅    │ ✅       │ ✅          │ ✅        │ —      │ —
KnowledgeNode        │ delete    │ ✅    │ ✅       │ ✅          │ —         │ —      │ —
KnowledgeRecommend   │ execute   │ ✅    │ ✅       │ ✅          │ ✅        │ —      │ —
```

---

## 11. TICKETS

```
Recurso              │ Acción    │ Admin │ Director │ Cons.Senior │ Consultor │ Viewer │ Client
─────────────────────┼───────────┼───────┼──────────┼─────────────┼───────────┼────────┼────────
Ticket               │ list      │ ✅    │ ✅       │ ✅          │ ✅        │ ✅     │ ✅ (own)
Ticket               │ read      │ ✅    │ ✅       │ ✅          │ ✅ (own)  │ ✅     │ ✅ (own)
Ticket               │ create    │ ✅    │ ✅       │ ✅          │ ✅        │ —      │ ✅
Ticket               │ update    │ ✅    │ ✅       │ ✅          │ ✅ (own)  │ —      │ —
Ticket               │ assign    │ ✅    │ ✅       │ ✅          │ —         │ —      │ —
TicketComment        │ crud      │ ✅    │ ✅       │ ✅          │ ✅ (own)  │ ✅ (r) │ ✅ (cr, own)
```

---

## 12. SIMULATION

```
Recurso              │ Acción    │ Admin │ Director │ Cons.Senior │ Consultor │ Viewer │ Client
─────────────────────┼───────────┼───────┼──────────┼─────────────┼───────────┼────────┼────────
Simulation           │ run       │ ✅    │ ✅       │ ✅          │ ✅        │ —      │ —
Simulation           │ read      │ ✅    │ ✅       │ ✅          │ ✅ (own)  │ ✅     │ ✅ (own)
Simulation           │ compare   │ ✅    │ ✅       │ ✅          │ ✅        │ ✅     │ —
```

---

## 13. BILLING

```
Recurso              │ Acción    │ Admin │ Director │ Cons.Senior │ Consultor │ Viewer │ Client
─────────────────────┼───────────┼───────┼──────────┼─────────────┼───────────┼────────┼────────
BillingPlan          │ read      │ ✅    │ ✅       │ ✅          │ ✅        │ ✅     │ —
BillingSubscription  │ read      │ ✅    │ ✅       │ —           │ —         │ —      │ —
BillingSubscription  │ change    │ ✅    │ —        │ —           │ —         │ —      │ —
BillingInvoice       │ read      │ ✅    │ ✅       │ —           │ —         │ —      │ —
BillingInvoice       │ download  │ ✅    │ ✅       │ —           │ —         │ —      │ —
```

---

## 14. SETTINGS & ADMIN

```
Recurso              │ Acción    │ Admin │ Director │ Cons.Senior │ Consultor │ Viewer │ Client
─────────────────────┼───────────┼───────┼──────────┼─────────────┼───────────┼────────┼────────
AuditLog             │ read      │ ✅    │ ✅       │ —           │ —         │ —      │ —
Event                │ read      │ ✅    │ ✅       │ ✅          │ ✅        │ —      │ —
FeatureFlag          │ read      │ ✅    │ ✅       │ ✅          │ ✅        │ —      │ —
FeatureFlag          │ write     │ ✅    │ —        │ —           │ —         │ —      │ —
Notification         │ read      │ ✅    │ ✅       │ ✅          │ ✅ (own)  │ ✅     │ ✅ (own)
Notification         │ readAll   │ ✅    │ ✅       │ ✅          │ ✅        │ ✅     │ ✅
PluginInstallation   │ install   │ ✅    │ ✅       │ —           │ —         │ —      │ —
PluginInstallation   │ uninstall │ ✅    │ ✅       │ —           │ —         │ —      │ —
```

---

## Reglas ABAC adicionales

### Restricciones por data ownership

```
Regla: Un consultor solo ve clientes asignados
  IF user.role == "consultor"
  THEN resource.client.assignedTo == user.id

Regla: Un cliente solo ve sus propios datos
  IF user.role == "client"
  THEN resource.clientId == user.clientId

Regla: Consultor senior ve todos los clientes
  IF user.role == "consultor_senior"
  THEN resource.companyId == user.companyId  // sin restricción
```

### Restricciones por plan (Product Engine)

```
Plan       │ Users │ Clients │ Storage │ AI Credits/mes │ Workflows
───────────┼───────┼─────────┼─────────┼────────────────┼──────────
Free       │ 1     │ 5       │ 100 MB  │ 50             │ 3
Starter    │ 5     │ 50      │ 5 GB    │ 1,000          │ 10
Professional│ 15   │ 200     │ 50 GB   │ 10,000         │ 50
Enterprise │ ∞    │ ∞       │ 1 TB    │ 100,000        │ ∞
```

### Permiso negado por límite excedido
```
{
  error: {
    code: "LIMIT_EXCEEDED",
    message: "Límite de usuarios excedido. Plan actual: 5/5. Actualiza a Professional.",
    limit: 5,
    current: 5,
    upgradeUrl: "/api/v1/billing/change-plan?plan=professional"
  }
}
```

---

## Implementación

### Middleware de autorización
```
1. Extraer token JWT → userId + companyId
2. Extraer rol(es) del usuario (de DB o cache)
3. Extraer recurso + acción del request
4. Consultar matriz: ¿rol + recurso + acción = permitido?
5. Si ABAC: evaluar reglas adicionales (ownership, plan limits)
6. Permitir o denegar con 403
```

### Cache de permisos
```
Redis:
  Key: "auth:{userId}:roles"
  Value: ["admin", "director"]
  TTL: 1 hora

  Key: "auth:{companyId}:limits"
  Value: { maxUsers: 5, maxStorage: 5000 }
  TTL: 1 hora
```
