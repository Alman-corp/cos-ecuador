export type DeviationSeverity = "minor" | "moderate" | "severe" | "critical"
export type CorrectionStatus = "proposed" | "approved" | "implemented" | "rejected"
export type AlertType = "schedule" | "budget" | "kpi" | "risk" | "blocker"

export interface Deviation {
  id: string
  phaseId: string
  planId: string
  type: "schedule" | "budget" | "kpi" | "resource"
  severity: DeviationSeverity
  description: string
  expectedValue: number
  actualValue: number
  unit: string
  detectedAt: string
  resolvedAt?: string
}

export interface Correction {
  id: string
  deviationId: string
  planId: string
  description: string
  impact: string
  estimatedCost: number
  estimatedDays: number
  status: CorrectionStatus
  proposedAt: string
  implementedAt?: string
}

export interface ProgressSnapshot {
  planId: string
  timestamp: string
  phasesCompleted: number
  phasesTotal: number
  tasksCompleted: number
  tasksTotal: number
  budgetSpent: number
  budgetTotal: number
  elapsedDays: number
  plannedDays: number
  phaseDetails: {
    phaseId: string
    phaseName: string
    progressPercent: number
    tasksCompleted: number
    tasksTotal: number
    status: string
    kpisMet: number
    kpisTotal: number
  }[]
}

export interface ExecutionAlert {
  id: string
  planId: string
  type: AlertType
  severity: DeviationSeverity
  title: string
  description: string
  recommendation: string
  createdAt: string
  acknowledgedAt?: string
  resolvedAt?: string
}

export interface ExecutionStatus {
  planId: string
  objective: string
  status: "on_track" | "at_risk" | "off_track" | "completed"
  overallProgress: number
  phasesCompleted: number
  phasesTotal: number
  tasksCompleted: number
  tasksTotal: number
  budgetSpent: number
  budgetTotal: number
  elapsedDays: number
  plannedDays: number
  deviationCount: number
  activeAlerts: number
  lastSnapshot: ProgressSnapshot
  deviations: Deviation[]
  corrections: Correction[]
  alerts: ExecutionAlert[]
}
