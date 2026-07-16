# ROADMAP

## Plan de implementación por sprints

Este documento define el orden de implementación del sistema completo, por bounded context y entregas funcionales. Cada sprint produce un incremento de producto validable.

---

## Fase 0: Foundation (Sprint 0)

**Duración:** 1 semana
**Objetivo:** Base técnica para todos los sprints siguientes

```
Deliverables:
├── Prisma schema definitivo (47 modelos)
├── Migrations + seed realista (3 empresas, 10 usuarios, 20 clientes)
├── Multi-tenant middleware (funcional + probado)
├── Auth (login/register con Supabase o JWT local)
├── RBAC middleware (roles + permisos por endpoint)
├── Auditoría transversal (cada API escribe AuditLog)
├── Config catalog service (config_entries table)
├── Layout base (sidebar por rol, navegación)
└── Docker infra estable (postgres, redis, minio)

Pruebas:
├── Seed multi-tenant: Empresa A no ve datos de Empresa B
├── Auth flow: registro → login → acceso a ruta protegida
├── RBAC: consultor no accede a /director/*
└── Audit: cada create/update genera AuditLog
```

---

## Sprint 1: Identity

**Duración:** 1 semana
**Objetivo:** Gestión de empresa, usuarios y roles

```
Historias:
├── Como admin, quiero configurar mi empresa (datos, sucursales, deptos)
├── Como admin, quiero invitar/crear usuarios con rol
├── Como admin, quiero gestionar roles y permisos
├── Como usuario, quiero ver mi perfil y cambiar mi contraseña
└── Como sistema, quiero registrar toda actividad en audit_logs

Páginas a conectar:
├── /admin/empresa (configuración del tenant)
├── /admin/usuarios (CRUD de usuarios)
├── /admin/roles (matriz de permisos)
├── /consultor/perfil
└── /director/configuracion/equipo

API endpoints: 15 (auth, company, users, roles)
Pruebas: Login/logout, CRUD usuarios, asignación de roles
```

---

## Sprint 2: CRM

**Duración:** 1.5 semanas
**Objetivo:** Pipeline comercial completo

```
Historias:
├── Como consultor, quiero registrar un lead desde cualquier fuente
├── Como consultor, quiero calificar leads (BANT + score automático)
├── Como consultor, quiero registrar actividades (llamada, email, reunión)
├── Como director, quiero ver el pipeline de ventas (kanban)
├── Como consultor, quiero convertir lead a cliente
└── Como director, quiero ver reportes de conversión

Páginas a conectar:
├── /director/leads (kanban pipeline)
├── /director/oportunidades
├── /consultor/clientes/nuevo (desde lead)
└── /consultor/clientes/:id (ficha básica)

API endpoints: 18 (leads, activities, opportunities)
Pruebas: Lead → activity → conversion → cliente creado
```

---

## Sprint 3: Clients

**Duración:** 1.5 semanas
**Objetivo:** Gestión completa de clientes

```
Historias:
├── Como consultor, quiero ver la ficha completa del cliente
├── Como consultor, quiero gestionar contactos, rep. legales, accionistas
├── Como consultor, quiero ver la timeline del cliente
├── Como cliente, quiero ver mi dashboard desde el portal
└── Como director, quiero segmentar clientes por industria/segmento/score

Páginas a conectar:
├── /consultor/clientes/:id (ficha completa con tabs)
├── /consultor/clientes/:id/contactos
├── /consultor/clientes/:id/timeline
├── /cliente/dashboard
└── /director/clientes (lista global + filtros)

API endpoints: 22
Pruebas: CRUD cliente + contactos + timeline events
```

---

## Sprint 4: Documentos

**Duración:** 2 semanas
**Objetivo:** Subida, procesamiento y versionado de documentos

