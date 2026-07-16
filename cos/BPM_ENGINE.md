# BPM ENGINE

## Editor visual de procesos de negocio

El BPM Engine permite a los directores de consultora **diseñar, ejecutar y monitorear procesos** sin escribir código. Los workflows son configurables visualmente con una interfaz drag-and-drop similar a herramientas profesionales como Camunda o Power Automate.

---

## 1. Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    BPM ENGINE                                │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ DESIGNER      │  │ EXECUTOR     │  │ MONITOR          │  │
│  │ (editor       │  │ (runtime)    │  │ (dashboard)      │  │
│  │  visual)      │  │             │  │                  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────────┘  │
│         │                 │                  │              │
│         ▼                 ▼                  ▼              │
│  Workflow            Workflow            Instancias       │
│  Definitions         Instances           en ejecución     │
│  (JSON schema)       (state machine)     (tiempos,        │
│                                          errores)         │
└─────────────────────────────────────────────────────────────┘
    │                      │                     │
    ▼                      ▼                     ▼
Event Bus ──────────►  Rule Engine ──────────► Decision Engine
```

---

## 2. Editor visual

### Paleta de componentes

```
INICIO / FIN
┌────────────┐     ┌────────────┐
│    INICIO  │     │    FIN     │
│  (evento)  │     │            │
└────────────┘     └────────────┘

TAREAS
┌────────────────┐  ┌────────────────┐
│ TAREA HUMANA   │  │ TAREA IA       │
│ Asignar a      │  │ Analizar,      │
│ usuario/rol    │  │ clasificar,    │
│                │  │ generar        │
└────────────────┘  └────────────────┘

DOCUMENTOS
┌────────────────┐  ┌────────────────┐
│ SOLICITAR DOC  │  │ VALIDAR DOC    │
│ Pedir archivo  │  │ IA verifica    │
│ al cliente     │  │ consistencia   │
└────────────────┘  └────────────────┘

CONTROL DE FLUJO
┌───────┐  ┌───────┐  ┌───────┐  ┌──────────┐
│  SI / │  │PARAL. │  │ ESPERA│  │  TIMER   │
│ENTONCES│  │ (split│  │(cond) │  │ (retardo)│
│  SINO  │  │ +join)│  │       │  │          │
└───────┘  └───────┘  └───────┘  └──────────┘

ACCIONES
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│NOTIFICAR │  │ ENVIAR   │  │ GENERAR  │  │ FIRMA    │
│          │  │ EMAIL    │  │ PDF      │  │ ELECTR.  │
└──────────┘  └──────────┘  └──────────┘  └──────────┘

INTEGRACIONES
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ WEBHOOK  │  │ LLAMAR   │  │ ACTUALIZ │  │ GUARDAR  │
│          │  │ API      │  │ KPI      │  │ EN KG    │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
```

### Interfaz del diseñador
```
┌─────────────────────────────────────────────────────────────┐
│ [Nuevo] [Abrir] [Guardar] [Publicar] [Exportar] [Importar] │
├─────────────────────────────────────────────────────────────┤
│ │ PALETA                    │   LIENZO (drag & drop)       │
│ │                           │                              │
│ │ [Inicio]                  │   ┌──────┐                   │
│ │ [Tarea Humana]            │   │INICIO│                   │
│ │ [Tarea IA]                │   └──┬───┘                   │
│ │ [Documento]               │      │                       │
│ │ [Condición]               │   ┌──▼────┐                  │
│ │ [Paralelo]                │   │SOLICIT│                  │
│ │ [Espera]                  │   │BALANCE│                  │
│ │ [Notificar]               │   └──┬────┘                  │
│ │ [Email]                   │      │                       │
│ │ [PDF]                     │   ┌──▼─────┐                │
│ │ [Webhook]                 │   │  IA    │                 │
│ │ ...                       │   │ANALIZA │                 │
│ └───────────────────────────┘  └──┬──────┘                │
│                                   │                       │
│ ┌──────────────────────────────┐ ┌▼────────┐             │
│ │ PROPIEDADES                  │ │¿APROBADO│             │
│ │                              │ │  [SI]   │  [NO]       │
│ │ Paso: Análisis IA            │ └──┬──────┘  │           │
│ │ Agente: financial            │    │         │           │
│ │ Modelo: gpt-4               │ ┌──▼──┐ ┌────▼────┐     │
│ │ Instrucciones: ...          │ │GEN  │ │NOTIFICAR│     │
│ └──────────────────────────────┘ │PDF  │ │AJUSTAR  │     │
│                                 └──┬───┘ └─────────┘     │
│                                    │                      │
│                               ┌────▼────┐                │
│                               │  FIN    │                 │
│                               └─────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Modelo de datos

### Workflow Definition
```prisma
model WorkflowDefinition {
  id          String   @id @default(uuid())
  companyId   String
  name        String
  description String?
  category    String?  // financial, tax, onboarding, reporting
  icon        String?
  steps       Json     // [step1, step2, ...]
  isActive    Boolean  @default(true)
  version     Int      @default(1)
  createdAt   DateTime
  updatedAt   DateTime
}
```

