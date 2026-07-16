# PRISMA SCHEMA DESIGN

## Modelo de datos completo por Bounded Contexts

Este documento define el diseño completo de la base de datos de Consulting OS, organizado por contextos delimitados (DDD). Cada tabla incluye campos, tipos, relaciones, índices, restricciones y reglas de negocio.

---

## Convenciones

```
- UUID v4 como IDs primarios (generados por Prisma)
- snake_case para columnas (mapeado con @map)
- created_at / updated_at / deleted_at en TODAS las tablas
- created_by / updated_by (opcional, String? @db.Uuid) en tablas de negocio
- company_id en todas las tablas tenant-scoped (excepto globales)
- Soft delete con deleted_at (nunca DELETE físico)
- Status como String con valores predefinidos (enum emulado en TS)
- Timestamps en UTC
- Decimal(16, 2) para montos financieros
- Decimal(16, 4) para ratios y porcentajes
- JSON para datos flexibles (configuraciones, metadata)
```

---

## 1. IDENTITY CONTEXT

### 1.1 Company (Tenant Root)
```prisma
model Company {
  id        String   @id @default(uuid()) @db.Uuid
  name      String                       // Razón social
  slug      String   @unique             // URL-safe identifier
  logoUrl   String?  @map("logo_url")
  taxId     String?  @map("tax_id")      // RUC
  email     String?
  phone     String?
  website   String?
  country   String   @default("EC")
  language  String   @default("es")
  status    String   @default("active")  // active, inactive, suspended, trial
  planId    String?  @map("plan_id")     // Subscription plan
  trialEndsAt DateTime? @map("trial_ends_at")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  // Relations
  settings    CompanySettings?
  branches    Branch[]
  departments Department[]
  users       User[]
  roles       Role[]
  leads       Lead[]
  clients     Client[]
  projects    Project[]
  documents   Document[]
  workflows   WorkflowDefinition[]
  rules       RuleDefinition[]
  knowledge   KnowledgeNode[]
  decisions   Decision[]
  notifications Notification[]
  auditLogs   AuditLog[]
  events      Event[]
  featureFlags FeatureFlag[]
  plugins     PluginInstallation[]
  subscriptions BillingSubscription[]
  invoices    BillingInvoice[]
  aiCostLogs  AICostLog[]

  @@map("companies")
}
```

### 1.2 CompanySettings
```prisma
model CompanySettings {
  id              String @id @default(uuid()) @db.Uuid
  companyId       String @unique @map("company_id") @db.Uuid
  company         Company @relation(fields: [companyId], references: [id])

  defaultCurrency String @default("USD") @map("default_currency")
  timezone        String @default("America/Guayaquil")
  dateFormat      String @default("DD/MM/YYYY") @map("date_format")
  fiscalYearStart String @default("01-01") @map("fiscal_year_start") // MM-DD
  themeConfig     Json?  @map("theme_config")
  features        Json?  // Feature flags override

  // Limits (plan-based with optional override)
  maxUsers         Int @default(5) @map("max_users")
  maxClients       Int @default(50) @map("max_clients")
  maxStorageMb     Int @default(5000) @map("max_storage_mb")
  maxAiCredits     Int @default(1000) @map("max_ai_credits")
  maxWorkflows     Int @default(10) @map("max_workflows")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("company_settings")
}
```

### 1.3 Branch
```prisma
model Branch {
  id             String   @id @default(uuid()) @db.Uuid
  companyId      String   @map("company_id") @db.Uuid
  company        Company  @relation(fields: [companyId], references: [id])
  name           String
  address        String?
  city           String?
  country        String   @default("EC")
  phone          String?
  email          String?
  isHeadquarters Boolean  @default(false) @map("is_headquarters")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  departments Department[]
  users       User[]

  @@unique([companyId, name])
  @@map("branches")
}
```

### 1.4 Department
```prisma
model Department {
  id         String   @id @default(uuid()) @db.Uuid
  companyId  String   @map("company_id") @db.Uuid
  company    Company  @relation(fields: [companyId], references: [id])
  branchId   String?  @map("branch_id") @db.Uuid
  branch     Branch?  @relation(fields: [branchId], references: [id])
  name       String
  code       String?
  parentId   String?  @map("parent_id") @db.Uuid
  parent     Department?  @relation("DepartmentHierarchy", fields: [parentId], references: [id])
  children   Department[] @relation("DepartmentHierarchy")
  headUserId String?  @map("head_user_id") @db.Uuid
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  users User[]

  @@unique([companyId, name])
  @@map("departments")
}
```

### 1.5 User
```prisma
model User {
  id           String   @id @default(uuid()) @db.Uuid
  email        String   @unique
  firstName    String   @map("first_name")
  lastName     String   @map("last_name")
  avatarUrl    String?  @map("avatar_url")
  phone        String?
  companyId    String   @map("company_id") @db.Uuid
  company      Company  @relation(fields: [companyId], references: [id])
  branchId     String?  @map("branch_id") @db.Uuid
  branch       Branch?  @relation(fields: [branchId], references: [id])
  departmentId String?  @map("department_id") @db.Uuid
  department   Department? @relation(fields: [departmentId], references: [id])
  position     String?  // Cargo
  isActive     Boolean  @default(true) @map("is_active")
  authId       String?  @unique @map("auth_id")  // Supabase/Keycloak ID
  lastLoginAt  DateTime? @map("last_login_at")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  deletedAt    DateTime? @map("deleted_at")

  roles        UserRole[]
  assignedTickets Ticket[] @relation("TicketAssignee")

  @@index([companyId, email])
  @@map("users")
}
```

### 1.6 Role
```prisma
model Role {
  id          String   @id @default(uuid()) @db.Uuid
  companyId   String   @map("company_id") @db.Uuid
  company     Company  @relation(fields: [companyId], references: [id])
  name        String
  description String?
  isSystem    Boolean  @default(false) @map("is_system")
  permissions Json     @default("[]")  // Array de strings: ["clients.read", "clients.write"]
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  users UserRole[]

  @@unique([companyId, name])
  @@map("roles")
}
```

### 1.7 UserRole
```prisma
model UserRole {
  userId String @map("user_id") @db.Uuid
  user   User   @relation(fields: [userId], references: [id])
  roleId String @map("role_id") @db.Uuid
  role   Role   @relation(fields: [roleId], references: [id])

  @@id([userId, roleId])
  @@map("user_roles")
}
```

---

## 2. CRM CONTEXT

