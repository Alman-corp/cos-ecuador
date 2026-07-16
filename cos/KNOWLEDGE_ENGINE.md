# KNOWLEDGE ENGINE

## Motor de conocimiento conectado (Knowledge Graph)

El Knowledge Engine es la **ventaja competitiva más difícil de replicar** de Consulting OS. No guarda documentos — guarda **conocimiento conectado**. Cada proyecto, cada diagnóstico, cada recomendación alimenta un grafo de conocimiento que la IA usa para mejorar sus respuestas con el tiempo.

Mientras más clientes usa la plataforma, más inteligente se vuelve.

---

## 1. De documentos a conocimiento

```
Evolución:
Documentos sueltos → Archivos organizados → Knowledge Graph

                    ┌──────────────────────────────────────────┐
                    │                                          │
                    │  DOCUMENTOS: "subir y guardar"           │
                    │  (cualquier software lo hace)            │
                    │                                          │
                    │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
                    │                                          │
                    │  KNOWLEDGE GRAPH: "conectar y aprender"  │
                    │  (ventaja competitiva)                   │
                    │                                          │
                    │  Cada caso enriquece el sistema          │
                    │  La IA mejora con cada uso               │
                    │  El valor crece con el tiempo            │
                    │                                          │
                    └──────────────────────────────────────────┘
```

---

## 2. Estructura del Knowledge Graph

### Nodos (entidades)
```
Nodo                    │ Propiedades                    │ Creado por
────────────────────────┼────────────────────────────────┼─────────────────────
Cliente                 │ nombre, industria, segmento   │ CRM
Problema                │ descripción, categoría        │ Consultor/IA
Norma                   │ código, jurisdicción          │ Sistema
Estrategia              │ descripción, tipo, costo      │ Consultor/IA
Resultado               │ métricas, éxito/fracaso       │ Consultor
Recomendación           │ prioridad, impacto            │ IA/Humano
Documento               │ tipo, fecha, metadata         │ Subida
Proyecto                │ tipo, fechas, presupuesto     │ Sistema
Tarea                   │ estado, prioridad             │ Proyecto
Decisión                │ contexto, selección           │ Decision Engine
KPI                     │ fórmula, valor, umbral        │ Configuración
Industry                │ nombre, región                │ Sistema
```

### Relaciones (aristas)
```
Relación                │ Origen → Destino              │ Descripción
────────────────────────┼───────────────────────────────┼─────────────────────
tiene                   │ Cliente → Problema            │ El cliente presenta
se_aplica               │ Problema → Norma              │ La norma aplica
se_ejecuto              │ Problema → Estrategia         │ Se aplicó estrategia
produjo                 │ Estrategia → Resultado        │ Resultado obtenido
genero                  │ Estrategia → Recomendación    │ Recomendación derivada
se_reutilizo_en         │ Estrategia → Cliente          │ Misma estrategia
similar_a               │ Cliente → Cliente             │ Clientes semejantes
derivado_de             │ Recomendación → Decision      │ Basado en decisión
contiene                │ Proyecto → Tarea              │ Proyecto incluye
referencia              │ Documento → Norma             │ Documento cita norma
mejoro                  │ Recomendación → KPI           │ KPI mejorado
causado_por             │ Problema → Evento             │ Evento disparador
```

### Ejemplo visual del grafo

```
                    ┌──────────┐
                    │ Cliente  │
                    │ "Grupo X"│
                    └────┬─────┘
                         │ tiene
                         ▼
                    ┌──────────┐
                    │ Problema │  "Liquidez insuficiente"
                    │ Score: 22│
                    └────┬─────┘
                         │
              ┌──────────┼──────────┐
              │          │          │
              ▼          ▼          ▼
        ┌──────────┐ ┌────────┐ ┌──────────┐
        │Norma     │ │Estrateg│ │Similar_a │
        │NIIF 7    │ │ia      │ │Cliente Y │
        └──────────┘ │"Plan A"│ └──────────┘
                     └───┬────┘
                         │ produjo
                         ▼
                    ┌──────────┐
                    │Resultado │
                    │+30% liq. │
                    └────┬─────┘
                         │ genero
                         ▼
                    ┌──────────────┐
                    │Recomendación │
                    │"Restructurar │
                    │ deuda"       │
                    └──────────────┘
                         │
                         ▼
                    ┌──────────┐
                    │ Decision  │
                    │ Plan A    │
                    │ Aprobado  │
                    └──────────┘
```

---

## 3. Pipeline de conocimiento

### 3.1 Extracción (al completar proyecto/caso)
```
Evento: project.completed o analysis.completed

1. Identificar nodos:
   - Cliente (existente)
   - Problema principal (nuevo)
   - Estrategia aplicada (nueva)
   - Resultado obtenido (nuevo)
   - Recomendaciones (nuevas)

2. Extraer propiedades:
   - IA extrae del informe final
   - Consultor confirma/edita
   - Sistema completa metadata
```

### 3.2 Indexación
```
3. Generar embeddings:
   - Cada nodo → texto descriptivo → embedding vector
   - Problema: "Cliente manufacturero con liquidez 0.8, deuda 2.5x, ventas cayendo 15%"
   - Estrategia: "Reestructuración de deuda: consolidar pasivos, negociar tasas, extender plazos"
   - Resultado: "Liquidez mejoró 30%, deuda reducida 15%, score subió de 22 a 55"

4. Almacenar en Vector DB:
   - pgvector (cada nodo tiene su embedding)
   - Índice IVFFlat para búsqueda rápida
```

