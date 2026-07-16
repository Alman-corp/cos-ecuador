# CONSULTING ENGINE — Flujo operativo completo de una consultora

## ¿Cómo trabaja una firma de consultoría financiera?

Este documento define el **flujo operativo completo** que Consulting OS debe ejecutar, desde la captación de leads hasta el seguimiento de clientes establecidos. Es el "motor" del software: cada paso corresponde a funcionalidades del sistema.

---

## 1. CICLO COMERCIAL (CRM + VENTAS)

La consultora vive de su pipeline comercial. Todo empieza aquí.

```
Lead (cualquier fuente)
  │
  ├── Web (formulario landing page)
  ├── Referido (cliente existente)
  ├── Partner (contador, banco, aseguradora)
  ├── Inbound (LinkedIn, Google, redes)
  ├── Cold Outreach (llamada, email, WhatsApp)
  └── Evento (feria, webinar, conferencia)
  │
  ▼
┌──────────────────────────────────────────┐
│ CALIFICACIÓN                              │
│ BANT: Budget, Authority, Need, Timeline   │
│ Score automático (0-100)                  │
│                                           │
│ ¿Califica?                                │
│   Sí → Prospecto                         │
│   No → Lead frío (nutrición automática)  │
└──────────────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────────────┐
│ PROSPECTO                                 │
│                                           │
│ Actividades:                              │
│   ├── Llamada de descubrimiento           │
│   ├── Email de propuesta de valor        │
│   ├── Reunión virtual                    │
│   ├── Envío de caso de éxito             │
│   ├── Demo del sistema                   │
│   └── Seguimiento LinkedIn               │
│                                           │
│ Documentos compartidos:                   │
│   ├── Brief del cliente                  │
│   ├── Primeros estados financieros       │
│   └── Evaluación rápida gratuita         │
│                                           │
│ Estado:                                   │
│   contacto → reunión → demo →            │
│   propuesta → negociación → ganado/perdido│
└──────────────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────────────┐
│ OPORTUNIDAD (en pipeline)                 │
│                                           │
│ Datos:                                    │
│   ├── Valor estimado $                   │
│   ├── Probabilidad de cierre %           │
│   ├── Fecha estimada de cierre           │
│   ├── Competidores                       │
│   ├── Notas de negociación               │
│   └── Pipeline stage                     │
│                                           │
│ Actividades automáticas:                  │
│   ├── Recordatorio de follow-up          │
│   ├── Alerta si probabilidad baja        │
│   ├── Notificar director si > $50K       │
│   └── Propuesta enviada → esperar 7 días │
└──────────────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────────────┐
│ NEGOCIACIÓN                               │
│                                           │
│ Propuesta enviada:                        │
│   ├── Alcance del proyecto               │
│   ├── Entregables                        │
│   ├── Timeline                           │
│   ├── Inversión                          │
│   │   ├── Plan Básico  ($497/mes)       │
│   │   ├── Plan Profesional ($1,297/mes) │
│   │   └── Plan Enterprise ($3,497/mes)  │
│   └── Términos y condiciones             │
│                                           │
│ Contrapropuestas → Ajustes → Cierre      │
└──────────────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────────────┐
│ CIERRE                                     │
│                                           │
│ Ganado:                                   │
│   ├── Contrato firmado                   │
│   ├── Plan seleccionado                  │
│   ├── Medio de pago                     │
│   ├── Fecha de inicio                    │
│   └── ─────────────────────────────      │
│           ↓                              │
│         CLIENTE OFICIAL                  │
│                                           │
│ Perdido:                                  │
│   ├── Razón (precio, timing, competidor) │
│   ├── ¿Nutrir para futuro?               │
│   └── Workflow de reactivación           │
└──────────────────────────────────────────┘
```

---

## 2. CICLO ONBOARDING (Nuevo Cliente)

```
┌──────────────────────────────────────────┐
│ CONTRATO FIRMADO                          │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│ 2.1 CONFIGURACIÓN INICIAL                 │
│   - Crear workspace del cliente          │
│   - Asignar equipo consultor             │
│   - Configurar permisos                  │
│   - Kickoff meeting programado           │
│   - Bienvenida automática (email)        │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│ 2.2 RECOLECCIÓN INICIAL DE DOCUMENTOS     │
│   Portal cliente:                         │
│   ├── Subir balance general              │
│   ├── Subir estado de resultados         │
│   ├── Subir flujo de caja                │
│   ├── Declaraciones de impuestos         │
│   ├── Nómina                             │
│   └── Contratos vigentes                 │
│                                           │
│   IA clasifica, valida y extrae datos    │
│   Humano revisa consistencia             │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│ 2.3 DIAGNÓSTICO INICIAL (RÁPIDO)          │
│   IA genera primer análisis:              │
│   ├── Ratios financieros clave           │
│   ├── Semáforo de salud financiera       │
│   ├── Riesgos identificados              │
│   ├── Oportunidades                      │
│   └── Recomendaciones iniciales          │
│                                           │
│   Humano revisa y ajusta                 │
│   Presentación al cliente                │
└──────────────────────────────────────────┘
```

