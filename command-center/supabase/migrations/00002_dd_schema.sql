-- ============================================================
-- DD (Due Diligence) Schema
-- ============================================================

-- 1. DD ENGAGEMENTS
create table if not exists public.dd_engagements (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  company_name  text not null,
  industry      text not null,
  fiscal_year   integer not null,
  currency      text not null,
  description   text,
  scope         text[] not null default '{}',
  status        text not null default 'draft' check (status in ('draft','in_progress','review','completed','archived')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 2. DD REPORTS
create table if not exists public.dd_reports (
  id            uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references public.dd_engagements(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  sections      text[] not null default '{}',
  notes         text,
  status        text not null default 'generating' check (status in ('generating','ready','error')),
  file_url      text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 3. DD DOCUMENTS
create table if not exists public.dd_documents (
  id            uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references public.dd_engagements(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  file_type     text not null,
  file_size     integer default 0,
  file_url      text,
  category      text,
  status        text not null default 'pending' check (status in ('pending','processing','ready','error')),
  created_at    timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_dd_engagements_company on public.dd_engagements(company_id, created_at desc);
create index idx_dd_engagements_user on public.dd_engagements(user_id, created_at desc);
create index idx_dd_reports_engagement on public.dd_reports(engagement_id, created_at desc);
create index idx_dd_documents_engagement on public.dd_documents(engagement_id, created_at desc);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.dd_engagements enable row level security;
alter table public.dd_reports enable row level security;
alter table public.dd_documents enable row level security;

-- DD Engagements: tenant + user isolation
create policy "dd_engagements_select"
  on public.dd_engagements for select
  using (company_id = public.current_company_id() and user_id = auth.uid());

create policy "dd_engagements_insert"
  on public.dd_engagements for insert
  with check (company_id = public.current_company_id() and user_id = auth.uid());

create policy "dd_engagements_update"
  on public.dd_engagements for update
  using (company_id = public.current_company_id() and user_id = auth.uid());

create policy "dd_engagements_delete"
  on public.dd_engagements for delete
  using (company_id = public.current_company_id() and user_id = auth.uid());

-- DD Reports: inherit via engagement
create policy "dd_reports_select"
  on public.dd_reports for select
  using (
    exists (
      select 1 from public.dd_engagements e
      where e.id = engagement_id
        and e.company_id = public.current_company_id()
        and e.user_id = auth.uid()
    )
  );

create policy "dd_reports_insert"
  on public.dd_reports for insert
  with check (
    exists (
      select 1 from public.dd_engagements e
      where e.id = engagement_id
        and e.company_id = public.current_company_id()
        and e.user_id = auth.uid()
    )
    and user_id = auth.uid()
  );

create policy "dd_reports_update"
  on public.dd_reports for update
  using (
    exists (
      select 1 from public.dd_engagements e
      where e.id = engagement_id
        and e.company_id = public.current_company_id()
        and e.user_id = auth.uid()
    )
  );

create policy "dd_reports_delete"
  on public.dd_reports for delete
  using (
    exists (
      select 1 from public.dd_engagements e
      where e.id = engagement_id
        and e.company_id = public.current_company_id()
        and e.user_id = auth.uid()
    )
  );

-- DD Documents: inherit via engagement
create policy "dd_documents_select"
  on public.dd_documents for select
  using (
    exists (
      select 1 from public.dd_engagements e
      where e.id = engagement_id
        and e.company_id = public.current_company_id()
        and e.user_id = auth.uid()
    )
  );

create policy "dd_documents_insert"
  on public.dd_documents for insert
  with check (
    exists (
      select 1 from public.dd_engagements e
      where e.id = engagement_id
        and e.company_id = public.current_company_id()
        and e.user_id = auth.uid()
    )
    and user_id = auth.uid()
  );

create policy "dd_documents_update"
  on public.dd_documents for update
  using (
    exists (
      select 1 from public.dd_engagements e
      where e.id = engagement_id
        and e.company_id = public.current_company_id()
        and e.user_id = auth.uid()
    )
  );

create policy "dd_documents_delete"
  on public.dd_documents for delete
  using (
    exists (
      select 1 from public.dd_engagements e
      where e.id = engagement_id
        and e.company_id = public.current_company_id()
        and e.user_id = auth.uid()
    )
  );

-- ============================================================
-- TRIGGERS: updated_at
-- ============================================================
create or replace function public.update_dd_updated_at()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_dd_engagements_updated_at
  before update on public.dd_engagements
  for each row execute function public.update_dd_updated_at();

create trigger trg_dd_reports_updated_at
  before update on public.dd_reports
  for each row execute function public.update_dd_updated_at();