### 2.1 Lead
```prisma
model Lead {
  id          String   @id @default(uuid()) @db.Uuid
  companyId   String   @map("company_id") @db.Uuid
  company     Company  @relation(fields: [companyId], references: [id])
  firstName   String   @map("first_name")
  lastName    String   @map("last_name")
  email       String?
  phone       String?
  companyName String?  @map("company_name")
  position    String?
  source      String   @default("web") // web, referral, partner, inbound, cold, event
  score       Int      @default(0)    // 0-100 calificación automática
  status      String   @default("new") // new, contacted, qualified, lost
  notes       String?
  assignedTo  String?  @map("assigned_to") @db.Uuid
  lastContactedAt DateTime? @map("last_contacted_at")
  convertedToClientId String? @map("converted_to_client_id") @db.Uuid
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  activities   LeadActivity[]
  convertedTo  Client? @relation(fields: [convertedToClientId], references: [id])

  @@index([companyId, status])
  @@index([companyId, score])
  @@map("leads")
}
```

### 2.2 LeadActivity
```prisma
model LeadActivity {
  id        String   @id @default(uuid()) @db.Uuid
  leadId    String   @map("lead_id") @db.Uuid
  lead      Lead     @relation(fields: [leadId], references: [id])
  type      String   // call, email, meeting, demo, proposal, follow_up
  subject   String?
  notes     String?
  performedBy String @map("performed_by") @db.Uuid
  performedAt DateTime @default(now()) @map("performed_at")
  createdAt DateTime @default(now()) @map("created_at")

  @@index([leadId, performedAt])
  @@map("lead_activities")
}
```

### 2.3 Client
```prisma
model Client {
  id          String   @id @default(uuid()) @db.Uuid
  companyId   String   @map("company_id") @db.Uuid
  company     Company  @relation(fields: [companyId], references: [id])
  leadId      String?  @map("lead_id") @db.Uuid
  lead        Lead?    @relation(fields: [leadId], references: [id])
  name        String
  tradeName   String?  @map("trade_name")
  taxId       String?  @map("tax_id")
  industry    String?
  segment     String?  // small, medium, large, corporate
  website     String?
  email       String?
  phone       String?
  address     String?
  city        String?
  country     String   @default("EC")
  status      String   @default("active") // active, inactive, prospect, churned
  score       Int      @default(0)       // 0-100 customer health score
  source      String?  // referral, cold_outreach, website, partner
  assignedTo  String?  @map("assigned_to") @db.Uuid
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  contacts     ClientContact[]
  legalReps    ClientLegalRep[]
  shareholders ClientShareholder[]
  contracts    ClientContract[]
  projects     Project[]
  documents    Document[]
  tickets      Ticket[]
  interactions ClientInteraction[]
  meetings     ClientMeeting[]
  issues       ClientIssue[]
  objectives   ClientObjective[]
  timeline     TimelineEvent[]
  decisions    Decision[]
  opportunities Opportunity[]

  @@index([companyId, status])
  @@index([companyId, assignedTo])
  @@map("clients")
}
```

### 2.4 ClientContact
```prisma
model ClientContact {
  id        String   @id @default(uuid()) @db.Uuid
  clientId  String   @map("client_id") @db.Uuid
  client    Client   @relation(fields: [clientId], references: [id])
  firstName String   @map("first_name")
  lastName  String   @map("last_name")
  email     String?
  phone     String?
  position  String?
  isPrimary Boolean  @default(false) @map("is_primary")
  notes     String?
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@index([clientId, isPrimary])
  @@map("client_contacts")
}
```

### 2.5 ClientLegalRep
```prisma
model ClientLegalRep {
  id             String   @id @default(uuid()) @db.Uuid
  clientId       String   @map("client_id") @db.Uuid
  client         Client   @relation(fields: [clientId], references: [id])
  fullName       String   @map("full_name")
  identification String?  // Cédula/RUC
  position       String?
  fromDate       DateTime @map("from_date")
  toDate         DateTime? @map("to_date")
  isActive       Boolean  @default(true) @map("is_active")
  createdAt      DateTime @default(now()) @map("created_at")

  @@map("client_legal_reps")
}
```

### 2.6 ClientShareholder
```prisma
model ClientShareholder {
  id              String   @id @default(uuid()) @db.Uuid
  clientId        String   @map("client_id") @db.Uuid
  client          Client   @relation(fields: [clientId], references: [id])
  fullName        String   @map("full_name")
  identification  String?
  sharePercentage Float    @map("share_percentage")
  shareType       String?  @map("share_type") // common, preferred
  createdAt       DateTime @default(now()) @map("created_at")

  @@map("client_shareholders")
}
```

### 2.7 Opportunity
```prisma
model Opportunity {
  id              String   @id @default(uuid()) @db.Uuid
  companyId       String   @map("company_id") @db.Uuid
  clientId        String   @map("client_id") @db.Uuid
  client          Client   @relation(fields: [clientId], references: [id])
  title           String
  value           Decimal  @db.Decimal(16, 2)
  probability     Int      @default(50)  // 0-100
  stage           String   @default("discovery") // discovery, proposal, negotiation, closing
  expectedCloseAt DateTime @map("expected_close_at")
  notes           String?
  assignedTo      String?  @map("assigned_to") @db.Uuid
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  @@index([companyId, stage])
  @@map("opportunities")
}
```

### 2.8 ClientContract
```prisma
model ClientContract {
  id              String   @id @default(uuid()) @db.Uuid
  clientId        String   @map("client_id") @db.Uuid
  client          Client   @relation(fields: [clientId], references: [id])
  title           String
  contractType    String   // retainer, project, hourly
  status          String   @default("draft") // draft, sent, signed, expired, terminated
  startDate       DateTime @map("start_date")
  endDate         DateTime? @map("end_date")
  value           Decimal  @default(0) @db.Decimal(16, 2)
  currency        String   @default("USD")
  pdfUrl          String?  @map("pdf_url")
  signedAt        DateTime? @map("signed_at")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  versions ClientContractVersion[]

  @@index([clientId, status])
  @@index([clientId, endDate])
  @@map("client_contracts")
}
```

### 2.9 ClientContractVersion
```prisma
model ClientContractVersion {
  id         String   @id @default(uuid()) @db.Uuid
  contractId String   @map("contract_id") @db.Uuid
  contract   ClientContract @relation(fields: [contractId], references: [id])
  version    Int      @default(1)
  content    Json
  changeLog  String?  @map("change_log")
  createdBy  String   @map("created_by") @db.Uuid
  createdAt  DateTime @default(now()) @map("created_at")

  @@unique([contractId, version])
  @@map("client_contract_versions")
}
```

---

## 3. CONSULTING CONTEXT