```
Historias:
├── Como cliente, quiero subir documentos (drag & drop)
├── Como sistema, quiero procesar documentos (clasificar, extraer, validar)
├── Como consultor, quiero ver documentos procesados con datos extraídos
├── Como consultor, quiero versionar documentos
├── Como usuario, quiero buscar documentos por tipo/cliente/período
└── Como sistema, quiero almacenar en MinIO con estructura tenant-scoped

Páginas a conectar:
├── /cliente/documentos/subir
├── /cliente/documentos
├── /consultor/documentos
├── /consultor/clientes/:id/documentos
└── /consultor/documentos/:id (detalle con datos extraídos)

API endpoints: 12
Pruebas: Upload → IA procesa → datos extraídos → versión
```

---

## Sprint 5: Finance

**Duración:** 2 semanas
**Objetivo:** Dashboard financiero + KPIs + reportes

```
Historias:
├── Como consultor, quiero ver estados financieros del cliente
├── Como consultor, quiero ver ratios automáticos (liquidez, solvencia, etc.)
├── Como director, quiero configurar KPIs personalizados
├── Como consultor, quiero generar reportes PDF/Excel
├── Como cliente, quiero ver mi dashboard financiero
└── Como director, quiero ver KPIs de la firma (MRR, ARR, churn, utilización)

Páginas a conectar:
├── /consultor/clientes/:id/financiero (dashboard financiero)
├── /consultor/clientes/:id/ratios
├── /consultor/reportes/generar
├── /cliente/dashboard-financiero
├── /director/dashboard (KPIs de la firma)
└── /consultor/clientes/:id/forecast

API endpoints: 16
Pruebas: Carga statement → ratios calculados → reporte PDF
```

---

## Sprint 6: Projects & Tasks

**Duración:** 2 semanas
**Objetivo:** Gestión de proyectos con Kanban

```
Historias:
├── Como consultor, quiero crear proyectos para un cliente
├── Como consultor, quiero gestionar tareas (Kanban board)
├── Como consultor, quiero crear hitos y riesgos
├── Como director, quiero ver carga de trabajo del equipo
└── Como consultor, quiero ver dependencias entre tareas

Páginas a conectar:
├── /consultor/proyectos (lista + kanban)
├── /consultor/proyectos/:id (detalle con tabs)
├── /consultor/proyectos/:id/tareas (kanban)
├── /consultor/proyectos/:id/hitos
├── /consultor/proyectos/:id/riesgos
└── /director/equipo/:id/carga (carga de trabajo)

API endpoints: 20
Pruebas: Proyecto → tareas → kanban → hitos → riesgos
```

---

## Sprint 7: Workflows & Rules

**Duración:** 3 semanas
**Objetivo:** BPM + Rule Engine

```
Historias:
├── Como director, quiero crear workflows con editor visual (drag & drop)
├── Como director, quiero definir reglas SI → ENTONCES sin código
├── Como sistema, quiero ejecutar workflows automáticamente
├── Como director, quiero monitorear instancias activas
├── Como consultor, quiero ver workflows asignados
└── Como sistema, quiero ejecutar reglas ante eventos

Páginas a conectar:
├── /director/workflows/nuevo (editor visual)
├── /director/workflows (lista de definiciones)
├── /director/workflows/instancias (monitor)
├── /director/reglas (lista)
├── /director/reglas/nueva (editor de reglas)
└── /director/reglas/:id (detalle con ejecuciones)

API endpoints: 18
Pruebas: Workflow completo (inicio → pasos → fin), regla → evento → acción
```

---

## Sprint 8: IA

**Duración:** 3 semanas
**Objetivo:** Análisis con IA multi-agente

```
Historias:
├── Como consultor, quiero ejecutar análisis financiero con IA
├── Como consultor, quiero ejecutar análisis tributario con IA
├── Como consultor, quiero diagnosticar un cliente completo (multi-agente)
├── Como consultor, quiero chatear con IA sobre un cliente
├── Como sistema, quiero registrar trazabilidad completa (AiTrace)
├── Como director, quiero ver dashboard de costos de IA
├── Como director, quiero configurar prompts y agentes
└── Como sistema, quiero aplicar límites de plan (créditos/mes)

Páginas a conectar:
├── /consultor/ia/analizar (nuevo análisis)
├── /consultor/ia/conversaciones
├── /consultor/ia/conversaciones/:id (chat)
├── /consultor/clientes/:id/analisis (dashboard análisis)
├── /director/ia/agentes (configuración)
├── /director/ia/prompts (plantillas)
└── /director/ia/costos (dashboard)

API endpoints: 14
Pruebas: Análisis multi-agente → resultado fusionado → AiTrace → costo calculado
```

