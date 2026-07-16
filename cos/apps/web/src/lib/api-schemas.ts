import { z } from "zod"

// ── Existing schemas ──

export const CreateClientSchema = z.object({
  name: z.string().min(1, "name is required").max(200),
  taxId: z.string().optional(),
  industry: z.string().optional(),
  segment: z.enum(["corporate", "pyme", "enterprise"]).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  contactFirstName: z.string().optional(),
  contactLastName: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
})
export type CreateClientInput = z.infer<typeof CreateClientSchema>

export const UpdateClientSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  taxId: z.string().optional(),
  industry: z.string().optional(),
  segment: z.enum(["corporate", "pyme", "enterprise"]).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
})
export type UpdateClientInput = z.infer<typeof UpdateClientSchema>

export const CreateLeadSchema = z.object({
  firstName: z.string().min(1, "firstName is required").max(100),
  lastName: z.string().max(100).default(""),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  source: z.string().optional(),
  score: z.number().int().min(0).max(100).optional(),
})
export type CreateLeadInput = z.infer<typeof CreateLeadSchema>

export const UpdateLeadSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().max(100).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  source: z.string().optional(),
  score: z.number().int().min(0).max(100).optional(),
  status: z.string().optional(),
})
export type UpdateLeadInput = z.infer<typeof UpdateLeadSchema>

export const CreateProjectSchema = z.object({
  name: z.string().min(1, "name is required").max(200),
  clientId: z.string().min(1, "clientId is required"),
  projectType: z.string().min(1, "projectType is required"),
  description: z.string().optional(),
  methodology: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  budget: z.number().min(0).optional(),
  startDate: z.string().optional(),
  targetEndDate: z.string().optional(),
})
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>

export const RegisterCompanySchema = z.object({
  name: z.string().min(1, "name is required").max(200),
  taxId: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
})
export type RegisterCompanyInput = z.infer<typeof RegisterCompanySchema>

export const LoginSchema = z.object({
  email: z.string().email("valid email is required"),
})
export type LoginInput = z.infer<typeof LoginSchema>

export const OnboardClientSchema = z.object({
  leadId: z.string().optional(),
  name: z.string().min(1, "name is required").max(200),
  taxId: z.string().optional(),
  industry: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  initialDocs: z.array(z.any()).optional(),
})
export type OnboardClientInput = z.infer<typeof OnboardClientSchema>

export const CreateDocumentSchema = z.object({
  clientId: z.string().min(1, "clientId is required"),
  title: z.string().min(1, "title is required").max(300),
  documentType: z.string().min(1, "documentType is required"),
  fileUrl: z.string().optional(),
  fileSize: z.number().min(0).optional(),
  description: z.string().optional(),
})
export type CreateDocumentInput = z.infer<typeof CreateDocumentSchema>

export const SendNotificationSchema = z.object({
  channel: z.enum(["in_app", "email", "slack", "whatsapp"]).optional(),
  category: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  title: z.string().min(1, "title is required"),
  body: z.string().min(1, "body is required"),
  userId: z.string().optional(),
  data: z.record(z.any()).optional(),
  scheduledFor: z.string().optional(),
})
export type SendNotificationInput = z.infer<typeof SendNotificationSchema>

export const StoreMemorySchema = z.object({
  companyId: z.string().min(1, "companyId is required"),
  clientId: z.string().optional(),
  type: z.enum(["decision", "strategy", "meeting", "document_change", "kpi_change", "risk", "note", "event", "task", "recommendation", "alert"]),
  title: z.string().min(1, "title is required"),
  description: z.string().min(1, "description is required"),
  entities: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({}),
  userId: z.string().min(1, "userId is required"),
  userName: z.string().optional(),
  importance: z.enum(["low", "medium", "high", "critical"]).default("medium"),
})
export type StoreMemoryInput = z.infer<typeof StoreMemorySchema>

export const CreateFinancialStatementSchema = z.object({
  clientId: z.string().min(1, "clientId is required"),
  periodStart: z.string().min(1, "periodStart is required"),
  periodEnd: z.string().min(1, "periodEnd is required"),
  statementType: z.enum(["balance_sheet", "income_statement", "cash_flow", "all"]),
  data: z.record(z.union([z.number(), z.string(), z.null()])),
})
export type CreateFinancialStatementInput = z.infer<typeof CreateFinancialStatementSchema>

