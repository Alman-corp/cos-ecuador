# CORE DOMAIN — Consulting OS

## ¿Qué hace el sistema?

Consulting OS es una **plataforma de operaciones empresariales impulsada por IA** para firmas de consultoría financiera en LatAm. Automatiza el ciclo completo de vida del cliente: desde la captación (CRM) hasta la entrega de informes, pasando por análisis multiagente con IA, gestión documental inteligente, flujos de trabajo configurables, motor de decisiones, simulaciones, y un ecosistema de conocimiento que se vuelve más valioso con cada caso resuelto.

---

## Bounded Contexts (DDD)

El dominio está organizado en **contextos delimitados**, cada uno con su propio lenguaje ubicuo, entidades, agregados y reglas de negocio.

```
┌─────────────────────────────────────────────────────────────┐
│                    CONSULTING OS                            │
├─────────────────────────────────────────────────────────────┤
│  IDENTITY     │  CRM        │  CONSULTING  │  FINANCE      │
│  CONTEXT      │  CONTEXT    │  CONTEXT     │  CONTEXT      │
├───────────────┼─────────────┼──────────────┼───────────────┤
│  AI CONTEXT   │  KNOWLEDGE  │  DECISION    │  ECOSYSTEM    │
│               │  CONTEXT    │  CONTEXT     │  CONTEXT      │
├───────────────┴─────────────┴──────────────┴───────────────┤
│  INFRASTRUCTURE: Event Bus / Data Lake / Plugin System     │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. IDENTITY CONTEXT

Cada instancia del sistema pertenece a una **firma de consultoría**. Todo está aislado por tenant.

**Agregados:** Empresa, Usuario, Rol, Workspace, Configuración

```
Empresa (Tenant Root)
├── Datos fiscales (RUC, razón social)
├── Sucursales / Departamentos
├── Workspaces (espacios de trabajo aislados)
├── Usuarios (roles: admin, director, consultor, viewer)
├── Roles con permisos granulares
├── Configuración (moneda, huso, temas, feature flags)
└── Suscripción (plan, facturación, límites)
```

**Reglas de dominio:**
- Un usuario pertenece a exactamente una empresa
- Los roles son configurables por empresa
- Los permisos se heredan: rol → workspace → recurso

---

## 2. CRM CONTEXT

La consultora vive de su pipeline comercial. Este contexto gestiona todo el ciclo de ventas.

**Agregados:** Lead, Prospecto, Oportunidad, Pipeline, Contrato

```
Lead (captura inicial)
├── Fuente (web, referral, partner, inbound, cold)
├── Score de calificación
├── Actividades (llamadas, emails, WhatsApp, LinkedIn)
└── Estado: nuevo → contactado → calificado → descartado
    │
    ▼
Prospecto (calificado)
├── Necesidades identificadas
├── Documentos compartidos
├── Reuniones
├── Propuestas enviadas
└── Estado: en negociación → ganado → perdido
    │
    ▼
Oportunidad (en pipeline)
├── Valor estimado
├── Probabilidad de cierre
├── Fecha estimada
├── Competidores
├── Notas de negociación
└── Pipeline stage
    │
    ▼
Contrato (cerrado-ganado)
├── Términos
├── Plan (starter, professional, enterprise)
├── Fecha inicio / fin
├── Renovación automática
└── Documento firmado
    │
    ▼
Cliente (oficial)
```

**Reglas de dominio:**
- Lead sin actividad > 7 días → tarea automática de follow-up
- Oportunidad > 90 días sin avance → notificar al director
- Contrato próximo a vencer > 30 días → iniciar workflow de renovación

---

## 3. CONSULTING CONTEXT

El corazón operativo: todo proyecto, diagnóstico, auditoría y entrega de valor al cliente.

**Agregados:** Proyecto, Tarea, Hito, Riesgo, Informe, Recomendación

```
Proyecto
├── Tipo (diagnóstico, auditoría, consultoría continua, advisory)
├── Metodología (kanban, scrum, waterfall)
├── Ciclo: planificar → ejecutar → revisar → entregar
├── Tareas (con dependencias, Kanban, asignación)
├── Hitos (milestones con fechas y entregables)
├── Riesgos (probabilidad × impacto = score)
├── Presupuesto / Costo real / ROI
├── Informes generados (automáticos + humanos)
└── Recomendaciones (basadas en IA + revisión humana)
```

**Flujo de un proyecto:**
```
Diagnóstico Inicial
    → Onboarding (carga documentos, kickoff)
    → Recolección (documentos contables, clasificación, validación)
    → Análisis (IA multiagente + revisión humana)
    → Informe (generación automática, dashboard KPIs, plan estratégico)
    → Presentación (reunión, acuerdos, acciones)
    → Seguimiento (KPIs periódicos, alertas, reuniones recurrentes)
    → Revisión (evaluación trimestral, nuevo análisis, ajuste)