---

## Sprint 9: Decision & Simulation

**Duración:** 2 semanas
**Objetivo:** Motor de decisiones + simulaciones

```
Historias:
├── Como consultor, quiero evaluar la salud financiera de un cliente
├── Como consultor, quiero ver planes A/B/C con probabilidades
├── Como consultor, quiero seleccionar un plan y generar recomendaciones
├── Como consultor, quiero simular "¿qué pasa si...?"
└── Como director, quiero ver historial de decisiones por cliente

Páginas a conectar:
├── /consultor/decisiones/evaluar
├── /consultor/decisiones/historial
├── /consultor/simulaciones/nueva
├── /consultor/clientes/:id/decisiones
└── /consultor/simulaciones/:id (resultado)

API endpoints: 8
Pruebas: Evaluar → score → planes → seleccionar → recomendaciones
```

---

## Sprint 10: Knowledge Graph

**Duración:** 2 semanas
**Objetivo:** Motor de conocimiento conectado

```
Historias:
├── Como sistema, quiero indexar automáticamente cada proyecto en el KG
├── Como consultor, quiero buscar conocimiento previo (semántico)
├── Como consultor, quiero ver recomendaciones basadas en casos similares
├── Como director, quiero visualizar el grafo de conocimiento
└── Como sistema, quiero mejorar respuestas IA con KG

Páginas a conectar:
├── /director/conocimiento/buscar
├── /director/conocimiento/grafo (visualización)
├── /director/conocimiento/estadisticas
└── (integración en resultados de IA)

API endpoints: 8
Pruebas: Indexar proyecto → buscar semánticamente → recomendación basada en casos
```

---

## Sprint 11: Ecosystem

**Duración:** 2 semanas
**Objetivo:** Marketplace, plugins, API pública, integraciones

```
Historias:
├── Como admin, quiero instalar plugins del marketplace
├── Como admin, quiero configurar integraciones (Stripe, email, etc.)
├── Como desarrollador, quiero usar la API pública documentada
├── Como admin, quiero gestionar webhooks
└── Como director, quiero ver facturación y planes

Páginas a conectar:
├── /admin/plugins (plugin store)
├── /admin/integraciones
├── /director/facturacion (plan actual + historial)
└── /precios (pricing page)

API endpoints: ~20 (públicos + webhooks + billing)
Pruebas: API key → rate limit → webhook → facturación
```

---

## Resumen de sprints

```
Sprint  │ Duración │ Entregable              │ Endpoints │ Páginas
────────┼──────────┼─────────────────────────┼───────────┼─────────
0       │ 1 sem    │ Foundation              │ —         │ —
1       │ 1 sem    │ Identity                │ 15        │ 5
2       │ 1.5 sem  │ CRM                     │ 18        │ 4
3       │ 1.5 sem  │ Clients                 │ 22        │ 5
4       │ 2 sem    │ Documentos              │ 12        │ 5
5       │ 2 sem    │ Finance                 │ 16        │ 6
6       │ 2 sem    │ Projects & Tasks        │ 20        │ 6
7       │ 3 sem    │ Workflows & Rules       │ 18        │ 6
8       │ 3 sem    │ IA                      │ 14        │ 7
9       │ 2 sem    │ Decision & Simulation   │ 8         │ 5
10      │ 2 sem    │ Knowledge Graph         │ 8         │ 3
11      │ 2 sem    │ Ecosystem               │ 20        │ 4
────────┼──────────┼─────────────────────────┼───────────┼─────────
Total   │ 23 sem   │ 11 sprints              │ ~171      │ ~56
        │ (~6 meses)│                        │           │
```