// ── New simple request body schemas ──

export const CopilotMessageSchema = z.object({
  clientId: z.string().min(1, "clientId is required"),
  message: z.string().min(1, "message is required"),
  conversationId: z.string().optional(),
})
export type CopilotMessageInput = z.infer<typeof CopilotMessageSchema>

export const CopilotToolSchema = z.object({
  toolName: z.string().min(1, "toolName is required"),
  params: z.record(z.any()),
})
export type CopilotToolInput = z.infer<typeof CopilotToolSchema>

export const CopilotFeedbackSchema = z.object({
  traceId: z.string().min(1, "traceId is required"),
  score: z.number().int().min(1, "score must be between 1 and 5").max(5, "score must be between 1 and 5"),
  text: z.string().optional(),
})
export type CopilotFeedbackInput = z.infer<typeof CopilotFeedbackSchema>

export const ConsultingStrategySchema = z.object({
  clientId: z.string().min(1, "clientId is required"),
  currentState: z.record(z.any()),
  desiredState: z.record(z.any()),
})
export type ConsultingStrategyInput = z.infer<typeof ConsultingStrategySchema>

export const ConsultingAnalyzeSchema = z.object({
  clientId: z.string().min(1, "clientId is required"),
  financialStatementIds: z.array(z.string()).default([]),
})
export type ConsultingAnalyzeInput = z.infer<typeof ConsultingAnalyzeSchema>

export const ConsultingComplianceSchema = z.object({
  clientId: z.string().min(1, "clientId is required"),
  checklistType: z.string().default("general"),
})
export type ConsultingComplianceInput = z.infer<typeof ConsultingComplianceSchema>

export const InviteUserSchema = z.object({
  email: z.string().email("valid email is required"),
  roleId: z.string().min(1, "roleId is required"),
})
export type InviteUserInput = z.infer<typeof InviteUserSchema>

const PriceTierEnum = z.enum(["starter", "professional", "enterprise"])
export const StripeCheckoutSchema = z.object({
  tier: PriceTierEnum,
  email: z.string().email().optional().or(z.literal("")),
  companyId: z.string().optional(),
})
export type StripeCheckoutInput = z.infer<typeof StripeCheckoutSchema>

export const StripePortalSchema = z.object({
  customerId: z.string().min(1, "customerId is required"),
})
export type StripePortalInput = z.infer<typeof StripePortalSchema>

export const CertifyProductSchema = z.object({
  productId: z.string().min(1, "productId is required"),
})
export type CertifyProductInput = z.infer<typeof CertifyProductSchema>

const LifecycleActionEnum = z.enum(["install", "activate", "configure", "start", "disable", "enable", "uninstall"])
export const ProductLifecycleSchema = z.object({
  action: LifecycleActionEnum,
})
export type ProductLifecycleInput = z.infer<typeof ProductLifecycleSchema>

export const ProductMigrateSchema = z.object({
  targetVersion: z.string().optional(),
  direction: z.enum(["up", "down"]).optional(),
})
export type ProductMigrateInput = z.infer<typeof ProductMigrateSchema>

export const ProductConfigSchema = z.record(z.any())

export const UpdateTaskSchema = z.object({
  taskId: z.string().min(1, "taskId is required"),
  status: z.string().optional(),
  assignedTo: z.string().optional(),
  completedAt: z.string().optional(),
})
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>

export const CreateRoleSchema = z.object({
  name: z.string().min(1, "name is required").max(100),
  permissions: z.array(z.string()),
})
export type CreateRoleInput = z.infer<typeof CreateRoleSchema>

export const UpdateRoleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  permissions: z.array(z.string()).optional(),
})
export type UpdateRoleInput = z.infer<typeof UpdateRoleSchema>

export const NluClassifySchema = z.object({
  text: z.string().min(1, "text is required"),
  action: z.literal("classify").optional(),
})
export type NluClassifyInput = z.infer<typeof NluClassifySchema>

