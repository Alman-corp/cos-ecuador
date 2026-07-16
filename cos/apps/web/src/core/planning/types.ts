export type PlanStatus = "draft" | "active" | "completed" | "cancelled"
export type PhaseStatus = "pending" | "in_progress" | "completed" | "blocked"
export type TaskPriority = "low" | "medium" | "high" | "critical"

export interface StrategicObjective {
  id: string
  title: string
  description: string
  category: string
  targetValue?: number
  currentValue?: number
  unit?: string
  timeframeMonths: number
  priority: TaskPriority
}

export interface BusinessPlan {
  id: string
  companyId: string
  clientId?: string
  objective: StrategicObjective
  phases: PlanPhase[]
  totalBudget: number
  estimatedDurationMonths: number
  status: PlanStatus
  createdAt: string
  startedAt?: string
  completedAt?: string
  roi?: number
  lessons?: string
}

export interface PlanPhase {
  id: string
  name: string
  description: string
  order: number
  status: PhaseStatus
  projects: PlanProject[]
  dependsOn: string[]
  budget: number
  durationWeeks: number
  kpis: PhaseKPI[]
}

export interface PlanProject {
  id: string
  name: string
  description: string
  tasks: PlanTask[]
  assignedRole: string
  budget: number
  startDate?: string
  endDate?: string
}

export interface PlanTask {
  id: string
  title: string
  description: string
  priority: TaskPriority
  estimatedHours: number
  assignedRole: string
  dependsOn: string[]
}

export interface PhaseKPI {
  name: string
  targetValue: number
  unit: string
  currentValue?: number
}

export interface PlanGenerationRequest {
  companyId: string
  clientId?: string
  objective: string
  category?: string
  targetValue?: number
  currentValue?: number
  unit?: string
  timeframeMonths?: number
  priority?: TaskPriority
}

export interface PlanExecutionResult {
  planId: string
  projectsCreated: number
  tasksCreated: number
  errors: string[]
  success: boolean
}