### 3.1 Project
```prisma
model Project {
  id            String   @id @default(uuid()) @db.Uuid
  companyId     String   @map("company_id") @db.Uuid
  clientId      String   @map("client_id") @db.Uuid
  client        Client   @relation(fields: [clientId], references: [id])
  name          String
  description   String?
  projectType   String   // consulting, audit, advisory, implementation
  methodology   String   @default("kanban") // kanban, scrum, waterfall
  status        String   @default("planning") // planning, active, paused, completed, cancelled
  priority      String   @default("medium")
  startDate     DateTime @map("start_date")
  targetEndDate DateTime? @map("target_end_date")
  actualEndDate DateTime? @map("actual_end_date")
  budget        Decimal  @default(0) @db.Decimal(16, 2)
  costToDate    Decimal  @default(0) @map("cost_to_date") @db.Decimal(16, 2)
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  tasks      Task[]
  milestones ProjectMilestone[]
  risks      ProjectRisk[]
  documents  Document[]

  @@index([companyId, status])
  @@index([clientId, status])
  @@map("projects")
}
```

### 3.2 ProjectMilestone
```prisma
model ProjectMilestone {
  id          String   @id @default(uuid()) @db.Uuid
  projectId   String   @map("project_id") @db.Uuid
  project     Project  @relation(fields: [projectId], references: [id])
  name        String
  dueDate     DateTime @map("due_date")
  completed   Boolean  @default(false)
  completedAt DateTime? @map("completed_at")
  createdAt   DateTime @default(now()) @map("created_at")

  @@index([projectId, dueDate])
  @@map("project_milestones")
}
```

### 3.3 Task
```prisma
model Task {
  id             String   @id @default(uuid()) @db.Uuid
  projectId      String   @map("project_id") @db.Uuid
  project        Project  @relation(fields: [projectId], references: [id])
  parentTaskId   String?  @map("parent_task_id") @db.Uuid
  parentTask     Task?    @relation("TaskHierarchy", fields: [parentTaskId], references: [id])
  subtasks       Task[]   @relation("TaskHierarchy")
  title          String
  description    String?
  status         String   @default("todo") // todo, in_progress, review, done
  priority       String   @default("medium")
  assignedTo     String?  @map("assigned_to") @db.Uuid
  estimatedHours Float?   @map("estimated_hours")
  actualHours    Float?   @map("actual_hours")
  kanbanColumn   String?  @map("kanban_column")
  dueDate        DateTime? @map("due_date")
  completedAt    DateTime? @map("completed_at")
  sortOrder      Int      @default(0) @map("sort_order")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  dependencies  TaskDependency[] @relation("TaskDependency_predecessor")
  dependents    TaskDependency[] @relation("TaskDependency_dependent")

  @@index([projectId, status])
  @@index([assignedTo, status])
  @@map("tasks")
}
```

### 3.4 TaskDependency
```prisma
model TaskDependency {
  id             String @id @default(uuid()) @db.Uuid
  predecessorId  String @map("predecessor_id") @db.Uuid
  predecessor    Task   @relation("TaskDependency_predecessor", fields: [predecessorId], references: [id])
  dependentId    String @map("dependent_id") @db.Uuid
  dependent      Task   @relation("TaskDependency_dependent", fields: [dependentId], references: [id])
  dependencyType String @default("finish_to_start")

  @@unique([predecessorId, dependentId])
  @@map("task_dependencies")
}
```

### 3.5 ProjectRisk
```prisma
model ProjectRisk {
  id          String   @id @default(uuid()) @db.Uuid
  projectId   String   @map("project_id") @db.Uuid
  project     Project  @relation(fields: [projectId], references: [id])
  title       String
  description String?
  probability Int      @default(50) // 0-100
  impact      Int      @default(50) // 0-100
  status      String   @default("identified") // identified, mitigated, realized, closed
  mitigation  String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@index([projectId, status])
  @@map("project_risks")
}
```

---

## 4. DOCUMENT CONTEXT

### 4.1 Document
```prisma
model Document {
  id          String   @id @default(uuid()) @db.Uuid
  companyId   String   @map("company_id") @db.Uuid
  clientId    String?  @map("client_id") @db.Uuid
  client      Client?  @relation(fields: [clientId], references: [id])
  projectId   String?  @map("project_id") @db.Uuid
  project     Project? @relation(fields: [projectId], references: [id])
  title       String
  documentType String  @map("document_type") // financial_statement, tax, contract, report, etc.
  fileUrl     String   @map("file_url")
  fileSize    Int      @default(0) @map("file_size")
  mimeType    String?  @map("mime_type")
  status      String   @default("pending") // pending, processing, ready, error
  confidence  Float?   // 0-1 IA classification confidence
  extracted   Json?    // IA extracted structured data
  notes       String?
  uploadedBy  String   @map("uploaded_by") @db.Uuid
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  versions DocumentVersion[]
  chunks   DocumentChunk[]

  @@index([companyId, clientId])
  @@index([companyId, documentType])
  @@index([companyId, status])
  @@map("documents")
}
```

### 4.2 DocumentVersion
```prisma
model DocumentVersion {
  id         String   @id @default(uuid()) @db.Uuid
  documentId String   @map("document_id") @db.Uuid
  document   Document @relation(fields: [documentId], references: [id])
  version    Int      @default(1)
  fileUrl    String   @map("file_url")
  fileSize   Int      @map("file_size")
  checksum   String?
  uploadedBy String   @map("uploaded_by") @db.Uuid
  createdAt  DateTime @default(now()) @map("created_at")

  @@unique([documentId, version])
  @@map("document_versions")
}
```

### 4.3 DocumentChunk
```prisma
model DocumentChunk {
  id         String   @id @default(uuid()) @db.Uuid
  documentId String   @map("document_id") @db.Uuid
  document   Document @relation(fields: [documentId], references: [id])
  chunkIndex Int      @map("chunk_index")
  content    String
  embedding  Unsupported("vector(1536)")?
  createdAt  DateTime @default(now()) @map("created_at")

  @@unique([documentId, chunkIndex])
  @@map("document_chunks")
}
```

---

## 5. FINANCE CONTEXT

### 5.1 FinancialStatement
```prisma
model FinancialStatement {
  id            String   @id @default(uuid()) @db.Uuid
  companyId     String   @map("company_id") @db.Uuid
  clientId      String   @map("client_id") @db.Uuid
  documentId    String?  @map("document_id") @db.Uuid
  document      Document? @relation(fields: [documentId], references: [id])
  periodStart   DateTime @map("period_start")
  periodEnd     DateTime @map("period_end")
  statementType String   @map("statement_type") // balance_sheet, income, cashflow
  currency      String   @default("USD")
  data          Json     // structured financial data
  version       Int      @default(1)
  isAudited     Boolean  @default(false) @map("is_audited")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@index([clientId, periodStart])
  @@index([clientId, statementType])
  @@map("financial_statements")
}
```