export const StrategicObjectiveSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  currentValue: z.number().optional(),
  targetValue: z.number().optional(),
  deadline: z.string().datetime().or(z.string()).optional(),
})

export const CreateStrategicPlanSchema = z.object({
  objectives: z.array(StrategicObjectiveSchema).default([]),
})
export type CreateStrategicPlanInput = z.infer<typeof CreateStrategicPlanSchema>

export const GenerateReportSchema = z.object({
  action: z.enum(["diagnostic_report", "generate"]),
  format: z.enum(["pdf", "csv", "excel"]).default("pdf"),
  companyId: z.string().optional(),
  clientId: z.string().optional(),
})
export type GenerateReportInput = z.infer<typeof GenerateReportSchema>

export const ProxyBodySchema = z.record(z.any())

// ── Action-dispatch schemas ──

// Confidence
export const ConfidenceEvaluateSchema = z.object({
  action: z.literal("evaluate"),
  context: z.enum(["prediction", "recommendation", "diagnosis", "hypothesis", "forecast"]).optional(),
  dataPoints: z.number().min(0).optional(),
  dataCompleteness: z.number().min(0).max(100).optional(),
  dataRecencyDays: z.number().min(0).optional(),
  historicalMatches: z.number().min(0).optional(),
  kpiConsistency: z.number().min(0).max(100).optional(),
  benchmarkAvailable: z.boolean().optional(),
  businessCasesAvailable: z.number().min(0).optional(),
  industryKnown: z.boolean().optional(),
})

export const ConfidenceEvaluatePredictionSchema = z.object({
  action: z.literal("evaluate-prediction"),
  historicalDataPoints: z.number().min(0),
  rSquared: z.number().min(0).max(1),
  kpiCount: z.number().min(0),
  industry: z.string().optional(),
})

export const ConfidenceEvaluateRecommendationSchema = z.object({
  action: z.literal("evaluate-recommendation"),
  evidenceCount: z.number().min(0),
  similarCases: z.number().min(0),
  industryKnown: z.boolean(),
})

export const ConfidenceEvaluateDiagnosisSchema = z.object({
  action: z.literal("evaluate-diagnosis"),
  observations: z.number().min(0),
  consistentKPIs: z.number().min(0),
  industryKnown: z.boolean(),
})

export const ConfidencePostSchema = z.discriminatedUnion("action", [
  ConfidenceEvaluateSchema,
  ConfidenceEvaluatePredictionSchema,
  ConfidenceEvaluateRecommendationSchema,
  ConfidenceEvaluateDiagnosisSchema,
])
export type ConfidencePostInput = z.infer<typeof ConfidencePostSchema>

// Genome
export const GenomeAnalyzeSchema = z.object({
  action: z.literal("analyze"),
  companyId: z.string().min(1, "companyId is required"),
  companyName: z.string().min(1, "companyName is required"),
  industry: z.string().optional(),
  size: z.string().optional(),
})

export const GenomeCompareSchema = z.object({
  action: z.literal("compare"),
  companyId: z.string().min(1, "companyId is required"),
  otherCompanyId: z.string().min(1, "otherCompanyId is required"),
})

export const GenomePostSchema = z.discriminatedUnion("action", [
  GenomeAnalyzeSchema,
  GenomeCompareSchema,
])
export type GenomePostInput = z.infer<typeof GenomePostSchema>

// Planning
export const PlanningGenerateSchema = z.object({
  action: z.literal("generate"),
  companyId: z.string().min(1, "companyId is required"),
  objective: z.string().min(1, "objective is required"),
  category: z.string().optional(),
  clientId: z.string().optional(),
  targetValue: z.number().optional(),
  currentValue: z.number().optional(),
  unit: z.string().optional(),
  timeframeMonths: z.number().min(1).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
})

export const PlanningExecuteSchema = z.object({
  action: z.literal("execute"),
  planId: z.string().min(1, "planId is required"),
})

export const PlanningPostSchema = z.discriminatedUnion("action", [
  PlanningGenerateSchema,
  PlanningExecuteSchema,
])
export type PlanningPostInput = z.infer<typeof PlanningPostSchema>

