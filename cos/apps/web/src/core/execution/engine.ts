import { planningEngine } from "@/core/planning"
import { memoryStore } from "@/core/memory"
import { predictionEngine } from "@/core/prediction"
import type { BusinessPlan, PlanPhase } from "@/core/planning"
import type {
  ExecutionStatus, ProgressSnapshot, Deviation, Correction, ExecutionAlert,
  DeviationSeverity, AlertType,
} from "./types"

const deviationStore = new Map<string, Deviation>()
const correctionStore = new Map<string, Correction>()
const alertStore = new Map<string, ExecutionAlert>()
const snapshotStore = new Map<string, ProgressSnapshot[]>()

class ExecutionEngine {
  async analyze(planId: string): Promise<ExecutionStatus> {
    const plan = planningEngine.getPlan(planId)
    if (!plan) throw new Error(`Plan ${planId} not found`)

    const phasesTotal = plan.phases.length
    const phasesCompleted = plan.phases.filter((p) => p.status === "completed").length
    const tasksTotal = plan.phases.reduce((s, p) => s + p.projects.reduce((s2, pr) => s2 + pr.tasks.length, 0), 0)
    const tasksCompleted = 0

    const elapsedDays = plan.startedAt
      ? Math.ceil((Date.now() - new Date(plan.startedAt).getTime()) / 86400000)
      : 0
    const plannedDays = plan.estimatedDurationMonths * 30

    const deviations = Array.from(deviationStore.values()).filter((d) => d.planId === planId)
    const corrections = Array.from(correctionStore.values()).filter((c) => c.planId === planId)
    const alerts = Array.from(alertStore.values()).filter((a) => a.planId === planId)

    // Detect schedule deviation
    const expectedProgress = plannedDays > 0 ? (elapsedDays / plannedDays) * 100 : 0
    const actualProgress = tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 100 : 0
    const scheduleGap = actualProgress - expectedProgress

    let status: ExecutionStatus["status"] = "on_track"
    const deviationCount = deviations.filter((d) => !d.resolvedAt).length
    const activeAlerts = alerts.filter((a) => !a.resolvedAt).length

    if (scheduleGap < -20 || activeAlerts > 2) status = "off_track"
    else if (scheduleGap < -10 || activeAlerts > 0) status = "at_risk"

    if (phasesCompleted === phasesTotal) status = "completed"

    const snapshot: ProgressSnapshot = {
      planId,
      timestamp: new Date().toISOString(),
      phasesCompleted,
      phasesTotal,
      tasksCompleted,
      tasksTotal,
      budgetSpent: plan.totalBudget * (actualProgress / 100),
      budgetTotal: plan.totalBudget,
      elapsedDays,
      plannedDays,
      phaseDetails: plan.phases.map((ph) => ({
        phaseId: ph.id,
        phaseName: ph.name,
        progressPercent: 0,
        tasksCompleted: 0,
        tasksTotal: ph.projects.reduce((s, pr) => s + pr.tasks.length, 0),
        status: ph.status,
        kpisMet: 0,
        kpisTotal: ph.kpis.length,
      })),
    }

    const snapshots = snapshotStore.get(planId) || []
    snapshots.push(snapshot)
    snapshotStore.set(planId, snapshots.slice(-50))

    return {
      planId, objective: plan.objective.title, status, overallProgress: actualProgress,
      phasesCompleted, phasesTotal, tasksCompleted, tasksTotal,
      budgetSpent: snapshot.budgetSpent, budgetTotal: plan.totalBudget,
      elapsedDays, plannedDays, deviationCount, activeAlerts,
      lastSnapshot: snapshot, deviations, corrections, alerts,
    }
  }

