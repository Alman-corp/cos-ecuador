warn The configuration property `package.json#prisma` is deprecated and will be removed in Prisma 7. Please migrate to a Prisma config file (e.g., `prisma.config.ts`).
For more information, see: https://pris.ly/prisma-config


[+] Added Schemas
  - public

[+] Added tables
  - companies
  - company_settings
  - branches
  - departments
  - users
  - roles
  - user_roles
  - leads
  - lead_activities
  - clients
  - client_contacts
  - client_legal_reps
  - client_shareholders
  - opportunities
  - client_contracts
  - client_contract_versions
  - projects
  - project_milestones
  - tasks
  - task_dependencies
  - project_risks
  - documents
  - document_versions
  - document_chunks
  - financial_statements
  - ratio_definitions
  - ratio_values
  - kpi_definitions
  - kpi_values
  - tickets
  - ticket_comments
  - client_interactions
  - client_meetings
  - client_meeting_attendees
  - meeting_agreements
  - client_issues
  - client_objectives
  - key_results
  - timeline_events
  - workflow_definitions
  - workflow_instances
  - workflow_step_results
  - workflow_triggers
  - rule_definitions
  - rule_executions
  - ai_agents
  - ai_conversations
  - ai_messages
  - ai_traces
  - ai_cost_logs
  - prompt_templates
  - prompt_versions
  - knowledge_nodes
  - knowledge_relations
  - decisions
  - recommendations
  - notifications
  - domain_events
  - audit_logs
  - jobs
  - integration_connections
  - integration_webhooks
  - integration_sync_jobs
  - config_entries
  - feature_flags
  - plugins
  - plugin_installations
  - billing_plans
  - billing_subscriptions
  - billing_invoices
  - consulting_rules
  - consulting_rule_versions
  - consulting_rule_executions
  - rule_dependencies
  - due_diligence_jobs
  - portal_access
  - due_diligence_credits
  - tax_declarations
  - tax_withholdings
  - sri_retentions
  - fiscal_obligations
  - tax_annexes
  - tax_payments
  - legal_contracts
  - contract_clauses
  - legal_obligations
  - legal_proceedings
  - legal_documents
  - contract_signatures
  - contract_amendments
  - competitors
  - market_signals
  - competitor_prices
  - market_trends
  - industry_reports
  - deliverable_templates
  - deliverables
  - deliverable_sections
  - deliverable_versions
  - notification_channels
  - notification_preferences
  - notification_templates
  - notification_deliveries
  - credit_consumptions
  - credit_packages
  - usage_records

[*] Changed the `ai_agents` table
  [+] Added unique index on columns (company_id, name)
  [+] Added foreign key on columns (company_id)

[*] Changed the `ai_conversations` table
  [+] Added index on columns (company_id, user_id)
  [+] Added foreign key on columns (company_id)
  [+] Added foreign key on columns (agent_id)

[*] Changed the `ai_cost_logs` table
  [+] Added index on columns (company_id, created_at)

[*] Changed the `ai_messages` table
  [+] Added index on columns (conversation_id, created_at)
  [+] Added foreign key on columns (conversation_id)

[*] Changed the `ai_traces` table
  [+] Added index on columns (company_id, created_at)
  [+] Added index on columns (company_id, agent_id)
  [+] Added index on columns (company_id, taskType)
  [+] Added index on columns (company_id, model, created_at)
  [+] Added foreign key on columns (company_id)
  [+] Added foreign key on columns (conversation_id)

[*] Changed the `audit_logs` table
  [+] Added index on columns (company_id, entity, entity_id)
  [+] Added index on columns (company_id, action, created_at)
  [+] Added index on columns (company_id, created_at)
  [+] Added index on columns (company_id, user_id, created_at)
  [+] Added foreign key on columns (company_id)

[*] Changed the `billing_invoices` table
  [+] Added unique index on columns (stripe_id)
  [+] Added index on columns (company_id, status)
  [+] Added foreign key on columns (company_id)
  [+] Added foreign key on columns (subscription_id)

[*] Changed the `billing_plans` table
  [+] Added unique index on columns (name)
  [+] Added unique index on columns (slug)

[*] Changed the `billing_subscriptions` table
  [+] Added unique index on columns (company_id)
  [+] Added unique index on columns (stripe_id)
  [+] Added foreign key on columns (company_id)
  [+] Added foreign key on columns (plan_id)

[*] Changed the `branches` table
  [+] Added unique index on columns (company_id, name)
  [+] Added foreign key on columns (company_id)

