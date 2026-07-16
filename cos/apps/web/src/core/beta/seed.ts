import { memoryStore } from "@/core/memory"
import { planningEngine } from "@/core/planning"
import { learningEngine } from "@/core/learning"
import { genomeEngine } from "@/core/genome"
import { persistence } from "@/core/persistence"
import { notificationService } from "@/core/notifications"

const COMPANY_ID = "demo-company"
const CLIENTS = ["cliente-constructora", "cliente-retail", "cliente-salud", "cliente-logistica"]
const NOW = new Date()

export async function seedAll() {
  seedMemory()
  await seedPlans()
  seedCases()
  await seedGenome()
  seedNewModules()
  await persistence.saveNow()
}

function seedMemory() {
  const entries = [
    { type: "kpi_change" as const, title: "Liquidez mejoró a 1.4", description: "Ratio de liquidez aumentó de 1.1 a 1.4 en el último trimestre", tags: ["finanzas", "liquidez"], importance: "high" as const, clientId: CLIENTS[0] },
    { type: "kpi_change" as const, title: "Margen operativo cayó a 12%", description: "Margen operativo se redujo del 18% al 12% por aumento de costos", tags: ["finanzas", "margen"], importance: "critical" as const, clientId: CLIENTS[0] },
    { type: "decision" as const, title: "Reestructuración de deuda aprobada", description: "Se aprobó renegociar pasivos bancarios por $500K", tags: ["finanzas", "deuda"], importance: "high" as const, clientId: CLIENTS[0] },
    { type: "meeting" as const, title: "Reunión estratégica con directorio", description: "Se definió prioridad en reducción de costos operativos", tags: ["estrategia"], importance: "high" as const },
    { type: "risk" as const, title: "Alta rotación de personal clave", description: "3 gerentes de área renunciaron en el último mes", tags: ["talento", "riesgo"], importance: "critical" as const, clientId: CLIENTS[1] },
    { type: "kpi_change" as const, title: "Ventas online crecieron 35%", description: "Canal digital pasó de representar 12% a 16% de ventas totales", tags: ["comercial", "digital"], importance: "high" as const, clientId: CLIENTS[1] },
    { type: "decision" as const, title: "Implementación de CRM iniciada", description: "Proyecto de CRM para seguimiento de clientes, presupuesto $40K", tags: ["comercial", "tecnologia"], importance: "medium" as const, clientId: CLIENTS[1] },
    { type: "meeting" as const, title: "Sesión de planeación comercial", description: "Definición de metas Q3: crecer 15% en cartera de clientes", tags: ["comercial"], importance: "medium" as const },
    { type: "kpi_change" as const, title: "Cumplimiento normativo al 94%", description: "Mejora en indicadores de cumplimiento regulatorio", tags: ["legal", "cumplimiento"], importance: "high" as const, clientId: CLIENTS[2] },
    { type: "risk" as const, title: "Observaciones de la Superintendencia", description: "3 hallazgos en auditoría de cumplimiento normativo", tags: ["legal", "riesgo"], importance: "critical" as const, clientId: CLIENTS[2] },
    { type: "decision" as const, title: "Plan de remediación de hallazgos", description: "Cronograma de 60 días para cerrar observaciones regulatorias", tags: ["legal", "cumplimiento"], importance: "high" as const, clientId: CLIENTS[2] },
    { type: "kpi_change" as const, title: "Eficiencia operativa mejoró 8%", description: "Reducción de tiempos de entrega de 5 a 4.2 días promedio", tags: ["operaciones", "eficiencia"], importance: "medium" as const, clientId: CLIENTS[3] },
    { type: "decision" as const, title: "Automatización de procesos logísticos", description: "Inversión de $80K en sistema WMS para bodega", tags: ["operaciones", "tecnologia"], importance: "high" as const, clientId: CLIENTS[3] },
    { type: "meeting" as const, title: "Comité de transformación digital", description: "Revisión de avance de proyectos tecnológicos", tags: ["digital"], importance: "medium" as const },
    { type: "risk" as const, title: "Proveedor crítico en riesgo financiero", description: "Principal proveedor reporta problemas de liquidez", tags: ["operaciones", "riesgo"], importance: "high" as const },
    { type: "kpi_change" as const, title: "ROI de campañas mejora a 4.2x", description: "Retorno sobre inversión en marketing digital mejoró significativamente", tags: ["comercial", "marketing"], importance: "medium" as const, clientId: CLIENTS[1] },
    { type: "event" as const, title: "Nuevo producto lanzado al mercado", description: "Línea de servicios premium para clientes corporativos", tags: ["innovacion", "crecimiento"], importance: "high" as const },
    { type: "recommendation" as const, title: "Recomendación: diversificar fuentes de ingreso", description: "Alta concentración en 3 clientes (68% de ingresos). Recomendamos diversificar.", tags: ["estrategia", "crecimiento"], importance: "high" as const },
    { type: "task" as const, title: "Actualizar proyecciones financieras", description: "Completar modelo financiero para presentación a junta directiva", tags: ["finanzas"], importance: "medium" as const },
    { type: "alert" as const, title: "ALERTA: Ratio deuda/EBITDA supera 4.5x", description: "Nivel de endeudamiento supera el umbral definido en el DNA", tags: ["finanzas", "alerta"], importance: "critical" as const },
  ]

  for (const e of entries) {
    const daysAgo = Math.floor(Math.random() * 60)
    const date = new Date(NOW.getTime() - daysAgo * 86400000)
    memoryStore.store({
      companyId: COMPANY_ID,
      type: e.type,
      title: e.title,
      description: e.description,
      entities: e.clientId ? [e.clientId] : CLIENTS,
      tags: e.tags,
      metadata: { source: "beta-seed" },
      userId: "system",
      userName: "Beta Seed",
      importance: e.importance,
    })
  }

  // Add some client entities
  const clientEntities = [
    { id: CLIENTS[0], name: "Constructora del Sur", industry: "construccion" },
    { id: CLIENTS[1], name: "RetailMax S.A.", industry: "retail" },
    { id: CLIENTS[2], name: "Clínica Santa María", industry: "salud" },
    { id: CLIENTS[3], name: "LogiExpress", industry: "logistica" },
  ]

  for (const c of clientEntities) {
    memoryStore.store({
      companyId: COMPANY_ID,
      clientId: c.id,
      type: "note",
      title: `Cliente registrado: ${c.name}`,
      description: `Empresa del sector ${c.industry} incorporada a la plataforma`,
      entities: [c.id],
      tags: ["cliente", c.industry],
      metadata: { industry: c.industry, clientName: c.name },
      userId: "system",
      userName: "Beta Seed",
      importance: "medium",
    })
  }
}