```

---

## 4. FINANCE CONTEXT

Análisis financiero del **cliente** + economía interna de la **consultora**.

### 4a. Finanzas del Cliente

**Agregados:** FinancialStatement, Ratio, Forecast, Scenario

```
FinancialStatement
├── Balance General (activo, pasivo, patrimonio)
├── Estado de Resultados (ingresos, costos, margen)
├── Flujo de Caja (operativo, inversión, financiamiento)
├── Ratios (liquidez, solvencia, rentabilidad, eficiencia)
├── Forecast (proyección 12 meses)
├── Escenarios (optimista, pesimista, base)
├── Stress Test (sube IVA, cae venta, sube tasa)
└── Alertas (detección temprana de desviaciones)
```

### 4b. Economía de la Consultora (MSP — Management Self-Platform)

**Agregados:** Revenue, MRR, ARR, Utilization, CAC, LTV, Churn

```
Métrica                │ Descripción
───────────────────────┼────────────────────────────────
MRR / ARR              │ Ingreso mensual/anual recurrente
Utilización            │ % de horas facturables de consultores
Costo/Hora             │ Costo total / horas disponibles
Margen por proyecto    │ Ingreso - costo directo
CAC                    │ Costo de adquisición de cliente
LTV                    │ Valor de vida del cliente
Churn                  │ Tasa de cancelación mensual
EBITDA                 │ Utilidad operativa
Cash Burn              │ Consumo mensual de caja
Pipeline Value         │ Valor total de oportunidades abiertas
```

**Reglas de dominio:**
- Utilización < 60% → alerta de capacidad ociosa
- Churn > 5% → revisar satisfacción de clientes
- CAC > LTV/3 → ajustar estrategia de adquisición

---

## 5. AI CONTEXT (AI Orchestrator)

Sistema multiagente con orquestador, no solo agentes sueltos.

**Agregados:** Agent, Conversation, Prompt, Memory, Cost

```
Usuario (consulta o sube documentos)
    │
    ▼
┌─────────────────────────────────────────┐
│ ROUTER IA                                │
│ Decide qué ruta tomar según el input     │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│ ANALIZADOR DE CONTEXTO                   │
│ Examina: historial, documentos, memoria  │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│ PLANIFICADOR                             │
│ Genera plan de ejecución:                │
│ qué agentes llamar, en qué orden         │
└────────────────┬────────────────────────┘
                 │
    ┌────────────┼────────────┬──────────────┐
    ▼            ▼            ▼              ▼
┌────────┐ ┌────────┐ ┌────────┐   ┌──────────┐
│ AGENTE │ │ AGENTE │ │ AGENTE │   │ AGENTE   │
│ FINAN- │ │ TRIBU- │ │ RIESGO │   │ COMER-   │
│ CIERO  │ │ TARIO  │ │        │   │ CIAL     │
└───┬────┘ └───┬────┘ └───┬────┘   └────┬─────┘
    │          │          │              │
    └──────────┼──────────┼──────────────┘
               ▼          ▼
┌─────────────────────────────────────────┐
│ SUPERVISOR                               │
│ Valda coherencia, detecta conflictos     │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│ VALIDADOR                                │
│ Verdad contra datos reales, fuentes      │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│ FUSIONADOR                               │
│ Combina respuestas en un solo informe    │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│ MEMORIA                                  │
│ Guarda: conversación, decisiones,        │
│ resultados → mejora futura               │
└────────────────┬────────────────────────┘
                 │
                 ▼
          Respuesta final al usuario
