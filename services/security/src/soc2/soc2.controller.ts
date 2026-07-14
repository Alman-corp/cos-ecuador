import { Controller, Get, Post, Param, Body } from "@nestjs/common"
import { Soc2Service } from "./soc2.service"

@Controller("api/v1/soc2")
export class Soc2Controller {
  constructor(private readonly service: Soc2Service) {}

  @Get("trust-services/:tenantId")
  async getTrustServices(@Param("tenantId") tenantId: string) {
    return this.service.getTrustServices(tenantId)
  }

  @Get("trust-services/:tenantId/:service")
  async getTrustService(
    @Param("tenantId") tenantId: string,
    @Param("service") service: string,
  ) {
    return this.service.getTrustService(tenantId, service)
  }

  @Post("audit/:tenantId")
  async triggerAudit(@Param("tenantId") tenantId: string) {
    return this.service.triggerAudit(tenantId)
  }

  @Get("evidence/:tenantId")
  async getEvidenceStatus(@Param("tenantId") tenantId: string) {
    return this.service.getEvidenceStatus(tenantId)
  }

  @Get("summary/:tenantId")
  async getSummary(@Param("tenantId") tenantId: string) {
    return this.service.getReadinessSummary(tenantId)
  }
}