### 5.2 RatioDefinition
```prisma
model RatioDefinition {
  id          String @id @default(uuid()) @db.Uuid
  companyId   String @map("company_id") @db.Uuid
  name        String
  description String?
  category    String // liquidity, solvency, profitability, efficiency
  formula     String // "current_assets / current_liabilities"
  unit        String @default("ratio") // ratio, percentage, days, currency
  minThreshold Float? @map("min_threshold")
  maxThreshold Float? @map("max_threshold")
  isSystem    Boolean @default(false) @map("is_system")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  values RatioValue[]

  @@unique([companyId, name])
  @@map("ratio_definitions")
}
```

### 5.3 RatioValue
```prisma
model RatioValue {
  id         String   @id @default(uuid()) @db.Uuid
  ratioId    String   @map("ratio_id") @db.Uuid
  ratio      RatioDefinition @relation(fields: [ratioId], references: [id])
  clientId   String   @map("client_id") @db.Uuid
  periodStart DateTime @map("period_start")
  periodEnd   DateTime @map("period_end")
  value      Decimal  @db.Decimal(16, 4)
  createdAt  DateTime @default(now()) @map("created_at")

  @@index([clientId, ratioId, periodStart])
  @@map("ratio_values")
}
```

### 5.4 KpiDefinition
```prisma
model KpiDefinition {
  id          String   @id @default(uuid()) @db.Uuid
  companyId   String   @map("company_id") @db.Uuid
  name        String
  description String?
  category    String   // financial, commercial, operational, team
  formula     Json     // { source: "table.field", aggregation: "sum|avg|count|formula" }
  unit        String   // "currency", "percentage", "count", "days"
  target      Decimal? @db.Decimal(16, 2)
  isSystem    Boolean  @default(false) @map("is_system")
  chartType   String?  @map("chart_type") // line, bar, pie, area, number
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  values KpiValue[]

  @@unique([companyId, name])
  @@map("kpi_definitions")
}
```

### 5.5 KpiValue
```prisma
model KpiValue {
  id         String   @id @default(uuid()) @db.Uuid
  kpiId      String   @map("kpi_id") @db.Uuid
  kpi        KpiDefinition @relation(fields: [kpiId], references: [id])
  clientId   String?  @map("client_id") @db.Uuid
  periodStart DateTime @map("period_start")
  periodEnd   DateTime @map("period_end")
  value      Decimal  @db.Decimal(16, 2)
  createdAt  DateTime @default(now()) @map("created_at")

  @@index([kpiId, periodStart])
  @@map("kpi_values")
}
```

---

## 6. WORKFLOW CONTEXT

### 6.1 WorkflowDefinition
```prisma
model WorkflowDefinition {
  id          String   @id @default(uuid()) @db.Uuid
  companyId   String   @map("company_id") @db.Uuid
  name        String
  description String?
  category    String?  // financial, tax, legal, onboarding, reporting
  icon        String?
  steps       Json     @default("[]") // ordered step definitions
  isActive    Boolean  @default(true) @map("is_active")
  version     Int      @default(1)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  instances WorkflowInstance[]
  triggers  WorkflowTrigger[]

  @@unique([companyId, name])
  @@map("workflow_definitions")
}
```

### 6.2 WorkflowInstance
```prisma
model WorkflowInstance {
  id          String   @id @default(uuid()) @db.Uuid
  companyId   String   @map("company_id") @db.Uuid
  definitionId String  @map("definition_id") @db.Uuid
  definition  WorkflowDefinition @relation(fields: [definitionId], references: [id])
  clientId    String?  @map("client_id") @db.Uuid
  title       String
  status      String   @default("pending") // pending, running, paused, completed, failed, cancelled
  currentStep String?  @map("current_step")
  context     Json     @default("{}")
  assignedTo  String?  @map("assigned_to") @db.Uuid
  startedAt   DateTime? @map("started_at")
  completedAt DateTime? @map("completed_at")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  stepResults WorkflowStepResult[]

  @@index([companyId, status])
  @@index([definitionId, status])
  @@map("workflow_instances")
}
```

### 6.3 WorkflowStepResult
```prisma
model WorkflowStepResult {
  id         String   @id @default(uuid()) @db.Uuid
  instanceId String   @map("instance_id") @db.Uuid
  instance   WorkflowInstance @relation(fields: [instanceId], references: [id])
  stepKey    String   @map("step_key")
  status     String   @default("pending") // pending, in_progress, completed, skipped, failed
  result     Json?
  startedAt  DateTime? @map("started_at")
  completedAt DateTime? @map("completed_at")
  performedBy String?  @map("performed_by") @db.Uuid
  notes      String?
  createdAt  DateTime @default(now()) @map("created_at")

  @@unique([instanceId, stepKey])
  @@map("workflow_step_results")
}
```

### 6.4 WorkflowTrigger
```prisma
model WorkflowTrigger {
  id           String   @id @default(uuid()) @db.Uuid
  definitionId String   @map("definition_id") @db.Uuid
  definition   WorkflowDefinition @relation(fields: [definitionId], references: [id])
  triggerType  String   // manual, scheduled, webhook, event
  config       Json     @default("{}")
  isActive     Boolean  @default(true) @map("is_active")
  lastFiredAt  DateTime? @map("last_fired_at")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@map("workflow_triggers")
}
```

---

## 7. RULE CONTEXT

### 7.1 RuleDefinition
```prisma
model RuleDefinition {
  id          String   @id @default(uuid()) @db.Uuid
  companyId   String   @map("company_id") @db.Uuid
  name        String
  description String?
  event       String   // Event type that triggers this rule
  conditions  Json     // []condition
  logicOp     String   @default("AND") // AND / OR
  actions     Json     // []action
  priority    Int      @default(0)
  cooldown    Int      @default(0)     // seconds between fires
  isActive    Boolean  @default(true) @map("is_active")
  lastFiredAt DateTime? @map("last_fired_at")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  executions RuleExecution[]

  @@unique([companyId, name])
  @@map("rule_definitions")
}
```

### 7.2 RuleExecution
```prisma
model RuleExecution {
  id        String   @id @default(uuid()) @db.Uuid
  ruleId    String   @map("rule_id") @db.Uuid
  rule      RuleDefinition @relation(fields: [ruleId], references: [id])
  event     String
  context   Json     @default("{}") // snapshot of data that triggered
  matched   Boolean  @default(false)
  actions   Json?    // actions executed
  duration  Int?     // ms
  error     String?
  createdAt DateTime @default(now()) @map("created_at")

  @@index([ruleId, createdAt])
  @@map("rule_executions")
}
```

---

## 8. AI CONTEXT