  async autoDetectDeviations(planId: string): Promise<Deviation[]> {
    const plan = planningEngine.getPlan(planId)
    if (!plan || plan.status !== "active") return []

    const newDeviations: Deviation[] = []
    const elapsedDays = plan.startedAt
      ? Math.ceil((Date.now() - new Date(plan.startedAt).getTime()) / 86400000)
      : 0

    for (const phase of plan.phases) {
      if (phase.status === "completed") continue

      // Check schedule deviation
      const expectedPhaseOrder = phase.order - 1
      const phaseStartDay = expectedPhaseOrder * 30
      const phaseElapsed = Math.max(0, elapsedDays - phaseStartDay)
      const expectedPhaseProgress = phase.durationWeeks > 0
        ? Math.min(100, (phaseElapsed / (phase.durationWeeks * 7)) * 100)
        : 0

      if (expectedPhaseProgress > 80 && phase.status === "pending") {
        const dev = this.createDeviation(planId, phase.id, "schedule", "moderate",
          `La fase "${phase.name}" debió iniciar pero sigue pendiente`,
          phase.durationWeeks * 7, phaseElapsed, "días")
        newDeviations.push(dev)
        this.createAlert(planId, "schedule", "moderate",
          `Fase retrasada: ${phase.name}`,
          `La fase "${phase.name}" no ha iniciado después de ${phaseElapsed} días (${Math.round(expectedPhaseProgress)}% del tiempo planificado)`,
          "Revisar dependencias y asignar recursos inmediatamente")
      }

      // Check KPI deviations for in_progress phases
      if (phase.status === "in_progress") {
        for (const kpi of phase.kpis) {
          if (kpi.currentValue !== undefined && kpi.currentValue < kpi.targetValue * 0.5) {
            const dev = this.createDeviation(planId, phase.id, "kpi", "severe",
              `KPI "${kpi.name}" en fase "${phase.name}" muy por debajo del objetivo`,
              kpi.targetValue, kpi.currentValue, kpi.unit)
            newDeviations.push(dev)
            this.createAlert(planId, "kpi", "severe",
              `KPI crítico: ${kpi.name}`,
              `${kpi.name}: ${kpi.currentValue}${kpi.unit} vs objetivo ${kpi.targetValue}${kpi.unit} (${Math.round((kpi.currentValue / kpi.targetValue) * 100)}%)`,
              "Revisar estrategia de la fase y asignar recursos adicionales")
          }
        }
      }
    }

    // Store everything
    for (const dev of newDeviations) {
      deviationStore.set(dev.id, dev)
    }

    if (newDeviations.length > 0) {
      memoryStore.store({
        companyId: plan.companyId,
        clientId: plan.clientId,
        type: "risk",
        title: `${newDeviations.length} desviaciones detectadas en ${plan.objective.title}`,
        description: newDeviations.map((d) => d.description).join("; "),
        entities: [],
        tags: ["execution", "deviation", planId],
        metadata: { planId, deviationCount: newDeviations.length },
        userId: "system",
        userName: "Execution Engine",
        importance: newDeviations.some((d) => d.severity === "critical" || d.severity === "severe") ? "critical" : "high",
      })
    }

    return newDeviations
  }

