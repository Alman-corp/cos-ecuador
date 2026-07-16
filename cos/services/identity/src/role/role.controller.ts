import { Controller, Get, Post, Put, Param, Body, Query } from "@nestjs/common"
import { RoleService } from "./role.service"

@Controller("roles")
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  findAll(@Query("companyId") companyId: string) {
    return this.roleService.findAll(companyId)
  }

  @Post()
  create(@Body() data: { companyId: string; name: string; description?: string; permissions?: any[] }) {
    return this.roleService.create(data)
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() data: any) {
    return this.roleService.update(id, data)
  }
}
