import { memoryStore } from "@/core/memory"
import { consultingDna } from "@/core/consulting-dna"
import { persistence, ensurePersistence } from "@/core/persistence"
import type {
  BusinessPlan, PlanPhase, PlanProject, PlanTask, PhaseKPI,
  PlanGenerationRequest, PlanExecutionResult, StrategicObjective,
} from "./types"

const planStore = new Map<string, BusinessPlan>()

class PlanningEngine {
  getAllPlansRaw(): BusinessPlan[] { return Array.from(planStore.values()) }
  restoreAllPlans(data: BusinessPlan[]): void {
    planStore.clear()
    for (const p of data) planStore.set(p.id, p)
  }

  async generatePlan(req: PlanGenerationRequest): Promise<BusinessPlan> {
    ensurePersistence()
    const id = `plan_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const objective = this.buildObjective(req)
    const phases = await this.generatePhases(objective, req)
    const totalBudget = phases.reduce((s, p) => s + p.budget, 0)

    // Store in memory
    memoryStore.store({
      companyId: req.companyId,
      clientId: req.clientId,
      type: "decision",
      title: `Plan generado: ${req.objective}`,
      description: `Plan de ${phases.length} fases con presupuesto de $${totalBudget.toLocaleString()}`,
      entities: [req.clientId].filter((x): x is string => !!x),
      tags: ["plan", req.category || "strategic"],
      metadata: { planId: id, phases: phases.length, budget: totalBudget },
      userId: "system",
      userName: "Planning Engine",
      importance: "high",
    })

    const plan: BusinessPlan = {
      id,
      companyId: req.companyId,
      clientId: req.clientId,
      objective,
      phases,
      totalBudget,
      estimatedDurationMonths: req.timeframeMonths || 6,
      status: "draft",
      createdAt: new Date().toISOString(),
    }

    planStore.set(id, plan)
    persistence.scheduleSave()
    return plan
  }

  async executePlan(planId: string): Promise<PlanExecutionResult> {
    const plan = planStore.get(planId)
    if (!plan) return { planId, projectsCreated: 0, tasksCreated: 0, errors: ["Plan not found"], success: false }
    if (plan.status !== "draft") return { planId, projectsCreated: 0, tasksCreated: 0, errors: ["Plan already executed"], success: false }

    plan.status = "active"
    plan.startedAt = new Date().toISOString()

    let projectsCreated = 0
    let tasksCreated = 0
    const errors: string[] = []

    for (const phase of plan.phases) {
      phase.status = "in_progress"
      for (const project of phase.projects) {
        project.startDate = new Date().toISOString()
        projectsCreated++
        for (const task of project.tasks) {
          tasksCreated++
        }
      }
    }

    planStore.set(planId, plan)
    persistence.scheduleSave()

    memoryStore.store({
      companyId: plan.companyId,
      clientId: plan.clientId,
      type: "event",
      title: `Plan ejecutado: ${plan.objective.title}`,
      description: `${projectsCreated} proyectos, ${tasksCreated} tareas generadas automáticamente`,
      entities: [],
      tags: ["plan", "execution"],
      metadata: { planId, projectsCreated, tasksCreated },
      userId: "system",
      userName: "Planning Engine",
      importance: "high",
    })

    return { planId, projectsCreated, tasksCreated, errors, success: true }
  }

  getPlan(planId: string): BusinessPlan | undefined {
    return planStore.get(planId)
  }

  getPlans(companyId: string): BusinessPlan[] {
    return Array.from(planStore.values()).filter((p) => p.companyId === companyId)
  }

  getAllPlans(): BusinessPlan[] {
    return Array.from(planStore.values())
  }

  getActivePlans(companyId: string): BusinessPlan[] {
    return this.getPlans(companyId).filter((p) => p.status === "active")
  }

  // ── Private: Build objective ──

  private buildObjective(req: PlanGenerationRequest): StrategicObjective {
    return {
      id: `obj_${Date.now()}`,
      title: req.objective,
      description: req.objective,
      category: req.category || "strategic",
      targetValue: req.targetValue,
      currentValue: req.currentValue,
      unit: req.unit,
      timeframeMonths: req.timeframeMonths || 6,
      priority: req.priority || "high",
    }
  }

  // ── Private: Generate phases based on objective category ──

  private async generatePhases(objective: StrategicObjective, req: PlanGenerationRequest): Promise<PlanPhase[]> {
    const category = (req.category || objective.category || "").toLowerCase()

    if (category.includes("liquidez") || category.includes("liquidity") || category.includes("financiero")) {
      return this.generateFinancialHealthPlan(objective)
    }
    if (category.includes("rentabilidad") || category.includes("profit")) {
      return this.generateProfitabilityPlan(objective)
    }
    if (category.includes("crecimiento") || category.includes("growth") || category.includes("venta")) {
      return this.generateGrowthPlan(objective)
    }
    if (category.includes("digital") || category.includes("transformación")) {
      return this.generateDigitalTransformationPlan(objective)
    }
    if (category.includes("cumplimiento") || category.includes("compliance") || category.includes("legal")) {
      return this.generateCompliancePlan(objective)
    }
    if (category.includes("operativo") || category.includes("operational") || category.includes("eficiencia")) {
      return this.generateOperationalEfficiencyPlan(objective)
    }

    return this.generateDefaultPlan(objective)
  }

  private generateFinancialHealthPlan(obj: StrategicObjective): PlanPhase[] {
    return [
      {
        id: `phase_${Date.now()}_1`, name: "Diagnóstico Financiero", description: "Análisis detallado de la situación financiera actual",
        order: 1, status: "pending", dependsOn: [], budget: 500, durationWeeks: 2,
        projects: [this.makeProject("Revisión de Estados Financieros", "Analizar balances y estados de resultados", [
          { id: "t1", title: "Recopilar balances últimos 12 meses", description: "", priority: "high", estimatedHours: 8, assignedRole: "Contador", dependsOn: [] },
          { id: "t2", title: "Calcular indicadores financieros", description: "", priority: "high", estimatedHours: 4, assignedRole: "Analista", dependsOn: ["t1"] },
          { id: "t3", title: "Identificar desviaciones críticas", description: "", priority: "high", estimatedHours: 4, assignedRole: "Consultor", dependsOn: ["t2"] },
        ], "Consultor Financiero", 500)],
        kpis: [{ name: "Indicadores calculados", targetValue: 12, unit: "indicadores" }],
      },
      {
        id: `phase_${Date.now()}_2`, name: "Optimización de Liquidez", description: "Mejorar la liquidez mediante acciones correctivas",
        order: 2, status: "pending", dependsOn: [`phase_${Date.now()}_1`], budget: 2000, durationWeeks: 6,
        projects: [
          this.makeProject("Gestión de Cuentas por Cobrar", "Reducir plazos de cobro y mejorar rotación", [
            { id: "t4", title: "Analizar cartera vencida", description: "", priority: "high", estimatedHours: 6, assignedRole: "Analista", dependsOn: [] },
            { id: "t5", title: "Implementar política de cobranzas", description: "", priority: "high", estimatedHours: 12, assignedRole: "Gerente", dependsOn: ["t4"] },
            { id: "t6", title: "Contactar clientes morosos", description: "", priority: "medium", estimatedHours: 16, assignedRole: "Asistente", dependsOn: ["t5"] },
          ], "Gerente Financiero", 1000),
          this.makeProject("Renegociación de Deuda", "Reestructurar pasivos bancarios", [
            { id: "t7", title: "Preparar expediente financiero", description: "", priority: "high", estimatedHours: 8, assignedRole: "Analista", dependsOn: [] },
            { id: "t8", title: "Negociar con bancos", description: "", priority: "critical", estimatedHours: 10, assignedRole: "Gerente", dependsOn: ["t7"] },
          ], "Gerente General", 1000),
        ],
        kpis: [
          { name: "Reducción cartera vencida", targetValue: 30, unit: "%" },
          { name: "Mejora liquidez", targetValue: 1.2, unit: "ratio" },
        ],
      },
      {
        id: `phase_${Date.now()}_3`, name: "Sostenibilidad Financiera", description: "Establecer controles y monitoreo continuo",
        order: 3, status: "pending", dependsOn: [`phase_${Date.now()}_2`], budget: 1000, durationWeeks: 4,
        projects: [this.makeProject("Sistema de Monitoreo", "Implementar alertas y reporting automático", [
          { id: "t9", title: "Configurar dashboard financiero", description: "", priority: "medium", estimatedHours: 8, assignedRole: "Consultor", dependsOn: [] },
          { id: "t10", title: "Establecer alertas tempranas", description: "", priority: "high", estimatedHours: 4, assignedRole: "Consultor", dependsOn: ["t9"] },
          { id: "t11", title: "Capacitar al equipo", description: "", priority: "medium", estimatedHours: 6, assignedRole: "Consultor", dependsOn: ["t10"] },
        ], "Consultor Financiero", 1000)],
        kpis: [{ name: "Alertas configuradas", targetValue: 5, unit: "alertas" }],
      },
    ]
  }

  private generateProfitabilityPlan(obj: StrategicObjective): PlanPhase[] {
    return [
      {
        id: `phase_${Date.now()}_1`, name: "Análisis de Costos", description: "Identificar estructura de costos y márgenes",
        order: 1, status: "pending", dependsOn: [], budget: 800, durationWeeks: 3,
        projects: [this.makeProject("Estructura de Costos", "Analizar costos fijos y variables", [
          { id: "t1", title: "Clasificar costos por centro", description: "", priority: "high", estimatedHours: 10, assignedRole: "Contador", dependsOn: [] },
          { id: "t2", title: "Calcular márgenes por producto", description: "", priority: "high", estimatedHours: 6, assignedRole: "Analista", dependsOn: ["t1"] },
          { id: "t3", title: "Identificar costos innecesarios", description: "", priority: "medium", estimatedHours: 4, assignedRole: "Consultor", dependsOn: ["t2"] },
        ], "Consultor Financiero", 800)],
        kpis: [{ name: "Costos identificados", targetValue: 100, unit: "%" }],
      },
      {
        id: `phase_${Date.now()}_2`, name: "Optimización de Márgenes", description: "Mejorar rentabilidad por línea de negocio",
        order: 2, status: "pending", dependsOn: [`phase_${Date.now()}_1`], budget: 1500, durationWeeks: 5,
        projects: [
          this.makeProject("Revisión de Precios", "Analizar y ajustar estrategia de precios", [
            { id: "t4", title: "Benchmark de precios mercado", description: "", priority: "high", estimatedHours: 8, assignedRole: "Analista", dependsOn: [] },
            { id: "t5", title: "Modelar elasticidad precio", description: "", priority: "medium", estimatedHours: 6, assignedRole: "Consultor", dependsOn: ["t4"] },
          ], "Gerente Comercial", 800),
          this.makeProject("Reducción de Costos", "Implementar programa de eficiencia", [
            { id: "t6", title: "Negociar con proveedores", description: "", priority: "high", estimatedHours: 8, assignedRole: "Gerente", dependsOn: [] },
            { id: "t7", title: "Automatizar procesos manuales", description: "", priority: "medium", estimatedHours: 16, assignedRole: "Consultor", dependsOn: ["t6"] },
          ], "Gerente de Operaciones", 700),
        ],
        kpis: [{ name: "Mejora margen neto", targetValue: 5, unit: "puntos porcentuales" }],
      },
    ]
  }

  private generateGrowthPlan(obj: StrategicObjective): PlanPhase[] {
    return [
      {
        id: `phase_${Date.now()}_1`, name: "Análisis de Mercado", description: "Evaluar oportunidades de crecimiento",
        order: 1, status: "pending", dependsOn: [], budget: 1000, durationWeeks: 3,
        projects: [this.makeProject("Estudio de Mercado", "Analizar segmentos y competencia", [
          { id: "t1", title: "Segmentar clientes potenciales", description: "", priority: "high", estimatedHours: 10, assignedRole: "Analista", dependsOn: [] },
          { id: "t2", title: "Analizar competencia directa", description: "", priority: "medium", estimatedHours: 8, assignedRole: "Analista", dependsOn: [] },
          { id: "t3", title: "Identificar canales de crecimiento", description: "", priority: "high", estimatedHours: 6, assignedRole: "Consultor", dependsOn: ["t1", "t2"] },
        ], "Consultor Comercial", 1000)],
        kpis: [{ name: "Oportunidades identificadas", targetValue: 5, unit: "oportunidades" }],
      },
      {
        id: `phase_${Date.now()}_2`, name: "Plan de Crecimiento", description: "Ejecutar estrategia de expansión",
        order: 2, status: "pending", dependsOn: [`phase_${Date.now()}_1`], budget: 3000, durationWeeks: 8,
        projects: [
          this.makeProject("Estrategia Comercial", "Diseñar e implementar plan de ventas", [
            { id: "t4", title: "Definir propuesta de valor", description: "", priority: "high", estimatedHours: 8, assignedRole: "Consultor", dependsOn: [] },
            { id: "t5", title: "Crear plan de marketing", description: "", priority: "high", estimatedHours: 12, assignedRole: "Consultor", dependsOn: ["t4"] },
            { id: "t6", title: "Implementar CRM", description: "", priority: "medium", estimatedHours: 20, assignedRole: "Consultor", dependsOn: ["t5"] },
          ], "Gerente Comercial", 2000),
          this.makeProject("Fidelización", "Retener y expandir clientes actuales", [
            { id: "t7", title: "Programa de fidelización", description: "", priority: "medium", estimatedHours: 10, assignedRole: "Consultor", dependsOn: [] },
            { id: "t8", title: "Estrategia upselling", description: "", priority: "medium", estimatedHours: 6, assignedRole: "Consultor", dependsOn: ["t7"] },
          ], "Gerente Comercial", 1000),
        ],
        kpis: [
          { name: "Incremento ventas", targetValue: 20, unit: "%" },
          { name: "Nuevos clientes", targetValue: 10, unit: "clientes" },
        ],
      },
    ]
  }

  private generateDigitalTransformationPlan(obj: StrategicObjective): PlanPhase[] {
    return [
      {
        id: `phase_${Date.now()}_1`, name: "Diagnóstico Digital", description: "Evaluar madurez digital actual",
        order: 1, status: "pending", dependsOn: [], budget: 600, durationWeeks: 2,
        projects: [this.makeProject("Evaluación Digital", "Analizar procesos y tecnología actual", [
          { id: "t1", title: "Mapear procesos actuales", description: "", priority: "high", estimatedHours: 12, assignedRole: "Consultor", dependsOn: [] },
          { id: "t2", title: "Evaluar stack tecnológico", description: "", priority: "high", estimatedHours: 8, assignedRole: "Consultor", dependsOn: [] },
          { id: "t3", title: "Identificar brechas digitales", description: "", priority: "high", estimatedHours: 4, assignedRole: "Consultor", dependsOn: ["t1", "t2"] },
        ], "Consultor Digital", 600)],
        kpis: [{ name: "Brechas identificadas", targetValue: 10, unit: "brechas" }],
      },
      {
        id: `phase_${Date.now()}_2`, name: "Implementación Digital", description: "Ejecutar transformación digital",
        order: 2, status: "pending", dependsOn: [`phase_${Date.now()}_1`], budget: 5000, durationWeeks: 12,
        projects: [
          this.makeProject("Automatización de Procesos", "Digitalizar procesos críticos", [
            { id: "t4", title: "Seleccionar herramientas", description: "", priority: "high", estimatedHours: 8, assignedRole: "Consultor", dependsOn: [] },
            { id: "t5", title: "Implementar soluciones", description: "", priority: "critical", estimatedHours: 40, assignedRole: "Consultor", dependsOn: ["t4"] },
            { id: "t6", title: "Capacitar al equipo", description: "", priority: "high", estimatedHours: 16, assignedRole: "Consultor", dependsOn: ["t5"] },
          ], "Consultor Digital", 3000),
          this.makeProject("Cultura Digital", "Fomentar adopción digital", [
            { id: "t7", title: "Programa de cambio cultural", description: "", priority: "medium", estimatedHours: 8, assignedRole: "Consultor", dependsOn: [] },
            { id: "t8", title: "Métricas de adopción", description: "", priority: "medium", estimatedHours: 4, assignedRole: "Analista", dependsOn: ["t7"] },
          ], "Gerente de RRHH", 2000),
        ],
        kpis: [
          { name: "Procesos digitalizados", targetValue: 80, unit: "%" },
          { name: "Adopción del equipo", targetValue: 90, unit: "%" },
        ],
      },
    ]
  }

  private generateCompliancePlan(obj: StrategicObjective): PlanPhase[] {
    return [
      {
        id: `phase_${Date.now()}_1`, name: "Auditoría de Cumplimiento", description: "Evaluar estado actual de compliance",
        order: 1, status: "pending", dependsOn: [], budget: 800, durationWeeks: 3,
        projects: [this.makeProject("Revisión Normativa", "Identificar obligaciones regulatorias", [
          { id: "t1", title: "Listar obligaciones legales", description: "", priority: "high", estimatedHours: 10, assignedRole: "Abogado", dependsOn: [] },
          { id: "t2", title: "Evaluar cumplimiento actual", description: "", priority: "high", estimatedHours: 12, assignedRole: "Abogado", dependsOn: ["t1"] },
          { id: "t3", title: "Identificar brechas", description: "", priority: "critical", estimatedHours: 6, assignedRole: "Consultor", dependsOn: ["t2"] },
        ], "Consultor Legal", 800)],
        kpis: [{ name: "Brechas identificadas", targetValue: 100, unit: "%" }],
      },
      {
        id: `phase_${Date.now()}_2`, name: "Plan de Remediación", description: "Corregir incumplimientos",
        order: 2, status: "pending", dependsOn: [`phase_${Date.now()}_1`], budget: 2000, durationWeeks: 6,
        projects: [this.makeProject("Implementación", "Ejecutar acciones correctivas", [
          { id: "t4", title: "Priorizar brechas", description: "", priority: "high", estimatedHours: 4, assignedRole: "Consultor", dependsOn: [] },
          { id: "t5", title: "Implementar controles", description: "", priority: "critical", estimatedHours: 20, assignedRole: "Consultor", dependsOn: ["t4"] },
          { id: "t6", title: "Documentar procedimientos", description: "", priority: "medium", estimatedHours: 10, assignedRole: "Analista", dependsOn: ["t5"] },
        ], "Consultor Legal", 2000)],
        kpis: [{ name: "Brechas cerradas", targetValue: 90, unit: "%" }],
      },
    ]
  }

  private generateOperationalEfficiencyPlan(obj: StrategicObjective): PlanPhase[] {
    return [
      {
        id: `phase_${Date.now()}_1`, name: "Diagnóstico Operativo", description: "Analizar procesos y eficiencia actual",
        order: 1, status: "pending", dependsOn: [], budget: 600, durationWeeks: 2,
        projects: [this.makeProject("Mapeo de Procesos", "Documentar flujos de trabajo actuales", [
          { id: "t1", title: "Mapear procesos clave", description: "", priority: "high", estimatedHours: 10, assignedRole: "Consultor", dependsOn: [] },
          { id: "t2", title: "Identificar cuellos de botella", description: "", priority: "high", estimatedHours: 6, assignedRole: "Consultor", dependsOn: ["t1"] },
          { id: "t3", title: "Medir tiempos y costos", description: "", priority: "medium", estimatedHours: 8, assignedRole: "Analista", dependsOn: ["t1"] },
        ], "Consultor Operaciones", 600)],
        kpis: [{ name: "Procesos mapeados", targetValue: 100, unit: "%" }],
      },
      {
        id: `phase_${Date.now()}_2`, name: "Optimización", description: "Mejorar eficiencia operativa",
        order: 2, status: "pending", dependsOn: [`phase_${Date.now()}_1`], budget: 2500, durationWeeks: 6,
        projects: [
          this.makeProject("Mejora de Procesos", "Rediseñar flujos ineficientes", [
            { id: "t4", title: "Rediseñar procesos críticos", description: "", priority: "high", estimatedHours: 12, assignedRole: "Consultor", dependsOn: [] },
            { id: "t5", title: "Implementar mejoras", description: "", priority: "high", estimatedHours: 16, assignedRole: "Consultor", dependsOn: ["t4"] },
            { id: "t6", title: "Medir resultados", description: "", priority: "medium", estimatedHours: 4, assignedRole: "Analista", dependsOn: ["t5"] },
          ], "Consultor Operaciones", 1500),
          this.makeProject("Automatización", "Automatizar tareas repetitivas", [
            { id: "t7", title: "Identificar tareas automatizables", description: "", priority: "medium", estimatedHours: 6, assignedRole: "Consultor", dependsOn: [] },
            { id: "t8", title: "Implementar automatizaciones", description: "", priority: "high", estimatedHours: 20, assignedRole: "Consultor", dependsOn: ["t7"] },
          ], "Consultor Digital", 1000),
        ],
        kpis: [
          { name: "Reducción de tiempos", targetValue: 30, unit: "%" },
          { name: "Ahorro de costos", targetValue: 15, unit: "%" },
        ],
      },
    ]
  }

  private generateDefaultPlan(obj: StrategicObjective): PlanPhase[] {
    return [
      {
        id: `phase_${Date.now()}_1`, name: "Diagnóstico Inicial", description: "Evaluar situación actual",
        order: 1, status: "pending", dependsOn: [], budget: 500, durationWeeks: 2,
        projects: [this.makeProject("Evaluación", "Analizar estado actual", [
          { id: "t1", title: "Recopilar información relevante", description: "", priority: "high", estimatedHours: 8, assignedRole: "Consultor", dependsOn: [] },
          { id: "t2", title: "Analizar brechas", description: "", priority: "high", estimatedHours: 6, assignedRole: "Consultor", dependsOn: ["t1"] },
          { id: "t3", title: "Elaborar diagnóstico", description: "", priority: "high", estimatedHours: 6, assignedRole: "Consultor", dependsOn: ["t2"] },
        ], "Consultor Senior", 500)],
        kpis: [{ name: "Diagnóstico completado", targetValue: 100, unit: "%" }],
      },
      {
        id: `phase_${Date.now()}_2`, name: "Plan de Acción", description: "Diseñar e implementar soluciones",
        order: 2, status: "pending", dependsOn: [`phase_${Date.now()}_1`], budget: 1500, durationWeeks: 6,
        projects: [this.makeProject("Implementación", "Ejecutar plan de acción", [
          { id: "t4", title: "Diseñar plan detallado", description: "", priority: "high", estimatedHours: 8, assignedRole: "Consultor", dependsOn: [] },
          { id: "t5", title: "Ejecutar acciones prioritarias", description: "", priority: "critical", estimatedHours: 20, assignedRole: "Consultor", dependsOn: ["t4"] },
          { id: "t6", title: "Monitorear avances", description: "", priority: "medium", estimatedHours: 8, assignedRole: "Analista", dependsOn: ["t5"] },
        ], "Consultor Senior", 1500)],
        kpis: [{ name: "Avance del plan", targetValue: 100, unit: "%" }],
      },
      {
        id: `phase_${Date.now()}_3`, name: "Cierre y Seguimiento", description: "Evaluar resultados y establecer continuidad",
        order: 3, status: "pending", dependsOn: [`phase_${Date.now()}_2`], budget: 500, durationWeeks: 2,
        projects: [this.makeProject("Evaluación Final", "Medir resultados y documentar aprendizaje", [
          { id: "t7", title: "Medir resultados vs objetivos", description: "", priority: "high", estimatedHours: 6, assignedRole: "Consultor", dependsOn: [] },
          { id: "t8", title: "Documentar lecciones aprendidas", description: "", priority: "medium", estimatedHours: 4, assignedRole: "Consultor", dependsOn: ["t7"] },
          { id: "t9", title: "Establecer seguimiento", description: "", priority: "medium", estimatedHours: 4, assignedRole: "Analista", dependsOn: ["t8"] },
        ], "Consultor Senior", 500)],
        kpis: [{ name: "Objetivos cumplidos", targetValue: 80, unit: "%" }],
      },
    ]
  }

  private makeProject(name: string, description: string, tasks: PlanTask[], role: string, budget = 500): PlanProject {
    return { id: `proj_${Math.random().toString(36).slice(2, 8)}`, name, description, tasks, assignedRole: role, budget }
  }
}

export const planningEngine = new PlanningEngine()
