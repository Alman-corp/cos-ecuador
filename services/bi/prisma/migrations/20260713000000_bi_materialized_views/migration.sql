-- Migration: BI Materialized Views
-- Description: Materialized views for Business Intelligence metrics
-- Date: 2026-07-13

-- ============================================================
-- 1. mv_subscriptions_summary
-- MRR actual por mes y compañía, para gráficos de tendencia
-- ============================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_subscriptions_summary AS
SELECT
  s.company_id,
  DATE_TRUNC('month', s.created_at) AS month,
  COUNT(*)::int AS subscriptions_count,
  COALESCE(SUM(bp.price_monthly), 0) AS total_mrr,
  COALESCE(AVG(bp.price_monthly), 0) AS avg_mrr_per_subscription,
  COUNT(*) FILTER (WHERE s.status = 'active')::int AS active_subscriptions,
  COUNT(*) FILTER (WHERE s.status = 'canceled')::int AS canceled_subscriptions
FROM billing_subscriptions s
JOIN billing_plans bp ON bp.id = s.plan_id
GROUP BY s.company_id, DATE_TRUNC('month', s.created_at)
ORDER BY s.company_id, month ASC
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_subscriptions_summary_pk
  ON mv_subscriptions_summary (company_id, month);

CREATE INDEX IF NOT EXISTS idx_mv_subscriptions_summary_company
  ON mv_subscriptions_summary (company_id);

-- ============================================================
-- 2. mv_subscriptions_history
-- Histórico de cohortes mensuales para retención
-- ============================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_subscriptions_history AS
WITH cohort_base AS (
  SELECT
    s.company_id,
    s.id AS subscription_id,
    DATE_TRUNC('month', s.created_at) AS cohort_month
  FROM billing_subscriptions s
  WHERE s.status = 'active'
),
monthly_series AS (
  SELECT
    cb.company_id,
    cb.cohort_month,
    s.id AS subscription_id,
    DATE_TRUNC('month', s.created_at) AS active_month
  FROM cohort_base cb
  JOIN billing_subscriptions s ON s.id = cb.subscription_id
    AND s.status = 'active'
),
periods AS (
  SELECT
    company_id,
    cohort_month,
    COUNT(DISTINCT subscription_id)::int AS active_clients,
    EXTRACT('month' FROM active_month) - EXTRACT('month' FROM cohort_month)
      + 12 * (EXTRACT('year' FROM active_month) - EXTRACT('year' FROM cohort_month))
      AS period_offset
  FROM monthly_series
  GROUP BY company_id, cohort_month, period_offset
)
SELECT
  company_id,
  cohort_month,
  period_offset,
  active_clients
FROM periods
WHERE period_offset >= 0
ORDER BY company_id, cohort_month, period_offset
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_subscriptions_history_pk
  ON mv_subscriptions_history (company_id, cohort_month, period_offset);

CREATE INDEX IF NOT EXISTS idx_mv_subscriptions_history_company
  ON mv_subscriptions_history (company_id);

-- ============================================================
-- 3. mv_revenue_transactions
-- Ingresos agregados por mes, servicio e industria
-- ============================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_revenue_transactions AS
SELECT
  i.company_id,
  DATE_TRUNC('month', i.created_at) AS month,
  c.industry,
  p.project_type AS service,
  COUNT(DISTINCT i.id)::int AS invoice_count,
  COUNT(DISTINCT i.company_id)::int AS client_count,
  COALESCE(SUM(i.amount), 0) AS total_revenue,
  COALESCE(SUM(i.amount) FILTER (WHERE i.status = 'paid'), 0) AS collected_revenue,
  COALESCE(SUM(i.amount) FILTER (WHERE i.status = 'overdue'), 0) AS overdue_revenue,
  COALESCE(AVG(i.amount), 0) AS avg_invoice_value
FROM billing_invoices i
LEFT JOIN projects p ON p.company_id = i.company_id
LEFT JOIN clients c ON c.id = p.client_id
GROUP BY i.company_id, DATE_TRUNC('month', i.created_at), c.industry, p.project_type
ORDER BY i.company_id, month DESC
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_revenue_transactions_pk
  ON mv_revenue_transactions (company_id, month, COALESCE(industry, ''), COALESCE(service, ''));

CREATE INDEX IF NOT EXISTS idx_mv_revenue_transactions_company
  ON mv_revenue_transactions (company_id);

CREATE INDEX IF NOT EXISTS idx_mv_revenue_transactions_month
  ON mv_revenue_transactions (company_id, month);

-- ============================================================
-- 4. mv_project_profitability
-- Rentabilidad de proyectos por costo real vs presupuesto
-- ============================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_project_profitability AS
SELECT
  p.company_id,
  p.id AS project_id,
  p.name AS project_name,
  c.name AS client_name,
  c.industry,
  p.project_type,
  p.status,
  p.start_date,
  p.target_end_date,
  p.budget,
  p.cost_to_date,
  CASE WHEN p.budget > 0
    THEN ROUND(((p.budget - p.cost_to_date) / p.budget * 100)::numeric, 2)
    ELSE 0
  END AS margin_pct,
  p.budget - p.cost_to_date AS profit_absolute,
  COUNT(DISTINCT t.id)::int AS total_tasks,
  COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed')::int AS completed_tasks,
  COALESCE(SUM(t.estimated_hours), 0) AS estimated_hours,
  COALESCE(SUM(t.actual_hours), 0) AS actual_hours,
  CASE WHEN COALESCE(SUM(t.estimated_hours), 0) > 0
    THEN ROUND((COALESCE(SUM(t.actual_hours), 0) / NULLIF(SUM(t.estimated_hours), 0) * 100)::numeric, 2)
    ELSE 0
  END AS hours_efficiency_pct
FROM projects p
JOIN clients c ON c.id = p.client_id
LEFT JOIN tasks t ON t.project_id = p.id AND t.deleted_at IS NULL
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.company_id, p.name, c.name, c.industry, p.project_type,
         p.status, p.start_date, p.target_end_date, p.budget, p.cost_to_date
ORDER BY p.company_id, margin_pct DESC
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_project_profitability_pk
  ON mv_project_profitability (company_id, project_id);

CREATE INDEX IF NOT EXISTS idx_mv_project_profitability_company
  ON mv_project_profitability (company_id);

CREATE INDEX IF NOT EXISTS idx_mv_project_profitability_status
  ON mv_project_profitability (company_id, status);

CREATE INDEX IF NOT EXISTS idx_mv_project_profitability_margin
  ON mv_project_profitability (company_id, margin_pct DESC);
