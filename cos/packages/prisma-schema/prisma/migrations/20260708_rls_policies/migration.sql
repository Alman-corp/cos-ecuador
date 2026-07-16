-- ============================================================
-- RLS: Row Level Security for all tenant-aware tables
-- ============================================================
-- This migration enables RLS on every table that has a company_id column,
-- and creates policies for SELECT, INSERT, UPDATE, DELETE.
-- 
-- Usage: SET app.tenant_id = '<uuid>' at session start.
-- The policies use current_setting('app.tenant_id', true)::uuid
-- which returns NULL if not set (blocking all access).

-- Create app schema for helper functions
CREATE SCHEMA IF NOT EXISTS app;

-- Helper function to get current tenant ID from session setting
CREATE OR REPLACE FUNCTION app.current_tenant_id()
RETURNS uuid
LANGUAGE SQL
STABLE
AS $$
  SELECT NULLIF(current_setting('app.tenant_id', true), '')::uuid;
$$;

-- Helper function: check if table has a given column
CREATE OR REPLACE FUNCTION app._table_has_column(tbl text, col text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = tbl
      AND a.attname = col
      AND NOT a.attisdropped
  );
END;
$$;

-- Generate and execute RLS policies for all tables with company_id
DO $$
DECLARE
  tbl text;
  has_client bool;
  pol_name text;
BEGIN
  FOR tbl IN
    SELECT c.relname::text
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relname NOT LIKE '_prisma_%'
      AND app._table_has_column(c.relname::text, 'company_id')
    ORDER BY c.relname
  LOOP
    has_client := app._table_has_column(tbl, 'client_id');

    -- Enable RLS
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', tbl);

    -- SELECT policy
    pol_name := tbl || '_select_tenant';
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT USING (company_id = app.current_tenant_id());',
      pol_name, tbl
    );

    -- INSERT policy
    pol_name := tbl || '_insert_tenant';
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR INSERT WITH CHECK (company_id = app.current_tenant_id());',
      pol_name, tbl
    );

    -- UPDATE policy
    pol_name := tbl || '_update_tenant';
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR UPDATE USING (company_id = app.current_tenant_id()) WITH CHECK (company_id = app.current_tenant_id());',
      pol_name, tbl
    );

    -- DELETE policy
    pol_name := tbl || '_delete_tenant';
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR DELETE USING (company_id = app.current_tenant_id());',
      pol_name, tbl
    );

    RAISE NOTICE 'RLS enabled on % with 4 policies', tbl;
  END LOOP;
END;
$$;