// Execution
export const ExecutionSchemaByAction = {
  detect: z.object({ action: z.literal("detect"), planId: z.string() }),
  correct: z.object({ action: z.literal("correct"), deviationId: z.string() }),
  approve: z.object({ action: z.literal("approve"), correctionId: z.string() }),
  implement: z.object({ action: z.literal("implement"), correctionId: z.string() }),
  ["acknowledge-alert"]: z.object({ action: z.literal("acknowledge-alert"), alertId: z.string() }),
  ["resolve-alert"]: z.object({ action: z.literal("resolve-alert"), alertId: z.string() }),
  reforecast: z.object({ action: z.literal("reforecast"), planId: z.string() }),
  ["resolve-deviation"]: z.object({ action: z.literal("resolve-deviation"), deviationId: z.string() }),
} as const

export const ExecutionPostSchema = z.discriminatedUnion("action", [
  ExecutionSchemaByAction.detect,
  ExecutionSchemaByAction.correct,
  ExecutionSchemaByAction.approve,
  ExecutionSchemaByAction.implement,
  ExecutionSchemaByAction["acknowledge-alert"],
  ExecutionSchemaByAction["resolve-alert"],
  ExecutionSchemaByAction.reforecast,
  ExecutionSchemaByAction["resolve-deviation"],
])
export type ExecutionPostInput = z.infer<typeof ExecutionPostSchema>

// Learning
export const LearningRegisterSchema = z.object({
  action: z.literal("register"),
}).passthrough()

export const LearningAutoRegisterSchema = z.object({
  action: z.literal("auto-register"),
  planId: z.string().min(1, "planId is required"),
}).passthrough()

export const LearningDeleteSchema = z.object({
  action: z.literal("delete"),
  caseId: z.string().min(1, "caseId is required"),
})

export const LearningSearchSchema = z.object({
  action: z.literal("search"),
}).passthrough()

export const LearningPostSchema = z.discriminatedUnion("action", [
  LearningRegisterSchema,
  LearningAutoRegisterSchema,
  LearningDeleteSchema,
  LearningSearchSchema,
])
export type LearningPostInput = z.infer<typeof LearningPostSchema>

