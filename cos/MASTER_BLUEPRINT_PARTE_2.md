# MASTER BLUEPRINT — PARTE 2: CATÁLOGO COMPLETO DE MOTORES, MÓDULOS Y APIs

---

### 5. CATÁLOGO COMPLETO DE MOTORES

#### 5.1 PredictionEngine

| Campo | Valor |
|---|---|
| **Nombre** | PredictionEngine |
| **Archivo** | `core/prediction/engine.ts` |
| **Objetivo** | Proyectar KPIs financieros, generar escenarios, detectar alertas tempranas |
| **Entradas** | MemoryEntry[] del memoryStore (tipo kpi_change), consultingDna thresholds |
| **Salidas** | `PredictionResult` con indicators[], scenarios[4], earlyWarnings[], summary, confidence |
| **Algoritmo** | Regresión lineal (mínimos cuadrados) para tendencia + proyección |
| **Precisión** | R² calculado, bounds con 1.96 × σ (95% confianza) |
| **Escenarios** | Base (60%), Optimista (20%), Pesimista (15%), Estrés (5%) |
| **Alertas** | Detección de cruce de umbrales del Consulting DNA |
| **Dependencias** | memoryStore, consultingDna, confidenceEngine |
| **Fortaleza** | Ligero, rápido, sin dependencias externas, produce resultados explicables |
| **Debilidad** | Solo regresión lineal, no captura estacionalidad ni no-linealidad |
| **Casos de uso** | Proyección de ventas, predicción de liquidez, alertas de deuda |
| **API** | `GET /api/prediction`, `POST /api/prediction` |

**Métodos públicos:**
```typescript
class PredictionEngine {
  async predict(companyId: string, clientId?: string): Promise<PredictionResult>
  async predictKPI(kpi: string, historicalData: KPIDataPoint[], days: number): Promise<{trend, projection, estimatedValue, confidence}>
  async cashFlowForecast(currentCash, monthlyInflow, monthlyOutflow, months): Promise<{monthly, breakevenMonth, willRunOut, runOutMonth}>
}
```

#### 5.2 EnhancedPredictionEngine

| Campo | Valor |
|---|---|
| **Nombre** | EnhancedPredictionEngine |
| **Archivo** | `core/prediction/enhanced.ts` |
| **Objetivo** | Proyecciones avanzadas con modelos estadísticos múltiples |
| **Entradas** | TimeSeriesPoint[] |
| **Salidas** | `EnhancedProjection` con modelUsed, seasonalityDetected, decomposition |
| **Modelos** | 4: linear, arima_like, seasonal_arima, holt_winters |
| **Estacionalidad** | Detección de autocorrelación + descomposición trend/seasonal/residual |
| **Anomalías** | Detección por desviación estándar con severity (low/medium/high/critical) |
| **Alertas** | Multi-umbral warning + critical con fecha estimada |
| **Dependencias** | Ninguna (TypeScript puro) |
| **Fortaleza** | Múltiples modelos, detección de estacionalidad, sin dependencias externas |
| **Debilidad** | No es ML real (no Prophet/LSTM), datos sintéticos limitados |
| **API** | No expuesta directamente (uso programático) |

**Métodos públicos:**
```typescript
class EnhancedPredictionEngine {
  detectSeasonality(points: TimeSeriesPoint[]): { hasSeasonality: boolean; period: number }
  decomposeSeasonal(points: TimeSeriesPoint[], period: number): SeasonalDecomposition
  projectEnhanced(points: TimeSeriesPoint[], days: number): EnhancedProjection
  detectAnomalies(points: TimeSeriesPoint[], threshold?: number): AnomalyResult[]
  generateEarlyWarningsEnhanced(indicators, thresholds): EarlyWarning[]
}
```

#### 5.3 ReasoningEngine