  async proposeCorrection(deviationId: string): Promise<Correction | null> {
    const dev = deviationStore.get(deviationId)
    if (!dev) return null

    const correction: Correction = {
      id: `corr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      deviationId: dev.id,
      planId: dev.planId,
      description: this.generateCorrectionDescription(dev),
      impact: this.generateCorrectionImpact(dev),
      estimatedCost: dev.severity === "critical" ? 2000 : dev.severity === "severe" ? 1000 : 500,
      estimatedDays: dev.severity === "critical" ? 14 : dev.severity === "severe" ? 7 : 3,
      status: "proposed",
      proposedAt: new Date().toISOString(),
    }

    correctionStore.set(correction.id, correction)
    return correction
  }

  approveCorrection(correctionId: string): Correction | undefined {
    const c = correctionStore.get(correctionId)
    if (!c) return undefined
    c.status = "approved"
    correctionStore.set(correctionId, c)
    return c
  }

  implementCorrection(correctionId: string): Correction | undefined {
    const c = correctionStore.get(correctionId)
    if (!c) return undefined
    c.status = "implemented"
    c.implementedAt = new Date().toISOString()
    correctionStore.set(correctionId, c)
    return c
  }

  acknowledgeAlert(alertId: string): ExecutionAlert | undefined {
    const a = alertStore.get(alertId)
    if (!a) return undefined
    a.acknowledgedAt = new Date().toISOString()
    alertStore.set(alertId, a)
    return a
  }

  resolveAlert(alertId: string): ExecutionAlert | undefined {
    const a = alertStore.get(alertId)
    if (!a) return undefined
    a.resolvedAt = new Date().toISOString()
    alertStore.set(alertId, a)
    return a
  }

  getHistory(planId: string): ProgressSnapshot[] {
    return snapshotStore.get(planId) || []
  }

  async reforecast(planId: string): Promise<{ originalEndDate: string; newEndDate: string; slippageDays: number; recommendation: string }> {
    const plan = planningEngine.getPlan(planId)
    if (!plan || !plan.startedAt) throw new Error("Plan not active")

    const elapsedDays = Math.ceil((Date.now() - new Date(plan.startedAt).getTime()) / 86400000)
    const plannedDays = plan.estimatedDurationMonths * 30

    const snapshots = snapshotStore.get(planId) || []
    const recentSnapshots = snapshots.slice(-5)

    let avgProgressRate = 0
    if (recentSnapshots.length >= 2) {
      const first = recentSnapshots[0]
      const last = recentSnapshots[recentSnapshots.length - 1]
      const daysBetween = (new Date(last.timestamp).getTime() - new Date(first.timestamp).getTime()) / 86400000
      const progressDelta = last.tasksTotal > 0
        ? (last.tasksCompleted / last.tasksTotal) - (first.tasksCompleted / first.tasksTotal)
        : 0
      avgProgressRate = daysBetween > 0 ? progressDelta / daysBetween : 0
    }

    const remainingProgress = 1 - (recentSnapshots.length > 0
      ? (recentSnapshots[recentSnapshots.length - 1].tasksCompleted / Math.max(1, recentSnapshots[recentSnapshots.length - 1].tasksTotal))
      : 0)
    const estimatedRemainingDays = avgProgressRate > 0 ? remainingProgress / avgProgressRate : plannedDays - elapsedDays

    const originalEndDate = new Date(new Date(plan.startedAt).getTime() + plannedDays * 86400000)
    const newEndDate = new Date(Date.now() + estimatedRemainingDays * 86400000)
    const slippageDays = Math.max(0, Math.ceil((newEndDate.getTime() - originalEndDate.getTime()) / 86400000))

    const recommendation = slippageDays <= 0
      ? "El plan va según lo previsto. Continúa con el cronograma actual."
      : slippageDays <= 15
        ? `Retraso leve de ${slippageDays} días. Considera asignar recursos adicionales a las fases críticas.`
        : `Retraso significativo de ${slippageDays} días. Sugiero revisar el plan completo y considerar una re-planificación.`

    return {
      originalEndDate: originalEndDate.toISOString(),
      newEndDate: newEndDate.toISOString(),
      slippageDays,
      recommendation,
    }
  }

  getAllAlerts(companyId: string): ExecutionAlert[] {
    const planIds = planningEngine.getPlans(companyId).map((p) => p.id)
    return Array.from(alertStore.values())
      .filter((a) => planIds.includes(a.planId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  resolveDeviation(deviationId: string): Deviation | undefined {
    const d = deviationStore.get(deviationId)
    if (!d) return undefined
    d.resolvedAt = new Date().toISOString()
    deviationStore.set(deviationId, d)
    return d
  }

  getAll(status?: ExecutionStatus["status"]): ExecutionStatus[] {
    const results: ExecutionStatus[] = []
    for (const plan of planningEngine.getAllPlans()) {
      try {
        const s = this.analyzeSync(plan.id)
        results.push(s)
      } catch {}
    }
    return status ? results.filter((r) => r.status === status) : results
  }

  private analyzeSync(planId: string): ExecutionStatus {
    const plan = planningEngine.getPlan(planId)
    if (!plan) throw new Error(`Plan ${planId} not found`)

    const phasesTotal = plan.phases.length
    const phasesCompleted = plan.phases.filter((p) => p.status === "completed").length
    const tasksTotal = plan.phases.reduce((s, p) => s + p.projects.reduce((s2, pr) => s2 + pr.tasks.length, 0), 0)
    const tasksCompleted = 0

    const elapsedDays = plan.startedAt
      ? Math.ceil((Date.now() - new Date(plan.startedAt).getTime()) / 86400000)
      : 0
    const plannedDays = plan.estimatedDurationMonths * 30

    const deviations = Array.from(deviationStore.values()).filter((d) => d.planId === planId)
    const corrections = Array.from(correctionStore.values()).filter((c) => c.planId === planId)
    const alerts = Array.from(alertStore.values()).filter((a) => a.planId === planId)

    const expectedProgress = plannedDays > 0 ? (elapsedDays / plannedDays) * 100 : 0
    const actualProgress = tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 100 : 0
    const scheduleGap = actualProgress - expectedProgress

    let status: ExecutionStatus["status"] = "on_track"
    const deviationCount = deviations.filter((d) => !d.resolvedAt).length
    const activeAlerts = alerts.filter((a) => !a.resolvedAt).length

    if (scheduleGap < -20 || activeAlerts > 2) status = "off_track"
    else if (scheduleGap < -10 || activeAlerts > 0) status = "at_risk"
    if (phasesCompleted === phasesTotal) status = "completed"

    const snapshot: ProgressSnapshot = {
      planId, timestamp: new Date().toISOString(),
      phasesCompleted, phasesTotal, tasksCompleted, tasksTotal,
      budgetSpent: plan.totalBudget * (actualProgress / 100),
      budgetTotal: plan.totalBudget, elapsedDays, plannedDays,
      phaseDetails: plan.phases.map((ph) => ({
        phaseId: ph.id, phaseName: ph.name, progressPercent: 0,
        tasksCompleted: 0,
        tasksTotal: ph.projects.reduce((s, pr) => s + pr.tasks.length, 0),
        status: ph.status, kpisMet: 0, kpisTotal: ph.kpis.length,
      })),
    }

    return {
      planId, objective: plan.objective.title, status, overallProgress: actualProgress,
      phasesCompleted, phasesTotal, tasksCompleted, tasksTotal,
      budgetSpent: snapshot.budgetSpent, budgetTotal: plan.totalBudget,
      elapsedDays, plannedDays, deviationCount, activeAlerts,
      lastSnapshot: snapshot, deviations, corrections, alerts,
    }
  }

  private createDeviation(planId: string, phaseId: string, type: Deviation["type"], severity: DeviationSeverity, description: string, expected: number, actual: number, unit: string): Deviation {
    return {
      id: `dev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      planId, phaseId, type, severity, description,
      expectedValue: expected, actualValue: actual, unit,
      detectedAt: new Date().toISOString(),
    }
  }

