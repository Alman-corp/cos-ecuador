import type { IEvent } from "../bus/EventBus"

// Identity events
export interface CompanyRegisteredEvent extends IEvent {
  readonly type: "identity.companyRegistered"
  readonly aggregateId: string
  readonly occurredAt: Date
  companyId: string
  name: string
  email: string
  adminId: string
}

export interface UserInvitedEvent extends IEvent {
  readonly type: "identity.userInvited"
  readonly aggregateId: string
  readonly occurredAt: Date
  companyId: string
  userId: string
  email: string
  invitedBy: string
}

export interface RoleCreatedEvent extends IEvent {
  readonly type: "identity.roleCreated"
  readonly aggregateId: string
  readonly occurredAt: Date
  companyId: string
  roleId: string
  name: string
  createdBy: string
}

// CRM events
export interface ClientCreatedEvent extends IEvent {
  readonly type: "crm.clientCreated"
  readonly aggregateId: string
  readonly occurredAt: Date
  companyId: string
  clientId: string
  name: string
  createdBy: string
}

export interface LeadConvertedEvent extends IEvent {
  readonly type: "crm.leadConverted"
  readonly aggregateId: string
  readonly occurredAt: Date
  companyId: string
  leadId: string
  clientId: string
  convertedBy: string
}

export interface ClientOnboardedEvent extends IEvent {
  readonly type: "crm.clientOnboarded"
  readonly aggregateId: string
  readonly occurredAt: Date
  companyId: string
  clientId: string
  documentsCount: number
  healthStatus: string
  createdBy: string
}

// Consulting events
export interface FinancialAnalysisCompletedEvent extends IEvent {
  readonly type: "consulting.financialAnalysisCompleted"
  readonly aggregateId: string
  readonly occurredAt: Date
  companyId: string
  clientId: string
  status: string
  score: number
  performedBy: string
}

export interface ReportGeneratedEvent extends IEvent {
  readonly type: "consulting.reportGenerated"
  readonly aggregateId: string
  readonly occurredAt: Date
  companyId: string
  reportType: string
  relatedEntityId: string
  generatedBy: string
}

// Workflow events
export interface WorkflowStartedEvent extends IEvent {
  readonly type: "workflow.started"
  readonly aggregateId: string
  readonly occurredAt: Date
  companyId: string
  workflowId: string
  instanceId: string
  startedBy: string
}

export interface WorkflowCompletedEvent extends IEvent {
  readonly type: "workflow.completed"
  readonly aggregateId: string
  readonly occurredAt: Date
  companyId: string
  workflowId: string
  instanceId: string
  result: string
}

// AI events
export interface AiRecommendationAcceptedEvent extends IEvent {
  readonly type: "ai.recommendationAccepted"
  readonly aggregateId: string
  readonly occurredAt: Date
  companyId: string
  recommendationId: string
  acceptedBy: string
}

export interface AnalysisRequestedEvent extends IEvent {
  readonly type: "ai.analysisRequested"
  readonly aggregateId: string
  readonly occurredAt: Date
  companyId: string
  clientId?: string
  analysisType: string
  requestedBy: string
}
