-- Contracts
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id),
    title VARCHAR NOT NULL,
    contract_type VARCHAR NOT NULL,
    contract_number VARCHAR UNIQUE,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    signed_at TIMESTAMPTZ,
    contract_value DECIMAL(14,2),
    currency VARCHAR NOT NULL DEFAULT 'USD',
    status VARCHAR NOT NULL DEFAULT 'DRAFT',
    auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
    renewal_notice_days INTEGER NOT NULL DEFAULT 30,
    parties JSONB NOT NULL DEFAULT '[]',
    document_id VARCHAR,
    signed_by_us BOOLEAN NOT NULL DEFAULT FALSE,
    signed_by_them BOOLEAN NOT NULL DEFAULT FALSE,
    executive_summary TEXT,
    risk_score INTEGER,
    critical_clauses JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contracts_company_client ON contracts(company_id, client_id);
CREATE INDEX idx_contracts_company_status ON contracts(company_id, status);
CREATE INDEX idx_contracts_company_end_date ON contracts(company_id, end_date);

-- Contract Obligations
CREATE TABLE contract_obligations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    responsible_party VARCHAR NOT NULL,
    obligation_type VARCHAR NOT NULL,
    due_date TIMESTAMPTZ NOT NULL,
    recurrence VARCHAR NOT NULL DEFAULT 'ONCE',
    amount DECIMAL(14,2),
    status VARCHAR NOT NULL DEFAULT 'PENDING',
    notes TEXT,
    evidence_document_id VARCHAR,
    completed_at TIMESTAMPTZ,
    alert_sent_5_days BOOLEAN NOT NULL DEFAULT FALSE,
    alert_sent_1_day BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contract_obligations_company_status_due ON contract_obligations(company_id, status, due_date);
CREATE INDEX idx_contract_obligations_company_contract ON contract_obligations(company_id, contract_id);

-- Contract Versions
CREATE TABLE contract_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    document_id VARCHAR NOT NULL,
    change_summary TEXT,
    changed_by VARCHAR NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(contract_id, version_number)
);

-- Sales Opportunities
CREATE TABLE sales_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id),
    title VARCHAR NOT NULL,
    description TEXT,
    stage VARCHAR NOT NULL DEFAULT 'LEAD',
    estimated_value DECIMAL(14,2),
    probability INTEGER NOT NULL DEFAULT 20,
    weighted_value DECIMAL(14,2),
    expected_close_date TIMESTAMPTZ,
    service_type VARCHAR,
    assigned_user_id VARCHAR,
    source VARCHAR NOT NULL DEFAULT 'OTHER',
    last_interaction TEXT,
    last_interaction_at TIMESTAMPTZ,
    lost_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sales_opportunities_company_stage ON sales_opportunities(company_id, stage);
CREATE INDEX idx_sales_opportunities_company_assigned ON sales_opportunities(company_id, assigned_user_id);
CREATE INDEX idx_sales_opportunities_company_close ON sales_opportunities(company_id, expected_close_date);

-- Sales Activities
CREATE TABLE sales_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    opportunity_id UUID NOT NULL REFERENCES sales_opportunities(id) ON DELETE CASCADE,
    activity_type VARCHAR NOT NULL,
    subject VARCHAR NOT NULL,
    notes TEXT,
    scheduled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_by VARCHAR NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sales_activities_company_opportunity ON sales_activities(company_id, opportunity_id);

-- Consultant Matches
CREATE TABLE consultant_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    client_id UUID NOT NULL,
    consultant_id VARCHAR NOT NULL,
    match_score INTEGER NOT NULL,
    reasons JSONB NOT NULL DEFAULT '[]',
    skills TEXT[] NOT NULL DEFAULT '{}',
    consultant_load INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(company_id, client_id, consultant_id)
);

CREATE INDEX idx_consultant_matches_company_score ON consultant_matches(company_id, match_score);