| Campo | Valor |
|---|---|
| **Nombre** | ReasoningEngine |
| **Archivo** | `core/reasoning/engine.ts` |
| **Objetivo** | Diagnóstico financiero automático, generación de hipótesis y recomendaciones |
| **Entradas** | Financial ratios, memory entries, industry |
| **Salidas** | Observations[], diagnosis[], hypotheses[], recommendations[], confidence |
| **Algoritmo** | Evaluación de ratios contra umbrales DNA + búsqueda en casos similares |
| **Diagnósticos** | Por categoría DNA (liquidity, solvency, etc.) con severidad |
| **Hipótesis** | Causas raíz sugeridas (alta cuentas por cobrar, baja rotación, etc.) |
| **Recomendaciones** | Acciones priorizadas por impacto |
| **Dependencias** | memoryStore, learningEngine, knowledge (kpis), consultingDna |
| **API** | `GET /api/reasoning`, `POST /api/reasoning` |

#### 5.4 PlanningEngine

| Campo | Valor |
|---|---|
| **Nombre** | PlanningEngine |
| **Archivo** | `core/planning/engine.ts`, `core/planning/types.ts` |
| **Objetivo** | Generación automática de planes estratégicos multi-fase |
| **Entradas** | companyId, clientId, objective, category, timeframeMonths, priority |
| **Salidas** | `BusinessPlan` con phases[], KPIs[], budget, resources, risks, dependencies |
| **Estructura del plan** | 4 fases: diagnóstico/análisis/implementación/control |
| **KPIs por fase** | Hasta 5 KPIs por fase con baseline, target, unidad |
| **Presupuesto** | Costo estimado, recursos asignados, ROI proyectado |
| **Riesgos** | Identificación automática de riesgos por categoría |
| **Dependencias** | Pre-requisitos entre fases, dependencias externas |
| **Persistencia** | Auto-save via persistence.scheduleSave() |
| **API** | `GET /api/planning`, `POST /api/planning` |

**BusinessPlan:**
```typescript
interface BusinessPlan {
  id, companyId, clientId?, title, objective, category, 
  status: "draft" | "active" | "completed" | "cancelled",
  phases: [{ id, name, description, status, kpis, projects, tasks, 
             budget, resources, risks, dependencies, durationWeeks }],
  kpis, totalBudget, totalRoi, risks, createdAt, startedAt?, completedAt?
}
```

#### 5.5 ExecutionEngine

| Campo | Valor |
|---|---|
| **Nombre** | ExecutionEngine |
| **Archivo** | `core/execution/engine.ts` |
| **Objetivo** | Monitorear ejecución de planes, detectar desviaciones, proponer correcciones |
| **Entradas** | planId, metric snapshots |
| **Salidas** | Snapshots[], deviations[], corrections[], alerts[] |
| **Snapshots** | Estado periódico de métricas del plan |
| **Desviaciones** | Diferencia entre target y actual, con severity |
| **Correcciones** | Acciones correctivas sugeridas con impacto estimado |
| **Alertas** | Notificaciones cuando desviación supera umbral |
| **API** | `GET /api/execution`, `POST /api/execution` |

#### 5.6 MemoryStore

| Campo | Valor |
|---|---|
| **Nombre** | MemoryStore |
| **Archivo** | `core/memory/store.ts` |
| **Objetivo** | Almacenamiento chronológico de memoria empresarial (event store ligero) |
| **Entradas** | MemoryEntry (type, title, description, entities, tags, metadata, importance) |
| **Salidas** | MemoryEntry[] (consultas, timelines, resúmenes) |
| **Tipos** | decision, strategy, meeting, document_change, kpi_change, risk, note, event, task, recommendation, alert |
| **Capacidad** | 10,000 entradas máximas (configurable) |
| **Persistencia** | Auto-save JSON + load al iniciar |
| **Importancia** | low, medium, high, critical |
| **API** | `GET /api/memory`, `POST /api/memory`, `GET /api/memory/timeline` |

#### 5.7 LearningEngine

