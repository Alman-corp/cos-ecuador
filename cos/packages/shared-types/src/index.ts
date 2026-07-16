// ============================================================
// COS Shared Types — Domain Models & DTOs
// ============================================================

// --- Identity ---
export interface CompanyDTO {
  id: string
  name: string
  slug: string
  taxId: string | null
  email: string | null
  phone: string | null
  status: "active" | "inactive" | "suspended"
  createdAt: string
}

export interface UserDTO {
  id: string
  email: string
  firstName: string
  lastName: string
  avatarUrl: string | null
  companyId: string
  departmentId: string | null
  position: string | null
  isActive: boolean
  roles: string[]
}

export interface OrgNodeDTO {
  id: string
  name: string
  type: "department" | "user"
  parentId: string | null
  children: OrgNodeDTO[]
  head?: UserDTO | null
}

// --- Clients ---
export interface ClientCompanyDTO {
  id: string
  name: string
  taxId: string | null
  industry: string | null
  segment: string | null
  status: "active" | "inactive" | "prospect" | "churned"
  score: number
  assignedTo: string | null
  contacts: ClientContactDTO[]
  contracts: ClientContractDTO[]
  createdAt: string
}

export interface ClientContactDTO {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  position: string | null
  isPrimary: boolean
}

export interface ClientContractDTO {
  id: string
  title: string
  status: "draft" | "sent" | "signed" | "expired" | "terminated"
  startDate: string
  endDate: string | null
  value: number
  currency: string
}

// --- Projects ---
export interface ProjectDTO {
  id: string
  clientCompanyId: string
  name: string
  status: "planning" | "active" | "paused" | "completed" | "cancelled"
  methodology: "kanban" | "scrum" | "waterfall"
  startDate: string
  targetEndDate: string | null
  budget: number
  costToDate: number
  progress: number // calculated
}

export interface TaskDTO {
  id: string
  projectId: string
  title: string
  status: "todo" | "in_progress" | "review" | "done"
  priority: "low" | "medium" | "high" | "urgent"
  assignedTo: string | null
  dueDate: string | null
  estimatedHours: number | null
  actualHours: number | null
  subtasks: TaskDTO[]
}

// --- Financial ---
export interface FinancialStatementDTO {
  id: string
  companyId: string
  period: string
  revenue: number
  cogs: number
  grossProfit: number
  opex: number
  ebitda: number
  netIncome: number
  ratios: FinancialRatios
}

export interface FinancialRatios {
  liquidity: number
  quickRatio: number
  debtEquity: number
  roa: number
  roe: number
  grossMargin: number
  ebitdaMargin: number
  netMargin: number
}

// --- AI ---
export interface AgentMessage {
  role: "user" | "assistant" | "system"
  content: string
  agentType?: string
  sources?: AgentSource[]
  metadata?: Record<string, unknown>
}

export interface AgentSource {
  documentId: string
  documentTitle: string
  chunkIndex: number
  page: number | null
  lineRange: string | null
  exactText: string
  confidence: number
  traceUrl: string
}

// --- Workflow ---
export interface WorkflowDefinition {
  id: string
  name: string
  trigger: string
  steps: WorkflowStep[]
  sla: string | null
  isActive: boolean
}

export interface WorkflowStep {
  id: string
  type: "action" | "condition" | "human_task" | "wait" | "notification"
  name: string
  config: Record<string, unknown>
  nextOnSuccess: string | null
  nextOnFailure: string | null
}

// --- Common ---
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
  timestamp: string
}

export interface TimelineEventDTO {
  id: string
  eventType: string
  title: string
  description: string | null
  referenceId: string | null
  referenceType: string | null
  performedBy: string | null
  occurredAt: string
}

export interface KPIValue {
  kpi: string
  label: string
  value: number
  previousValue: number | null
  change: number | null
  unit: string
  trend: "up" | "down" | "neutral"
  timestamp: string
}
