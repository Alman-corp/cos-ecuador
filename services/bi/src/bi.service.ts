import { Injectable, Logger } from "@nestjs/common"
import { Cron, CronExpression } from "@nestjs/schedule"
import { PrismaService } from "@cos/prisma"

@Injectable()
export class BusinessIntelligenceService {
  private readonly logger = new Logger(BusinessIntelligenceService.name)

  constructor(private readonly prisma: PrismaService) {}

  async getExecutiveDashboard(companyId: string) {
    const [mrr, arr, activeClients, churnRate, pipelineWeighted, utilization] = await Promise.all([
      this.getMRRSummary(companyId),
      this.getARRSummary(companyId),
      this.getActiveClientCount(companyId),
      this.getChurnRate(companyId),
      this.getPipelineWeightedValue(companyId),
      this.getUtilizationRate(companyId),
    ])
    const prevMonthMrr = await this.getMRRSummary(companyId, -1)
    const momGrowth = prevMonthMrr.total > 0 ? ((mrr.total - prevMonthMrr.total) / prevMonthMrr.total) * 100 : 0
    return { mrr, arr, activeClients, churnRate, pipelineWeighted, utilization, momGrowth }
  }

  async getMRRMetrics(companyId: string) {
    const [actual, history, byPlan] = await Promise.all([
      this.getMRRSummary(companyId),
      this.getMRRHistory(companyId),
      this.getMRRByPlan(companyId),
    ])
    const prev = history.length >= 2 ? history[history.length - 2] : null
    const momGrowth = prev && prev.mrr > 0 ? ((actual.total - prev.mrr) / prev.mrr) * 100 : 0
    return { current: actual.total, arr: actual.total * 12, momGrowth, history, byPlan }
  }

  async getClientMetrics(companyId: string) {
    const [total, active, churned, ltv, churnRate, cohortRetention] = await Promise.all([
      this.prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(*)::int AS total FROM clients WHERE company_id = $1 AND deleted_at IS NULL`, companyId),
      this.prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(*)::int AS count FROM clients WHERE company_id = $1 AND status = 'active' AND deleted_at IS NULL`, companyId),
      this.prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(*)::int AS count FROM clients WHERE company_id = $1 AND status = 'churned' AND deleted_at IS NULL`, companyId),
      this.getLTV(companyId),
      this.getChurnRate(companyId),
      this.calculateCohortRetention(companyId),
    ])
    return {
      total: Number(total[0]?.total ?? 0),
      active: Number(active[0]?.count ?? 0),
      churned: Number(churned[0]?.count ?? 0),
      ltv: ltv,
      churnRate: churnRate,
      cohortRetention,
    }
  }

  async getRevenueMetrics(companyId: string) {
    const [byService, byIndustry, monthly] = await Promise.all([
      this.getRevenueByService(companyId),
      this.getRevenueByIndustry(companyId),
      this.getRevenueMonthly(companyId),
    ])
    return { byService, byIndustry, monthly }
  }

  async getPipelineMetrics(companyId: string) {
    const [byStage, weighted, totalValue] = await Promise.all([
      this.getPipelineByStage(companyId),
      this.getPipelineWeightedValue(companyId),
      this.getPipelineTotalValue(companyId),
    ])
    return { byStage, weightedValue: weighted, totalValue }
  }

  async getUtilizationMetrics(companyId: string) {
    const [overall, byUser] = await Promise.all([
      this.getUtilizationRate(companyId),
      this.getUtilizationByUser(companyId),
    ])
    return { overall, byUser }
  }

  async calculateCohortRetention(companyId: string) {
    return this.prisma.$queryRawUnsafe<any[]>(`
      SELECT
        cohort_month,
        period_offset,
        active_clients,
        FIRST_VALUE(active_clients) OVER (PARTITION BY cohort_month ORDER BY period_offset) AS initial_clients,
        ROUND(
          100.0 * active_clients / NULLIF(FIRST_VALUE(active_clients) OVER (PARTITION BY cohort_month ORDER BY period_offset), 0),
          2
        ) AS retention_pct
      FROM mv_subscriptions_history
      WHERE company_id = $1
      ORDER BY cohort_month, period_offset`, companyId)
  }

  async refreshMaterializedViews() {
    this.logger.log("Refreshing materialized views...")
    const views = [
      "mv_subscriptions_summary",
      "mv_subscriptions_history",
      "mv_revenue_transactions",
      "mv_project_profitability",
    ]
    for (const view of views) {
      try {
        await this.prisma.$executeRawUnsafe(`REFRESH MATERIALIZED VIEW CONCURRENTLY ${view}`)
        this.logger.log(`Refreshed ${view}`)
      } catch (err) {
        this.logger.error(`Failed to refresh ${view}: ${err instanceof Error ? err.message : err}`)
      }
    }
    this.logger.log("Materialized view refresh complete")
    return { refreshed: true, timestamp: new Date().toISOString() }
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleCronRefresh() {
    this.logger.log("Scheduled refresh of materialized views")
    await this.refreshMaterializedViews()
  }

  private async getMRRSummary(companyId: string, monthOffset = 0) {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT
        COUNT(*)::int AS total_subscriptions,
        COALESCE(SUM(bs.price_monthly), 0) AS total_mrr
      FROM billing_subscriptions s
      JOIN billing_plans bs ON bs.id = s.plan_id
      WHERE s.company_id = $1 AND s.status = 'active'
        AND (s.trial_ends_at IS NULL OR s.trial_ends_at < NOW())`, companyId)
    const row = rows[0] ?? { total_subscriptions: 0, total_mrr: 0 }
    return { total: Number(row.total_mrr), subscriptions: Number(row.total_subscriptions) }
  }