| Campo | Valor |
|---|---|
| **Nombre** | LearningEngine |
| **Archivo** | `core/learning/engine.ts` |
| **Objetivo** | Business Case Library — registro y búsqueda de casos de consultoría |
| **Entradas** | BusinessCase (registro estructurado de proyecto) |
| **Salidas** | Casos similares, estadísticas, lecciones aprendidas |
| **Búsqueda semántica** | Por industry, problemCategory, tags, texto libre |
| **Estadísticas** | Total por industria/categoría/impacto, success rate, ROI promedio |
| **Persistencia** | Auto-save JSON |
| **API** | `GET /api/learning`, `POST /api/learning` |

**BusinessCase:**
```typescript
interface BusinessCase {
  id, companyId, clientId, clientName, industry, companySize,
  problem, problemCategory, diagnosis, planSummary, planDurationMonths,
  result, resultadoCuantitativo: { revenueImpact?, costReduction?, marginImprovement? },
  status: "completed" | "failed" | "in_progress",
  impact: "low" | "medium" | "significant" | "transformational",
  tiempoMeses, costTotal, rentabilidad,
  lecciones: string[], errores: string[], aciertos: string[],
  tags, completedAt
}
```

#### 5.8 OptimizationEngine

| Campo | Valor |
|---|---|
| **Nombre** | OptimizationEngine |
| **Archivo** | `core/optimization/engine.ts` |
| **Objetivo** | Optimización de cartera de productos y precios |
| **Entradas** | Product portfolio, price tiers, market data |
| **Salidas** | OptimizedPortfolio, pricing recommendations, bundle suggestions |
| **API** | `GET /api/optimization`, `POST /api/optimization` |

#### 5.9 GenomeEngine

| Campo | Valor |
|---|---|
| **Nombre** | GenomeEngine |
| **Archivo** | `core/genome/engine.ts` |
| **Objetivo** | Diagnóstico organizacional en 14 dimensiones |
| **Entradas** | companyId, name, industry, size |
| **Salidas** | `GenomeResult` con dimensions[], overallScore, confidence, strengths[], weaknesses[], recommendations[] |
| **Dimensiones** | 14 (ver sección 4.5) |
| **Cálculo** | Reglas por dimensión + scoring 0-100 + confidence 0-1 |
| **API** | `GET /api/genome`, `POST /api/genome` |

#### 5.10 ConfidenceEngine

| Campo | Valor |
|---|---|
| **Nombre** | ConfidenceEngine |
| **Archivo** | `core/confidence/index.ts` |
| **Objetivo** | Evaluar confianza de predicciones, diagnósticos y recomendaciones |
| **Entradas** | dataPoints, rSquared, indicatorCount, memorySimilarity |
| **Salidas** | ConfidenceResult con overall score (0-100) y factors[] |
| **Factores** | dataQuality, historicalConsistency, modelAccuracy, memoryRelevance, domainCoverage, temporalRecency |
| **API** | `POST /api/confidence` |

#### 5.11 NLUEngine

| Campo | Valor |
|---|---|
| **Nombre** | NLUEngine |
| **Archivo** | `core/nlu/index.ts` |
| **Objetivo** | Clasificación semántica de texto en español |
| **Entradas** | Texto en español |
| **Salidas** | NLUResult con intent, intentScore, entities[], sentiment, confidence, suggestions[] |
| **Intenciones** | 12 (health_check, kpi_query, scenario, prediction, report, benchmark, plan, alert, compliance, cashflow, valuation, optimize) |
| **Entidades** | 7 (company, metric, number, industry, date, percentage, currency) |
| **Sentimiento** | positive/negative/neutral |
| **Sugerencias** | Contextuales por intent (hasta 3) |
| **API** | `POST /api/nlu`, `GET /api/nlu` |

#### 5.12 ScrapingService

| Campo | Valor |
|---|---|
| **Nombre** | ScrapingService |
| **Archivo** | `core/scraping/index.ts` |
| **Objetivo** | Obtener datos de fuentes oficiales (SRI, Supercias) |
| **Entradas** | source, topic, industry |
| **Salidas** | ScrapeResult<T> con data, source, fromCache |
| **SRI** | Tasas impositivas (9 tramos IR, IVA 15%/0%, Patente 0.5%) + CIIU |
| **Supercias** | Datos de 5 empresas ecuatorianas de referencia |
| **Benchmarks** | 9 industrias × 5 métricas × 3 percentiles |
| **Caché** | TTL 1 hora en memoria |
| **API** | `GET /api/scraping`, `POST /api/scraping` |

