-- ============================================================
-- 00003: RLS Policies — Gap Coverage
-- Uses app.current_tenant pattern for consistent tenant isolation
-- ============================================================

-- 0. HELPERS: tenant context via session setting
create or replace function public.set_current_tenant(company_id uuid)
returns void
language sql
as $$
  select set_config('app.current_tenant', company_id::text, true);
$$;

create or replace function public.current_tenant()
returns uuid
language sql
stable
as $$
  select current_setting('app.current_tenant')::uuid;
$$;

-- ============================================================
-- 1. COMPANIES
-- ============================================================
create policy "tenant_companies_insert"
  on public.companies for insert
  with check (true);

create policy "tenant_companies_update"
  on public.companies for update
  using (id = public.current_tenant());

create policy "tenant_companies_delete"
  on public.companies for delete
  using (id = public.current_tenant());

-- ============================================================
-- 2. PROFILES
-- ============================================================
create policy "tenant_profiles_delete"
  on public.profiles for delete
  using (company_id = public.current_tenant() and id = auth.uid());

-- ============================================================
-- 3. FINANCIAL STATEMENTS
-- ============================================================
create policy "tenant_financial_statements_delete"
  on public.financial_statements for delete
  using (company_id = public.current_tenant());

-- ============================================================
-- 4. TRANSACTIONS
-- ============================================================
create policy "tenant_transactions_update"
  on public.transactions for update
  using (company_id = public.current_tenant());

create policy "tenant_transactions_delete"
  on public.transactions for delete
  using (company_id = public.current_tenant());

-- ============================================================
-- 5. PROJECTIONS
-- ============================================================
create policy "tenant_projections_update"
  on public.projections for update
  using (company_id = public.current_tenant());

create policy "tenant_projections_delete"
  on public.projections for delete
  using (company_id = public.current_tenant());

-- ============================================================
-- 6. DOCUMENTS
-- ============================================================
create policy "tenant_documents_update"
  on public.documents for update
  using (company_id = public.current_tenant());

create policy "tenant_documents_delete"
  on public.documents for delete
  using (company_id = public.current_tenant());

-- ============================================================
-- 7. DOCUMENT CHUNKS
-- ============================================================
create policy "tenant_document_chunks_insert"
  on public.document_chunks for insert
  with check (
    exists (
      select 1 from public.documents d
      where d.id = document_id
        and d.company_id = public.current_tenant()
    )
  );

create policy "tenant_document_chunks_update"
  on public.document_chunks for update
  using (
    exists (
      select 1 from public.documents d
      where d.id = document_id
        and d.company_id = public.current_tenant()
    )
  );

create policy "tenant_document_chunks_delete"
  on public.document_chunks for delete
  using (
    exists (
      select 1 from public.documents d
      where d.id = document_id
        and d.company_id = public.current_tenant()
    )
  );

-- ============================================================
-- 8. AGENT SESSIONS
-- ============================================================
create policy "tenant_agent_sessions_update"
  on public.agent_sessions for update
  using (company_id = public.current_tenant() and user_id = auth.uid());

create policy "tenant_agent_sessions_delete"
  on public.agent_sessions for delete
  using (company_id = public.current_tenant() and user_id = auth.uid());

-- ============================================================
-- 9. AUDIT LOG
-- ============================================================
create policy "tenant_audit_log_insert"
  on public.audit_log for insert
  with check (
    company_id = public.current_tenant()
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "tenant_audit_log_delete"
  on public.audit_log for delete
  using (
    company_id = public.current_tenant()
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
