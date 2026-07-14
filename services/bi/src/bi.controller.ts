import { Controller, Get, Post, Query } from "@nestjs/common"
import { BusinessIntelligenceService } from "./bi.service"

@Controller("api/v1/bi")
export class BIController {
  constructor(private readonly bi: BusinessIntelligenceService) {}

  @Get("executive")
  getExecutiveDashboard(@Query("companyId") companyId: string) {
    return this.bi.getExecutiveDashboard(companyId)
  }

  @Get("mrr")
  getMRRMetrics(@Query("companyId") companyId: string) {
    return this.bi.getMRRMetrics(companyId)
  }

  @Get("clients")
  getClientMetrics(@Query("companyId") companyId: string) {
    return this.bi.getClientMetrics(companyId)
  }

  @Get("revenue")
  getRevenueMetrics(@Query("companyId") companyId: string) {
    return this.bi.getRevenueMetrics(companyId)
  }

  @Get("pipeline")
  getPipelineMetrics(@Query("companyId") companyId: string) {
    return this.bi.getPipelineMetrics(companyId)
  }

  @Get("utilization")
  getUtilizationMetrics(@Query("companyId") companyId: string) {
    return this.bi.getUtilizationMetrics(companyId)
  }

  @Post("refresh")
  refreshMaterializedViews() {
    return this.bi.refreshMaterializedViews()
  }
}