#### 5.13 NotificationService

| Campo | Valor |
|---|---|
| **Nombre** | NotificationService |
| **Archivo** | `core/notifications/index.ts` |
| **Objetivo** | Sistema de notificaciones multicanal |
| **Canales** | in_app, email, whatsapp (email y whatsapp son stub) |
| **Templates** | 4: alert_kpi_critical, report_weekly, milestone_achieved, task_assigned |
| **Categorías** | alert, report, milestone, task, system |
| **Prioridades** | low, medium, high, critical |
| **API** | `GET /api/notifications`, `POST /api/notifications` |

#### 5.14 XBRLParser

| Campo | Valor |
|---|---|
| **Nombre** | XBRLParser |
| **Archivo** | `core/xbrl/index.ts` |
| **Objetivo** | Parsear estados financieros en formato XBRL (XML) |
| **Entradas** | XML string + companyId |
| **Salidas** | XBRLParseResult con statements[], errors[], unrecognizedConcepts[] |
| **Conceptos IFRS** | 30 mapeados (CA, NCA, TA, CL, NCL, TL, EQ, REV, COS, GP, OI, NI, CASH, AR, INV, PPE, AP, ST_DEBT, LT_DEBT, DA, EPS, etc.) |
| **Ratios calculados** | 12: current, quick, cash, debt-to-equity, debt-to-assets, net margin, gross margin, operating margin, ROA, ROE, AR turnover, inventory turnover |
| **Tipos detectados** | balance_sheet, income_statement, cash_flow, equity |
| **API** | `POST /api/xbrl` (multipart file upload), `GET /api/xbrl` |

---

### 6. CATÁLOGO COMPLETO DE MÓDULOS

#### 6.1 Customer Management

| Módulo | Archivos | Estado |
|---|---|---|
| **Clientes CRUD** | `api/clients/route.ts`, `api/clients/[id]/route.ts` | Implementado |
| **Clientes Onboarding** | `api/clients/onboard/route.ts` | Implementado |
| **Leads** | `api/leads/route.ts`, `api/leads/[id]/route.ts` | Implementado |
| **Clientes - Reporte** | `api/clients/[id]/report/route.ts` | Implementado |
| **Clientes - Plan Estratégico** | `api/clients/[id]/strategic-plan/route.ts` | Implementado |

#### 6.2 Identity & Auth

| Módulo | Archivos | Estado |
|---|---|---|
| **Auth Supabase** | `middleware.ts`, `lib/auth/token.ts`, `(public)/auth/*` | Implementado |
| **Roles** | `api/identity/roles/route.ts`, `api/identity/roles/[id]/route.ts` | Implementado |
| **Registro** | `api/auth/register/route.ts` | Implementado |
| **Login** | `api/auth/login/route.ts` | Implementado |
| **Invitar usuario** | `api/auth/invite/route.ts` | Implementado |

#### 6.3 Financial Analysis

| Módulo | Archivos | Estado |
|---|---|---|
| **Estados Financieros** | `api/financial-statements/route.ts`, `api/financial-statements/[id]/route.ts` | Implementado |
| **Análisis Consultor** | `api/consulting/analyze/route.ts` | Implementado |
| **XBRL Parser** | `api/xbrl/route.ts`, `core/xbrl/index.ts` | Implementado |
| **Ratios** | `api/ratios/[tenantId]/route.ts` | Implementado (mock) |
| **Margins** | `api/margins/[tenantId]/route.ts` | Implementado (mock) |
| **Valuación** | `api/valuation/[tenantId]/route.ts` | Implementado (mock) |

#### 6.4 Executive Intelligence

