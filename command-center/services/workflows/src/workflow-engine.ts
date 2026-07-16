interface WorkflowStep {
  id: string
  type: 'action' | 'condition' | 'wait' | 'webhook' | 'notification'
  name: string
  config: Record<string, any>
  next?: string | { true?: string; false?: string }
  retryPolicy?: { maxAttempts: number; backoff: 'exponential' | 'fixed'; delayMs: number }
}

interface WorkflowDefinition {
  id: string
  tenantId?: string
  name: string
  description?: string
  trigger: { type: 'event' | 'cron' | 'manual' | 'webhook'; config: Record<string, any> }
  steps: WorkflowStep[]
  variables?: Record<string, any>
  active: boolean
}

export const CORE_WORKFLOWS: WorkflowDefinition[] = [
  {
    id: 'wf_onboarding',
    name: 'Onboarding de Cliente Nuevo',
    description: 'Automatiza el proceso completo de onboarding cuando se crea un nuevo cliente',
    trigger: { type: 'event', config: { event: 'client.created' } },
    steps: [
      { id: 's1', type: 'action', name: 'Enviar email de bienvenida', config: { action: 'send_email', to: '{{client.email}}', subject: 'Bienvenido a {{tenant.name}}', templateId: 'welcome_client' }, next: 's2' },
      { id: 's2', type: 'action', name: 'Crear carpeta documental', config: { action: 'update_record', model: 'documentFolder', data: { name: 'Documentos {{client.name}}', companyId: '{{client.id}}' } }, next: 's3' },
      { id: 's3', type: 'action', name: 'Notificar al consultor asignado', config: { action: 'send_notification', userId: '{{client.assignedConsultorId}}', title: 'Nuevo cliente onboarded', message: '{{client.name}} ha completado onboarding', type: 'SUCCESS' } },
    ],
    active: true,
  },
  {
    id: 'wf_document',
    name: 'Procesamiento de Documento Subido',
    description: 'Pipeline automático cuando un cliente sube un documento al Data Hub',
    trigger: { type: 'event', config: { event: 'document.uploaded' } },
    steps: [
      { id: 's1', type: 'action', name: 'Validar tipo de documento', config: { action: 'http_request', url: '{{API_URL}}/api/v1/documents/{{document.id}}/validate', method: 'POST' }, next: 's2' },
      { id: 's2', type: 'condition', name: 'Es PDF escaneado?', config: { expression: '{{s1_result.needsOCR}} == true' }, next: { true: 's3_ocr', false: 's3_text' } },
      { id: 's3_ocr', type: 'action', name: 'Ejecutar OCR', config: { action: 'http_request', url: '{{API_URL}}/api/v1/documents/{{document.id}}/ocr', method: 'POST' }, next: 's4' },
      { id: 's3_text', type: 'action', name: 'Extraer texto directo', config: { action: 'http_request', url: '{{API_URL}}/api/v1/documents/{{document.id}}/extract-text', method: 'POST' }, next: 's4' },
      { id: 's4', type: 'action', name: 'Clasificar tipo documental', config: { action: 'http_request', url: '{{AI_ENGINE_URL}}/api/v1/documents/{{document.id}}/classify', method: 'POST' }, next: 's5' },
      { id: 's5', type: 'action', name: 'Notificar al equipo', config: { action: 'send_notification', userId: '{{document.uploadedByUserId}}', title: 'Documento procesado', message: '{{document.name}} ha sido indexado', type: 'INFO' } },
    ],
    active: true,
  },
  {
    id: 'wf_tax_alert',
    name: 'Alerta de Vencimiento SRI',
    description: 'Alerta 7 días antes del vencimiento de obligaciones tributarias',
    trigger: { type: 'cron', config: { schedule: '0 9 * * *' } },
    steps: [
      { id: 's1', type: 'action', name: 'Buscar obligaciones próximas a vencer', config: { action: 'http_request', url: '{{API_URL}}/api/v1/tax/obligations/upcoming?days=7', method: 'GET' }, next: 's2' },
      { id: 's2', type: 'condition', name: 'Hay obligaciones próximas?', config: { expression: '{{s1_result.count}} > 0' }, next: { true: 's3', false: 'end' } },
      { id: 's3', type: 'action', name: 'Enviar alerta al consultor', config: { action: 'send_email', to: '{{tenant.adminEmail}}', subject: '{{s1_result.count}} obligaciones SRI por vencer', templateId: 'tax_deadline_alert' }, next: 's4' },
      { id: 's4', type: 'action', name: 'Crear tarea en proyecto', config: { action: 'update_record', model: 'task', data: { title: 'Preparar declaracion SRI', priority: 'HIGH' } } },
    ],
    active: true,
  },
  {
    id: 'wf_quote',
    name: 'Generación Automática de Cotización',
    description: 'Genera cotización cuando un lead es calificado como oportunidad',
    trigger: { type: 'event', config: { event: 'lead.qualified' } },
    steps: [
      { id: 's1', type: 'action', name: 'Validar RUC del lead', config: { action: 'sri_validate_ruc', ruc: '{{lead.ruc}}' }, next: 's2' },
      { id: 's2', type: 'condition', name: 'RUC válido?', config: { expression: '{{s1_result.valid}} == true' }, next: { true: 's3', false: 'sfail' } },
      { id: 's3', type: 'action', name: 'Generar PDF de cotización', config: { action: 'generate_pdf', template: 'quote_template', data: { clientName: '{{lead.companyName}}', ruc: '{{lead.ruc}}' }, filename: 'Cotizacion_{{lead.ruc}}.pdf' }, next: 's4' },
      { id: 's4', type: 'action', name: 'Enviar cotización al lead', config: { action: 'send_email', to: '{{lead.email}}', subject: 'Cotización - {{tenant.name}}', templateId: 'quote_email' } },
      { id: 'sfail', type: 'action', name: 'Notificar RUC inválido', config: { action: 'send_notification', userId: '{{lead.assignedUserId}}', title: 'RUC inválido', message: 'El RUC {{lead.ruc}} no es válido', type: 'ERROR' } },
    ],
    active: true,
  },
  {
    id: 'wf_kyc',
    name: 'Verificación KYC de Cliente',
    description: 'Due diligence automático contra fuentes públicas',
    trigger: { type: 'event', config: { event: 'client.created' } },
    steps: [
      { id: 's1', type: 'action', name: 'Consultar Supercias', config: { action: 'http_request', url: '{{API_URL}}/api/v1/integrations/supercias/company/{{client.ruc}}', method: 'GET' }, next: 's2' },
      { id: 's2', type: 'action', name: 'Verificar listas PEP', config: { action: 'http_request', url: '{{API_URL}}/api/v1/compliance/pep-check', method: 'POST', body: { ruc: '{{client.ruc}}' } }, next: 's3' },
      { id: 's3', type: 'condition', name: 'Hay alertas?', config: { expression: '{{s2_result.pepMatches}} > 0' }, next: { true: 'shigh', false: 's4' } },
      { id: 's4', type: 'action', name: 'Archivar reporte KYC', config: { action: 'update_record', model: 'document', data: { name: 'KYC_{{client.ruc}}.pdf', type: 'KYC_REPORT', companyId: '{{client.id}}' } } },
      { id: 'shigh', type: 'action', name: 'Alertar Compliance Officer', config: { action: 'send_notification', userId: '{{tenant.complianceOfficerId}}', title: 'ALERTA KYC - Alto Riesgo', message: '{{client.name}} coincide con listas PEP', type: 'CRITICAL' } },
    ],
    active: true,
  },
]