[*] Changed the `client_contacts` table
  [+] Added index on columns (client_id, is_primary)
  [+] Added foreign key on columns (client_id)

[*] Changed the `client_contract_versions` table
  [+] Added unique index on columns (contract_id, version)
  [+] Added foreign key on columns (contract_id)

[*] Changed the `client_contracts` table
  [+] Added index on columns (client_id, status)
  [+] Added index on columns (client_id, end_date)
  [+] Added foreign key on columns (client_id)

[*] Changed the `client_interactions` table
  [+] Added foreign key on columns (client_id)

[*] Changed the `client_issues` table
  [+] Added foreign key on columns (client_id)

[*] Changed the `client_legal_reps` table
  [+] Added foreign key on columns (client_id)

[*] Changed the `client_meeting_attendees` table
  [+] Added foreign key on columns (meeting_id)

[*] Changed the `client_meetings` table
  [+] Added foreign key on columns (client_id)

[*] Changed the `client_objectives` table
  [+] Added foreign key on columns (client_id)

[*] Changed the `client_shareholders` table
  [+] Added foreign key on columns (client_id)

[*] Changed the `clients` table
  [+] Added index on columns (company_id, status)
  [+] Added index on columns (company_id, assigned_to)
  [+] Added foreign key on columns (company_id)

[*] Changed the `companies` table
  [+] Added unique index on columns (slug)

[*] Changed the `company_settings` table
  [+] Added unique index on columns (company_id)
  [+] Added foreign key on columns (company_id)

[*] Changed the `competitor_prices` table
  [+] Added index on columns (competitor_id, product)
  [+] Added index on columns (competitor_id, effective_date)
  [+] Added foreign key on columns (competitor_id)

[*] Changed the `competitors` table
  [+] Added index on columns (company_id, industry)
  [+] Added unique index on columns (company_id, name)
  [+] Added foreign key on columns (company_id)

[*] Changed the `config_entries` table
  [+] Added index on columns (company_id, scope)
  [+] Added unique index on columns (company_id, scope, key)
  [+] Added foreign key on columns (company_id)

[*] Changed the `consulting_rule_executions` table
  [+] Added index on columns (rule_id, evaluated_at)
  [+] Added index on columns (client_id)
  [+] Added index on columns (triggered)
  [+] Added foreign key on columns (rule_id)

[*] Changed the `consulting_rule_versions` table
  [+] Added index on columns (rule_id, version)
  [+] Added unique index on columns (rule_id, version)
  [+] Added foreign key on columns (rule_id)

[*] Changed the `consulting_rules` table
  [+] Added index on columns (category, enabled)
  [+] Added index on columns (created_at)

[*] Changed the `contract_amendments` table
  [+] Added index on columns (contract_id, effective_date)
  [+] Added unique index on columns (contract_id, amendment_number)
  [+] Added foreign key on columns (contract_id)

[*] Changed the `contract_clauses` table
  [+] Added index on columns (contract_id, category)
  [+] Added unique index on columns (contract_id, clause_number)
  [+] Added foreign key on columns (contract_id)

[*] Changed the `contract_signatures` table
  [+] Added index on columns (contract_id, signer_role)
  [+] Added foreign key on columns (contract_id)

[*] Changed the `credit_consumptions` table
  [+] Added index on columns (company_id, created_at)
  [+] Added index on columns (company_id, credit_type)
  [+] Added index on columns (company_id, reference_type, reference_id)
  [+] Added foreign key on columns (company_id)
  [+] Added foreign key on columns (subscription_id)

[*] Changed the `credit_packages` table
  [+] Added index on columns (company_id, credit_type)
  [+] Added unique index on columns (company_id, name)
  [+] Added foreign key on columns (company_id)

[*] Changed the `decisions` table
  [+] Added index on columns (company_id, client_id)
  [+] Added index on columns (company_id, status)
  [+] Added foreign key on columns (company_id)
  [+] Added foreign key on columns (client_id)

[*] Changed the `deliverable_sections` table
  [+] Added unique index on columns (deliverable_id, section_number)
  [+] Added foreign key on columns (deliverable_id)

[*] Changed the `deliverable_templates` table
  [+] Added index on columns (company_id, deliverable_type)
  [+] Added unique index on columns (company_id, name)
  [+] Added foreign key on columns (company_id)

[*] Changed the `deliverable_versions` table
  [+] Added unique index on columns (deliverable_id, version)
  [+] Added foreign key on columns (deliverable_id)