// Notifications
export const NotifySendSchema = z.object({
  action: z.literal("send"),
  channel: z.enum(["in_app", "email", "slack", "whatsapp"]).default("in_app"),
  category: z.string().default("system"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  title: z.string().min(1, "title is required"),
  body: z.string().min(1, "body is required"),
  userId: z.string().optional(),
  data: z.record(z.any()).optional(),
  scheduledFor: z.string().optional(),
})

export const NotifySendTemplateSchema = z.object({
  action: z.literal("send_template"),
  channel: z.enum(["in_app", "email", "slack", "whatsapp"]).default("in_app"),
  templateId: z.string().min(1, "templateId is required"),
  variables: z.record(z.any()).default({}),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  userId: z.string().optional(),
})

export const NotifyMarkReadSchema = z.object({
  action: z.literal("mark_read"),
  notificationId: z.string().min(1, "notificationId is required"),
})

export const NotificationsPostSchema = z.discriminatedUnion("action", [
  NotifySendSchema,
  NotifySendTemplateSchema,
  NotifyMarkReadSchema,
])
export type NotificationsPostInput = z.infer<typeof NotificationsPostSchema>

// Scraping
export const ScrapingClearCacheSchema = z.object({
  action: z.literal("clear_cache"),
})

export const ScrapingRefreshSchema = z.object({
  action: z.literal("refresh"),
  source: z.string().default("benchmarks"),
  industry: z.string().default("Manufactura"),
  topic: z.string().optional(),
})

export const ScrapingPostSchema = z.discriminatedUnion("action", [
  ScrapingClearCacheSchema,
  ScrapingRefreshSchema,
])
export type ScrapingPostInput = z.infer<typeof ScrapingPostSchema>

// Reasoning
export const ReasoningReasonSchema = z.object({
  action: z.literal("reason"),
  companyId: z.string().default("default"),
  clientId: z.string().optional(),
  query: z.string().default("Analizar situación actual"),
  context: z.any().optional(),
})

export const ReasoningExplainSchema = z.object({
  action: z.literal("explain"),
  kpi: z.string().min(1, "kpi is required"),
  currentValue: z.number(),
  previousValue: z.number(),
  companyId: z.string().default("default"),
  clientId: z.string().optional(),
})

export const ReasoningDiagnoseSchema = z.object({
  action: z.literal("diagnose"),
  data: z.record(z.any()).default({}),
})

export const ReasoningPostSchema = z.discriminatedUnion("action", [
  ReasoningReasonSchema,
  ReasoningExplainSchema,
  ReasoningDiagnoseSchema,
])
export type ReasoningPostInput = z.infer<typeof ReasoningPostSchema>

// Prediction
export const PredictionPredictSchema = z.object({
  action: z.literal("predict"),
  companyId: z.string().default("default"),
  clientId: z.string().optional(),
})

export const PredictionPredictKpiSchema = z.object({
  action: z.literal("predict-kpi"),
  kpi: z.string().min(1, "kpi is required"),
  historicalData: z.array(z.any()).default([]),
  days: z.number().min(1).default(90),
})

export const PredictionCashFlowSchema = z.object({
  action: z.literal("cash-flow"),
  currentCash: z.number().default(0),
  monthlyInflow: z.number().default(0),
  monthlyOutflow: z.number().default(0),
  months: z.number().min(1).default(12),
})

export const PredictionPostSchema = z.discriminatedUnion("action", [
  PredictionPredictSchema,
  PredictionPredictKpiSchema,
  PredictionCashFlowSchema,
])
export type PredictionPostInput = z.infer<typeof PredictionPostSchema>

// Optimization
export const OptimizationAnalyzeSchema = z.object({
  action: z.literal("analyze"),
}).passthrough()

export const OptimizationSimulateSchema = z.object({
  action: z.literal("simulate"),
}).passthrough()

export const OptimizationPostSchema = z.discriminatedUnion("action", [
  OptimizationAnalyzeSchema,
  OptimizationSimulateSchema,
])
export type OptimizationPostInput = z.infer<typeof OptimizationPostSchema>

// Knowledge
export const KnowledgeSearchKpiSchema = z.object({
  action: z.literal("search_kpi"),
  domain: z.string().optional(),
  query: z.string().optional(),
})

export const KnowledgeEvaluateKpiSchema = z.object({
  action: z.literal("evaluate_kpi"),
  kpiId: z.string().min(1, "kpiId is required"),
  value: z.number(),
})

export const KnowledgeEvaluateRatiosSchema = z.object({
  action: z.literal("evaluate_ratios"),
  values: z.record(z.number()),
})

export const KnowledgeBenchmarkCompareSchema = z.object({
  action: z.literal("benchmark_compare"),
  industry: z.string().min(1, "industry is required"),
  ratios: z.record(z.number()),
})

export const KnowledgeBenchmarkReportSchema = z.object({
  action: z.literal("benchmark_report"),
  companyId: z.string().optional(),
  industry: z.string().min(1, "industry is required"),
  ratios: z.record(z.number()),
})

export const KnowledgeIfrsValidateSchema = z.object({
  action: z.literal("ifrs_validate"),
  data: z.record(z.any()),
  companyId: z.string().optional(),
  period: z.string().optional(),
})

export const KnowledgeIfrsRatiosSchema = z.object({
  action: z.literal("ifrs_ratios"),
  data: z.record(z.number()),
})

export const KnowledgeSriAnalyzeSchema = z.object({
  action: z.literal("sri_analyze"),
  profile: z.record(z.any()),
})

export const KnowledgeQuerySchema = z.object({
  action: z.literal("knowledge_query"),
  query: z.string().min(1, "query is required"),
})

export const KnowledgePostSchema = z.discriminatedUnion("action", [
  KnowledgeSearchKpiSchema,
  KnowledgeEvaluateKpiSchema,
  KnowledgeEvaluateRatiosSchema,
  KnowledgeBenchmarkCompareSchema,
  KnowledgeBenchmarkReportSchema,
  KnowledgeIfrsValidateSchema,
  KnowledgeIfrsRatiosSchema,
  KnowledgeSriAnalyzeSchema,
  KnowledgeQuerySchema,
])
export type KnowledgePostInput = z.infer<typeof KnowledgePostSchema>