| Módulo | Archivos | Estado |
|---|---|---|
| **Executive Brief** | `api/executive/route.ts` | Implementado |
| **AI Copilot** | `api/ai/copilot/route.ts`, `CopilotPanel.tsx` | Implementado |
| **AI Copilot Stats** | `api/ai/copilot/stats/route.ts` | Implementado |
| **AI Copilot Feedback** | `api/ai/copilot/feedback/route.ts` | Implementado |
| **Confidence** | `api/confidence/route.ts`, `core/confidence/index.ts` | Implementado |
| **NLU** | `api/nlu/route.ts`, `core/nlu/index.ts` | Implementado |

#### 6.5 Knowledge Management

| Módulo | Archivos | Estado |
|---|---|---|
| **Knowledge Base** | `api/knowledge/route.ts`, `core/knowledge/` | Implementado |
| **IFRS Taxonomy** | `core/knowledge/ifrs/taxonomy.ts` | Implementado (400+ conceptos) |
| **KPI Library** | `core/knowledge/kpis/index.ts` | Implementado (100+ KPIs) |
| **Benchmarks** | `core/knowledge/benchmarks/index.ts` | Implementado (9 industrias) |
| **SRI Intelligence** | `core/knowledge/sri/index.ts` | Implementado |
| **Enterprise Ontology** | `core/knowledge/graph/index.ts` | Implementado |
| **Regulatory** | `core/knowledge/regulatory/` | Vacío |

#### 6.6 Strategic Planning

| Módulo | Archivos | Estado |
|---|---|---|
| **Planning Engine** | `api/planning/route.ts`, `core/planning/` | Implementado |
| **Execution Engine** | `api/execution/route.ts`, `core/execution/` | Implementado |
| **Planning Panel UI** | `components/planning/PlanningPanel.tsx` | Implementado |
| **Execution Monitor UI** | `components/execution/ExecutionMonitor.tsx` | Implementado |

#### 6.7 Machine Learning & Prediction

| Módulo | Archivos | Estado |
|---|---|---|
| **Prediction Engine** | `api/prediction/route.ts`, `core/prediction/engine.ts` | Implementado |
| **Enhanced ML** | `core/prediction/enhanced.ts` | Implementado |
| **Monte Carlo** | `api/monte-carlo/route.ts` | Proxy (stub) |
| **Optimization** | `api/optimization/route.ts`, `core/optimization/` | Implementado |

#### 6.8 Learning & Memory

| Módulo | Archivos | Estado |
|---|---|---|
| **Memory Store** | `api/memory/route.ts`, `api/memory/timeline/route.ts`, `core/memory/` | Implementado |
| **Learning Engine** | `api/learning/route.ts`, `core/learning/` | Implementado |
| **Business Case Library UI** | `components/learning/BusinessCaseLibrary.tsx` | Implementado |

#### 6.9 Enterprise Genome

| Módulo | Archivos | Estado |
|---|---|---|
| **Genome Engine** | `api/genome/route.ts`, `core/genome/` | Implementado |
| **Genome Viewer UI** | `components/genome/GenomeViewer.tsx` | Implementado |

#### 6.10 Consulting DNA

| Módulo | Archivos | Estado |
|---|---|---|
| **Consulting DNA** | `api/consulting-dna/route.ts`, `core/consulting-dna/index.ts` | Implementado |
| **DNA Manager UI** | `director/adn/page.tsx` | Implementado |

#### 6.11 Product OS

| Módulo | Archivos | Estado |
|---|---|---|
| **Product OS** | `api/product-os/route.ts`, `core/product-os/` | Implementado |
| **Product Registry** | `api/products/route.ts`, `core/products/` | Implementado |
| **Product Detail** | `api/products/[id]/route.ts` | Implementado |
| **Product Config** | `api/products/[id]/config/route.ts` | Implementado |
| **Product Lifecycle** | `api/products/[id]/lifecycle/route.ts` | Implementado |
| **Product Migration** | `api/products/[id]/migrate/route.ts` | Implementado |
| **Platform** | `api/platform/route.ts`, `core/platform/` | Implementado |
| **Certification** | `api/platform/certification/route.ts` | Implementado |
| **Product OS UI** | `director/product-os/page.tsx` | Implementado |
| **Product Manager UI** | `director/productos/page.tsx` | Implementado |
| **Platform Admin UI** | `director/platform/page.tsx` | Implementado |