### Step schema (JSON)
```typescript
type StepType =
  | "start" | "end"
  | "task_human" | "task_ai"
  | "document_request" | "document_validate"
  | "condition" | "parallel" | "wait" | "timer"
  | "notification" | "email" | "generate_pdf"
  | "webhook" | "api_call" | "update_kpi"
  | "save_knowledge" | "esignature"

interface WorkflowStep {
  id: string
  type: StepType
  label: string
  config: {
    // Según el tipo
    assignee?: string | string[]       // task_human
    agent?: string                      // task_ai
    model?: string                      // task_ai
    prompt?: string                     // task_ai
    condition?: string                  // condition
    variable?: string                   // condition
    expectedValue?: any                 // condition
    timeout?: number                    // wait, timer
    channel?: string                    // notification
    template?: string                   // email
    url?: string                        // webhook
    kpiId?: string                      // update_kpi
  }
  next: {
    default?: string           // next step id
    branches?: {               // for conditions
      [key: string]: string    // "yes" → stepId, "no" → stepId
    }
  }
  position?: { x: number, y: number }  // canvas position
}
```

---

## 4. Ejecución (State Machine)

### Estados de una instancia
```
PENDING → RUNNING → PAUSED → COMPLETED
                   → FAILED
                   → CANCELLED
```

### Transiciones
```
Evento                     │ De           │ A
───────────────────────────┼──────────────┼────────────
Usuario inicia workflow    │ PENDING      │ RUNNING
Paso humano completado     │ RUNNING      │ RUNNING
Paso IA completado         │ RUNNING      │ RUNNING
Error en paso              │ RUNNING      │ FAILED
Usuario pausa              │ RUNNING      │ PAUSED
Timer alcanzado            │ PAUSED       │ RUNNING
Último paso completado     │ RUNNING      │ COMPLETED
Usuario/Fallo crítico      │ *            │ CANCELLED
```

### Ejecución de pasos
```
Cada paso se ejecuta en el Executor:

1. Obtener step de la definición
2. Resolver contexto (variables, datos del workflow)
3. Ejecutar según tipo:
   - task_human → asignar a usuario/rol, notificar
   - task_ai → llamar al AI Orchestrator
   - condition → evaluar expresión
   - wait → pausar hasta condición
   - timer → agendar wake-up
   - notification → enviar notificación
   - webhook → llamar URL externa
4. Guardar resultado en WorkflowStepResult
5. Avanzar al siguiente paso según next.default o next.branches
```

---

## 5. Templates predefinidos

```
Template                    │ Pasos
────────────────────────────┼──────────────────────────────────────────
Onboarding de cliente       │ Inicio → Solicitar docs → IA analiza → Revisión humana → Informe → Reunión → Fin
Auditoría mensual           │ Inicio → Esperar docs → IA extrae → Valida → Humano revisa → PDF → Notificar → Fin
Diagnóstico rápido          │ Inicio → Solicitar balance → IA ratios → IA riesgo → Informe → Fin
Renovación de contrato      │ Inicio → Notificar → IA propuesta → Humano aprueba → PDF firma → Archivar → Fin
Alerta de riesgo            │ Inicio → IA detecta → Evaluar → Director decide → Plan acción → Seguimiento → Fin
Facturación recurrente      │ Inicio → Timer mensual → Generar factura → Enviar → Registrar pago → Fin
Seguimiento de KPI          │ Inicio → Timer semanal → Actualizar KPIs → ¿Desviación? → Notificar → Fin
Retención de cliente        │ Inicio → IA analiza churn → Propuesta → Humano contacta → Plan retención → Fin
```

---

## 6. Monitor

```
┌─────────────────────────────────────────────────────────────┐
│ WORKFLOWS ACTIVOS                    Última hora: 12 ejec.  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Workflow              │ Cliente    │ Estado   │ Paso     │ T │
│───────────────────────┼────────────┼──────────┼──────────┼───│
│ Onboarding           │ Cliente A  │ ▶ Running│ Solicitar│ 2d│
│ Auditoría Mensual    │ Cliente B  │ ⏸ Paused │ Espera   │ 5d│
│ Diagnóstico Rápido   │ Cliente C  │ ✅ Done  │ —        │ — │
│ Alerta de Riesgo     │ Cliente D  │ ❌ Failed│ IA error │ — │
│ Renovación           │ Cliente E  │ ⏳ Pend.  │ —        │ — │
│                                                             │
│ ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌ 75% completados                         │
│ ▌▌▌▌▌ 5% errores                                            │
│ ▌ 20% en progreso                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Integración con otros engines

```
Rule Engine:  "Cliente nuevo" → workflow.start("onboarding")
              "Riesgo alto" → workflow.start("alerta_riesgo")

Decision Engine: "Plan A seleccionado" → workflow.start("seguimiento_plan_a")

Event Bus:  event.workflow.started → dashboard actualiza
            event.workflow.completed → notificación
            event.workflow.failed → alerta técnica
```