### 3.3 Conexión
```
5. Detectar relaciones:
   - Embedding similarity → nodos similares
   - Mismo cliente → enlazar nuevos nodos
   - Mismo problema → "similar_a" otros casos
   - Misma estrategia → "se_reutilizo_en" otros clientes

6. Construir/actualizar grafo:
   - N nuevas aristas
   - Pesos basados en relevancia y tiempo
```

### 3.4 Reutilización
```
Cuando un nuevo caso entra:
  1. Vectorizar el nuevo problema
  2. Buscar top-5 casos similares en Vector DB
  3. Recuperar estrategias y resultados
  4. IA genera recomendación adaptada:
     "En 3 casos anteriores similares, la estrategia [X]
      resultó en [Y] de mejora. Recomendación adaptada: [Z]"
  5. Presentar al consultor con score de confianza
```

---

## 4. Learning Loop

```
Ciclo de mejora continua:

Nuevo caso
    │
    ▼
Knowledge Graph buscó similares → encontró 3 casos
    │
    ▼
IA generó recomendación basada en casos anteriores
    │
    ▼
Consultor aplicó + ajustó
    │
    ▼
Resultado: éxito (mejora 30%) o fracaso (lección)
    │
    ▼
Caso se indexa en el grafo
    │
    ▼
Próximo caso similar → IA tendrá 4+ casos de referencia
    │
    ▼
La precisión mejora con cada iteración
```

### Métricas de aprendizaje
```
Métrica                  │ Descripción
─────────────────────────┼────────────────────────────────────────
Casos indexados          │ Total de casos en el grafo
Precisión de IA          │ % de recomendaciones aceptadas sin cambio
Tasa de reutilización    │ % de nuevos casos que usan conocimiento previo
Mejora en score          │ Diferencia promedio pre/post aplicación
Tiempo de análisis       │ Reducción de tiempo vs. sin KG
Clientes por patrón      │ Clientes que comparten el mismo problema
```

---

## 5. API de conocimiento

```
BUSCAR CONOCIMIENTO
───────────────────
POST /api/v1/knowledge/search
  Body: { query: "cliente con liquidez baja y deuda alta", filters: { industry: "comercio" }, limit: 5 }
  Response: { results: [{ node, similarity, context }] }

RECUPERAR CASO
──────────────
GET /api/v1/knowledge/case/{caseId}
  Response: { problema, estrategia, resultado, recomendaciones, documentos[] }

RECOMENDAR
──────────
POST /api/v1/knowledge/recommend
  Body: { clientId, problemDescription }
  Response: { recommendations: [{ text, confidence, basedOn[] }], similarCases[] }

INDEXAR
───────
POST /api/v1/knowledge/index
  Body: { clientId, projectId? }
  Response: { nodesCreated, relationsCreated }
```

---

## 6. Modelo de datos

```prisma
model KnowledgeNode {
  id          String   @id @default(uuid())
  companyId   String
  type        String   // client, problem, norm, strategy, result, recommendation, etc.
  title       String
  description String?
  properties  Json     @default("{}")
  embedding   Unsupported("vector(1536)")?  // pgvector
  metadata    Json     @default("{}")
  createdAt   DateTime
  updatedAt   DateTime

  relations   KnowledgeRelation[]
}

model KnowledgeRelation {
  id          String   @id @default(uuid())
  fromId      String
  from        KnowledgeNode @relation("FromNode", fields: [fromId], references: [id])
  toId        String
  to          KnowledgeNode @relation("ToNode", fields: [toId], references: [id])
  type        String   // tiene, se_aplica, produjo, similar_a, etc.
  weight      Float    @default(1.0)
  metadata    Json     @default("{}")
  createdAt   DateTime
}
```

---

## 7. Privacidad y multi-tenencia

```
Capa de aislamiento:
├── Tenant level:     Nodos y relaciones visibles solo dentro del tenant
├── Cross-tenant:     Solo datos anonimizados (sin nombres, RUCs)
│                     Solo patrones: "industria X + problema Y → estrategia Z"
└── Global:           Métricas agregadas (mejora el producto base)

El tenant puede optar por:
├── "Solo mi data" → no contribuye al conocimiento global
├── "Compartir anónimo" → contribuye patrones (default)
└── "Compartir todo" → contribuye datos completos (beneficio: mejores recomendaciones)
```

---

## 8. Roadmap de implementación

```
Fase 1 (MVP):
├── KnowledgeNode + KnowledgeRelation en PostgreSQL
├── Indexación manual (consultor marca problemas/estrategias)
├── Búsqueda básica por tags y texto
└── Sin embeddings (búsqueda solo por keywords)

Fase 2 (Growth):
├── pgvector para embeddings
├── Indexación automática al completar proyecto
├── Búsqueda semántica
└── Recomendaciones básicas basadas en similaridad

Fase 3 (Scale):
├── Procesamiento batch con eventos async
├── Cross-tenant learning (anonimizado)
├── Dashboard de conocimiento
├── API pública de conocimiento
└── Active learning (qué casos indexar prioritariamente)
```