async function seedPlans() {
  // Plan 1: Completed plan → business case
  const plan1 = await planningEngine.generatePlan({
    companyId: COMPANY_ID,
    clientId: CLIENTS[0],
    objective: "Mejorar liquidez y reestructurar deuda de la constructora",
    category: "liquidez",
    timeframeMonths: 4,
    priority: "critical",
  })
  plan1.status = "completed"
  plan1.startedAt = new Date(NOW.getTime() - 150 * 86400000).toISOString()
  plan1.phases.forEach((p) => { p.status = "completed" })

  // Plan 2: Active plan being monitored
  const plan2 = await planningEngine.generatePlan({
    companyId: COMPANY_ID,
    clientId: CLIENTS[1],
    objective: "Transformación digital del canal de ventas retail",
    category: "transformacion_digital",
    targetValue: 30,
    unit: "%",
    timeframeMonths: 6,
    priority: "high",
  })
  plan2.status = "active"
  plan2.startedAt = new Date(NOW.getTime() - 30 * 86400000).toISOString()
  plan2.phases[0].status = "completed"
  if (plan2.phases.length > 1) plan2.phases[1].status = "in_progress"

  // Plan 3: Draft plan
  await planningEngine.generatePlan({
    companyId: COMPANY_ID,
    clientId: CLIENTS[2],
    objective: "Cumplimiento normativa sector salud 2026",
    category: "cumplimiento",
    timeframeMonths: 8,
    priority: "high",
  })
}

