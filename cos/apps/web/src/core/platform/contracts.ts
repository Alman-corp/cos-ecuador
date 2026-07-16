// ============================================================
// BI OS Core 1.0 — Platform Contracts
// Stable API surface for vertical packages.
// VERTICALS MUST NEVER IMPORT FROM OUTSIDE THIS SURFACE.
// ============================================================

export const CORE_VERSION = "1.0.0"
export const CORE_COMPATIBILITY_RANGE = ">=1.0.0 <2.0.0"

// ─── Core Services ───────────────────────────────────────────

export interface CoreIdentityService {
  getCompanyId(): string
  getUserId(): string
  getUserRoles(): string[]
  hasPermission(permission: string): boolean
}

export interface CoreCrmService {
  getClient(clientId: string): Promise<CoreClient>
  getClients(filters?: CoreClientFilter): Promise<CoreClient[]>
  createClient(data: CoreCreateClientInput): Promise<CoreClient>
}

export interface CoreDocumentService {
  upload(clientId: string, file: File): Promise<CoreDocument>
  getDocuments(clientId: string): Promise<CoreDocument[]>
  getDocument(documentId: string): Promise<CoreDocument>
}

export interface CoreAiService {
  evaluate(data: CoreEvaluateInput): Promise<CoreEvaluation>
  diagnose(data: CoreDiagnoseInput): Promise<CoreDiagnosis>
  recommend(data: CoreRecommendInput): Promise<CoreRecommendation[]>
}

export interface CoreReportingService {
  generate(data: CoreReportInput): Promise<CoreReport>
}

export interface CoreWorkflowService {
  start(workflowId: string, data: Record<string, any>): Promise<CoreWorkflowInstance>
  getStatus(instanceId: string): Promise<CoreWorkflowInstance>
}

export interface CoreKnowledgeService {
  search(query: string, filters?: CoreKnowledgeFilter): Promise<CoreKnowledgeEntry[]>
}

// ─── Core Data Types ─────────────────────────────────────────

export interface CoreClient {
  id: string
  companyId: string
  name: string
  taxId?: string
  email?: string
  phone?: string
  industry?: string
  size?: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface CoreClientFilter {
  search?: string
  status?: string
  industry?: string
  limit?: number
  offset?: number
}

export interface CoreCreateClientInput {
  name: string
  taxId?: string
  email?: string
  phone?: string
  industry?: string
  size?: string
}

export interface CoreDocument {
  id: string
  clientId: string
  name: string
  type: string
  size: number
  url: string
  uploadedAt: string
  metadata?: Record<string, any>
}

export interface CoreEvaluateInput {
  clientId: string
  financialData: CoreFinancialData
  rules?: string[]
}

export interface CoreFinancialData {
  currentAssets: number
  currentLiabilities: number
  totalAssets: number
  totalLiabilities: number
  equity: number
  revenue: number
  netIncome: number
  ebit: number
  ebitda: number
  inventory: number
  accountsReceivable: number
  accountsPayable: number
  cash: number
  costOfGoodsSold: number
  operatingExpenses: number
  interestExpense: number
  depreciation: number
  amortization: number
}

export interface CoreEvaluation {
  healthScore: number
  ratios: CoreRatio[]
  riskLevel: string
  summary: string
}

export interface CoreRatio {
  name: string
  value: number
  benchmark: number
  status: string
  interpretation: string
}

export interface CoreDiagnoseInput {
  clientId: string
  ratios: CoreRatio[]
  thresholds?: string[]
}

export interface CoreDiagnosis {
  level: string
  findings: CoreFinding[]
  score: number
}

export interface CoreFinding {
  id: string
  type: string
  severity: string
  description: string
  recommendation: string
}

export interface CoreRecommendInput {
  clientId: string
  diagnosis: CoreDiagnosis
  context?: Record<string, any>
}

export interface CoreRecommendation {
  id: string
  title: string
  description: string
  priority: string
  category: string
  effort: string
  impact: string
}

export interface CoreReportInput {
  clientId: string
  type: string
  data: Record<string, any>
  template?: string
}

export interface CoreReport {
  id: string
  url: string
  format: string
  generatedAt: string
}

export interface CoreWorkflowInstance {
  id: string
  workflowId: string
  status: string
  currentStep: number
  totalSteps: number
  data: Record<string, any>
  startedAt: string
  completedAt?: string
}

export interface CoreKnowledgeEntry {
  id: string
  title: string
  description: string
  type: string
  category: string
  content: string
  tags: string[]
}

export interface CoreKnowledgeFilter {
  type?: string
  category?: string
  tags?: string[]
}

// ─── Events ──────────────────────────────────────────────────

export enum CoreEvent {
  CLIENT_CREATED = "core.client.created",
  CLIENT_UPDATED = "core.client.updated",
  DOCUMENT_UPLOADED = "core.document.uploaded",
  EVALUATION_COMPLETED = "core.evaluation.completed",
  DIAGNOSIS_COMPLETED = "core.diagnosis.completed",
  REPORT_GENERATED = "core.report.generated",
  WORKFLOW_STARTED = "core.workflow.started",
  WORKFLOW_COMPLETED = "core.workflow.completed",
  PRODUCT_INSTALLED = "core.product.installed",
  PRODUCT_ACTIVATED = "core.product.activated",
  PRODUCT_CONFIGURED = "core.product.configured",
}

export interface CoreEventPayload {
  event: CoreEvent
  timestamp: string
  data: Record<string, any>
  source: string
}

// ─── Vertical Contract ───────────────────────────────────────

export interface VerticalContract {
  id: string
  name: string
  version: string
  compatibleWith: string
  requiresCore: string
  hooks: VerticalHook[]
}

export interface VerticalHook {
  event: CoreEvent
  handler: string
  priority: number
}