#### 6.12 Notifications & Scraping

| Módulo | Archivos | Estado |
|---|---|---|
| **Notification Service** | `api/notifications/route.ts`, `core/notifications/` | Implementado |
| **Web Scraping** | `api/scraping/route.ts`, `core/scraping/` | Implementado |

#### 6.13 Reports & Export

| Módulo | Archivos | Estado |
|---|---|---|
| **Report Generation** | `api/reports/route.ts` | Implementado |
| **PDF Template** | `lib/pdf/report.tsx`, `lib/pdf/generate.ts` | Implementado |
| **CSV/Excel Export** | `lib/excel/generate.ts` | Implementado |

#### 6.14 Billing

| Módulo | Archivos | Estado |
|---|---|---|
| **Stripe Checkout** | `api/stripe/checkout/route.ts` | Implementado (real) |
| **Stripe Billing Portal** | `api/stripe/portal/route.ts` | Implementado (real) |
| **Stripe Subscription** | `api/stripe/subscription/route.ts` | Implementado |
| **Stripe Webhook** | `api/stripe/webhook/route.ts` | Implementado |
| **Subscription UI** | `components/billing/SubscriptionStatus.tsx` | Implementado |

#### 6.15 System

| Módulo | Archivos | Estado |
|---|---|---|
| **Tasks** | `api/system/tasks/route.ts` | Implementado |
| **Telemetry** | `api/system/telemetry/route.ts`, `lib/telemetry.ts` | Implementado |
| **System Validate** | `api/system/validate/route.ts` | Implementado |
| **Beta** | `api/beta/route.ts`, `core/beta/seed.ts`, `core/beta/index.ts` | Implementado |
| **Persistence** | `core/persistence/index.ts` | Implementado |

#### 6.16 Workflows

| Módulo | Archivos | Estado |
|---|---|---|
| **Workflows API** | `api/workflows/route.ts` | Proxy (stub) |

#### 6.17 Analysis & Consulting

| Módulo | Archivos | Estado |
|---|---|---|
| **Analyze** | `api/analyze/route.ts` | Proxy (stub) |
| **Compliance** | `api/consulting/compliance/route.ts` | Implementado |
| **Strategy** | `api/consulting/strategy/route.ts` | Implementado |

#### 6.18 Dashboard & Analytics

| Módulo | Archivos | Estado |
|---|---|---|
| **Dashboard** | `api/dashboard/[tenantId]/route.ts`, `consultor/dashboard/page.tsx` | Implementado |
| **Stress Simulator** | `consultor/dashboard/stress-simulator/page.tsx`, `components/war-room/*` | Implementado |
| **Data Hub** | `consultor/dashboard/data-hub/page.tsx` | Implementado |
| **Agents** | `consultor/dashboard/agents/page.tsx` | Implementado |
| **Valuation** | `consultor/dashboard/valuation/page.tsx` | Implementado |
| **Margins** | `consultor/dashboard/margins/page.tsx` | Implementado |

---

### 7. CATÁLOGO COMPLETO DE APIs

#### 7.1 API Routes por Dominio

**Customer Management (6 endpoints):**
```
GET   /api/clients                    → Lista clientes (companyId)
POST  /api/clients                    → Crear cliente
GET   /api/clients/[id]               → Detalle cliente
PUT   /api/clients/[id]               → Actualizar cliente
DELETE /api/clients/[id]              → Eliminar cliente
POST  /api/clients/onboard            → Onboarding cliente
GET   /api/clients/[id]/report        → Reporte PDF cliente
GET   /api/clients/[id]/strategic-plan → Plan estratégico cliente
POST  /api/clients/[id]/strategic-plan → Generar plan
```