function seedCases() {
  learningEngine.registerCase({
    companyId: COMPANY_ID,
    clientId: CLIENTS[0],
    clientName: "Constructora del Sur",
    industry: "construcción",
    companySize: "mediana",
    problem: "Problemas de liquidez con deuda bancaria de $2M y ratio de liquidez de 0.9",
    problemCategory: "liquidez",
    diagnosis: "Estructura de capital desbalanceada: 75% deuda corto plazo, márgenes comprimidos al 8%",
    planSummary: "Reestructuración de deuda a 36 meses + plan de eficiencia operativa + mejora de cobranzas",
    planDurationMonths: 4,
    result: "Ratio de liquidez mejoró a 1.4, deuda reestructurada, margen operativo recuperado a 14%",
    resultadoCuantitativo: { revenueImpact: 120000, costReduction: 85000, marginImprovement: 6, liquidityImprovement: 0.5 },
    status: "completed",
    impact: "significant",
    tiempoMeses: 5,
    costTotal: 45000,
    rentabilidad: 355,
    lecciones: ["Involucrar a la banca desde el inicio del proceso", "Priorizar cuentas por cobrar antes que nueva deuda"],
    errores: ["Subestimamos el tiempo de negociación bancaria (+3 semanas)"],
    aciertos: ["Equipo de reestructuración dedicado full-time funcionó muy bien"],
    tags: ["liquidez", "deuda", "reestructuracion", "constructora"],
    completedAt: new Date(NOW.getTime() - 30 * 86400000).toISOString(),
  })

  learningEngine.registerCase({
    companyId: COMPANY_ID,
    clientId: CLIENTS[1],
    clientName: "RetailMax S.A.",
    industry: "retail",
    companySize: "grande",
    problem: "Caída de ventas presenciales del 22% y 15% de tiendas con rentabilidad negativa",
    problemCategory: "rentabilidad",
    diagnosis: "Mezcla de canales ineficiente: 85% ventas físicas, e-commerce solo 5%. Estructura de costos fijos alta",
    planSummary: "Plan de transformación omnicanal con cierre de tiendas no rentables y potenciación de canal digital",
    planDurationMonths: 8,
    result: "E-commerce pasó a 18% de ventas totales, margen mejoró 4 puntos, 3 tiendas cerradas",
    resultadoCuantitativo: { revenueImpact: 350000, costReduction: 180000, marginImprovement: 4 },
    status: "completed",
    impact: "transformational",
    tiempoMeses: 9,
    costTotal: 120000,
    rentabilidad: 441,
    lecciones: ["El cambio cultural fue más difícil que el tecnológico", "Capacitar al equipo antes del lanzamiento digital"],
    errores: ["Retraso en integración de sistemas legacy (+6 semanas)", "Subestimamos resistencia del equipo de tiendas"],
    aciertos: ["Programa de embajadores digitales internos funcionó muy bien"],
    tags: ["transformacion", "digital", "retail", "omnicanal"],
    completedAt: new Date(NOW.getTime() - 15 * 86400000).toISOString(),
  })

  learningEngine.registerCase({
    companyId: COMPANY_ID,
    clientId: CLIENTS[3],
    clientName: "LogiExpress",
    industry: "logística",
    companySize: "mediana",
    problem: "Eficiencia operativa baja: entregas en 5.2 días promedio, 12% devoluciones",
    problemCategory: "eficiencia_operativa",
    diagnosis: "Procesos manuales en bodega, ruteo ineficiente, sin trazabilidad en tiempo real",
    planSummary: "Implementación de WMS + sistema de ruteo inteligente + tablets para repartidores",
    planDurationMonths: 5,
    result: "Tiempo de entrega reducido a 3.8 días, devoluciones al 5%, trazabilidad 100%",
    resultadoCuantitativo: { costReduction: 95000, revenueImpact: 60000 },
    status: "completed",
    impact: "significant",
    tiempoMeses: 6,
    costTotal: 80000,
    rentabilidad: 193,
    lecciones: ["La capacitación en terreno fue clave para la adopción", "Implementar por fases reduce el riesgo operativo"],
    errores: ["Subestimamos el tiempo de integración con ERP existente"],
    aciertos: ["Tabletas con app offline fueron un acierto para zonas sin cobertura"],
    tags: ["operaciones", "logistica", "wms", "eficiencia"],
    completedAt: new Date(NOW.getTime() - 5 * 86400000).toISOString(),
  })
}