### 8.1 AiAgent
```prisma
model AiAgent {
  id          String   @id @default(uuid()) @db.Uuid
  companyId   String   @map("company_id") @db.Uuid
  name        String
  description String?
  agentType   String   // financial, tax, risk, commercial, marketing
  model       String   @default("gpt-4")
  systemPrompt String? @map("system_prompt")
  config      Json     @default("{}") // temperature, maxTokens, etc.
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  conversations AiConversation[]

  @@unique([companyId, name])
  @@map("ai_agents")
}
```

### 8.2 AiConversation
```prisma
model AiConversation {
  id        String   @id @default(uuid()) @db.Uuid
  companyId String   @map("company_id") @db.Uuid
  clientId  String?  @map("client_id") @db.Uuid
  agentId   String   @map("agent_id") @db.Uuid
  agent     AiAgent  @relation(fields: [agentId], references: [id])
  userId    String   @map("user_id") @db.Uuid
  title     String?
  context   Json     @default("{}") // documents, project, etc.
  status    String   @default("active") // active, completed, failed
  totalTokens Int    @default(0) @map("total_tokens")
  totalCost Decimal  @default(0) @map("total_cost") @db.Decimal(12, 6)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  messages AiMessage[]
  costLogs AICostLog[]

  @@index([companyId, userId])
  @@map("ai_conversations")
}
```

### 8.3 AiMessage
```prisma
model AiMessage {
  id             String   @id @default(uuid()) @db.Uuid
  conversationId String   @map("conversation_id") @db.Uuid
  conversation   AiConversation @relation(fields: [conversationId], references: [id])
  role           String   // user, assistant, system, tool
  content        String
  metadata       Json?    // tool_calls, function_responses, etc.
  tokens         Int      @default(0)
  cost           Decimal  @default(0) @db.Decimal(12, 6)
  createdAt      DateTime @default(now()) @map("created_at")

  @@index([conversationId, createdAt])
  @@map("ai_messages")
}
```

### 8.4 AICostLog
```prisma
model AICostLog {
  id             String   @id @default(uuid()) @db.Uuid
  companyId      String   @map("company_id") @db.Uuid
  conversationId String   @map("conversation_id") @db.Uuid
  conversation   AiConversation? @relation(fields: [conversationId], references: [id])
  agentId        String   @map("agent_id") @db.Uuid
  agent          AiAgent? @relation(fields: [agentId], references: [id])
  userId         String   @map("user_id") @db.Uuid
  model          String
  inputTokens    Int      @map("input_tokens")
  outputTokens   Int      @map("output_tokens")
  totalTokens    Int      @map("total_tokens")
  cost           Decimal  @db.Decimal(12, 6)
  duration       Int      // ms
  cacheHit       Boolean  @default(false) @map("cache_hit")
  quality        Int?     // 1-5 feedback
  createdAt      DateTime @default(now()) @map("created_at")

  @@index([companyId, createdAt])
  @@index([companyId, agentId])
  @@map("ai_cost_logs")
}
```

### 8.5 PromptTemplate
```prisma
model PromptTemplate {
  id          String   @id @default(uuid()) @db.Uuid
  companyId   String   @map("company_id") @db.Uuid
  name        String
  description String?
  category    String   // analysis, report, classification, extraction
  content     String   // template with {{variables}}
  variables   Json     @default("[]")
  model       String   @default("gpt-4")
  isSystem    Boolean  @default(false) @map("is_system")
  version     Int      @default(1)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  versions PromptVersion[]

  @@unique([companyId, name])
  @@map("prompt_templates")
}
```

### 8.6 PromptVersion
```prisma
model PromptVersion {
  id        String   @id @default(uuid()) @db.Uuid
  promptId  String   @map("prompt_id") @db.Uuid
  prompt    PromptTemplate @relation(fields: [promptId], references: [id])
  version   Int      @default(1)
  content   String
  changeLog String?  @map("change_log")
  createdBy String   @map("created_by") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at")

  @@unique([promptId, version])
  @@map("prompt_versions")
}
```

---

## 9. KNOWLEDGE CONTEXT

### 9.1 KnowledgeNode
```prisma
model KnowledgeNode {
  id          String   @id @default(uuid()) @db.Uuid
  companyId   String   @map("company_id") @db.Uuid
  type        String   // client, problem, norm, strategy, result, recommendation, document
  title       String
  description String?
  properties  Json     @default("{}")
  embedding   Unsupported("vector(1536)")?
  metadata    Json     @default("{}")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  relationsFrom KnowledgeRelation[] @relation("FromNode")
  relationsTo   KnowledgeRelation[] @relation("ToNode")

  @@index([companyId, type])
  @@index([companyId, type, title])
  @@map("knowledge_nodes")
}
```

### 9.2 KnowledgeRelation
```prisma
model KnowledgeRelation {
  id        String   @id @default(uuid()) @db.Uuid
  fromId    String   @map("from_id") @db.Uuid
  from      KnowledgeNode @relation("FromNode", fields: [fromId], references: [id])
  toId      String   @map("to_id") @db.Uuid
  to        KnowledgeNode @relation("ToNode", fields: [toId], references: [id])
  type      String   // has, applies, produced, generated, similar_to, references, etc.
  weight    Float    @default(1.0)
  metadata  Json     @default("{}")
  createdAt DateTime @default(now()) @map("created_at")

  @@index([fromId, type])
  @@index([toId, type])
  @@map("knowledge_relations")
}
```

---

## 10. DECISION CONTEXT

### 10.1 Decision
```prisma
model Decision {
  id          String   @id @default(uuid()) @db.Uuid
  companyId   String   @map("company_id") @db.Uuid
  clientId    String   @map("client_id") @db.Uuid
  client      Client   @relation(fields: [clientId], references: [id])
  score       Int      // 0-100
  status      String   // critical, alert, healthy, optimal
  factors     Json     // []FactorScore
  plans       Json     // []GeneratedPlan
  selectedPlan Int?    @map("selected_plan") // index of selected plan
  humanNotes  String?  @map("human_notes")
  createdAt   DateTime @default(now()) @map("created_at")

  recommendations Recommendation[]

  @@index([companyId, clientId])
  @@index([companyId, status])
  @@map("decisions")
}
```

### 10.2 Recommendation
```prisma
model Recommendation {
  id          String   @id @default(uuid()) @db.Uuid
  decisionId  String   @map("decision_id") @db.Uuid
  decision    Decision @relation(fields: [decisionId], references: [id])
  title       String
  description String?
  priority    Int      @default(0) // 1-5
  category    String?  // financial, tax, operational, strategic
  source      String   @default("ai") // ai, human, system
  status      String   @default("pending") // pending, approved, rejected, implemented
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@index([decisionId, status])
  @@map("recommendations")
}
```

---

## 11. BILLING CONTEXT

