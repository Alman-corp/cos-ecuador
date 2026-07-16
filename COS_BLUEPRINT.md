# CONSULTING OPERATING SYSTEM — BLUEPRINT MAESTRO

**Versión:** 1.0 · **Clasificación:** CONFIDENCIAL · **Junio 2026**
**Objetivo:** Automatizar el 95% del trabajo operativo de una consultora de élite.

---

## ÍNDICE ARQUITECTÓNICO

1. [VISIÓN DEL SISTEMA](#1-visión-del-sistema)
2. [ARQUITECTURA DE ALTO NIVEL](#2-arquitectura-de-alto-nivel)
3. [MAPEO DE MÓDULOS](#3-mapeo-de-módulos)
4. [MODELO DE DATOS (ERD LÓGICO)](#4-modelo-de-datos)
5. [ECOSISTEMA DE AGENTES IA](#5-ecosistema-de-agentes-ia)
6. [WORKFLOW ENGINE](#6-workflow-engine)
7. [ARQUITECTURA TÉCNICA](#7-arquitectura-técnica)
8. [PLAN DE FASES](#8-plan-de-fases)
9. [CATÁLOGO DE AUTOMATIZACIONES](#9-catálogo-de-automatizaciones)
10. [MÉTRICAS DE ÉXITO](#10-métricas-de-éxito)

---

## 1. VISIÓN DEL SISTEMA

### 1.1 Declaración de Visión

 construir la consultora más automatizada del mundo. Un sistema donde un cliente ingrese y la plataforma sea capaz de realizar automáticamente: diagnóstico, auditoría, análisis financiero, legal, tributario, administrativo, generación de informes, estrategias, planes, seguimiento, comunicación, documentación, recordatorios, reuniones, dashboards, KPIs — todo sin depender constantemente de personas.

### 1.2 Principios de Diseño

| Principio | Descripción |
|-----------|-------------|
| **Zero-ops primero** | Todo proceso repetitivo debe automatizarse antes de asignarse a un humano |
| **IA nativa** | Cada módulo tiene un agente IA especializado como interfaz por defecto |
| **Event-driven** | El sistema reacciona a eventos en lugar de depender de acciones manuales |
| **Knowledge-first** | Todo documento, decisión e interacción se indexa y es consultable |
| **Multi-tenant jerárquico** | Empresas → Sucursales → Departamentos → Usuarios |
| **Auditabilidad total** | Cada acción es trazable, versionada e inmutable |
| **Offline-conscious** | El sistema debe funcionar en condiciones de conectividad limitada |

### 1.3 Lo que NO es

- No es un CRM (aunque tiene gestión de clientes)
- No es un ERP (aunque tiene finanzas y operaciones)
- No es un dashboard (aunque tiene BI)
- Es un **Sistema Operativo para Consultoras** que integra TODO

---

## 2. ARQUITECTURA DE ALTO NIVEL

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           CLIENTE LAYER                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Portal       │  │ Portal      │  │ Portal      │  │ API Pública         │  │
│  │ Cliente      │  │ Consultor   │  │ Director    │  │ (REST/GraphQL)      │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├──────────────────────────────────────────────────────────────────────────────┤
│                        API GATEWAY (Kong/KrakenD)                             │
│                     Auth · Rate Limit · Routing · Logging                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                         MICROSERVICES LAYER (NestJS)                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Identity  │ │ Client   │ │ Document │ │ Finance  │ │ Workflow Engine  │   │
│  │ Service   │ │ Service  │ │ Service  │ │ Service  │ │                  │   │
│  ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤ ├──────────────────┤   │
│  │ Tax       │ │ Legal    │ │ Project  │ │ BI       │ │ Intelligence     │   │
│  │ Service   │ │ Service  │ │ Service  │ │ Service  │ │ Center           │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
├──────────────────────────────────────────────────────────────────────────────┤
│                         AI ORCHESTRATION LAYER                                │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────────────────────┐ │
│  │ Orchestrator  │  │ Agent        │  │ RAG Engine (Qdrant + Elasticsearch)│ │
│  │ (LangGraph)   │  │ Runtime      │  │ ISD Tracing · Embeddings · Ranking │ │
│  └──────────────┘  └──────────────┘  └─────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────┤
│                         INFRASTRUCTURE LAYER                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐ │
│  │PostgreSQL │ │ Redis    │ │RabbitMQ  │ │Elastic   │ │ MinIO    │ │K8s   │ │
│  │+ Prisma   │ │ Cache    │ │Events    │ │Search    │ │ Storage  │ │Pods  │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. MAPEO DE MÓDULOS

### M1 · Identidad Corporativa

| Submódulo | Descripción |
|-----------|-------------|
| Empresas | Gestión multi-tenant con ciclo de vida completo |
| Sucursales | Ubicaciones, datos fiscales por jurisdicción |
| Marcas | Portfolio de marcas con identidad visual |
| Departamentos | Estructura organizacional jerárquica |
| Usuarios | Profiles, autenticación, 2FA, SSO (Keycloak) |
| Roles y Permisos | RBAC dinámico por módulo/operación/dato |
| Jerarquías | Líneas de reporte, matriz de aprobación |
| Organigrama | Visualización interactiva del organigrama |

### M2 · Clientes

| Submódulo | Descripción |
|-----------|-------------|
| Empresas Cliente | Datos completos, industria, tamaño, score |
| Contactos | Múltiples contactos por cliente con roles |
| Representantes Legales | Vinculación jurídica con documentos |
| Accionistas | Estructura de propiedad, participación |
| Historial | Línea de tiempo completa de interacciones |
| Reuniones | Minutas, acuerdos, seguimiento |
| Problemas | Issues tracking con resolución automática |
| Objetivos | OKRs del cliente vinculados a proyectos |
| Contratos | Gestión de contratos con versionado |
| Facturación | Ciclo completo de facturación |
| Tickets | Sistema de tickets con IA de clasificación |
| Documentos | Repositorio por cliente con control de acceso |
| Cronología | Timeline unificada de todo lo anterior |

### M3 · Motor Documental

| Submódulo | Descripción |
|-----------|-------------|
| Ingesta Automática | OCR, clasificación, extracción por IA |
| Indexación | Elasticsearch + embeddings vectoriales |
| Categorización | Taxonomía automática por tipo de documento |
| Versionado | Historial completo con diff semántico |
| Búsqueda | Híbrida: léxica + semántica + filtros |
| Relaciones | Documentos vinculados entre sí y a entidades |
| Compliance | Retención, expiración, permisos legales |
| Firma Electrónica | Integración con proveedores de firma digital |

### M4 · Motor IA

| Agente | Especialidad |
|--------|-------------|
| IA Contable | Clasificación de cuentas, reconciliación, ajustes |
| IA Tributaria | Cálculo de impuestos, anexos, declaraciones |
| IA Financiera | Análisis de estados financieros, ratios, DCF |
| IA Comercial | Análisis de mercado, competencia, pricing |
| IA RRHH | Análisis de nómina, clima laboral, rotación |
| IA Legal | Revisión de contratos, cumplimiento, riesgos |
| IA Riesgos | Identificación y cuantificación de riesgos |
| IA Planeación | Estrategia, escenarios, roadmaps |
| IA Marketing | SEO, contenido, campañas, embudo |
| IA Estrategia | Síntesis de alto nivel, recomendaciones C-level |
| **Orquestador** | Enrutamiento, coordinación, calidad, escalamiento |

### M5 · Workflow Engine

| Componente | Descripción |
|-----------|-------------|
| Trigger Registry | Catálogo de eventos que inician workflows |
| Step Definitions | Atomic business operations |
| Flow Builder | Editor visual de secuencias (DAG) |
| Condition Engine | Ramificación basada en datos y reglas |
| Human Tasks | Puntos de decisión manual con SLA |
| Integrations | Conexión con todos los módulos |
| Monitoring | Visibilidad en tiempo real de ejecuciones |
| Retry Logic | Reintentos inteligentes con backoff |

### M6 · Business Intelligence

| Componente | Descripción |
|-----------|-------------|
| Dashboard Ejecutivo | KPIs en tiempo real personalizados por rol |
| Ratios Financieros | Liquidez, solvencia, rentabilidad, eficiencia |
| Forecast | Proyecciones con ML (ARIMA, Prophet, LSTM) |
| Alertas Inteligentes | Thresholds dinámicos con detección de anomalías |
| Comparativas | Benchmark sectorial, histórico, presupuesto |
| Reportes Automáticos | Generación programada de informes PDF/Excel |
| Data Warehouse | Esquema en estrella para análisis OLAP |

### M7 · Gestión de Proyectos

| Componente | Descripción |
|-----------|-------------|
| Kanban | Tablero visual por proyecto |
| Scrum | Sprints, retrospectivas, velocity |
| Cronograma | Línea de tiempo con milestones |
| Gantt | Dependencias, ruta crítica, recursos |
| Entregables | Seguimiento con aprobación |
| Riesgos | Matriz de probabilidad e impacto |
| Costos | Presupuesto vs real, facturación por proyecto |
| Horas | Time tracking con integración a payroll |

### M8 · Automatizaciones

| Componente | Descripción |
|-----------|-------------|
| Email Automation | Recepción → clasificación → acción |
| Document Intelligence | Documento entrante → extracción → registro |
| Notification Engine | Reglas de notificación multicanal |
| Scheduled Tasks | Jobs programados (cron) |
| Webhook Gateway | Eventos salientes a sistemas externos |
| Integration Bridge | Conectores pre-construidos (SRI, BCE, etc.) |

### M9 · Motor Financiero

| Componente | Descripción |
|-----------|-------------|
| DCF Engine | Valuación por flujo de caja descontado |
| WACC/CAPM | Cálculo automatizado de costo de capital |
| VPN/TIR | Evaluación de proyectos de inversión |
| Liquidez | Ratios, capital de trabajo, necesidades operativas |
| Stress Testing | Escenarios múltiples con Monte Carlo |
| Optimización | Estructura de capital, política de dividendos |

### M10 · Motor Tributario

| Componente | Descripción |
|-----------|-------------|
| IVA | Cálculo, declaración, cruces, devoluciones |
| Renta | Determinación, anticipos, ajustes |
| Retenciones | Clasificación, declaración, anexos |
| Anexos | Generación automática (ATS, REOC, etc.) |
| Calendario | Fechas clave con alertas personalizadas |
| Simulaciones | Escenarios de planificación fiscal |

### M11 · Motor Legal

| Componente | Descripción |
|-----------|-------------|
| Contratos | Template engine + versionado + firma |
| Obligaciones | Seguimiento de cumplimiento regulatorio |
| Riesgos Legales | Identificación y cuantificación |
| Litigios | Seguimiento de casos con cronología |
| Compliance | Checklist automatizado vs normativa |

### M12 · Centro de Inteligencia

| Componente | Descripción |
|-----------|-------------|
| Cross-module Analysis | Correlación entre datos financieros, tributarios, legales |
| Anomaly Detection | Alertas tempranas de fraude, desviaciones, pérdidas |
| Opportunity Mining | Identificación automática de oportunidades |
| Reportes Ejecutivos | Síntesis IA para la dirección |
| Recomendaciones | Suggestions accionables con priorización |

### M13 · Portal Cliente

| Componente | Descripción |
|-----------|-------------|
| Dashboard Personalizado | KPIs relevantes para el cliente |
| Proyectos | Vista de avance, entregables, hitos |
| Documentos | Repositorio de documentos compartidos |
| Reportes | Informes generados automáticamente |
| Mensajes | Comunicación directa con consultores |
| Facturas | Historial y estado de facturación |
| Reuniones | Agenda, minutas, acuerdos |
| IA Cliente | Asistente virtual para consultas |

### M14 · Portal Consultor

| Componente | Descripción |
|-----------|-------------|
| Agenda | Calendario unificado con integración Google/Outlook |
| Clientes | Cartera de clientes asignados |
| Alertas | Notificaciones prioritarias |
| IA Asistente | Copiloto para análisis y generación de contenido |
| Proyectos | Tablero de proyectos activos |
| Documentos | Repositorio de trabajo |
| KPIs | Metas personales y del equipo |
| Chat | Comunicación interna y con clientes |
| Automatizaciones | Configuración de reglas personales |

### M15 · Portal Director

| Componente | Descripción |
|-----------|-------------|
| Rentabilidad | Margen por proyecto, cliente, consultor |
| Consultores | Productividad, utilización, desempeño |
| Pipeline | Embudo de ventas con forecast |
| Ingresos | MRR, ARR, crecimiento, churn |
| Flujo de Caja | Proyección y estado actual |
| IA Estratégica | Recomendaciones de alto nivel |
| Riesgos | Mapa de riesgos corporativos |
| OKRs | Seguimiento de objetivos estratégicos |

---

## 4. MODELO DE DATOS

### 4.1 Dominios Principales (~300 tablas estimadas)

```
DOMAIN: IDENTITY (~25 tablas)
├── companies
├── branches
├── brands
├── departments
├── users
├── roles
├── permissions
├── role_permissions
├── user_roles
├── org_chart_nodes
├── org_chart_edges
├── address_book
├── phone_numbers
├── emails
├── social_links
├── company_settings
├── audit_log (global)
├── sessions
├── api_keys
├── mfa_devices
├── login_attempts
├── password_history
├── company_documents
├── integrations_config
└── notification_preferences

DOMAIN: CLIENTS (~30 tablas)
├── client_companies
├── client_contacts
├── client_legal_reps
├── client_shareholders
├── client_industries
├── client_segments
├── client_scores
├── client_status_history
├── interactions
├── meetings
├── meeting_attendees
├── meeting_agreements
├── issues
├── issue_comments
├── objectives (OKRs)
├── key_results
├── contracts
├── contract_versions
├── invoices
├── invoice_items
├── payments
├── tickets
├── ticket_comments
├── ticket_assignments
├── ticket_sla
├── client_documents
├── document_versions
├── document_shares
├── timeline_events
└── client_notes

DOMAIN: FINANCE (~40 tablas)
├── accounts
├── account_types
├── account_groups
├── journal_entries
├── journal_lines
├── financial_statements
├── statement_lines
├── ratios
├── ratio_definitions
├── budgets
├── budget_lines
├── projections
├── projection_lines
├── dcf_assumptions
├── dcf_results
├── monte_carlo_simulations
├── monte_carlo_iterations
├── scenarios
├── scenario_variables
├── wacc_components
├── cost_of_equity
├── cost_of_debt
├── valuation_results
├── synergy_quantifications
├── transaction_advisory
├── due_diligence_items
├── due_diligence_documents
├── capital_optimization
├── dividend_policies
├── debt_schedules
├── stress_test_results
├── forex_transactions
├── cash_forecasts
├── cash_flow_lines
├── working_capital_items
├── kpi_definitions
├── kpi_values
├── alerts
├── alert_thresholds
└── alert_history

DOMAIN: TAX (~25 tablas)
├── tax_registrations
├── tax_obligations
├── tax_periods
├── tax_returns
├── tax_return_lines
├── vat_returns
├── vat_credits
├── vat_debits
├── income_tax_returns
├── income_tax_schedules
├── withholding_tax_certificates
├── withholding_tax_returns
├── annexes (ATS, REOC, etc.)
├── annexe_lines
├── tax_audits
├── tax_liabilities
├── tax_payments
├── tax_credits
├── tax_exemptions
├── tax_calendar
├── tax_alerts
├── tax_simulations
├── cross_reference_results
├── tax_reconciliation
└── transfer_pricing_docs

DOMAIN: LEGAL (~20 tablas)
├── legal_entities
├── contracts_templates
├── contracts
├── contract_clauses
├── contract_parties
├── contract_approvals
├── obligations
├── obligation_tracking
├── litigation_cases
├── litigation_events
├── litigation_documents
├── compliance_checklists
├── compliance_results
├── legal_risks
├── risk_matrix
├── ip_assets
├── trademarks
├── patents
├── legal_calendar
└── power_of_attorneys

DOMAIN: DOCUMENTS (~15 tablas)
├── document_store
├── document_types
├── document_categories
├── document_tags
├── document_versions
├── document_chunks
├── document_embeddings
├── document_relations
├── document_shares
├── document_comments
├── document_tasks (OCR, classification)
├── ocr_results
├── classification_results
├── extraction_results
└── document_audit

DOMAIN: PROJECTS (~20 tablas)
├── projects
├── project_teams
├── project_milestones
├── tasks
├── task_assignments
├── task_dependencies
├── task_comments
├── sprints
├── sprint_backlog
├── kanban_boards
├── kanban_columns
├── kanban_cards
├── gantt_tasks
├── project_risks
├── project_budgets
├── project_costs
├── time_entries
├── deliverables
├── deliverable_approvals
└── project_templates

DOMAIN: WORKFLOW (~15 tablas)
├── workflow_definitions
├── workflow_versions
├── workflow_steps
├── step_conditions
├── workflow_triggers
├── workflow_executions
├── execution_steps
├── execution_logs
├── human_tasks
├── human_task_assignments
├── sla_definitions
├── sla_tracking
├── integration_connectors
├── webhook_endpoints
└── webhook_logs

DOMAIN: AI (~15 tablas)
├── agent_definitions
├── agent_instances
├── agent_prompts
├── prompt_versions
├── agent_sessions
├── conversation_messages
├── message_attachments
├── agent_tools
├── tool_executions
├── rag_collections
├── rag_chunks
├── embeddings_cache
├── model_configs
├── agent_training_data
└── agent_audit

DOMAIN: BI (~15 tablas)
├── dashboard_definitions
├── dashboard_widgets
├── widget_data_sources
├── report_definitions
├── report_schedules
├── report_generations
├── data_marts
├── materialized_views_config
├── kpi_targets
├── benchmark_data
├── industry_averages
├── alert_rules
├── alert_instances
├── ml_models
├── ml_predictions

DOMAIN: AUTOMATION (~10 tablas)
├── email_accounts
├── email_rules
├── email_processed_log
├── scheduled_tasks
├── task_execution_logs
├── notification_templates
├── notification_logs
└── integration_credentials

DOMAIN: SYSTEM (~10 tablas)
├── feature_flags
├── system_config
├── migration_log
├── background_jobs
├── job_history
├── rate_limits
├── cache_invalidation
├── health_checks
├── metrics_storage
└── error_logs
```

**Total estimado: ~240 tablas (núcleo) · expandible a ~350 con módulos especializados**

---

## 5. ECOSISTEMA DE AGENTES IA

### 5.1 Arquitectura del Orquestador

```
                    ┌─────────────────────────┐
                    │   INPUT (Usuario/Datos)  │
                    └──────────┬──────────────┘
                               │
                    ┌──────────▼──────────────┐
                    │    AGENTE ORQUESTADOR    │
                    │  (Clasifica + Enruta)    │
                    └──────┬──────┬──────┬────┘
                           │      │      │
           ┌───────────────┘      │      └───────────────┐
           │                      │                      │
    ┌──────▼──────┐      ┌───────▼───────┐     ┌────────▼────────┐
    │ AGENTE      │      │ AGENTE        │     │ AGENTE          │
    │ FINANCIERO  │      │ TRIBUTARIO    │     │ LEGAL           │
    │ DCF, Ratios,│      │ IVA, Renta,   │     │ Contratos,      │
    │ Stress Test │      │ Anexos, Alert.│     │ Obligaciones    │
    └──────┬──────┘      └───────┬───────┘     └────────┬────────┘
           │                      │                      │
    ┌──────▼──────┐      ┌───────▼───────┐     ┌────────▼────────┐
    │ AGENTE      │      │ AGENTE        │     │ AGENTE          │
    │ CONTABLE    │      │ COMERCIAL     │     │ RIESGOS         │
    │ Clasif.,    │      │ Mercado,      │     │ Scoring,        │
    │ Reconc.     │      │ Competencia   │     │ Mitigación      │
    └──────┬──────┘      └───────┬───────┘     └────────┬────────┘
           │                      │                      │
           └───────────────┬──────┴──────────────────────┘
                           │
                    ┌──────▼──────┐
                    │  RAG ENGINE │
                    │  Qdrant +   │
                    │  Elastic    │
                    └─────────────┘
```

### 5.2 Especificación de Agentes

| Agente | Tools | Memoria | Conocimiento Base |
|--------|-------|---------|-------------------|
| **Orquestador** | Clasificador de intención, enrutador, QA | Window 10 | Mapa de capacidades del sistema |
| **Financiero** | DCF Engine, Monte Carlo, Ratio Calculator, Stress Tester | Window 20 | Estados financieros, fórmulas, benchmarks |
| **Tributario** | Tax Calculator, Annex Generator, Calendar | Window 15 | Legislación tributaria local, tablas de impuestos |
| **Contable** | Account Classifier, Reconciliation Tool, JE Generator | Window 15 | PCGE, NIC/NIIF, manuales contables |
| **Legal** | Contract Analyzer, Obligation Tracker, Risk Scorer | Window 20 | Base legal, jurisprudencia, normativa |
| **Comercial** | Market Analyzer, Competitor Tracker, Pricing Optimizer | Window 10 | Datos de mercado, perfiles de competencia |
| **RRHH** | Payroll Analyzer, Turnover Predictor, Climate Survey | Window 10 | Benchmarks de compensación, legal laboral |
| **Riesgos** | Risk Matrix Generator, Scenario Simulator, Fraud Detector | Window 15 | Matrices de riesgo, históricos de incidentes |
| **Planeación** | Strategy Generator, Roadmap Builder, KPI Tracker | Window 20 | OKRs, metodologías, casos de éxito |
| **Marketing** | SEO Analyzer, Campaign Optimizer, Funnel Analyzer | Window 10 | Data de campañas, métricas de mercado |
| **Estrategia** | Synthesis Engine, Recommendation Generator, Report Builder | Window 30 | Historial completo del cliente, industria |

### 5.3 RAG con ISD (Iterative Source Decomposition)

Cada respuesta de la IA debe incluir:

```json
{
  "response": "...",
  "sources": [
    {
      "document_id": "uuid",
      "document_title": "Balance_2025_Q4.xlsx",
      "chunk_index": 42,
      "page": 3,
      "line_range": "12-18",
      "exact_text": "El EBITDA se sitúa en $109,500...",
      "confidence": 0.94,
      "trace_url": "/docs/uuid/view?chunk=42"
    }
  ]
}
```

---

## 6. WORKFLOW ENGINE

### 6.1 Ejemplo: Onboarding de Cliente Automatizado

```
CLIENTE FIRMA CONTRATO
       │
       ▼
┌──────────────────┐
│ 1. Detectar firma │ (Workflow Trigger: contract.signed)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 2. Crear empresa  │ (Identity Service: createClientCompany)
│    en sistema     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 3. Enviar email   │ (Notification Engine: bienvenida + credenciales)
│    de bienvenida  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 4. Solicitar docs │ (Document Service: crear carpetas + solicitudes)
│    iniciales      │
└────────┬─────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 5. ESPERAR documentos               │ (Human Task: cliente sube docs)
│    (SLA: 7 días, alerta día 5)      │
└────────┬────────────────────────────┘
         │
         ▼
┌──────────────────┐
│ 6. Clasificar     │ (IA Documental: OCR + clasificación automática)
│    documentos     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 7. Extraer datos  │ (IA Financiera + Contable: extraer balances, etc.)
│    financieros    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 8. Generar        │ (BI Service: ratios, diagnóstico inicial)
│    diagnóstico    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 9. Notificar      │ (Notificar consultor + cliente)
│    resultados     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│10. AGENDAR        │ (Calendar Service: agendar revisión)
│    reunión        │
└──────────────────┘
```

### 6.2 Catálogo de Workflows (50+)

| Workflow | Trigger | Pasos | SLA |
|----------|---------|-------|-----|
| Onboarding Cliente | contract.signed | 12 | 7 días |
| Diagnóstico Financiero | documents.uploaded | 8 | 24 horas |
| Preparación Declaración IVA | tax.period.ending | 15 | 5 días |
| Revisión Contractual | contract.draft.created | 6 | 48 horas |
| Alerta de Liquidez | kpi.threshold.crossed | 4 | 5 minutos |
| Generación Informe Mensual | schedule.monthly | 10 | 2 días |
| Due Diligence Express | project.dd.created | 20 | 14 días |
| Actualización de Ratios | financial.data.updated | 3 | 1 minuto |
| Facturación Automática | invoice.due | 5 | 1 hora |
| Encuesta Satisfacción | project.monthly | 4 | 1 día |

---

## 7. ARQUITECTURA TÉCNICA

### 7.1 Stack Tecnológico Definitivo

| Capa | Tecnología | Versión | Propósito |
|------|-----------|---------|-----------|
| **Frontend** | Next.js | 16.2+ | SSR, App Router, React Server Components |
| **UI Framework** | React + Tailwind CSS + Shadcn/ui | 19.x / 4.x | Componentes premium, tema oscuro |
| **State (Client)** | Zustand + TanStack Query | 5.x | Estado global + server state |
| **Charts** | Recharts + D3.js | — | Dashboard y visualizaciones |
| **Backend** | NestJS | 11.x | Microservicios, modular, decorators |
| **API Style** | REST + GraphQL (Apollo) | — | APIs internas y externas |
| **ORM** | Prisma | 6.x | Type-safe, migrations, studio |
| **Database** | PostgreSQL | 16.x | Datos relacionales + pgvector |
| **Cache** | Redis Stack | 7.x | Sesiones, rate limiting, colas |
| **Message Broker** | RabbitMQ | 4.x | Event-driven architecture |
| **Search** | Elasticsearch | 8.x | Búsqueda documental |
| **Vector Store** | Qdrant | 1.x | Embeddings para RAG |
| **Object Storage** | MinIO | — | Documentos, archivos, backups |
| **Auth** | Keycloak | 26.x | SSO, OAuth2, SAML, RBAC |
| **Monitoring** | Grafana + Prometheus + Sentry | — | Métricas, logs, errores |
| **Containers** | Docker + Docker Compose | — | Desarrollo local |
| **Orchestration** | Kubernetes (K3s/K8s) | 1.30+ | Producción escalable |
| **CI/CD** | GitHub Actions + ArgoCD | — | GitOps, pipelines |
| **IaC** | Terraform + Pulumi | — | Infraestructura reproducible |
| **AI Framework** | LangChain + LangGraph | 0.3+ | Agentes, RAG, ISD |
| **AI Models** | GPT-4o / Claude 4 / Llama 4 | — | Razonamiento multi-documento |

### 7.2 Estructura del Monorepo

```
cos/
├── apps/
│   └── web/                    # Next.js Frontend
│       ├── src/
│       │   ├── app/            # App Router (portales: cliente, consultor, director)
│       │   ├── components/     # Componentes compartidos
│       │   └── lib/            # Hooks, utils, API client
│       └── package.json
├── services/                   # NestJS Microservicios
│   ├── identity/               # M1: Identidad Corporativa
│   ├── clients/                # M2: Clientes
│   ├── documents/              # M3: Motor Documental
│   ├── finance/                # M9: Motor Financiero
│   ├── tax/                    # M10: Motor Tributario
│   ├── legal/                  # M11: Motor Legal
│   ├── projects/               # M7: Gestión de Proyectos
│   ├── workflows/              # M5: Workflow Engine
│   ├── intelligence/           # M12: Centro de Inteligencia
│   ├── bi/                     # M6: Business Intelligence
│   ├── notifications/          # Notificaciones multicanal
│   ├── integrations/           # Bridge de integraciones
│   └── ai-orchestrator/        # M4: Orquestador de Agentes IA
├── packages/
│   ├── shared-types/           # Tipos TypeScript/Pydantic compartidos
│   ├── prisma-schema/          # Esquema Prisma centralizado
│   └── cos-sdk/                # SDK para comunicación entre servicios
├── infra/
│   ├── docker/                 # Dockerfiles
│   ├── k8s/                    # Manifiestos Kubernetes
│   ├── terraform/              # IaC
│   └── monitoring/             # Grafana dashboards
├── docs/
│   ├── architecture/           # Diagramas C4, ADRs
│   ├── api/                    # OpenAPI specs
│   └── business/               # Procesos, casos de uso
├── .github/
│   └── workflows/              # CI/CD pipelines
└── docker-compose.yml
```

### 7.3 Microservicios: Comunicación

```
┌─────────────┐     REST/gRPC     ┌──────────────┐
│  Cliente     │◄────────────────►│  API Gateway  │
│  (Next.js)   │                  │  (Kong)       │
└─────────────┘                   └──────┬───────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
              ┌─────▼─────┐      ┌──────▼──────┐     ┌───────▼──────┐
              │ Identity   │      │ Clients     │     │ Documents    │
              │ Service    │      │ Service     │     │ Service      │
              └─────┬─────┘      └──────┬──────┘     └───────┬──────┘
                    │                    │                    │
              ┌─────▼─────┐      ┌──────▼──────┐     ┌───────▼──────┐
              │ Finance    │      │ Tax         │     │ Workflow     │
              │ Service    │      │ Service     │     │ Engine       │
              └─────┬─────┘      └──────┬──────┘     └───────┬──────┘
                    │                    │                    │
                    └────────────────────┼────────────────────┘
                                         │
                              ┌──────────▼──────────┐
                              │   Message Broker     │
                              │   (RabbitMQ)         │
                              └──────────┬──────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
              ┌─────▼─────┐      ┌──────▼──────┐     ┌───────▼──────┐
              │ AI         │      │ Notifications│    │ Integrations │
              │ Orchestr.  │      │ Service      │    │ Bridge       │
              └───────────┘      └─────────────┘     └──────────────┘
```

---

## 8. PLAN DE FASES

### Fase 0 · Arquitectura Empresarial (Ahora)

| Entregable | Esfuerzo |
|-----------|----------|
| Blueprint del Sistema (este documento) | 1 semana |
| Modelo de datos completo (ERD) | 2 semanas |
| Catálogo de procesos de negocio (500+) | 3 semanas |
| Casos de uso por módulo | 2 semanas |
| Diseño UX/UI (alta fidelidad) | 4 semanas |
| Especificación de APIs | 3 semanas |
| Plan maestro de desarrollo | 1 semana |

### Fase 1 · Núcleo (Meses 1-3)

| Módulo | Prioridad | Dependencias |
|--------|-----------|-------------|
| M1: Identidad Corporativa | P0 | — |
| M2: Clientes | P0 | M1 |
| M3: Motor Documental | P0 | M1, M2 |
| M5: Workflow Engine (básico) | P0 | M1 |
| Infraestructura base (K8s, CI/CD) | P0 | — |
| Autenticación Keycloak | P0 | M1 |

### Fase 2 · Operación (Meses 4-6)

| Módulo | Prioridad | Dependencias |
|--------|-----------|-------------|
| M7: Gestión de Proyectos | P1 | M1, M2 |
| M13: Portal Cliente | P1 | M1, M2, M3 |
| M14: Portal Consultor | P1 | M1, M2, M7 |
| M15: Portal Director | P1 | M1, M2, M7 |
| M8: Automatizaciones (básico) | P1 | M5 |
| Notificaciones | P1 | M1 |

### Fase 3 · Inteligencia (Meses 7-9)

| Módulo | Prioridad | Dependencias |
|--------|-----------|-------------|
| M6: Business Intelligence | P2 | M2 (datos históricos) |
| M9: Motor Financiero | P2 | M2, M3 |
| M10: Motor Tributario | P2 | M2, M3 |
| M11: Motor Legal | P2 | M2, M3 |
| M12: Centro de Inteligencia (básico) | P2 | M6, M9, M10, M11 |

### Fase 4 · IA (Meses 10-12)

| Módulo | Prioridad | Dependencias |
|--------|-----------|-------------|
| M4: Motor IA (agentes especializados) | P3 | M3, M9, M10, M11 |
| RAG + ISD completo | P3 | M3, M4 |
| Orquestador LangGraph | P3 | M4 |
| Fine-tuning de modelos | P3 | M4 |

### Fase 5 · Integraciones (Meses 13-14)

| Integración | Prioridad |
|-------------|-----------|
| Correo Electrónico (IMAP/SMTP) | P2 |
| Calendarios (Google/Outlook) | P2 |
| ERPs locales | P2 |
| Facturación Electrónica SRI | P2 |
| Firma Digital (DocuSign/FirmaEC) | P2 |
| Mensajería (Slack/Teams/WhatsApp) | P2 |
| Bancos (API de transacciones) | P3 |

### Fase 6 · Escalabilidad (Meses 15-16)

| Componente | Prioridad |
|-----------|-----------|
| Alta disponibilidad multi-AZ | P2 |
| Disaster Recovery | P2 |
| Auditoría de seguridad | P2 |
| ISO 27001 | P2 |
| Monitoreo avanzado (APM) | P2 |
| Optimización de costos cloud | P2 |
| Multi-región | P3 |

---

## 9. CATÁLOGO DE AUTOMATIZACIONES

### 9.1 Automatizaciones Transaccionales (30+)

| # | Automatización | Módulos | Frecuencia |
|---|---------------|---------|-----------|
| A01 | Clasificación automática de documentos | Documentos + IA | Tiempo real |
| A02 | Extracción de datos financieros de PDF/Excel | Documentos + Finanzas | Tiempo real |
| A03 | Cálculo automático de ratios financieros | Finanzas + BI | Diario |
| A04 | Generación de informe mensual de clientes | BI + Portal Cliente | Mensual |
| A05 | Detección de anomalías en transacciones | Centro Intel. + Finanzas | Tiempo real |
| A06 | Recordatorio de obligaciones tributarias | Tributario + Notificaciones | Según calendario |
| A07 | Cruce automático de IVA vs facturación | Tributario | Mensual |
| A08 | Actualización de organigrama desde RRHH | Identidad + RRHH | Diario |
| A09 | Asignación automática de tickets | Clientes + IA | Tiempo real |
| A10 | Generación de minuta de reunión | Clientes + IA | Post-reunión |
| A11 | Verificación de cumplimiento contractual | Legal + IA | Semanal |
| A12 | Rebalanceo de indicadores de proyectos | Proyectos + BI | Diario |
| A13 | Detección de fuga de clientes (churn prediction) | Centro Intel. + IA | Semanal |
| A14 | Optimización de precio de servicios | Finanzas + IA | Mensual |
| A15 | Generación de plan de trabajo automático | Proyectos + IA | Por proyecto |

### 9.2 Reglas de Negocio Automatizadas (20+)

| # | Regla | Acción |
|---|-------|--------|
| R01 | Si liquidez < 1.0 → Alerta roja + notificar consultor | Crear alerta, enviar email |
| R02 | Si documento contiene "balance" + "estado resultados" → Clasificar como EEFF | Clasificar + extraer |
| R03 | Si fecha actual = fecha límite SRI - 5 días → Recordatorio | Enviar notificación |
| R04 | Si ticket sin asignar > 4 horas → Escalar a líder de equipo | Reasignar + notificar |
| R05 | Si proyecto > 90% presupuesto → Alerta de sobrecosto | Notificar director |
| R06 | Si cliente no visita portal > 30 días → Email de engagement | Enviar email automático |
| R07 | Si nuevo contrato firmado → Iniciar workflow onboarding | Disparar workflow |
| R08 | Si factura vencida > 15 días → Bloquear acceso a reportes | Actualizar permisos |

---

## 10. MÉTRICAS DE ÉXITO

### 10.1 KPIs del Sistema

| Métrica | Target | Cómo se mide |
|---------|--------|-------------|
| Automatización alcanzada | > 95% procesos operativos | Workflows ejecutados sin intervención humana / total |
| Tiempo de respuesta IA | < 3 segundos (P95) | Latencia de agente orquestador |
| Precisión de clasificación documental | > 95% F1 | Muestreo semanal de documentos clasificados |
| Tasa de acierto en recomendaciones | > 85% | Feedback del consultor sobre recomendaciones |
| Uptime del sistema | > 99.95% | Health checks + SLI/SLO |
| Tiempo de onboarding cliente | < 48 horas | Desde firma de contrato hasta diagnóstico listo |
| Satisfacción de consultores (NPS) | > 70 | Encuesta trimestral |
| Satisfacción de clientes (NPS) | > 60 | Encuesta trimestral |

### 10.2 KPIs de Negocio

| Métrica | Año 1 | Año 2 | Año 3 |
|---------|-------|-------|-------|
| Clientes activos | 15 | 50 | 150 |
| MRR | $45,000 | $150,000 | $450,000 |
| ARR | $540,000 | $1,800,000 | $5,400,000 |
| Consultores por cliente | 1:5 | 1:15 | 1:30 |
| Proyectos simultáneos por consultor | 3 | 5 | 8 |
| Ratio ingresos/consultor | $90,000 | $150,000 | $200,000 |

---

## APÉNDICE: COMPARATIVA CON COMPETENCIA

| Aspecto | COS | Consultora Tradicional | SaaS Genérico (Salesforce, etc.) |
|---------|-----|----------------------|----------------------------------|
| **Enfoque** | Automatización total | Dependencia humana | Herramienta aislada |
| **IA** | Multi-agente nativa | Ninguna o básica | Asistente conversacional simple |
| **Workflows** | Motor propietario 500+ flows | Procesos manuales | Workflows genéricos limitados |
| **Documentos** | RAG + ISD + OCR automático | Gestión manual | Almacenamiento básico |
| **Multi-tenant** | Jerárquico completo | No aplica | Plano |
| **Portal Cliente** | Inteligente con IA | Email/PDF | Portal estándar |
| **Costo operativo** | 90% menos que tradicional | 100% | 30-50% menos |
| **Escalabilidad** | 1 consultor = 30 clientes | 1 consultor = 3-5 clientes | Depende del implementador |

---

> **Documento Maestro — Consulting Operating System (COS)**
> Próxima revisión: Julio 2026
> Este blueprint es un documento vivo. Cada módulo requiere su propio diseño detallado (ADR, ERD, API spec, UX flows).
