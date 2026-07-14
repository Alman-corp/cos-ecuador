import { createClient } from '@supabase/supabase-js'
import { addBusinessDays } from 'date-fns'
import type {
  DataProcessingActivity, Consent, ConsentInput, ARCORequest,
  ARCORight, LegalBasisEC, DataCategory, DataSubjectCategory,
} from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const sb = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const DEFAULT_ACTIVITIES: Array<{
  name: string
  description: string
  purpose: string
  legalBasis: LegalBasisEC
  dataCategories: DataCategory[]
  dataSubjectCategories: DataSubjectCategory[]
  retentionDays: number
}> = [
  {
    name: 'Gestión de clientes de consultoría',
    description: 'Datos para prestación de servicios de consultoría financiera y tributaria',
    purpose: 'Prestación contractual de servicios de consultoría',
    legalBasis: 'CONTRACT',
    dataCategories: ['PERSONAL_BASIC', 'FINANCIAL', 'TAX', 'COMMERCIAL'],
    dataSubjectCategories: ['CLIENTS'],
    retentionDays: 1825,
  },
  {
    name: 'Gestión de recursos humanos',
    description: 'Datos de empleados para planillas y contratos',
    purpose: 'Gestión laboral y cumplimiento IESS',
    legalBasis: 'CONTRACT',
    dataCategories: ['PERSONAL_BASIC', 'LABOR', 'FINANCIAL'],
    dataSubjectCategories: ['EMPLOYEES'],
    retentionDays: 3650,
  },
  {
    name: 'Análisis con inteligencia artificial',
    description: 'Procesamiento de documentos con modelos de IA',
    purpose: 'Generación de insights y análisis automatizado',
    legalBasis: 'CONTRACT',
    dataCategories: ['FINANCIAL', 'COMMERCIAL', 'TECHNICAL'],
    dataSubjectCategories: ['CLIENTS'],
    retentionDays: 90,
  },
  {
    name: 'Comunicaciones comerciales',
    description: 'Newsletters, webinars y novedades del servicio',
    purpose: 'Marketing directo',
    legalBasis: 'CONSENT',
    dataCategories: ['PERSONAL_BASIC'],
    dataSubjectCategories: ['CLIENTS', 'PROSPECTS'],
    retentionDays: 730,
  },
]

export async function initializeDefaultActivities(tenantId: string, createdBy?: string) {
  const now = new Date().toISOString()
  const { data, error } = await sb
    .from('data_processing_activities')
    .insert(
      DEFAULT_ACTIVITIES.map((a) => ({
        tenant_id: tenantId,
        name: a.name,
        description: a.description,
        purpose: a.purpose,
        legal_basis: a.legalBasis,
        data_categories: a.dataCategories,
        data_subject_categories: a.dataSubjectCategories,
        retention_days: a.retentionDays,
        created_by: createdBy,
        created_at: now,
        updated_at: now,
      }))
    )
    .select()

  if (error) throw new Error(`Error initializing activities: ${error.message}`)
  return data
}

export async function listActivities(tenantId: string): Promise<DataProcessingActivity[]> {
  const { data, error } = await sb
    .from('data_processing_activities')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'ACTIVE')

  if (error) throw new Error(`Error listing activities: ${error.message}`)
  return (data || []).map(mapRow)
}

export async function recordConsent(params: {
  tenantId: string
  dataSubjectEmail: string
  dataSubjectCedula?: string
  activityId: string
  granted: boolean
  policyVersion: string
  policyUrl: string
  consentMethod: string
  ipAddress?: string
  userAgent?: string
}) {
  if (!params.granted) throw new Error('No se puede registrar consentimiento no otorgado')

  const { data, error } = await sb
    .from('consents')
    .insert({
      tenant_id: params.tenantId,
      data_subject_email: params.dataSubjectEmail,
      data_subject_cedula: params.dataSubjectCedula,
      activity_id: params.activityId,
      granted: true,
      granted_at: new Date().toISOString(),
      policy_version: params.policyVersion,
      policy_url: params.policyUrl,
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
      consent_method: params.consentMethod,
    })
    .select()
    .single()

  if (error) throw new Error(`Error recording consent: ${error.message}`)
  return data
}

