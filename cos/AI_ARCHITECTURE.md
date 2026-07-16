# AI ARCHITECTURE

## Sistema Multi-Agente Orquestado

Consulting OS utiliza una arquitectura de IA multi-agente donde un **orquestador central** coordina múltiples agentes especializados, supervisa la calidad, fusiona resultados y mantiene memoria empresarial.

---

## 1. Arquitectura general

```
                     ┌──────────────┐
                     │   USUARIO    │
                     │ (consulta o  │
                     │  documentos) │
                     └──────┬───────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        ORCHESTRATOR                                 │
│                                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ ROUTER      │→ │ CONTEXT      │→ │ PLANNER                  │  │
│  │ Decide tipo │  │ ANALYZER    │  │ Genera plan de            │  │
│  │ de consulta │  │ Historial +  │  │ ejecución (qué agentes,  │  │
│  │             │  │ documentos   │  │ qué orden, qué modelos)  │  │
│  └─────────────┘  └──────────────┘  └──────────┬───────────────┘  │
│                                                  │                  │
└──────────────────────────────────────────────────┼──────────────────┘
                                                   │
                   ┌───────────────────────────────┼───────────────┐
                   ▼                               ▼               ▼
        ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
        │ FINANCIAL AGENT  │  │ TAX AGENT        │  │ RISK AGENT       │
        │                  │  │                  │  │                  │
        │ Ratios           │  │ Declaraciones    │  │ Score crédito    │
        │ Tendencias      │  │ Cumplimiento    │  │ Alertas          │
        │ Proyecciones    │  │ Optimización    │  │ Detección        │
        │ Benchmark       │  │ fiscal           │  │ temprana         │
        └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
                 │                     │                     │
                 ▼                     ▼                     ▼
        ┌─────────────────────────────────────────────────────────────┐
        │                     SUPERVISOR                              │
        │  Valida coherencia entre agentes                           │
        │  Detecta contradicciones                                   │
        │  Solicita rectificación si necesario                       │
        └───────────────────────────┬─────────────────────────────────┘
                                    │
                                    ▼
        ┌─────────────────────────────────────────────────────────────┐
        │                     VALIDATOR                               │
        │  Verdad contra datos reales                                │
        │  Checa fuentes y referencias                               │
        │  Asigna score de confianza                                 │
        └───────────────────────────┬─────────────────────────────────┘
                                    │
                                    ▼
        ┌─────────────────────────────────────────────────────────────┐
        │                     FUSIONER                                │
        │  Combina respuestas en un solo informe coherente          │
        │  Elimina duplicados                                        │
        │  Estructura: ejecutivo → detalle → anexos                  │
        └───────────────────────────┬─────────────────────────────────┘
                                    │
                                    ▼
        ┌─────────────────────────────────────────────────────────────┐
        │                     MEMORY                                  │
        │  Guarda: consulta, plan, respuestas, decisiones            │
        │  Alimenta: Knowledge Graph                                 │
        │  Mejora: futuras recomendaciones                           │
        └─────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                            Respuesta final
                         (informe, dashboard, alerta)
```

---

## 2. Componentes del Orquestador

### 2.1 Router
```
Input:  Consulta del usuario + documentos
Output: Tipo de tarea + metadata

Clasifica en:
  ├── "analisis.financiero"    → Plan: financial_agent
  ├── "analisis.tributario"    → Plan: tax_agent
  ├── "diagnostico.completo"   → Plan: all_agents
  ├── "simulacion"             → Plan: simulation_engine
  ├── "decision"               → Plan: decision_engine
  ├── "pregunta.general"       → Plan: knowledge_retrieval
  └── "reporte.automatico"     → Plan: fusioner_only

Confianza: 0-100%
Si < 70% → preguntar al usuario para confirmar
```

### 2.2 Context Analyzer
```
Examina:
├── Historial de conversación (últimas N interacciones)
├── Documentos del cliente (los más recientes)
├── Knowledge Graph (casos similares anteriores)
├── Preferencias del usuario (modelo favorito, tono, idioma)
├── Memoria empresarial (decisiones previas sobre este cliente)
└── Límites del plan (tokens, costo, velocidad)

Output: Contexto enriquecido para el Planner
```

### 2.3 Planner
```
Genera un plan de ejecución:

Ejemplo para "diagnóstico completo":
{
  plan: [
    { agent: "financial", model: "gpt-4", priority: 1, context: "balance+results" },
    { agent: "tax", model: "claude-opus", priority: 2, context: "declarations" },
    { agent: "risk", model: "gpt-4", priority: 3, context: "all" },
  ],
  fusion: "structured_report",
  maxTokens: 8000,
  maxCost: 0.50,
  timeout: 120000,     // ms
  fallback: "gpt-3.5-turbo"  // si excede costo
}
```

### 2.4 Agents

