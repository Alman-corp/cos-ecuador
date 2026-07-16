// SDK types — re-exported from core contracts for stable public API

export type {
  CoreClient,
  CoreClientFilter,
  CoreCreateClientInput,
  CoreDocument,
  CoreFinancialData,
  CoreEvaluateInput,
  CoreEvaluation,
  CoreRatio,
  CoreDiagnoseInput,
  CoreDiagnosis,
  CoreFinding,
  CoreRecommendInput,
  CoreRecommendation,
  CoreReportInput,
  CoreReport,
  CoreWorkflowInstance,
  CoreKnowledgeEntry,
  CoreKnowledgeFilter,
  CoreEventPayload,
  VerticalContract,
  VerticalHook,
} from "../contracts"

export { CoreEvent, CORE_VERSION, CORE_COMPATIBILITY_RANGE } from "../contracts"

export type {
  ProductManifest,
  ProductAgent,
  ProductRule,
  ProductDashboard,
  ProductReport,
  ProductWorkflow,
  ProductKPI,
  ProductPackage,
  LifecycleState,
  ConfigField,
} from "@/core/products/manifest"