```

### AI Cost Engine
```
Cada consulta registra:
├── Modelo usado (GPT-4, Claude, Gemini, propio)
├── Tokens (input + output)
├── Costo ($)
├── Tiempo de respuesta (ms)
├── Calidad (score 1-5, feedback humano)
└── Cache hit/miss
```

**Reglas de dominio:**
- Consultas repetitivas → cache automático
- Costo mensual por agente → alerta si excede presupuesto
- Modelo barato para tareas simples, caro para complejas

---

## 6. KNOWLEDGE CONTEXT (Knowledge Graph)

No guardamos documentos, guardamos **conocimiento conectado**.

**Agregados:** KnowledgeNode, KnowledgeRelation, KnowledgeGraph

```
Cliente ─── tiene ─── Problema
             │
             ├── se aplica ─── Norma (NIIF, NIC, ley tributaria)
             │
             ├── se ejecutó ─── Estrategia
             │                    │
             │                    └── produjo ─── Resultado
             │                                    │
             │                                    ├── éxito
             │                                    └── fracaso (lección)
             │
             └── generó ─── Recomendación
                              │
                              └── se reutilizó en ─── OtroCliente
```

**La IA aprende de cada caso:**
```
Caso 1: Cliente A, problema X, estrategia Y → resultado Z
Caso 2: Cliente B, problema similar, IA recomienda Y adaptado
...
Caso N: Patrón detectado → recomendación automática
```

**Reglas de dominio:**
- Todo proyecto alimenta el knowledge graph automáticamente
- Recomendaciones mejoran con el tiempo (learning loop)
- Búsqueda semántica sobre conocimiento acumulado (Vector DB)

---

## 7. DECISION CONTEXT (Decision Engine)

El alma del software. No solo reglas — **razona**.

**Agregados:** DecisionRule, DecisionTree, Scenario

```
Input del cliente
├── Liquidez: 0.8 (mala)
├── Deuda/Patrimonio: 2.5 (alta)
├── Ventas: -15% (cayendo)
├── IVA pendiente: sí
└── Nómina: +20% (creciendo)
    │
    ▼
┌─────────────────────────────────────────┐
│ DECISION ENGINE                          │
│                                         │
│ Evalúa múltiples factores simultáneamente│
│                                         │
│ Resultado: RIESGO MUY ALTO (score 85/100)│
│                                         │
│ Propone:                                 │
│   Plan A: Restructuración de deuda      │
│   Plan B: Reducción de gastos operativos│
│   Plan C: Línea de crédito puente       │
│                                         │
│ Cada plan con:                           │
│   - Probabilidad de éxito               │
│   - Impacto esperado                    │
│   - Plazo recomendado                   │
│   - Pasos concretos                     │
└─────────────────────────────────────────┘
```

---

## 8. SIMULATION CONTEXT (Simulation Engine)

**¿Qué pasa si...?**

```
Escenarios que el usuario puede simular:
├── Sube IVA del 12% al 15%
├── Caen ventas 20%
├── Dólar se aprecia 10%
├── Tasa de interés sube 3%
├── Nuevo préstamo $50K
├── Contratar 2 empleados
├── Cambiar proveedor (ahorro 5%)
├── Cliente paga en 60 días vs 30
└── Personalizado (cualquier variable)
```

Cada escenario genera:
```
┌─────────────────────────────────────────┐
│ Impacto en:                              │
│   - Balance                              │
│   - Resultados                           │
│   - Flujo de caja                        │
│   - Ratios clave                         │
│   - Score crediticio                     │
│   - Riesgo                               │
│                                          │
│ Comparación: actual vs simulado          │
│ Visualización: gráficos interactivos     │
│ Exportación: PDF con escenarios          │
└─────────────────────────────────────────┘
```

---

## 9. ECOSYSTEM CONTEXT

La plataforma crece con su comunidad.

**Agregados:** Plugin, Template, Marketplace, Partner

```
Marketplace
├── Plantillas de workflow (BPM predefinidos)
├── Agentes IA (nuevos modelos, especialidades)
├── Dashboards preconfigurados
├── Indicadores/KPIs
├── Reglas de negocio
├── Reportes
└── Cursos y certificaciones
    │
    ▼