[*] Changed the `deliverables` table
  [+] Added index on columns (company_id, status)
  [+] Added index on columns (company_id, client_id, deliverable_type)
  [+] Added index on columns (company_id, template_id)
  [+] Added foreign key on columns (company_id)
  [+] Added foreign key on columns (template_id)

[*] Changed the `departments` table
  [+] Added unique index on columns (company_id, name)
  [+] Added foreign key on columns (company_id)
  [+] Added foreign key on columns (branch_id)
  [+] Added foreign key on columns (parent_id)

[*] Changed the `document_chunks` table
  [+] Added unique index on columns (document_id, chunk_index)
  [+] Added foreign key on columns (document_id)

[*] Changed the `document_versions` table
  [+] Added unique index on columns (document_id, version)
  [+] Added foreign key on columns (document_id)

[*] Changed the `documents` table
  [+] Added index on columns (company_id, client_id)
  [+] Added index on columns (company_id, document_type)
  [+] Added index on columns (company_id, status)
  [+] Added foreign key on columns (company_id)
  [+] Added foreign key on columns (client_id)
  [+] Added foreign key on columns (project_id)

[*] Changed the `domain_events` table
  [+] Added index on columns (aggregate_type, aggregate_id)
  [+] Added index on columns (event_type, status)
  [+] Added index on columns (company_id, event_type, created_at)
  [+] Added index on columns (status, created_at)
  [+] Added foreign key on columns (company_id)

[*] Changed the `due_diligence_credits` table
  [+] Added unique index on columns (company_id)
  [+] Added foreign key on columns (company_id)
  [+] Added foreign key on columns (subscription_id)

[*] Changed the `due_diligence_jobs` table
  [+] Added index on columns (company_id, status)
  [+] Added index on columns (status)
  [+] Added foreign key on columns (company_id)

[*] Changed the `feature_flags` table
  [+] Added unique index on columns (company_id, flag)
  [+] Added foreign key on columns (company_id)

[*] Changed the `financial_statements` table
  [+] Added index on columns (client_id, period_start)
  [+] Added index on columns (client_id, statement_type)
  [+] Added foreign key on columns (company_id)
  [+] Added foreign key on columns (document_id)

[*] Changed the `fiscal_obligations` table
  [+] Added index on columns (company_id, period_year, period_month)
  [+] Added index on columns (company_id, status, due_date)
  [+] Added index on columns (client_id, obligation_code)
  [+] Added foreign key on columns (company_id)

[*] Changed the `industry_reports` table
  [+] Added index on columns (company_id, industry, published_at)
  [+] Added index on columns (company_id, report_type)
  [+] Added foreign key on columns (company_id)

[*] Changed the `integration_connections` table
  [+] Added index on columns (company_id, provider)
  [+] Added unique index on columns (company_id, name)
  [+] Added foreign key on columns (company_id)

[*] Changed the `integration_sync_jobs` table
  [+] Added index on columns (company_id, status)
  [+] Added foreign key on columns (company_id)
  [+] Added foreign key on columns (connection_id)

[*] Changed the `integration_webhooks` table
  [+] Added index on columns (company_id, status)
  [+] Added foreign key on columns (company_id)
  [+] Added foreign key on columns (connection_id)

[*] Changed the `jobs` table
  [+] Added index on columns (type, status)
  [+] Added index on columns (status, priority, created_at)
  [+] Added index on columns (company_id, type, status)
  [+] Added foreign key on columns (company_id)

[*] Changed the `key_results` table
  [+] Added foreign key on columns (objective_id)

[*] Changed the `knowledge_nodes` table
  [+] Added index on columns (company_id, type)
  [+] Added foreign key on columns (company_id)

[*] Changed the `knowledge_relations` table
  [+] Added index on columns (from_id, type)
  [+] Added index on columns (to_id, type)
  [+] Added foreign key on columns (from_id)
  [+] Added foreign key on columns (to_id)

[*] Changed the `kpi_definitions` table
  [+] Added unique index on columns (company_id, name)
  [+] Added foreign key on columns (company_id)

[*] Changed the `kpi_values` table
  [+] Added index on columns (kpi_id, period_start)
  [+] Added foreign key on columns (kpi_id)

[*] Changed the `lead_activities` table
  [+] Added index on columns (lead_id, performed_at)
  [+] Added foreign key on columns (lead_id)

