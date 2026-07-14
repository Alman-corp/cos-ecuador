export type LegalBasisEC =
  | 'CONSENT' | 'CONTRACT' | 'LEGAL_OBLIGATION'
  | 'VITAL_INTEREST' | 'PUBLIC_INTEREST' | 'LEGITIMATE_INTEREST'

export type DataCategory =
  | 'PERSONAL_BASIC' | 'PERSONAL_SENSITIVE' | 'FINANCIAL'
  | 'TAX' | 'LABOR' | 'COMMERCIAL' | 'TECHNICAL' | 'BIOMETRIC'

export type DataSubjectCategory =
  | 'CLIENTS' | 'EMPLOYEES' | 'PROVIDERS' | 'PROSPECTS' | 'THIRD_PARTIES'

export type ActivityStatus = 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED'

export type ConsentMethod = 'CHECKBOX' | 'SIGNATURE' | 'DOUBLE_OPT_IN' | 'WRITTEN'

export type ARCORight = 'ACCESS' | 'RECTIFY' | 'CANCEL' | 'OPPOSE' | 'PORTABILITY'

export type ARCOStatus =
  | 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'EXPIRED'

export type SafeguardType =
  | 'ADEQUACY_DECISION' | 'SCC' | 'BCR' | 'DPA' | 'EXPLICIT_CONSENT' | 'CONTRACTUAL_NECESSITY'

export type SecurityCategory =
  | 'ENCRYPTION_AT_REST' | 'ENCRYPTION_IN_TRANSIT' | 'ACCESS_CONTROL'
  | 'BACKUP' | 'MONITORING' | 'INCIDENT_RESPONSE' | 'TRAINING' | 'AUDIT'

export interface DataProcessingActivity {
  id: string
  tenantId: string
  name: string
  description?: string
  purpose: string
  legalBasis: LegalBasisEC
  dataCategories: DataCategory[]
  dataSubjectCategories: DataSubjectCategory[]
  internationalTransfers?: boolean
  retentionDays: number
  retentionJustification?: string
  requiresDPIA?: boolean
  dpiaCompletedAt?: string
  dpiaDocumentUrl?: string
  status: ActivityStatus
  createdAt: string
  updatedAt: string
  createdBy?: string
}

export interface Consent {
  id: string
  tenantId: string
  dataSubjectEmail: string
  dataSubjectCedula?: string
  activityId: string
  granted: boolean
  grantedAt?: string
  revokedAt?: string
  revokedReason?: string
  policyVersion: string
  policyUrl: string
  consentMethod: ConsentMethod
  createdAt: string
}

export interface ConsentInput {
  activityType: string
  granted: boolean
}

export interface ARCORequest {
  id: string
  tenantId: string
  requesterEmail: string
  requesterCedula?: string
  requesterName: string
  rightType: ARCORight
  status: ARCOStatus
  receivedAt: string
  respondedAt?: string
  deadlineAt: string
  responseNotes?: string
  exportFileUrl?: string
}

export interface InternationalTransfer {
  id: string
  activityId: string
  recipientCountry: string
  recipientName: string
  recipientType: string
  purpose: string
  safeguardType: SafeguardType
  dpaSignedAt?: string
  dpaExpiresAt?: string
}

export interface SecurityMeasure {
  id: string
  activityId: string
  category: SecurityCategory
  name: string
  description?: string
  implementedAt?: string
  evidenceUrl?: string
}