**Identity (6 endpoints):**
```
POST  /api/auth/login                 → Login (crea sesión)
POST  /api/auth/register              → Registrar compañía
POST  /api/auth/invite                → Invitar usuario
GET   /api/identity/roles             → Listar roles
POST  /api/identity/roles             → Crear rol
PUT   /api/identity/roles/[id]        → Actualizar rol
DELETE /api/identity/roles/[id]       → Eliminar rol
```

**Financial (8 endpoints):**
```
GET   /api/financial-statements       → Listar estados financieros
POST  /api/financial-statements       → Crear estado financiero
GET   /api/financial-statements/[id]  → Detalle estado financiero
DELETE /api/financial-statements/[id] → Eliminar estado financiero
POST  /api/xbrl                       → Subir y parsear archivo XBRL
GET   /api/xbrl                       → Info conceptos soportados
POST  /api/consulting/analyze         → Analizar estados financieros
GET   /api/ratios/[tenantId]          → Ratios financieros (mock)
```

**Consulting Intelligence (5 endpoints):**
```
POST  /api/consulting/compliance      → Verificar cumplimiento
POST  /api/consulting/strategy        → Evaluar brechas estratégicas
POST  /api/analyze                    → Proxy a orquestador
GET   /api/consulting-dna             → Obtener DNA de consultoría
GET   /api/knowledge                  → Consultar Knowledge Lake
POST  /api/knowledge                  → Evaluar/buscar en Knowledge Lake
```

**Executive (5 endpoints):**
```
GET   /api/executive                  → Executive Brief
POST  /api/confidence                 → Evaluar confianza
POST  /api/ai/copilot                 → Chat con copiloto
POST  /api/ai/copilot/feedback        → Feedback de traza AI
GET   /api/ai/copilot/stats           → Estadísticas AI
```

**Prediction & Analysis (6 endpoints):**
```
GET   /api/prediction                 → Predicción completo
POST  /api/prediction                 → predict / predict-kpi / cash-flow
POST  /api/monte-carlo                → Simulación Monte Carlo (proxy)
GET   /api/reasoning                  → Razonamiento/diagnóstico
POST  /api/reasoning                  → reason / explain / diagnose
POST  /api/nlu                        → Clasificar texto
GET   /api/nlu                        → Info intenciones soportadas
```

**Planning & Execution (2 endpoints):**
```
GET   /api/planning                   → Listar/consultar planes
POST  /api/planning                   → generate / execute
GET   /api/execution                  → Consultar ejecución
POST  /api/execution                  → detect / correct / approve / implement / reforecast
```

**Learning & Memory (4 endpoints):**
```
GET   /api/memory                     → Consultar memoria
POST  /api/memory                     → Almacenar en memoria
GET   /api/memory/timeline            → Timeline de memoria
GET   /api/learning                   → Consultar casos/aprendizaje
POST  /api/learning                   → Registrar caso
```

**Enterprise Genome (2 endpoints):**
```
GET   /api/genome                     → Obtener genoma
POST  /api/genome                     → Analizar genoma
```

**Product OS (9 endpoints):**
```
GET   /api/product-os                 → Datos Product OS
GET   /api/products                   → Listar productos
GET   /api/products/[id]              → Detalle producto
PUT   /api/products/[id]/config       → Configurar producto
POST  /api/products/[id]/lifecycle    → Acción de ciclo de vida
POST  /api/products/[id]/migrate      → Migrar versión
GET   /api/platform                   → Estado plataforma
GET   /api/platform/certification     → Certificaciones
POST  /api/platform/certification     → Ejecutar certificación
```

**System (5 endpoints):**
```
GET   /api/beta                       → Estado beta
POST  /api/beta                       → Seed datos demo
GET   /api/system/tasks               → Listar tareas
PATCH /api/system/tasks               → Actualizar tarea
GET   /api/system/telemetry           → Time-to-value
GET   /api/system/validate            → Health check sistema
```

**Channels (3 endpoints):**
```
POST  /api/chat                       → Chat (proxy a orquestador)
POST  /api/documents                  → Subir documento
GET   /api/documents                  → Listar documentos
GET   /api/dashboard/[tenantId]       → Dashboard métricas
```