[*] Changed the `leads` table
  [+] Added unique index on columns (converted_to_client_id)
  [+] Added index on columns (company_id, status)
  [+] Added index on columns (company_id, score)
  [+] Added foreign key on columns (company_id)
  [+] Added foreign key on columns (converted_to_client_id)

[*] Changed the `legal_contracts` table
  [+] Added index on columns (company_id, status)
  [+] Added index on columns (company_id, client_id)
  [+] Added index on columns (company_id, expiration_date)
  [+] Added foreign key on columns (company_id)

[*] Changed the `legal_documents` table
  [+] Added index on columns (company_id, contract_id)
  [+] Added index on columns (company_id, proceeding_id)
  [+] Added index on columns (company_id, document_type)
  [+] Added foreign key on columns (company_id)
  [+] Added foreign key on columns (contract_id)
  [+] Added foreign key on columns (proceeding_id)

[*] Changed the `legal_obligations` table
  [+] Added index on columns (company_id, status, due_date)
  [+] Added index on columns (contract_id, status)
  [+] Added index on columns (company_id, obligation_type)
  [+] Added foreign key on columns (company_id)
  [+] Added foreign key on columns (contract_id)

[*] Changed the `legal_proceedings` table
  [+] Added index on columns (company_id, status)
  [+] Added index on columns (company_id, client_id)
  [+] Added foreign key on columns (company_id)

[*] Changed the `market_signals` table
  [+] Added index on columns (company_id, signal_type, detected_at)
  [+] Added index on columns (company_id, competitor_id)
  [+] Added index on columns (company_id, relevance)
  [+] Added foreign key on columns (company_id)
  [+] Added foreign key on columns (competitor_id)

[*] Changed the `market_trends` table
  [+] Added index on columns (company_id, trend_type, detected_at)
  [+] Added index on columns (company_id, industry)
  [+] Added foreign key on columns (company_id)

[*] Changed the `meeting_agreements` table
  [+] Added foreign key on columns (meeting_id)

[*] Changed the `notification_channels` table
  [+] Added unique index on columns (company_id, channel_type)
  [+] Added foreign key on columns (company_id)

[*] Changed the `notification_deliveries` table
  [+] Added index on columns (company_id, user_id, channel, created_at)
  [+] Added index on columns (company_id, status)
  [+] Added index on columns (notification_id)
  [+] Added foreign key on columns (company_id)

[*] Changed the `notification_preferences` table
  [+] Added index on columns (company_id, user_id)
  [+] Added unique index on columns (company_id, user_id, channel, notification_type)
  [+] Added foreign key on columns (company_id)

[*] Changed the `notification_templates` table
  [+] Added unique index on columns (company_id, template_type, channel)
  [+] Added foreign key on columns (company_id)

[*] Changed the `notifications` table
  [+] Added index on columns (user_id, is_read, created_at)
  [+] Added index on columns (company_id, created_at)
  [+] Added foreign key on columns (company_id)

[*] Changed the `opportunities` table
  [+] Added index on columns (company_id, stage)
  [+] Added foreign key on columns (company_id)
  [+] Added foreign key on columns (client_id)

[*] Changed the `plugin_installations` table
  [+] Added unique index on columns (company_id, plugin_id)
  [+] Added foreign key on columns (company_id)
  [+] Added foreign key on columns (plugin_id)

[*] Changed the `plugins` table
  [+] Added unique index on columns (name)
  [+] Added unique index on columns (slug)

[*] Changed the `portal_access` table
  [+] Added unique index on columns (job_id)
  [+] Added index on columns (email)
  [+] Added foreign key on columns (job_id)

[*] Changed the `project_milestones` table
  [+] Added index on columns (project_id, due_date)
  [+] Added foreign key on columns (project_id)

[*] Changed the `project_risks` table
  [+] Added index on columns (project_id, status)
  [+] Added foreign key on columns (project_id)

[*] Changed the `projects` table
  [+] Added index on columns (company_id, status)
  [+] Added index on columns (client_id, status)
  [+] Added foreign key on columns (company_id)
  [+] Added foreign key on columns (client_id)

[*] Changed the `prompt_templates` table
  [+] Added unique index on columns (company_id, name)
  [+] Added foreign key on columns (company_id)

[*] Changed the `prompt_versions` table
  [+] Added unique index on columns (prompt_id, version)
  [+] Added foreign key on columns (prompt_id)

[*] Changed the `ratio_definitions` table
  [+] Added unique index on columns (company_id, name)
  [+] Added foreign key on columns (company_id)