---

## 3. CICLO OPERATIVO (Recurrente)

```
                    ┌─────────────────┐
                    │ CLIENTE ACTIVO   │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────┐
│ RECOLECCIÓN      │ │ ANÁLISIS IA   │ │ INFORME       │
│                  │ │              │ │               │
│ Documentos       │ │ Router IA    │ │ Generación    │
│ periódicos       │ │ → Planificador│ │ automática    │
│ (balance,        │ │ → Agentes    │ │ Dashboard     │
│ resultados,      │ │ → Supervisor │ │ KPIs          │
│ flujo)           │ │ → Validador  │ │ Plan          │
│                  │ │ → Fusionador │ │ Estratégico   │
│ Clasificación    │ │ → Memoria    │ │ Exportar PDF  │
│ Validación       │ │              │ │               │
└────────┬─────────┘ └──────┬───────┘ └──────┬────────┘
         │                  │                │
         └──────────────────┼────────────────┘
                            │
                            ▼
              ┌──────────────────────────────┐
              │ PRESENTACIÓN                  │
              │                               │
              │ Reunión con cliente           │
              │   - Presentar informe         │
              │   - Discutir hallazgos        │
              │   - Acordar acciones          │
              │   - Próximos pasos            │
              │                               │
              │ Sistema registra:             │
              │   - Acuerdos                  │
              │   - Tareas asignadas          │
              │   - Próxima revisión          │
              └──────────────┬───────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │ SEGUIMIENTO                   │
              │                               │
              │ Automático:                   │
              │   - KPIs periódicos           │
              │   - Alertas de desviación     │
              │   - Recordatorios             │
              │   - Nueva documentación       │
              │                               │
              │ Humano:                       │
              │   - Reuniones recurrentes     │
              │   - Ajuste de estrategia      │
              │   - Revisión trimestral       │
              └──────────────────────────────┘
```

---

## 4. CICLO DE DOCUMENT INTELLIGENCE

No es solo subir archivos. La IA transforma documentos en datos accionables.

```
Documento subido
    │
    ▼
┌──────────────────────────────────────────┐
│ 1. EXTRACCIÓN                             │
│   - OCR (PDF escaneado → texto)          │
│   - Extracción estructurada (tablas)     │
│   - Reconocimiento de entidades          │
│     (RUC, fechas, montos, firmas)        │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│ 2. CLASIFICACIÓN                          │
│   - Tipo: balance, resultados, flujo,    │
│           declaración, contrato, factura │
│   - Período: Q1 2025, anual 2024        │
│   - Moneda: USD, EUR, COP               │
│   - Confianza: score de clasificación    │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│ 3. VALIDACIÓN                             │
│   - ¿Cuadra balance? (activo = pasivo)   │
│   - ¿Consistente con período anterior?   │
│   - ¿Datos completos?                    │
│   - Señalar anomalías                    │
│   - Requiere revisión humana?            │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│ 4. RELACIÓN                               │
│   - Vincular con cliente correcto        │
│   - Vincular con proyecto                │
│   - Vincular con período fiscal          │
│   - Detectar relaciones entre docs       │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│ 5. COMPARACIÓN                            │
│   - Vs. período anterior                 │
│   - Vs. presupuesto                      │
│   - Vs. industria (benchmark)            │
│   - Vs. meta del cliente                 │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│ 6. RESUMEN                               │
│   - Resumen ejecutivo (IA genera)        │
│   - Highlights                           │
│   - Riesgos detectados                   │
│   - Oportunidades                        │
└──────────────────────────────────────────┘
```

---

## 5. CICLO DE WORKFLOW / BPM

Procesos configurables visualmente, sin código.

### Elementos del editor BPM

```
┌──────────────────────────────────────────┐
│ PALETA DE COMPONENTES                     │
│                                           │
│ Inicio / Fin                             │
│ Tarea humana (asignar a usuario)         │
│ Tarea IA (analizar, clasificar, generar) │
│ Documento (solicitar, validar, firmar)   │
│ Condición (SI/ENTONCES/SINO)            │
│ Evento (timer, webhook, email recibido)  │
│ Paralelo (ejecutar N tareas simultáneas) │
│ Espera (hasta condición o fecha)        │
│ Notificación (email, in-app, WhatsApp)  │
│ Webhook (llamar API externa)            │
│ Firma electrónica                       │
│ Generar PDF                             │
│ Actualizar KPI                          │
│ Guardar en Knowledge Graph              │
└──────────────────────────────────────────┘
```

