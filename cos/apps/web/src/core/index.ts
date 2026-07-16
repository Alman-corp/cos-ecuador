// Bus layer
export { commandBus, queryBus, eventBus } from "./bus"
export type { ICommand, ICommandHandler, IQuery, IQueryHandler, IEvent, IEventHandler } from "./bus"

// Registration
export { registerCore } from "./register"

// Domain Services
export { financialAnalysisService } from "./services/FinancialAnalysisService"
export { clientHealthService } from "./services/ClientHealthService"
export { riskAssessmentService } from "./services/RiskAssessmentService"
export { taxCalculationService } from "./services/TaxCalculationService"
export { complianceService } from "./services/ComplianceService"
export { strategicPlanningService } from "./services/StrategicPlanningService"

// Legacy errors (kept for backward compat)
export { DomainError, NotFoundError, ValidationError, UnauthorizedError, ConflictError } from "./errors"

// Domain Exceptions
export {
  ClientAlreadyExistsException, SubscriptionExpiredException,
  LeadAlreadyConvertedException, InsufficientPermissionsException,
  CompanyNotActiveException, DuplicateEmailException,
  InvalidOperationException, DocumentNotFoundException,
  FinancialStatementException, WorkflowExecutionException, AiProviderException,
} from "./exceptions"

// Result Pattern
export { success, failure, fromThrowable, fromPromise, Success, Failure } from "./result"
export type { Result } from "./result"

// Repositories
export type {
  Repository, WriteRepository,
  ICompanyRepository, IUserRepository, IClientRepository,
  ILeadRepository, IDocumentRepository, IFinancialStatementRepository,
  ClientFilters, LeadFilters, DocumentFilters,
} from "./repositories"
export {
  prismaCompanyRepo, prismaUserRepo, prismaClientRepo,
  prismaLeadRepo, prismaDocumentRepo, prismaFinancialStatementRepo,
} from "./repositories/prisma"

// Unit of Work
export { unitOfWork } from "./unit-of-work"
export type { IUnitOfWork } from "./unit-of-work"

// Specifications
export {
  Specification, HighRiskClientSpec, HealthyClientSpec,
  EnterpriseClientSpec, ActiveClientSpec, ClientByIndustrySpec,
} from "./specifications"

// Policies
export {
  Policy, PolicyResult,
  SubscriptionActivePolicy, HasPermissionPolicy, UserIsActivePolicy,
  CanDeleteClientPolicy, CanApproveInvoicePolicy, CanRunAuditPolicy, CanCreateStrategyPolicy,
} from "./policies"
export type { PolicyContext } from "./policies"

// Validation
export {
  BusinessRule, BusinessValidationResult, validateRules,
  CompanyMustHaveSubscription, LeadCannotBeConvertedTwice,
  ClientMustHaveRepresentative, FinancialStatementsMustBalance,
  EmailMustBeUnique, ClientEmailMustBeUniqueInCompany,
} from "./validation"

// Domain Events
export type {
  CompanyRegisteredEvent, UserInvitedEvent, RoleCreatedEvent,
  ClientCreatedEvent, LeadConvertedEvent, ClientOnboardedEvent,
  FinancialAnalysisCompletedEvent, ReportGeneratedEvent,
  WorkflowStartedEvent, WorkflowCompletedEvent,
  AiRecommendationAcceptedEvent, AnalysisRequestedEvent,
} from "./events"

// Outbox
export { appendToOutbox, processOutbox, outboxWorker } from "./outbox"

// Facades
export { identityFacade, IdentityFacade } from "./facades/IdentityFacade"
export { crmFacade, CrmFacade } from "./facades/CrmFacade"
export { consultingFacade, ConsultingFacade } from "./facades/ConsultingFacade"

// Use Cases (re-exported for direct access)
export * from "./use-cases"

// XBRL Parser
export { parseXBRLInstance, parseXBRLFile, getFinancialRatiosFromXBRL } from "./xbrl"
export type { XBRLParsedStatement, XBRLConceptValue, XBRLParseResult } from "./xbrl"

// Web Scraping
export { scrapingService } from "./scraping"
export type { ScrapedBenchmark, ScrapedCompany, ScrapeResult } from "./scraping"

// Notification Service
export { notificationService } from "./notifications"
export type { Notification, NotificationTemplate, NotificationChannel, NotificationCategory, NotificationPriority } from "./notifications"

// NLU Engine
export { nluEngine } from "./nlu"
export type { NLUResult, NLUIntent, NLUEntity } from "./nlu"

// Enhanced Prediction
export { enhancedPredictionEngine, EnhancedPredictionEngine } from "./prediction/enhanced"
export type { EnhancedProjection, SeasonalDecomposition, AnomalyResult } from "./prediction/enhanced"
