-- Create chat_sessions table
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    client_id UUID,
    title VARCHAR,
    primary_agent VARCHAR,
    status VARCHAR NOT NULL DEFAULT 'ACTIVE',
    total_tokens INTEGER NOT NULL DEFAULT 0,
    total_cost_usd DECIMAL(10,6) NOT NULL DEFAULT 0,
    initial_context JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_message_at TIMESTAMPTZ
);

CREATE INDEX idx_chat_sessions_company_user_status ON chat_sessions(company_id, user_id, status);
CREATE INDEX idx_chat_sessions_company_client ON chat_sessions(company_id, client_id);
CREATE INDEX idx_chat_sessions_created ON chat_sessions(created_at);

-- Create chat_messages table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR NOT NULL,
    content TEXT NOT NULL,
    reasoning TEXT,
    agent_used VARCHAR,
    model_used VARCHAR,
    tools_executed JSONB,
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    cost_usd DECIMAL(10,6) NOT NULL DEFAULT 0,
    latency_ms INTEGER,
    first_token_ms INTEGER,
    last_token_ms INTEGER,
    citation_ids JSONB DEFAULT '[]',
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_messages_company_session ON chat_messages(company_id, session_id);
CREATE INDEX idx_chat_messages_company_role_created ON chat_messages(company_id, role, created_at);

-- Create tool_call_logs table
CREATE TABLE tool_call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    tool_name VARCHAR NOT NULL,
    tool_input JSONB NOT NULL,
    tool_output JSONB,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    execution_time_ms INTEGER NOT NULL DEFAULT 0,
    sequence_number INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tool_call_logs_company_message ON tool_call_logs(company_id, message_id);
CREATE INDEX idx_tool_call_logs_company_tool ON tool_call_logs(company_id, tool_name);

-- Update agent_feedback to match new schema (add columns if missing)
ALTER TABLE agent_feedback ADD COLUMN IF NOT EXISTS was_helpful BOOLEAN;
ALTER TABLE agent_feedback ADD COLUMN IF NOT EXISTS sources_correct BOOLEAN;
ALTER TABLE agent_feedback ADD COLUMN IF NOT EXISTS user_id UUID;