### Ejemplo: Workflow de "Auditoría Mensual"

```
INICIO (1ro de cada mes)
    │
    ▼
ESPERAR: Cliente sube documentación
    │ (timer: 5 días máximo)
    │
    ▼
┌──────────────────────────────────────────┐
│ ¿Documentos recibidos?                    │
│                                           │
│ Sí:                                      │
│   → IA extrae datos                      │
│   → IA valida consistencia              │
│   → Humano revisa                        │
│   → Generar informe automático           │
│   → Enviar notificación al cliente       │
│   → Agendar reunión de revisión          │
│                                           │
│ No:                                      │
│   → Enviar recordatorio al cliente       │
│   → Escalar al director si > 7 días      │
└──────────────────────────────────────────┘
    │
    ▼
FIN
```

---

## 6. CICLO DEL DECISION ENGINE

Razonamiento automático sobre la salud del cliente.

```
INPUTS DEL CLIENTE
├── Ratios financieros
├── Tendencias (12 meses)
├── Documentos
├── Score histórico
├── Variables macro (opcional)
├── Eventos recientes (pérdida cliente grande, demanda, etc.)
└── Restricciones del cliente
    │
    ▼
┌──────────────────────────────────────────┐
│ DECISION ENGINE                           │
│                                           │
│ 1. EVALUAR                              │
│    Factor 1: Liquidez (peso 25%)         │
│      Ratio: 0.8 → Score: 20/100         │
│    Factor 2: Deuda (peso 20%)            │
│      Ratio: 2.5 → Score: 30/100         │
│    Factor 3: Tendencia (peso 20%)        │
│      Ventas -15% → Score: 25/100        │
│    Factor 4: Cumplimiento (peso 15%)     │
│      IVA pendiente → Score: 10/100      │
│    Factor 5: Estabilidad (peso 20%)      │
│      Nómina +20%, ventas -15% → 35/100  │
│                                           │
│    Score total: 22/100 → RIESGO MUY ALTO │
│                                           │
│ 2. RECOMENDAR                            │
│    Plan A: Reestructuración de deuda     │
│      Probabilidad: 65%                   │
│      Impacto: +30% liquidez              │
│      Plazo: 6 meses                      │
│      Pasos: [1, 2, 3...]                 │
│                                           │
│    Plan B: Reducción de gastos           │
│      Probabilidad: 70%                   │
│      Impacto: +15% margen               │
│      Plazo: 3 meses                      │
│      Pasos: [1, 2, 3...]                 │
│                                           │
│    Plan C: Línea de crédito puente       │
│      Probabilidad: 45%                   │
│      Impacto: +50% liquidez temporal     │
│      Plazo: 1 mes                        │
│      Pasos: [1, 2, 3...]                 │
└──────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────┐
│ HUMANO REVISA                             │
│   - Ajusta planes                       │
│   - Aprueba o modifica                   │
│   - Presenta al cliente                  │
└──────────────────────────────────────────┘
```

---

## 7. CICLO DE SIMULACIÓN

"¿Qué pasa si...?" — en tiempo real.

```
USUARIO CONFIGURA ESCENARIO
├── Variable a modificar
│   ├── Subir IVA (12% → 15%)
│   ├── Caen ventas 20%
│   ├── Dólar se aprecia 10%
│   ├── Tasa interés sube 3%
│   ├── Nuevo préstamo $50K
│   ├── Contratar 2 personas
│   ├── Cambiar proveedor (-5%)
│   └── Cliente paga a 60 vs 30 días
│
├── Magnitud del cambio
├── Horizonte (3, 6, 12 meses)
└── Cliente(s) a aplicar
    │
    ▼
┌──────────────────────────────────────────┐
│ SIMULACIÓN                                │
│                                           │
│ Resultados:                               │
│   ┌──────────────────┬──────┬──────────┐ │
│   │ Métrica          │ Actual│ Simulado│ │
│   ├──────────────────┼──────┼──────────┤ │
│   │ Liquidez         │ 1.2  │ 0.9      │ │
│   │ Margen Neto      │ 8%   │ 5%       │ │
│   │ Deuda/Patrimonio │ 1.5  │ 2.1      │ │
│   │ Score Riesgo     │ 45   │ 68       │ │
│   │ Flujo Caja Libre │ $12K │ -$3K     │ │
│   └──────────────────┴──────┴──────────┘ │
│                                           │
│ Impacto en dashboard (gráficos)          │
│ Recomendación automática:                 │
│   "No recomendado sin plan de mitigación" │
└──────────────────────────────────────────┘
```

---

