-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    file_name VARCHAR,
    file_type VARCHAR,
    file_size INTEGER,
    source VARCHAR NOT NULL DEFAULT 'upload',
    category VARCHAR,
    law_type VARCHAR,
    law_number VARCHAR,
    article VARCHAR,
    year INTEGER,
    issuer VARCHAR,
    status VARCHAR NOT NULL DEFAULT 'PENDING',
    error TEXT,
    chunk_count INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    uploaded_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_company_status ON documents(company_id, status);
CREATE INDEX idx_documents_company_category ON documents(company_id, category);
CREATE INDEX idx_documents_company_law_type ON documents(company_id, law_type);
CREATE INDEX idx_documents_company_created ON documents(company_id, created_at);

-- Create document_chunks table with vector support
CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    company_id UUID NOT NULL,
    index INTEGER NOT NULL,
    content TEXT NOT NULL,
    tokens INTEGER NOT NULL DEFAULT 0,
    embedding vector(1536),
    metadata JSONB DEFAULT '{}',
    law_type VARCHAR,
    article VARCHAR,
    has_isd BOOLEAN NOT NULL DEFAULT FALSE,
    isd JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chunks_document_index ON document_chunks(document_id, index);
CREATE INDEX idx_chunks_company ON document_chunks(company_id);
CREATE INDEX idx_chunks_company_law_type ON document_chunks(company_id, law_type);
CREATE INDEX idx_chunks_company_isd ON document_chunks(company_id, has_isd);
CREATE INDEX idx_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_chunks_content_trgm ON document_chunks USING gin (content gin_trgm_ops);

-- Create citations table
CREATE TABLE citations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chunk_id UUID NOT NULL REFERENCES document_chunks(id) ON DELETE CASCADE,
    company_id UUID NOT NULL,
    session_id VARCHAR NOT NULL,
    message_id VARCHAR,
    relevance REAL NOT NULL DEFAULT 0.0,
    content TEXT NOT NULL,
    law_type VARCHAR,
    article VARCHAR,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_citations_session ON citations(session_id);
CREATE INDEX idx_citations_company_session ON citations(company_id, session_id);
CREATE INDEX idx_citations_chunk ON citations(chunk_id);

-- Create agent_feedback table
CREATE TABLE agent_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    session_id VARCHAR NOT NULL,
    message_id VARCHAR,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    category VARCHAR,
    comment TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_feedback_session ON agent_feedback(session_id);
CREATE INDEX idx_feedback_company_created ON agent_feedback(company_id, created_at);
CREATE INDEX idx_feedback_company_rating ON agent_feedback(company_id, rating);