### 11.1 BillingPlan
```prisma
model BillingPlan {
  id          String   @id @default(uuid()) @db.Uuid
  name        String   @unique
  slug        String   @unique
  description String?
  priceMonthly Decimal @map("price_monthly") @db.Decimal(10, 2)
  priceYearly  Decimal @map("price_yearly") @db.Decimal(10, 2) @default(0)
  currency    String   @default("USD")
  features    Json     @default("[]") // []string
  limits      Json     @default("{}") // { maxUsers, maxClients, maxStorage, etc. }
  isActive    Boolean  @default(true) @map("is_active")
  sortOrder   Int      @default(0) @map("sort_order")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  subscriptions BillingSubscription[]

  @@map("billing_plans")
}
```

### 11.2 BillingSubscription
```prisma
model BillingSubscription {
  id              String   @id @default(uuid()) @db.Uuid
  companyId       String   @unique @map("company_id") @db.Uuid
  company         Company  @relation(fields: [companyId], references: [id])
  planId          String   @map("plan_id") @db.Uuid
  plan            BillingPlan @relation(fields: [planId], references: [id])
  stripeId        String?  @unique @map("stripe_id")
  status          String   @default("active") // active, past_due, canceled, trialing
  currentPeriodStart DateTime? @map("current_period_start")
  currentPeriodEnd   DateTime? @map("current_period_end")
  trialEndsAt     DateTime? @map("trial_ends_at")
  canceledAt      DateTime? @map("canceled_at")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  invoices BillingInvoice[]

  @@map("billing_subscriptions")
}
```

### 11.3 BillingInvoice
```prisma
model BillingInvoice {
  id             String   @id @default(uuid()) @db.Uuid
  companyId      String   @map("company_id") @db.Uuid
  subscriptionId String?  @map("subscription_id") @db.Uuid
  subscription   BillingSubscription? @relation(fields: [subscriptionId], references: [id])
  stripeId       String?  @unique @map("stripe_id")
  invoiceNumber  String   @map("invoice_number")
  amount         Decimal  @db.Decimal(16, 2)
  currency       String   @default("USD")
  status         String   @default("pending") // pending, paid, overdue, cancelled
  dueDate        DateTime @map("due_date")
  paidAt         DateTime? @map("paid_at")
  pdfUrl         String?  @map("pdf_url")
  createdAt      DateTime @default(now()) @map("created_at")

  @@index([companyId, status])
  @@map("billing_invoices")
}
```

---

## 12. TICKET CONTEXT

### 12.1 Ticket
```prisma
model Ticket {
  id        String   @id @default(uuid()) @db.Uuid
  companyId String   @map("company_id") @db.Uuid
  clientId  String   @map("client_id") @db.Uuid
  client    Client   @relation(fields: [clientId], references: [id])
  title     String
  description String?
  category  String?  // financial, tax, legal, administrative, technical
  priority  String   @default("medium") // low, medium, high, urgent
  status    String   @default("open") // open, in_progress, resolved, closed
  source    String   @default("portal") // portal, email, phone, system
  assignedTo String? @map("assigned_to") @db.Uuid
  assignee  User?    @relation("TicketAssignee", fields: [assignedTo], references: [id])
  resolvedAt DateTime? @map("resolved_at")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  comments TicketComment[]

  @@index([companyId, status])
  @@index([clientId, status])
  @@index([assignedTo, status])
  @@map("tickets")
}
```

### 12.2 TicketComment
```prisma
model TicketComment {
  id         String   @id @default(uuid()) @db.Uuid
  ticketId   String   @map("ticket_id") @db.Uuid
  ticket     Ticket   @relation(fields: [ticketId], references: [id])
  content    String
  authorId   String   @map("author_id") @db.Uuid
  isInternal Boolean  @default(false) @map("is_internal")
  createdAt  DateTime @default(now()) @map("created_at")

  @@index([ticketId, createdAt])
  @@map("ticket_comments")
}
```

---

## 13. NOTIFICATION & EVENT CONTEXT

### 13.1 Notification
```prisma
model Notification {
  id            String   @id @default(uuid()) @db.Uuid
  companyId     String   @map("company_id") @db.Uuid
  userId        String   @map("user_id") @db.Uuid
  title         String
  body          String?
  channel       String   @default("in_app") // in_app, email, sms, push
  type          String   // alert, info, action_required, system
  referenceType String?  @map("reference_type")
  referenceId   String?  @map("reference_id")
  isRead        Boolean  @default(false) @map("is_read")
  readAt        DateTime? @map("read_at")
  createdAt     DateTime @default(now()) @map("created_at")

  @@index([userId, isRead, createdAt])
  @@index([companyId, createdAt])
  @@map("notifications")
}
```

### 13.2 Event
```prisma
model Event {
  id            String   @id @default(uuid()) @db.Uuid
  companyId     String   @map("company_id") @db.Uuid
  userId        String?  @map("user_id") @db.Uuid
  type          String   // document.uploaded, client.created, etc.
  source        String   // web-app, api, system, worker
  data          Json     @default("{}")
  correlationId String?  @map("correlation_id")
  causationId   String?  @map("causation_id")
  createdAt     DateTime @default(now()) @map("created_at")

  @@index([companyId, type, createdAt])
  @@index([companyId, createdAt])
  @@map("events")
}
```

### 13.3 AuditLog
```prisma
model AuditLog {
  id              String   @id @default(uuid()) @db.Uuid
  companyId       String   @map("company_id") @db.Uuid
  userId          String?  @map("user_id") @db.Uuid
  action          String   // create, update, delete, view, export, login
  entity          String   // Model name
  entityId        String?  @map("entity_id")
  oldValues       Json?
  newValues       Json?
  ipAddress       String?  @map("ip_address")
  userAgent       String?  @map("user_agent")
  source          String?  // UI, API, WORKFLOW, IA, SYSTEM
  correlationId   String?  @map("correlation_id")
  sessionId       String?  @map("session_id")
  duration        Int?     // ms (for performance tracking)
  createdAt       DateTime @default(now()) @map("created_at")

  @@index([companyId, entity, entityId])
  @@index([companyId, action, createdAt])
  @@index([companyId, createdAt])
  @@index([companyId, userId, createdAt])
  @@map("audit_logs")
}
```

---

## 14. PLUGIN & ECOSYSTEM CONTEXT

### 14.1 Plugin
```prisma
model Plugin {
  id          String   @id @default(uuid()) @db.Uuid
  name        String   @unique
  slug        String   @unique
  description String?
  version     String   @default("1.0.0")
  author      String?
  icon        String?
  type        String   // agent, workflow, dashboard, integration, api
  config      Json     @default("{}") // extension points, hooks
  isPublic    Boolean  @default(false) @map("is_public")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  installations PluginInstallation[]
  @@map("plugins")
}
```

