# DECISION ENGINE

## Motor de razonamiento multi-factor

El Decision Engine es el alma de Consulting OS. No ejecuta reglas simples — **razona** evaluando múltiples factores simultáneamente, asigna pesos, calcula scores y genera planes de acción con probabilidades de éxito.

---

## 1. Arquitectura

```
Input del cliente (datos financieros, documentos, eventos)
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│                     DECISION ENGINE                          │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐ │
│  │ FACTOR   │→ │ SCORING  │→ │ PLAN     │→ │ OUTPUT     │ │
│  │ EVAL     │  │ ENGINE   │  │ GENERATOR│  │ FORMATTER  │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘ │
│       │              │             │              │         │
│       ▼              ▼             ▼              ▼         │
│  Factores       Score por     Genera        Informe        │
│  financieros    factor +     planes A/B/C  estructurado   │
│  + contexto     peso global   + probab.                    │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ HUMANO REVISA                                                │
│ - Ajusta planes                                             │
│ - Aprueba o modifica                                        │
│ - Presenta al cliente                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Factor Evaluation

### 2.1 Factores financieros (core)
```
Factor                  │ Peso │ Fuente                   │ Rango saludable
────────────────────────┼──────┼──────────────────────────┼────────────────
Liquidez (razón corr.)  │ 25%  │ Balance                  │ 1.5 - 3.0
Endeudamiento           │ 20%  │ Balance                  │ < 60%
Margen neto             │ 15%  │ Resultados               │ > 5%
Tendencia ventas        │ 15%  │ Resultados (N períodos)  │ > 0%
Flujo de caja libre     │ 10%  │ Flujo de caja            │ > 0
Cobertura de gastos     │ 10%  │ Flujo de caja            │ > 1.2
Cumplimiento tributario │ 5%   │ Declaraciones            │ Al día
```

### 2.2 Factores contextuales
```
Factor                  │ Peso │ Fuente
────────────────────────┼──────┼──────────────────────────────────
Estabilidad laboral     │ var. │ Nómina histórica (variación)
Concentración clientes  │ var. │ Top 3 clientes / total ingresos
Antigüedad del negocio  │ var. │ Fecha de constitución
Sector económico        │ var. │ Industria (riesgo sectorial)
Historial de pagos      │ var. │ Tickets, quejas, morosidad
Cambios normativos      │ var. │ Eventos externos (API)
```

### 2.3 Scoring por factor
```
Cada factor recibe:
{
  factor: "liquidez",
  value: 0.8,
  weight: 0.25,
  score: 20,            // 0-100
  threshold: 1.5,
  status: "critical",
  trend: "deteriorating",
  message: "Liquidez muy por debajo del mínimo saludable (1.5)"
}

Score global:
  Weighted average de todos los factores
  Rango: 0-100
  0-30:  RIESGO MUY ALTO
  31-50: RIESGO ALTO
  51-70: RIESGO MODERADO
  71-85: SALUDABLE
  86-100: ÓPTIMO
```

---

## 3. Plan Generator

### 3.1 Generación de planes
```
Basado en los factores más críticos, genera:

Plan A: Reestructuración de deuda
├── Probabilidad: 65%
├── Impacto esperado: +30% liquidez, -15% deuda
├── Plazo: 6 meses
├── Pasos:
│   1. Consolidar deudas corto plazo
│   2. Negociar tasas con proveedores
│   3. Extender plazos de pago
│   4. Refinanciar deuda bancaria
└── Riesgos: Requiere historial crediticio positivo

Plan B: Reducción de gastos operativos
├── Probabilidad: 70%
├── Impacto esperado: +15% margen neto
├── Plazo: 3 meses
├── Pasos:
│   1. Auditoría de gastos fijos
│   2. Renegociar contratos proveedores
│   3. Optimizar nómina (horas extras, rotación)
│   4. Digitalizar procesos (reducir papelería)
└── Riesgos: Impacto limitado si gastos ya son eficientes

Plan C: Línea de crédito puente
├── Probabilidad: 45%
├── Impacto esperado: +50% liquidez temporal
├── Plazo: 1 mes
├── Pasos:
│   1. Solicitar línea de crédito
│   2. Presentar flujo de caja proyectado
│   3. Usar para cubrir gap 90 días
└── Riesgos: Incrementa deuda, solo solución temporal
```

### 3.2 Recomendación priorizada
```
Los planes se ordenan por:
  score = (probabilidad × impacto) / (plazo × riesgo)

Mayor score → recomendado primero
```

---

## 4. Implementación técnica

### 4.1 Modelo de datos
```prisma
model DecisionFactor {
  id          String   @id @default(uuid())
  companyId   String
  name        String   // liquidez, endeudamiento, etc.
  category    String   // financial, contextual, operational
  weight      Float    // 0-1
  formula     String   // expresión evaluable: "current_ratio"
  threshold   Json     // { min: 1.5, max: 3.0 }
  isActive    Boolean  @default(true)
  createdAt   DateTime
  updatedAt   DateTime
}

model DecisionEvaluation {
  id          String   @id @default(uuid())
  companyId   String
  clientId    String
  score       Int      // 0-100
  status      String   // critical, alert, healthy, optimal
  factors     Json     // []FactorScore
  plans       Json     // []GeneratedPlan
  selectedPlan String? // user selection
  humanNotes  String?
  createdAt   DateTime
}
```

### 4.2 API
```
POST /api/v1/decision/evaluate
  Body: { clientId, factors?: override[] }
  Response: { score, status, factors[], plans[], evaluationId }

POST /api/v1/decision/{id}/select-plan
  Body: { planIndex, notes? }
  Response: { success, plan }

GET /api/v1/decision/{id}
  Response: { evaluation completa }

GET /api/v1/decision/history?clientId=X
  Response: { evaluations[] }
```

### 4.3 Integración con IA
```
El Decision Engine usa la IA para:
├── Interpretar factores cualitativos
├── Generar descripciones de planes
├── Estimar probabilidades (basado en casos históricos)
├── Redactar informes explicativos
└── Sugerir pasos concretos adaptados al cliente

Pero la matemática (cálculo de scores, pesos) es determinista:
├── Fórmulas predefinidas
├── Sin alucinaciones
└── Reproducible y auditable
```

---

## 5. Ejemplos de uso

### Diagnóstico rápido
```
Input: Balance + Resultados + Flujo
Output: Score 22/100 → "RIESGO MUY ALTO"
        Plan A: Reestructurar deuda (65%)
        Plan B: Reducir gastos (70%)
        Plan C: Crédito puente (45%)
Tiempo: < 30 segundos
```

### Alerta de deterioro
```
Input: Nuevo período (ventas -20%, deuda +30%)
Output: Score bajó de 65 a 38 → "RIESGO ALTO"
        "Se detectó deterioro significativo en 3 factores"
        Plan sugerido: Revisión urgente con el cliente
```

### Comparación pre/post decisión
```
Input: "Simular Plan A aplicado"
Output: Score proyectado: 22 → 55 ("RIESGO MODERADO")
        "El Plan A mejoraría la liquidez en 30% pero
         incrementaría deuda en 15%. Recomendación:
         Combinar Plan A + Plan B para mejor resultado."
```