## 8. CICLO DE TICKETS / SOPORTE

```
Cliente abre ticket (portal, email, WhatsApp)
    │
    ▼
┌──────────────────────────────────────────┐
│ IA CLASIFICA                              │
│   - Categoría: financiero, tributario,   │
│     legal, administrativo, técnico       │
│   - Prioridad: baja, media, alta, urgente│
│   - Asigna automáticamente al consultor  │
│   - Sugiere respuesta basada en historial│
└──────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────┐
│ CONSULTOR RESPONDE                        │
│   - Revisa sugerencia IA                 │
│   - Ajusta si necesario                  │
│   - Responde por canal original          │
│   - Marca resuelto o escalar             │
└──────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────┐
│ FEEDBACK                                  │
│   - Encuesta satisfacción                │
│   - Ticket alimenta Knowledge Graph      │
│   - Si recurrente → crear workflow       │
└──────────────────────────────────────────┘
```

---

## 9. CICLO DE CONOCIMIENTO (Knowledge Graph)

Cada interacción alimenta el conocimiento colectivo.

```
PROYECTO COMPLETADO
    │
    ▼
┌──────────────────────────────────────────┐
│ 1. EXTRACCIÓN                             │
│   Problema → Estrategia → Resultado      │
│   Documentos clave                       │
│   Decisiones importantes                 │
│   Errores y lecciones                    │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│ 2. INDEXACIÓN                             │
│   Embeddings → Vector DB                 │
│   Tags y categorías                     │
│   Relaciones: este problema ocurrió     │
│               también en Cliente X       │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│ 3. REUTILIZACIÓN                          │
│   Nuevo cliente con problema similar:    │
│   "En 3 casos anteriores, la estrategia  │
│    Y resultó en mejora de Z.             │
│    Recomendación adaptada: Y'"           │
│                                           │
│   La IA mejora sus recomendaciones       │
│   con cada caso resuelto                 │
└──────────────────────────────────────────┘
```

---

## 10. CICLO DE ECONOMÍA DE LA CONSULTORA (MSP)

La consultora se analiza a sí misma.

```
MÉTRICAS EN VIVO
├── MRR: $48,320 (+12% vs mes anterior)
├── ARR: $579,840
├── Clientes activos: 42
├── Churn: 1.8% (target: < 3%)
├── LTV promedio: $24,500
├── CAC: $3,200 (LTV/CAC = 7.6x)
├── Utilización consultores: 74%
├── Margen promedio por proyecto: 52%
├── Pipeline: $124,500 (6 oportunidades)
├── Cash Burn: $18,400/mes
└── Runway: 14 meses
    │
    ▼
┌──────────────────────────────────────────┐
│ ALERTAS AUTOMÁTICAS                       │
│   ├── Utilización < 60% → muy baja       │
│   ├── Churn > 5% → clientes insatisfechos│
│   ├── CAC > LTV/3 → ajustar marketing   │
│   ├── Pipeline < 3x MRR → insuficiente   │
│   └── Cash Burn alto → revisar gastos    │
└──────────────────────────────────────────┘
```

---

## Roles operativos

| Rol | Responsabilidad | ¿Qué ve? |
|-----|----------------|---------|
| **Admin** | Configura empresa, usuarios, roles, facturación | TODO |
| **Director** | Pipeline, asignación, KPIs de la firma, revisiones | Todos los clientes y proyectos |
| **Consultor Senior** | Clientes complejos, informes, mentoría | Clientes asignados |
| **Consultor** | Ejecución de proyectos, análisis, atención | Clientes asignados |
| **Viewer** | Solo lectura de dashboards e informes | Clientes asignados |
| **Cliente** | Su dashboard, documentos, tickets | Solo su empresa |

---

## Principios del Consulting Engine

1. **CRM-first**: el pipeline comercial es la entrada de todo; sin leads no hay clientes
2. **IA multiagente orquestada**: Router → Planner → Agents → Supervisor → Validator → Fusioner → Memory
3. **Inteligencia documental**: cada documento es extraído, clasificado, validado, relacionado, comparado y resumido
4. **Workflows configurables**: procesos sin código con editor visual (BPM)
5. **Decisiones que razonan**: no solo reglas, el engine evalúa múltiples factores con peso y genera planes
6. **Simulación continua**: toda decisión puede modelarse antes de ejecutarse
7. **Autoconocimiento (MSP)**: la consultora se analiza con las mismas herramientas que sus clientes
8. **Conocimiento acumulativo**: cada caso alimenta el knowledge graph; la IA mejora con el tiempo
9. **Sin código**: reglas, BPM, KPIs, dashboards, simulaciones: todo configurable visualmente
10. **Event-driven**: todo cambio significativo propaga eventos que N suscriptores procesan