### 14.2 PluginInstallation
```prisma
model PluginInstallation {
  id         String   @id @default(uuid()) @db.Uuid
  companyId  String   @map("company_id") @db.Uuid
  company    Company  @relation(fields: [companyId], references: [id])
  pluginId   String   @map("plugin_id") @db.Uuid
  plugin     Plugin   @relation(fields: [pluginId], references: [id])
  config     Json     @default("{}")
  isActive   Boolean  @default(true) @map("is_active")
  installedBy String  @map("installed_by") @db.Uuid
  installedAt DateTime @default(now()) @map("installed_at")

  @@unique([companyId, pluginId])
  @@map("plugin_installations")
}
```

---

## 15. INTEGRATIONS CONTEXT

### 15.1 IntegrationConnection
```prisma
model IntegrationConnection {
  id          String   @id @default(uuid()) @db.Uuid
  companyId   String   @map("company_id") @db.Uuid
  name        String
  provider    String   // stripe, gmail, outlook, whatsapp, zoom, quickbooks, etc.
  type        String   // oauth, api_key, webhook
  status      String   @default("active") // active, expired, error, revoked
  config      Json     @default("{}")     // Encrypted credentials reference
  lastUsedAt  DateTime? @map("last_used_at")
  expiresAt   DateTime? @map("expires_at")
  createdBy   String?  @map("created_by") @db.Uuid
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  webhooks    IntegrationWebhook[]
  syncJobs    IntegrationSyncJob[]

  @@unique([companyId, name])
  @@index([companyId, provider])
  @@map("integration_connections")
}
```

### 15.2 IntegrationWebhook
```prisma
model IntegrationWebhook {
  id           String   @id @default(uuid()) @db.Uuid
  companyId    String   @map("company_id") @db.Uuid
  connectionId String?  @map("connection_id") @db.Uuid
  connection   IntegrationConnection? @relation(fields: [connectionId], references: [id])
  url          String
  events       Json     @default("[]")  // events to subscribe
  secret       String?                  // HMAC secret
  status       String   @default("active") // active, paused, failed
  lastTriggeredAt DateTime? @map("last_triggered_at")
  lastError    String?  @map("last_error")
  retryCount   Int      @default(0) @map("retry_count")
  createdBy    String?  @map("created_by") @db.Uuid
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@index([companyId, status])
  @@map("integration_webhooks")
}
```

### 15.3 IntegrationSyncJob
```prisma
model IntegrationSyncJob {
  id           String   @id @default(uuid()) @db.Uuid
  companyId    String   @map("company_id") @db.Uuid
  connectionId String   @map("connection_id") @db.Uuid
  connection   IntegrationConnection @relation(fields: [connectionId], references: [id])
  entity       String   // clients, documents, invoices, contacts
  direction    String   @default("import") // import, export, bidirectional
  status       String   @default("pending") // pending, running, completed, failed
  config       Json     @default("{}")
  lastRunAt    DateTime? @map("last_run_at")
  lastError    String?  @map("last_error")
  schedule     String?  // cron expression for recurring sync
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@index([companyId, status])
  @@map("integration_sync_jobs")
}
```

---

## 16. EVENT STORE CONTEXT

### 16.1 DomainEvent
```prisma
model DomainEvent {
  id            String   @id @default(uuid()) @db.Uuid
  companyId     String?  @map("company_id") @db.Uuid
  aggregateId   String   @map("aggregate_id")
  aggregateType String   @map("aggregate_type") // client, project, document, etc.
  eventType     String   @map("event_type")     // client.created, document.uploaded
  version       Int      @default(1)
  data          Json     @default("{}")         // event payload
  metadata      Json     @default("{}")         // userId, source, correlationId, causationId
  status        String   @default("published")  // published, processed, failed, dead
  publishedAt   DateTime @default(now()) @map("published_at")
  processedAt   DateTime? @map("processed_at")
  createdAt     DateTime @default(now()) @map("created_at")

  @@index([aggregateType, aggregateId])
  @@index([eventType, status])
  @@index([companyId, eventType, createdAt])
  @@index([status, createdAt])
  @@map("domain_events")
}
```

---

## 17. JOBS CONTEXT

### 17.1 Job
```prisma
model Job {
  id          String   @id @default(uuid()) @db.Uuid
  companyId   String?  @map("company_id") @db.Uuid
  type        String   // document.processing, ai.analysis, report.generation, email.send, sync.run
  status      String   @default("pending") // pending, queued, running, completed, failed, cancelled
  priority    Int      @default(0)         // 0=low, 5=medium, 10=high
  payload     Json     @default("{}")      // input data
  result      Json?                        // output data
  progress    Int      @default(0)         // 0-100
  attempts    Int      @default(0)
  maxAttempts Int      @default(3) @map("max_attempts")
  lastError   String?  @map("last_error")
  workerId    String?  @map("worker_id")
  queuedAt    DateTime? @map("queued_at")
  startedAt   DateTime? @map("started_at")
  completedAt DateTime? @map("completed_at")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@index([type, status])
  @@index([status, priority, createdAt])
  @@index([companyId, type, status])
  @@map("jobs")
}
```

---

## 18. CONFIG CATALOG CONTEXT

### 18.1 ConfigEntry
```prisma
model ConfigEntry {
  id          String   @id @default(uuid()) @db.Uuid
  companyId   String   @map("company_id") @db.Uuid
  scope       String   // company, billing, ai, workflow, security, branding, notifications, integrations
  key         String   // "ai.default_model", "billing.currency", "notifications.email_from"
  value       Json     // Any JSON value
  description String?
  isEncrypted Boolean  @default(false) @map("is_encrypted")
  isSystem    Boolean  @default(false) @map("is_system") // readonly by user
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@unique([companyId, scope, key])
  @@index([companyId, scope])
  @@map("config_entries")
}
```

---

## 19. AI TRACEABILITY CONTEXT

