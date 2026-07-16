import { Controller, Get, Post, Put, Param, Body } from "@nestjs/common"
import { CompanyService } from "./company.service"

@Controller("companies")
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  findAll() {
    return this.companyService.findAll()
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.companyService.findById(id)
  }

  @Post()
  create(@Body() data: { name: string; slug: string; taxId?: string; email?: string; phone?: string }) {
    return this.companyService.create(data)
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() data: any) {
    return this.companyService.update(id, data)
  }

  @Get(":id/org-chart")
  getOrgChart(@Param("id") id: string) {
    return this.companyService.getOrgChart(id)
  }
}
