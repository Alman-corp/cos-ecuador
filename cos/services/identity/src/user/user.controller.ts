import { Controller, Get, Post, Put, Param, Body, Query } from "@nestjs/common"
import { UserService } from "./user.service"

@Controller("users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll(@Query("companyId") companyId: string) {
    return this.userService.findAll(companyId)
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.userService.findById(id)
  }

  @Post()
  create(@Body() data: {
    email: string
    firstName: string
    lastName: string
    companyId: string
    departmentId?: string
    position?: string
    roleIds?: string[]
  }) {
    return this.userService.create(data)
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() data: any) {
    return this.userService.update(id, data)
  }
}