### 19.1 AiTrace
```prisma
model AiTrace {
  id             String   @id @default(uuid()) @db.Uuid
  companyId      String   @map("company_id") @db.Uuid
  taskId         String?  @map("task_id")     // External ID: job, conversation, etc.
  taskType       String   // analysis, extraction, classification, chat, recommendation
  agentId        String?  @map("agent_id")
  agentName      String?  @map("agent_name")
  model          String   // gpt-4, claude-opus, gpt-3.5-turbo
  promptTemplate  String? @map("prompt_template")
  promptVersion  Int?     @map("prompt_version")
  systemPrompt   String?  @map("system_prompt")
  userMessage    String?  @map("user_message")
  contextData    Json?    @map("context_data")  // documents, client data used
  response       String?                        // Full AI response
  inputTokens    Int      @default(0) @map("input_tokens")
  outputTokens   Int      @default(0) @map("output_tokens")
  totalTokens    Int      @default(0) @map("total_tokens")
  cost           Decimal  @default(0) @db.Decimal(12, 6)
  duration       Int      @default(0)     // ms
  latency        Int?                      // time to first token (ms)
  cacheHit       Boolean  @default(false) @map("cache_hit")
  status         String   @default("success") // success, error, partial
  error          String?
  feedbackScore  Int?     @map("feedback_score") // 1-5
  feedbackText   String?  @map("feedback_text")
  reused         Boolean  @default(false)  // reused from Knowledge Graph?
  reuseSource    String?  @map("reuse_source") // knowledge node ID
  userId         String?  @map("user_id") @db.Uuid
  createdAt      DateTime @default(now()) @map("created_at")

  @@index([companyId, createdAt])
  @@index([companyId, agentId])
  @@index([companyId, taskType])
  @@index([companyId, model, createdAt])
  @@map("ai_traces")
}
```

---

## 20. FEATURE FLAGS

### 15.1 FeatureFlag
```prisma
model FeatureFlag {
  id          String   @id @default(uuid()) @db.Uuid
  companyId   String   @map("company_id") @db.Uuid
  company     Company  @relation(fields: [companyId], references: [id])
  flag        String   // crm.enabled, ai.orchestrator.v2, marketplace.enabled
  isEnabled   Boolean  @default(false) @map("is_enabled")
  config      Json?    // Optional per-flag config
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@unique([companyId, flag])
  @@map("feature_flags")
}
```

---

## Versioning Strategy

Las siguientes entidades mantienen **historial de versiones** completo para permitir rollback y auditoría:

```
Entidad            │ Modelo de versión          │ Implementado
───────────────────┼────────────────────────────┼─────────────
WorkflowDefinition │ WorkflowDefinition (steps) │ steps en JSON, version col
RuleDefinition     │ RuleDefinition (conditions)│ conditions en JSON, version col
PromptTemplate     │ PromptVersion              │ Modelo independiente ✅
Document           │ DocumentVersion            │ Modelo independiente ✅
ClientContract     │ ClientContractVersion      │ Modelo independiente ✅
KpiDefinition      │ (version col)              │ version column (futuro)
ReportTemplate     │ (version col)              │ version column (futuro)
Dashboard          │ (version col)              │ version column (futuro)
```

**Política de versionado:**
- Cada cambio en contenido → incrementa `version`
- Se preserva la versión anterior (nunca UPDATE destructivo)
- Máximo 10 versiones por entidad (archive automático)
- Rollback: restaurar versión anterior como active

---

## Model Relationship Map

```
Company 1──N Branch
Company 1──N Department
Company 1──N User
Company 1──N Role
Company 1──N Lead
Company 1──N Client
Company 1──N Project
Company 1──N Document
Company 1──N WorkflowDefinition
Company 1──N RuleDefinition
Company 1──N AiAgent
Company 1──N AiConversation
Company 1──N KnowledgeNode
Company 1──N Decision
Company 1──N Ticket
Company 1──N Notification
Company 1──N Event
Company 1──N AuditLog
Company 1──N FeatureFlag
Company 1──N PluginInstallation
Company 1──1 CompanySettings
Company 1──1 BillingSubscription

User N──N Role (via UserRole)
User 1──N Task
User 1──N Ticket (as assignee)

Lead 1──0..1 Client
Lead 1──N LeadActivity

Client 1──N ClientContact
Client 1──N ClientLegalRep
Client 1──N ClientShareholder
Client 1──N ClientContract
Client 1──N Project
Client 1──N Document
Client 1──N Ticket
Client 1──N Decision
Client 1──N Opportunity

Project 1──N Task
Project 1──N ProjectMilestone
Project 1──N ProjectRisk
Project 1──N Document

Task N──N (via TaskDependency)

Document 1──N DocumentVersion
Document 1──N DocumentChunk

AiAgent 1──N AiConversation
AiConversation 1──N AiMessage
AiConversation 1──N AICostLog

WorkflowDefinition 1──N WorkflowInstance
WorkflowDefinition 1──N WorkflowTrigger
WorkflowInstance 1──N WorkflowStepResult

RuleDefinition 1──N RuleExecution

KnowledgeNode N──N KnowledgeRelation (from/to)

Decision 1──N Recommendation

IntegrationConnection 1──N IntegrationWebhook
IntegrationConnection 1──N IntegrationSyncJob
```

---

## Index Strategy Summary

```
Obligatorios (toda tabla tenant-scoped):
  (companyId) — filtro base de multi-tenancy

Por contexto:
  CRM:     (companyId, status), (clientId, status), (leadId, performedAt)
  Projects: (companyId, status), (projectId, status), (assignedTo, status)
  Tasks:   (projectId, status), (assignedTo, status)
  Docs:    (companyId, clientId), (companyId, documentType)
  Finance: (clientId, periodStart), (clientId, statementType)
  AI:      (companyId, createdAt), (conversationId, createdAt)
  Notif:   (userId, isRead, createdAt)
  Audit:   (companyId, entity, createdAt), (companyId, action, createdAt)
  Events:  (companyId, type, createdAt), (aggregateType, aggregateId), (status, createdAt)
  Jobs:    (type, status), (status, priority, createdAt)
  KG:      (companyId, type), (fromId, type), (toId, type)
  AI:      (companyId, taskType), (companyId, model, createdAt)
  Audit:   (companyId, entity, entityId), (companyId, userId, createdAt)
  Config:  (companyId, scope)
  Integration: (companyId, provider), (companyId, status)
```

---

## Migration Strategy

```
Fase 1 (Ahora — MVP):
  1. Reemplazar schema actual con este diseño
  2. Prisma migrate dev --name "v2_domain_model"
  3. Seed realista: 3 empresas, 10 usuarios, 20 clientes, 50 documentos, 5 workflows, 10 reglas
  4. Data migration: renombrar modelos existentes (ClientCompany → Client)
  5. Verificar: aislamiento multi-tenant, integridad referencial, índices
  6. Crear índices compuestos para consultas frecuentes

Fase 2 (Growth):
  1. pgvector extension para embeddings (KnowledgeGraph + AI Memory)
  2. Domain Events → Event Bus (RabbitMQ)
  3. Jobs worker (Bull queue) para IA, notificaciones, reportes
  4. Particionar domain_events y audit_logs por mes
  5. Agregar índices basados en patrones de query reales

Fase 3 (Scale):
  1. Sharding por tenant_id (manual o por extensión PostgreSQL)
  2. Read replicas para reporting y consultas pesadas
  3. Archivo automático de datos históricos a Data Lake
  4. Cache写-through para tenant settings y config
```
