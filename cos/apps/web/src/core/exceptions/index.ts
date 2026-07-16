import { DomainError } from "../errors"

export class ClientAlreadyExistsException extends DomainError {
  readonly code = "CLIENT_ALREADY_EXISTS"
  constructor(email: string) { super(`Client already exists: ${email}`) }
}
export class SubscriptionExpiredException extends DomainError {
  readonly code = "SUBSCRIPTION_EXPIRED"
  constructor(companyId: string) { super(`Subscription expired for company: ${companyId}`) }
}
export class LeadAlreadyConvertedException extends DomainError {
  readonly code = "LEAD_ALREADY_CONVERTED"
  constructor(leadId: string) { super(`Lead already converted: ${leadId}`) }
}
export class InsufficientPermissionsException extends DomainError {
  readonly code = "INSUFFICIENT_PERMISSIONS"
  constructor(userId: string, action: string) { super(`User ${userId} lacks permission: ${action}`) }
}
export class CompanyNotActiveException extends DomainError {
  readonly code = "COMPANY_NOT_ACTIVE"
  constructor(companyId: string) { super(`Company not active: ${companyId}`) }
}
export class DuplicateEmailException extends DomainError {
  readonly code = "DUPLICATE_EMAIL"
  constructor(email: string) { super(`Email already in use: ${email}`) }
}
export class InvalidOperationException extends DomainError {
  readonly code = "INVALID_OPERATION"
  constructor(message: string) { super(message) }
}
export class DocumentNotFoundException extends DomainError {
  readonly code = "DOCUMENT_NOT_FOUND"
  constructor(id: string) { super(`Document not found: ${id}`) }
}
export class FinancialStatementException extends DomainError {
  readonly code = "FINANCIAL_STATEMENT_ERROR"
  constructor(message: string) { super(message) }
}
export class WorkflowExecutionException extends DomainError {
  readonly code = "WORKFLOW_EXECUTION_ERROR"
  constructor(message: string) { super(message) }
}
export class AiProviderException extends DomainError {
  readonly code = "AI_PROVIDER_ERROR"
  constructor(provider: string, message: string) { super(`AI provider ${provider} error: ${message}`) }
}
