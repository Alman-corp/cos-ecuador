-- LOPDP Ecuador — Ley Orgánica de Protección de Datos Personales
-- Migration 00004: Actividades de tratamiento, consentimientos, solicitudes ARCO+P
-- Art. 23, 7, 9-15, 33, 36 LOPDP

-- ========== ENUMS ==========

CREATE TYPE legal_basis_ec AS ENUM (
  'CONSENT', 'CONTRACT', 'LEGAL_OBLIGATION',
  'VITAL_INTEREST', 'PUBLIC_INTEREST', 'LEGITIMATE_INTEREST'
);

CREATE TYPE data_category AS ENUM (
  'PERSONAL_BASIC', 'PERSONAL_SENSITIVE', 'FINANCIAL',
  'TAX', 'LABOR', 'COMMERCIAL', 'TECHNICAL', 'BIOMETRIC'
);

CREATE TYPE data_subject_category AS ENUM (
  'CLIENTS', 'EMPLOYEES', 'PROVIDERS', 'PROSPECTS', 'THIRD_PARTIES'
);

CREATE TYPE activity_status AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');

CREATE TYPE consent_method AS ENUM ('CHECKBOX', 'SIGNATURE', 'DOUBLE_OPT_IN', 'WRITTEN');

CREATE TYPE arco_right AS ENUM ('ACCESS', 'RECTIFY', 'CANCEL', 'OPPOSE', 'PORTABILITY');

CREATE TYPE arco_status AS ENUM ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED', 'EXPIRED');

CREATE TYPE safeguard_type AS ENUM (
  'ADEQUACY_DECISION', 'SCC', 'BCR', 'DPA', 'EXPLICIT_CONSENT', 'CONTRACTUAL_NECESSITY'
);

CREATE TYPE security_category AS ENUM (
  'ENCRYPTION_AT_REST', 'ENCRYPTION_IN_TRANSIT', 'ACCESS_CONTROL',
  'BACKUP', 'MONITORING', 'INCIDENT_RESPONSE', 'TRAINING', 'AUDIT'
);

-- ========== DATA PROCESSING ACTIVITIES (Art. 23 LOPDP) ==========

CREATE TABLE data_processing_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  description TEXT,
  purpose TEXT NOT NULL,
  legal_basis LEGAL_BASIS_EC NOT NULL,
  data_categories DATA_CATEGORY[] NOT NULL DEFAULT '{}',
  data_subject_categories DATA_SUBJECT_CATEGORY[] NOT NULL DEFAULT '{}',
  international_transfers BOOLEAN DEFAULT FALSE,
  retention_days INT NOT NULL DEFAULT 1825,
  retention_justification TEXT,
  requires_dpia BOOLEAN DEFAULT FALSE,
  dpia_completed_at TIMESTAMPTZ,
  dpia_document_url TEXT,
  status ACTIVITY_STATUS DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

ALTER TABLE data_processing_activities ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_dpa_tenant_status ON data_processing_activities(tenant_id, status);

-- ========== CONSENTS (Art. 7.a LOPDP) ==========

CREATE TABLE consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES companies(id),
  data_subject_id TEXT,
  data_subject_email TEXT,
  data_subject_cedula TEXT,
  activity_id UUID NOT NULL REFERENCES data_processing_activities(id),
  granted BOOLEAN DEFAULT FALSE,
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  policy_version TEXT NOT NULL,
  policy_url TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  consent_method CONSENT_METHOD NOT NULL DEFAULT 'CHECKBOX',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE consents ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_consents_tenant_email ON consents(tenant_id, data_subject_email);
CREATE INDEX idx_consents_activity_granted ON consents(tenant_id, activity_id, granted);

-- ========== INTERNATIONAL TRANSFERS (Art. 33 LOPDP) ==========

CREATE TABLE international_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES data_processing_activities(id) ON DELETE CASCADE,
  recipient_country TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_type TEXT NOT NULL,
  purpose TEXT NOT NULL,
  safeguard_type SAFEGUARD_TYPE NOT NULL,
  safeguard_document_url TEXT,
  dpa_signed_at TIMESTAMPTZ,
  dpa_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transfers_activity ON international_transfers(activity_id);

-- ========== SECURITY MEASURES ==========

CREATE TABLE security_measures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES data_processing_activities(id) ON DELETE CASCADE,
  category SECURITY_CATEGORY NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  implemented_at TIMESTAMPTZ,
  evidence_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_security_activity_category ON security_measures(activity_id, category);

-- ========== ARCO+P REQUESTS (Art. 9-15 LOPDP) ==========

CREATE TABLE arco_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES companies(id),
  requester_email TEXT NOT NULL,
  requester_cedula TEXT,
  requester_name TEXT NOT NULL,
  right_type ARCO_RIGHT NOT NULL,
  status ARCO_STATUS DEFAULT 'PENDING',
  received_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  deadline_at TIMESTAMPTZ NOT NULL,
  response_notes TEXT,
  export_file_url TEXT,
  anonymized_at TIMESTAMPTZ,
  handled_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE arco_requests ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_arco_tenant_status ON arco_requests(tenant_id, status);
CREATE INDEX idx_arco_deadline ON arco_requests(deadline_at, status);

-- ========== RLS POLICIES ==========

CREATE POLICY dpa_tenant_isolation ON data_processing_activities
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY consents_tenant_isolation ON consents
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY arco_tenant_isolation ON arco_requests
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- ========== TRIGGERS ==========

CREATE TRIGGER trg_dpa_updated_at BEFORE UPDATE ON data_processing_activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========== DEFAULT DATA: 4 Actividades de tratamiento base ==========

-- Estas se insertan via seed, no aquí, para mantener la migration idempotente