export async function revokeConsent(
  tenantId: string,
  activityId: string,
  dataSubjectEmail: string,
  reason?: string
) {
  const { data: existing } = await sb
    .from('consents')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('activity_id', activityId)
    .eq('data_subject_email', dataSubjectEmail)
    .eq('granted', true)
    .is('revoked_at', null)
    .single()

  if (!existing) throw new Error('Consentimiento activo no encontrado')

  const { data, error } = await sb
    .from('consents')
    .update({ revoked_at: new Date().toISOString(), revoked_reason: reason || 'Revocado por el titular' })
    .eq('id', existing.id)
    .select()
    .single()

  if (error) throw new Error(`Error revoking consent: ${error.message}`)
  return data
}

export async function getConsentsByEmail(tenantId: string, email: string): Promise<Consent[]> {
  const { data, error } = await sb
    .from('consents')
    .select('*, activity:activity_id(name)')
    .eq('tenant_id', tenantId)
    .eq('data_subject_email', email)

  if (error) throw new Error(`Error fetching consents: ${error.message}`)
  return (data || []).map((r: any) => ({
    id: r.id,
    tenantId: r.tenant_id,
    dataSubjectEmail: r.data_subject_email,
    dataSubjectCedula: r.data_subject_cedula,
    activityId: r.activity_id,
    granted: r.granted,
    grantedAt: r.granted_at,
    revokedAt: r.revoked_at,
    revokedReason: r.revoked_reason,
    policyVersion: r.policy_version,
    policyUrl: r.policy_url,
    consentMethod: r.consent_method,
    createdAt: r.created_at,
  }))
}

export async function submitARCORequest(params: {
  tenantId: string
  requesterEmail: string
  requesterCedula?: string
  requesterName: string
  rightType: ARCORight
}) {
  const deadline = addBusinessDays(new Date(), 15).toISOString()

  const { data, error } = await sb
    .from('arco_requests')
    .insert({
      tenant_id: params.tenantId,
      requester_email: params.requesterEmail,
      requester_cedula: params.requesterCedula,
      requester_name: params.requesterName,
      right_type: params.rightType,
      deadline_at: deadline,
      status: 'PENDING',
    })
    .select()
    .single()

  if (error) throw new Error(`Error submitting ARCO request: ${error.message}`)
  return data
}

export async function listARCORequests(tenantId: string): Promise<ARCORequest[]> {
  const { data, error } = await sb
    .from('arco_requests')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('received_at', { ascending: false })

  if (error) throw new Error(`Error listing ARCO requests: ${error.message}`)
  return (data || []).map((r: any) => ({
    id: r.id,
    tenantId: r.tenant_id,
    requesterEmail: r.requester_email,
    requesterCedula: r.requester_cedula,
    requesterName: r.requester_name,
    rightType: r.right_type,
    status: r.status,
    receivedAt: r.received_at,
    respondedAt: r.responded_at,
    deadlineAt: r.deadline_at,
    responseNotes: r.response_notes,
    exportFileUrl: r.export_file_url,
  }))
}

function mapRow(r: any): DataProcessingActivity {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    name: r.name,
    description: r.description,
    purpose: r.purpose,
    legalBasis: r.legal_basis,
    dataCategories: r.data_categories || [],
    dataSubjectCategories: r.data_subject_categories || [],
    internationalTransfers: r.international_transfers,
    retentionDays: r.retention_days,
    retentionJustification: r.retention_justification,
    requiresDPIA: r.requires_dpia,
    dpiaCompletedAt: r.dpia_completed_at,
    dpiaDocumentUrl: r.dpia_document_url,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    createdBy: r.created_by,
  }
}

export { DEFAULT_ACTIVITIES }
