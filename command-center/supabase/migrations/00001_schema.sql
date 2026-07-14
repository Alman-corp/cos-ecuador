-- ============================================================
-- INFINITY COMMAND CENTER — Database Schema
-- Multi-tenant with Row Level Security
-- ============================================================

-- 0. EXTENSIONS
create extension if not exists "pgcrypto";
create extension if not exists "pgvector";

-- 1. COMPANIES (tenants)
create table if not exists public.companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  logo_url    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2. PROFILES (users linked to companies)
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  company_id    uuid not null references public.companies(id) on delete cascade,
  full_name     text,
  role          text not null default 'viewer' check (role in ('admin','analyst','viewer','auditor')),
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 3. FINANCIAL STATEMENTS
create table if not exists public.financial_statements (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  period          date not null,
  revenue         numeric(16,2) default 0,
  cogs            numeric(16,2) default 0,
  gross_profit    numeric(16,2) generated always as (revenue - cogs) stored,
  opex            numeric(16,2) default 0,
  ebitda          numeric(16,2) generated always as (revenue - cogs - opex) stored,
  depreciation    numeric(16,2) default 0,
  ebit            numeric(16,2) generated always as (revenue - cogs - opex - depreciation) stored,
  interest        numeric(16,2) default 0,
  tax             numeric(16,2) default 0,
  net_income      numeric(16,2) generated always as (revenue - cogs - opex - depreciation - interest - tax) stored,
  created_at      timestamptz not null default now(),
  unique(company_id, period)
);

-- 4. TRANSACTIONS (daily cash movements)
create table if not exists public.transactions (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  date            date not null,
  description     text not null,
  amount          numeric(16,2) not null,
  type            text not null check (type in ('inflow','outflow')),
  category        text not null,
  reference       text,
  created_at      timestamptz not null default now()
);

-- 5. PROJECTIONS (DCF / cash flow forecasts)
create table if not exists public.projections (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  projection_date date not null default current_date,
  scenario        text not null default 'base' check (scenario in ('base','optimistic','pessimistic')),
  cash_balance    numeric(16,2) default 0,
  months_runway   numeric(6,2) default 0,
  metadata        jsonb default '{}',
  created_at      timestamptz not null default now()
);

-- 6. MACRO INDICATORS (shared across tenants)
create table if not exists public.macro_indicators (
  id              uuid primary key default gen_random_uuid(),
  indicator       text not null,
  country         text not null default 'EC',
  frequency       text not null check (frequency in ('daily','weekly','monthly','quarterly','yearly')),
  date            date not null,
  value           numeric(16,4) not null,
  source          text,
  created_at      timestamptz not null default now(),
  unique(indicator, country, date)
);

-- 7. DOCUMENTS (VDRs, contracts, reports)
create table if not exists public.documents (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  title           text not null,
  file_type       text not null,
  file_url        text not null,
  file_size       integer default 0,
  status          text not null default 'pending' check (status in ('pending','processing','ready','error')),
  page_count      integer default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 8. DOCUMENT CHUNKS (vectorized for RAG / ISD)
create table if not exists public.document_chunks (
  id              uuid primary key default gen_random_uuid(),
  document_id     uuid not null references public.documents(id) on delete cascade,
  chunk_index     integer not null,
  content         text not null,
  embedding       vector(1024),
  page_number     integer,
  line_range      int4range,
  metadata        jsonb default '{}',
  created_at      timestamptz not null default now(),
  unique(document_id, chunk_index)
);

-- 9. AGENT SESSIONS
create table if not exists public.agent_sessions (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  agent_type      text not null,
  messages        jsonb not null default '[]',
  status          text not null default 'active' check (status in ('active','completed','archived')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 10. AUDIT LOG (immutable)
create table if not exists public.audit_log (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  user_id         uuid references auth.users(id),
  action          text not null,
  table_name      text,
  record_id       uuid,
  old_values      jsonb,
  new_values      jsonb,
  ip_address      inet,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_financial_statements_company on public.financial_statements(company_id, period desc);
create index idx_transactions_company on public.transactions(company_id, date desc);
create index idx_projections_company on public.projections(company_id, projection_date desc);
create index idx_macro_indicator_lookup on public.macro_indicators(indicator, country, date desc);
create index idx_document_chunks_embedding on public.document_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index idx_audit_log_company on public.audit_log(company_id, created_at desc);
create index idx_profiles_company on public.profiles(company_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.financial_statements enable row level security;
alter table public.transactions enable row level security;
alter table public.projections enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.agent_sessions enable row level security;
alter table public.audit_log enable row level security;

-- Macro indicators are world-readable (for now)
alter table public.macro_indicators enable row level security;

-- Helper: get current user's company_id
create or replace function public.current_company_id()
returns uuid
language sql
stable
as $$
  select company_id from public.profiles where id = auth.uid();
$$;

-- RLS policies: each tenant sees only their own data
create policy "Users can view their own company"
  on public.companies for select
  using (id = public.current_company_id());

create policy "Users can view their own profile"
  on public.profiles for select
  using (id = auth.uid());

create policy "Users can update their own profile"
  on public.profiles for update
  using (id = auth.uid());

-- Financial statements: tenant isolation
create policy "Tenant isolation — select"
  on public.financial_statements for select
  using (company_id = public.current_company_id());

create policy "Tenant isolation — insert"
  on public.financial_statements for insert
  with check (company_id = public.current_company_id());

create policy "Tenant isolation — update"
  on public.financial_statements for update
  using (company_id = public.current_company_id());

-- Transactions: tenant isolation
create policy "Tenant isolation — select"
  on public.transactions for select
  using (company_id = public.current_company_id());

create policy "Tenant isolation — insert"
  on public.transactions for insert
  with check (company_id = public.current_company_id());

-- Projections: tenant isolation
create policy "Tenant isolation — select"
  on public.projections for select
  using (company_id = public.current_company_id());

create policy "Tenant isolation — insert"
  on public.projections for insert
  with check (company_id = public.current_company_id());

-- Documents: tenant isolation
create policy "Tenant isolation — select"
  on public.documents for select
  using (company_id = public.current_company_id());

create policy "Tenant isolation — insert"
  on public.documents for insert
  with check (company_id = public.current_company_id());

-- Document chunks: inherit via document
create policy "Tenant isolation — select"
  on public.document_chunks for select
  using (
    exists (
      select 1 from public.documents d
      where d.id = document_id
        and d.company_id = public.current_company_id()
    )
  );

-- Agent sessions: tenant + user isolation
create policy "Tenant + user isolation — select"
  on public.agent_sessions for select
  using (company_id = public.current_company_id() and user_id = auth.uid());

create policy "Tenant + user isolation — insert"
  on public.agent_sessions for insert
  with check (company_id = public.current_company_id() and user_id = auth.uid());

-- Audit log: read-only for admins
create policy "Admin read — audit_log"
  on public.audit_log for select
  using (
    company_id = public.current_company_id()
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Macro indicators: everyone can read
create policy "Public read"
  on public.macro_indicators for select
  using (true);

-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, company_id, full_name, role)
  values (
    new.id,
    (new.raw_user_meta_data->>'company_id')::uuid,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'viewer')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