#### Financial Agent
```
Capacidades:
├── Análisis de balances (activo, pasivo, patrimonio)
├── Estado de resultados (ingresos, costos, márgenes)
├── Flujo de caja (operativo, inversión, financiamiento)
├── Ratios (liquidez, solvencia, rentabilidad, eficiencia)
├── Tendencias (comparación N períodos)
├── Proyecciones (forecast 12 meses)
├── Benchmark (vs industria)
└── Alertas (desviaciones > umbral)

Modelo: gpt-4 para análisis complejo
        gpt-3.5-turbo para ratios simples
System Prompt: "Eres un analista financiero senior con 20 años de experiencia..."
```

#### Tax Agent
```
Capacidades:
├── Análisis de declaraciones (IVA, renta, retenciones)
├── Cumplimiento fiscal (fechas, montos, obligaciones)
├── Optimización (estrategias fiscales legales)
├── Riesgos tributarios
└── Planificación fiscal

Modelo: claude-opus (mejor con documentos largos)
System Prompt: "Eres un tributarista experto en legislación ecuatoriana/latinoamericana..."
```

#### Risk Agent
```
Capacidades:
├── Score crediticio (0-100)
├── Riesgo de liquidez
├── Riesgo de solvencia
├── Riesgo operativo
├── Alertas tempranas
└── Recomendaciones de mitigación

Modelo: gpt-4
System Prompt: "Eres un analista de riesgos financieros..."
```

#### Commercial Agent
```
Capacidades:
├── Oportunidades de upselling
├── Segmentación de clientes
├── Recomendación de servicios adicionales
├── Análisis de rentabilidad por cliente
└── Alertas de churn

Modelo: gpt-3.5-turbo
```

### 2.5 Supervisor
```
Valida:
├── Coherencia: ¿Los agentes se contradicen?
├── Completitud: ¿Cubrieron todas las áreas?
├── Calidad: ¿Las respuestas tienen suficiente profundidad?
├── Confianza: Score individual < 70% → marcar para revisión humana
└── Acción: Si hay contradicción → re-ejecutar agente conflictivo
```

### 2.6 Validator
```
Verifica contra datos reales:
├── ¿Los ratios calculados coinciden con los datos?
├── ¿Las fuentes son correctas?
├── ¿Las fechas coinciden?
└── Confianza general del informe (0-100%)

Si confianza < 60% → marcar "requiere revisión humana"
```

### 2.7 Fusioner
```
Toma todas las respuestas y produce:

INFORME ESTRUCTURADO:
├── Resumen ejecutivo (1 párrafo)
├── Hallazgos principales (3-5 bullets)
├── Análisis detallado (por agente)
├── Riesgos identificados
├── Oportunidades
├── Recomendaciones (priorizadas)
├── Plan de acción (pasos concretos)
└── Anexos (tablas, gráficos, datos fuente)

Formato de salida: JSON estructurado → renderizado como informe
```

### 2.8 Memory
```
Capas de memoria:
├── Ephemeral (consulta actual) — se descarta al terminar
├── Session (conversación activa) — dura 24h
├── Project (historial del proyecto) — dura lo que el proyecto
├── Client (todo el cliente) — permanente
├── Company (patrones de la empresa) — permanente
└── Global (anónimo, mejora el producto) — permanente

Cada capa almacena:
{ role, content, agent, model, tokens, cost, timestamp, feedback }
```

---

## 3. Cost Engine

Cada consulta a la IA se registra y optimiza.

```
Registro por consulta:
{
  tenant: "company-slug",
  user: "user-id",
  session: "session-id",
  agent: "financial",
  model: "gpt-4",
  inputTokens: 4500,
  outputTokens: 1200,
  totalTokens: 5700,
  cost: 0.042,               // USD
  duration: 3400,             // ms
  cacheHit: false,
  quality: null,              // feedback humano 1-5
  timestamp: "2026-06-26T..."
}

Estrategia de optimización:
├── Cache: respuestas idénticas → TTL 1h
├── Model routing: simple → gpt-3.5, complejo → gpt-4/claude
├── Budget mensual por tenant
├── Alerta si > 80% del budget
└── Downgrade automático si excede budget
```

### Costos estimados por operación
```
Operación                  │ Modelo         │ Costo estimado
───────────────────────────┼────────────────┼────────────────
Análisis de balance        │ gpt-4          │ $0.08-0.15
Ratios básicos             │ gpt-3.5-turbo  │ $0.01-0.03
Diagnóstico completo       │ gpt-4          │ $0.30-0.50
Generación de informe      │ gpt-4          │ $0.15-0.30
Clasificación documento    │ gpt-3.5-turbo  │ $0.005-0.01
Extracción de datos        │ gpt-4          │ $0.05-0.10
Respuesta a ticket         │ gpt-3.5-turbo  │ $0.01-0.03
Simulación                 │ gpt-4          │ $0.10-0.20
```