  private createAlert(planId: string, type: AlertType, severity: DeviationSeverity, title: string, description: string, recommendation: string): ExecutionAlert {
    const alert: ExecutionAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      planId, type, severity, title, description, recommendation,
      createdAt: new Date().toISOString(),
    }
    alertStore.set(alert.id, alert)
    return alert
  }

  private generateCorrectionDescription(dev: Deviation): string {
    const templates: Record<string, Record<string, string>> = {
      schedule: {
        minor: "Ajustar cronograma: redistribuir tareas en las próximas semanas.",
        moderate: "Asignar recursos adicionales para recuperar el tiempo perdido.",
        severe: "Reestructurar la fase: priorizar tareas críticas y mover las no esenciales.",
        critical: "Detener la fase y re-planificar completamente con el equipo extendido.",
      },
      budget: {
        minor: "Revisar gastos no esenciales y reasignar presupuesto.",
        moderate: "Solicitar aprobación para presupuesto adicional del 10%.",
        severe: "Congelar gastos no críticos y renegociar con proveedores.",
        critical: "Requiere inyección de capital. Preparar informe para la dirección.",
      },
      kpi: {
        minor: "Ajustar metas de la fase y reforzar el seguimiento semanal.",
        moderate: "Cambiar enfoque de la fase: asignar especialistas al KPI crítico.",
        severe: "Rediseñar la estrategia de la fase con el equipo consultor.",
        critical: "Detener la fase actual. Iniciar plan de contingencia.",
      },
      resource: {
        minor: "Reasignar recursos internos para cubrir la brecha.",
        moderate: "Contratar apoyo temporal especializado.",
        severe: "Externalizar la fase completa a un socio estratégico.",
        critical: "Requiere contratación urgente. Escalar a dirección general.",
      },
    }
    return templates[dev.type]?.[dev.severity] || "Revisar y ajustar el plan de acción."
  }

  private generateCorrectionImpact(dev: Deviation): string {
    const map: Record<DeviationSeverity, string> = {
      minor: "Impacto bajo. Se resuelve con ajustes menores al cronograma.",
      moderate: "Impacto medio. Requiere recursos adicionales pero no afecta el objetivo.",
      severe: "Impacto alto. Puede retrasar el plan general entre 1 y 4 semanas.",
      critical: "Impacto muy alto. Riesgo de no cumplir el objetivo sin intervención mayor.",
    }
    return map[dev.severity]
  }
}

export const executionEngine = new ExecutionEngine()