  private async getARRSummary(companyId: string) {
    const mrr = await this.getMRRSummary(companyId)
    return { total: mrr.total * 12, mrrBase: mrr.total }
  }

  private async getActiveClientCount(companyId: string) {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(*)::int AS count FROM clients
      WHERE company_id = $1 AND status = 'active' AND deleted_at IS NULL`, companyId)
    return Number(rows[0]?.count ?? 0)
  }

  private async getChurnRate(companyId: string) {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(`
      WITH monthly_counts AS (
        SELECT
          DATE_TRUNC('month', created_at) AS month,
          COUNT(*) FILTER (WHERE status = 'churned')::int AS churned,
          COUNT(*)::int AS total
        FROM clients
        WHERE company_id = $1 AND deleted_at IS NULL
        GROUP BY DATE_TRUNC('month', created_at)
      )
      SELECT
        CASE WHEN SUM(total) > 0
          THEN ROUND(100.0 * SUM(churned) / NULLIF(SUM(total), 0), 2)
          ELSE 0
        END AS churn_rate
      FROM monthly_counts`, companyId)
    return Number(rows[0]?.churn_rate ?? 0)
  }

  private async getLTV(companyId: string) {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT
        CASE WHEN COUNT(DISTINCT s.company_id) > 0
          THEN ROUND(
            (COALESCE(SUM(i.amount), 0) / NULLIF(COUNT(DISTINCT s.company_id), 0))::numeric, 2
          )
          ELSE 0
        END AS ltv
      FROM billing_subscriptions s
      LEFT JOIN billing_invoices i ON i.subscription_id = s.id AND i.status = 'paid'
      WHERE s.company_id = $1`, companyId)
    return Number(rows[0]?.ltv ?? 0)
  }

  private async getPipelineWeightedValue(companyId: string) {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT COALESCE(SUM(value * probability / 100.0), 0) AS weighted
      FROM opportunities
      WHERE company_id = $1 AND stage NOT IN ('closed_won', 'closed_lost')`, companyId)
    return Number(rows[0]?.weighted ?? 0)
  }

  private async getPipelineTotalValue(companyId: string) {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT COALESCE(SUM(value), 0) AS total
      FROM opportunities
      WHERE company_id = $1 AND stage NOT IN ('closed_won', 'closed_lost')`, companyId)
    return Number(rows[0]?.total ?? 0)
  }

  private async getPipelineByStage(companyId: string) {
    return this.prisma.$queryRawUnsafe<any[]>(`
      SELECT stage, COUNT(*)::int AS count, COALESCE(SUM(value), 0) AS value
      FROM opportunities
      WHERE company_id = $1 AND stage NOT IN ('closed_won', 'closed_lost')
      GROUP BY stage
      ORDER BY stage`, companyId)
  }

  private async getUtilizationRate(companyId: string) {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(`
      WITH user_hours AS (
        SELECT
          u.id,
          COALESCE(SUM(t.actual_hours), 0) AS billable_hours,
          COUNT(*) FILTER (WHERE t.status = 'completed')::int AS completed_tasks
        FROM users u
        LEFT JOIN tasks t ON t.assigned_to = u.id
          AND t.created_at >= DATE_TRUNC('month', NOW())
          AND t.created_at < DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
        WHERE u.company_id = $1 AND u.is_active = true
        GROUP BY u.id
      )
      SELECT
        COUNT(*)::int AS total_users,
        COALESCE(SUM(billable_hours), 0) AS total_billable,
        CASE WHEN COUNT(*) > 0
          THEN ROUND((COALESCE(SUM(billable_hours), 0) / (COUNT(*) * 160.0)) * 100, 2)
          ELSE 0
        END AS utilization_pct
      FROM user_hours`, companyId)
    return {
      percentage: Number(rows[0]?.utilization_pct ?? 0),
      billableHours: Number(rows[0]?.total_billable ?? 0),
      totalUsers: Number(rows[0]?.total_users ?? 0),
    }
  }

  private async getUtilizationByUser(companyId: string) {
    return this.prisma.$queryRawUnsafe<any[]>(`
      SELECT
        u.id, u.first_name || ' ' || u.last_name AS full_name,
        COALESCE(SUM(t.actual_hours), 0) AS billable_hours,
        ROUND((COALESCE(SUM(t.actual_hours), 0) / 160.0) * 100, 2) AS utilization_pct
      FROM users u
      LEFT JOIN tasks t ON t.assigned_to = u.id
        AND t.created_at >= DATE_TRUNC('month', NOW())
        AND t.created_at < DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
      WHERE u.company_id = $1 AND u.is_active = true
      GROUP BY u.id, u.first_name, u.last_name
      ORDER BY utilization_pct DESC`, companyId)
  }

  private async getMRRHistory(companyId: string) {
    return this.prisma.$queryRawUnsafe<any[]>(`
      SELECT
        month,
        total_mrr AS mrr,
        subscriptions_count AS subscriptions
      FROM mv_subscriptions_summary
      WHERE company_id = $1
      ORDER BY month ASC`, companyId)
  }

  private async getMRRByPlan(companyId: string) {
    return this.prisma.$queryRawUnsafe<any[]>(`
      SELECT
        bp.name AS plan_name,
        COUNT(*)::int AS subscriptions,
        COALESCE(SUM(bp.price_monthly), 0) AS mrr
      FROM billing_subscriptions s
      JOIN billing_plans bp ON bp.id = s.plan_id
      WHERE s.company_id = $1 AND s.status = 'active'
      GROUP BY bp.name
      ORDER BY mrr DESC`, companyId)
  }

  private async getRevenueByService(companyId: string) {
    return this.prisma.$queryRawUnsafe<any[]>(`
      SELECT
        p.project_type AS service,
        COUNT(DISTINCT p.id)::int AS projects,
        COALESCE(SUM(p.budget), 0) AS budgeted,
        COALESCE(SUM(p.cost_to_date), 0) AS earned
      FROM projects p
      WHERE p.company_id = $1 AND p.status IN ('in_progress', 'completed')
      GROUP BY p.project_type
      ORDER BY earned DESC`, companyId)
  }

  private async getRevenueByIndustry(companyId: string) {
    return this.prisma.$queryRawUnsafe<any[]>(`
      SELECT
        c.industry,
        COUNT(DISTINCT p.id)::int AS projects,
        COALESCE(SUM(p.budget), 0) AS budgeted,
        COALESCE(SUM(p.cost_to_date), 0) AS earned
      FROM projects p
      JOIN clients c ON c.id = p.client_id
      WHERE p.company_id = $1 AND p.status IN ('in_progress', 'completed')
      GROUP BY c.industry
      ORDER BY earned DESC`, companyId)
  }

  private async getRevenueMonthly(companyId: string) {
    return this.prisma.$queryRawUnsafe<any[]>(`
      SELECT
        DATE_TRUNC('month', i.created_at) AS month,
        COUNT(*)::int AS invoices,
        COALESCE(SUM(i.amount), 0) AS revenue,
        COALESCE(SUM(i.amount) FILTER (WHERE i.status = 'paid'), 0) AS collected
      FROM billing_invoices i
      WHERE i.company_id = $1 AND i.status IN ('paid', 'pending')
      GROUP BY DATE_TRUNC('month', i.created_at)
      ORDER BY month DESC
      LIMIT 24`, companyId)
  }
}
