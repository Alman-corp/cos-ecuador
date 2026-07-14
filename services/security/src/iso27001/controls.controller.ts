import { Controller, Get, Post, Param } from "@nestjs/common"
import { ISO27001ControlsService } from "./controls.service"

@Controller("api/v1/iso27001")
export class ISO27001ControlsController {
  constructor(private readonly service: ISO27001ControlsService) {}

  @Get("compliance/:tenantId")
  async getComplianceReport(@Param("tenantId") tenantId: string) {
    return this.service.generateComplianceReport(tenantId)
  }

  @Get("controls/:tenantId")
  async getControlsStatus(@Param("tenantId") tenantId: string) {
    return this.service.getControlsStatus(tenantId)
  }

  @Post("validate/:tenantId")
  async runValidation(@Param("tenantId") tenantId: string) {
    return this.service.runFullValidation(tenantId)
  }

  @Get("summary/:tenantId")
  async getSummary(@Param("tenantId") tenantId: string) {
    return this.service.getSummary(tenantId)
  }
}