async function seedGenome() {
  await genomeEngine.analyze(COMPANY_ID, "Corporación Demo", "consultoría", "pyme")
}

function seedNewModules() {
  memoryStore.store({
    companyId: COMPANY_ID, type: "note", title: "XBRL: Estados financieros cargados",
    description: "Estado de situación financiera y estado de resultados cargados vía XBRL para Constructora del Sur. Período: 2024-01-01 a 2024-12-31. 32 conceptos IFRS reconocidos.",
    tags: ["xbrl", "financial", "balance_sheet", "income_statement"], entities: [CLIENTS[0]],
    metadata: { module: "xbrl", concepts: 32, unmapped: 0, periodStart: "2024-01-01", periodEnd: "2024-12-31" },
    userId: "system", userName: "Beta Seed", importance: "high",
  })

  memoryStore.store({
    companyId: COMPANY_ID, type: "kpi_change", title: "Benchmark industria: Manufactura",
    description: "Ratios de Manufactura vs industria: Liquidez 1.8 (p50), Endeudamiento 1.0 (p50), Margen Neto 7% (p50). La empresa está en percentil 45.",
    tags: ["scraping", "benchmark", "manufactura", "competitividad"], entities: CLIENTS,
    metadata: { module: "scraping", source: "Supercias", industry: "Manufactura", percentiles: { currentRatio: 1.8, debtToEquity: 1.0, netMargin: 7 } },
    userId: "system", userName: "Beta Seed", importance: "medium",
  })

  notificationService.notify(COMPANY_ID, "in_app", "milestone", "medium",
    "Bienvenido a BI OS Platform",
    "Los datos demo han sido cargados. Explora las secciones: Dashboard, Planificación, Benchmarking, y más.",
    { userId: "system", data: { module: "notifications", step: "welcome" } },
  )

  memoryStore.store({
    companyId: COMPANY_ID, type: "note", title: "NLU: Consultas de ejemplo disponibles",
    description: "El motor NLU reconoce 12 intenciones: salud financiera, KPIs, escenarios, predicción, reportes, benchmarks, planes, alertas, compliance, cashflow, valoración, optimización. Probar con: '¿Cómo está la salud financiera?'",
    tags: ["nlu", "ai", "lenguaje"], entities: [],
    metadata: { module: "nlu", intents: 12, entityTypes: 7 },
    userId: "system", userName: "Beta Seed", importance: "medium",
  })

  memoryStore.store({
    companyId: COMPANY_ID, type: "kpi_change", title: "Serie temporal: Ventas mensuales",
    description: "Datos históricos de ventas de los últimos 12 meses cargados para predicción avanzada. Modelos: ARIMA, Holt-Winters, Descomposición Estacional.",
    tags: ["prediction", "ml", "timeseries"], entities: CLIENTS,
    metadata: { module: "enhanced_prediction", dataPoints: 12, models: ["arima_like", "holt_winters", "seasonal_arima"] },
    userId: "system", userName: "Beta Seed", importance: "high",
  })
}