Plugin System (como WordPress)
├── API pública para desarrolladores externos
├── Instalación 1-click
├── Sandbox de pruebas
├── Versiones y actualizaciones
└── Monetización (comisión 30%)

Partners
├── Consultoras que revenden la plataforma
├── Contadores/auditores independientes
├── Firmas de software complementario
└── Revenue share
```

---

## 10. INFRAESTRUCTURA TRANSVERSAL

### Event Bus (Arquitectura basada en eventos)

```
Eventos del sistema (asíncronos):
├── Documento.subido → IA procesa, Workflow avanza
├── Cliente.creado → CRM actualiza, Dashboard refresca
├── Análisis.completado → Notifica, genera informe
├── Riesgo.detectado → Alerta, crea tarea
├── Contrato.por_vencer → Workflow renovación
├── Mensaje.recibido → Clasifica, asigna, responde
└── KPI.alcanzado → Celebración automática

Cada evento:
├── Es inmutable (registro de auditoría)
├── Tiene payload y metadata
├── Es consumido por N suscriptores
└── Se persiste para replay
```

### Data Architecture

```
┌──────────────┐
│ PostgreSQL   │ ← Datos transaccionales (Prisma ORM)
├──────────────┤
│ Data Lake    │ ← Archivos, logs, eventos históricos (MinIO)
├──────────────┤
│ Vector DB    │ ← Embeddings para búsqueda semántica
├──────────────┤
│ Warehouse    │ ← BI, reportes agregados (OLAP)
├──────────────┤
│ Cache        │ ← Redis (sesiones, rate limit, consultas IA)
└──────────────┘
```

### Plugin Architecture

```
┌─────────────────────────────────────────┐
│ HOST (Consulting OS)                     │
│                                          │
│  PluginManager                           │
│  ├── Loader (carga plugins)              │
│  ├── Sandbox (aislamiento)               │
│  ├── Hook System (puntos de extensión)   │
│  └── EventBus (comunicación)             │
│                                          │
│  Extension Points:                       │
│  ├── ai.orchestrator.agent               │
│  ├── consulting.workflow.step            │
│  ├── dashboard.widget                    │
│  ├── api.endpoint                        │
│  ├── knowledge.source                    │
│  └── ui.component                        │
└─────────────────────────────────────────┘
```

### Memory System (Memoria Empresarial)

```
Capas de memoria:
├── Por conversación (contexto inmediato)
├── Por proyecto (historial completo)
├── Por cliente (todas las interacciones)
├── Por empresa (patrones transversales)
└── Global (anónimo, mejora el producto)
```

---

## Mapa de relaciones entre contextos

```
IDENTITY ──── propietario de ──── todos los contextos
     │
     ├── CRM ──── crea ──── CLIENTE
     │
     ├── CLIENTE ──── tiene ──── CONSULTING (proyectos)
     │                           │
     │                           └── genera ──── FINANCE (análisis)
     │                                           │
     │                                           └── alimenta ──── KNOWLEDGE
     │                                                           │
     │                                                           └── mejora ──── AI
     │                                                                           │
     │                                                                           ├── usa ──── DECISION
     │                                                                           └── corre ──── SIMULATION
     │
     └── todo ──── observado por ──── EVENT BUS
                                                     │
                                                     └── persiste ──── DATA LAKE
```

---

## Principios de dominio (revisados)

1. **Tenant aislado**: ningún usuario ve datos de otra empresa (Row-Level Security + middleware)
2. **Cliente-centrismo por contexto**: CRM capta, Consulting ejecuta, Finance analiza, Knowledge acumula
3. **Event-driven**: todo cambio significativo es un evento que N suscriptores procesan
4. **IA multiagente orquestada**: Router → Planner → Agents → Supervisor → Validator → Fusioner → Memory
5. **Conocimiento como activo**: cada caso enriquece el knowledge graph; la IA mejora con el tiempo
6. **Sin código**: reglas, BPM, KPIs y dashboards configurables visualmente
7. **Plataforma, no app**: API pública, plugin system, marketplace, ecosistema de partners
8. **Decision-first**: el motor de decisiones razona, no solo ejecuta reglas
9. **Simulación continua**: cada variable es simulable antes de decidir
10. **Autoconocimiento (MSP)**: la consultora se analiza a sí misma con las mismas herramientas que a sus clientes