[*] Changed the `ratio_values` table
  [+] Added index on columns (client_id, ratio_id, period_start)
  [+] Added foreign key on columns (ratio_id)

[*] Changed the `recommendations` table
  [+] Added index on columns (decision_id, status)
  [+] Added foreign key on columns (decision_id)

[*] Changed the `roles` table
  [+] Added unique index on columns (company_id, name)
  [+] Added foreign key on columns (company_id)

[*] Changed the `rule_definitions` table
  [+] Added unique index on columns (company_id, name)
  [+] Added foreign key on columns (company_id)

[*] Changed the `rule_dependencies` table
  [+] Added unique index on columns (rule_id, depends_on_id)
  [+] Added foreign key on columns (rule_id)
  [+] Added foreign key on columns (depends_on_id)

[*] Changed the `rule_executions` table
  [+] Added index on columns (rule_id, created_at)
  [+] Added foreign key on columns (rule_id)

[*] Changed the `sri_retentions` table
  [+] Added index on columns (company_id, fiscal_period)
  [+] Added index on columns (company_id, sequential)
  [+] Added foreign key on columns (company_id)
  [+] Added foreign key on columns (withholding_id)

[*] Changed the `task_dependencies` table
  [+] Added unique index on columns (predecessor_id, dependent_id)
  [+] Added foreign key on columns (predecessor_id)
  [+] Added foreign key on columns (dependent_id)

[*] Changed the `tasks` table
  [+] Added index on columns (project_id, status)
  [+] Added index on columns (assigned_to, status)
  [+] Added foreign key on columns (project_id)
  [+] Added foreign key on columns (parent_task_id)

[*] Changed the `tax_annexes` table
  [+] Added index on columns (company_id, annex_type, period_year)
  [+] Added index on columns (company_id, status)
  [+] Added foreign key on columns (company_id)

[*] Changed the `tax_declarations` table
  [+] Added index on columns (company_id, client_id, period_year, declaration_type)
  [+] Added index on columns (client_id, status)
  [+] Added index on columns (company_id, due_date)
  [+] Added foreign key on columns (company_id)

[*] Changed the `tax_payments` table
  [+] Added index on columns (company_id, client_id, tax_type)
  [+] Added index on columns (company_id, payment_date)
  [+] Added foreign key on columns (company_id)

[*] Changed the `tax_withholdings` table
  [+] Added index on columns (company_id, client_id, fiscal_period)
  [+] Added index on columns (company_id, withholding_type)
  [+] Added foreign key on columns (company_id)

[*] Changed the `ticket_comments` table
  [+] Added index on columns (ticket_id, created_at)
  [+] Added foreign key on columns (ticket_id)

[*] Changed the `tickets` table
  [+] Added index on columns (company_id, status)
  [+] Added index on columns (client_id, status)
  [+] Added index on columns (assigned_to, status)
  [+] Added foreign key on columns (company_id)
  [+] Added foreign key on columns (client_id)
  [+] Added foreign key on columns (assigned_to)

[*] Changed the `timeline_events` table
  [+] Added index on columns (client_id, occurred_at)
  [+] Added foreign key on columns (client_id)

[*] Changed the `usage_records` table
  [+] Added index on columns (company_id, usage_type, recorded_at)
  [+] Added index on columns (company_id, client_id, usage_type)
  [+] Added index on columns (company_id, reference_type, reference_id)
  [+] Added foreign key on columns (company_id)

[*] Changed the `user_roles` table
  [+] Added foreign key on columns (user_id)
  [+] Added foreign key on columns (role_id)

[*] Changed the `users` table
  [+] Added unique index on columns (email)
  [+] Added unique index on columns (auth_id)
  [+] Added index on columns (company_id, email)
  [+] Added foreign key on columns (company_id)
  [+] Added foreign key on columns (branch_id)
  [+] Added foreign key on columns (department_id)

[*] Changed the `workflow_definitions` table
  [+] Added unique index on columns (company_id, name)
  [+] Added foreign key on columns (company_id)

[*] Changed the `workflow_instances` table
  [+] Added index on columns (company_id, status)
  [+] Added index on columns (definition_id, status)
  [+] Added foreign key on columns (company_id)
  [+] Added foreign key on columns (definition_id)

[*] Changed the `workflow_step_results` table
  [+] Added unique index on columns (instance_id, step_key)
  [+] Added foreign key on columns (instance_id)

[*] Changed the `workflow_triggers` table
  [+] Added foreign key on columns (definition_id)

