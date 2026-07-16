import { Controller, Get, Post, Put, Delete, Param, Body } from "@nestjs/common"
import { MeetingsService } from "./meetings.service"

@Controller("clients/:clientId/meetings")
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Get()
  findByClient(@Param("clientId") clientId: string) {
    return this.meetingsService.findByClient(clientId)
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.meetingsService.findById(id)
  }

  @Post()
  create(@Param("clientId") clientId: string, @Body() data: any) {
    return this.meetingsService.create({ ...data, clientCompanyId: clientId })
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() data: any) {
    return this.meetingsService.update(id, data)
  }

  @Post(":id/complete")
  complete(@Param("id") id: string, @Body("minutes") minutes?: string) {
    return this.meetingsService.complete(id, minutes)
  }

  @Post(":id/cancel")
  cancel(@Param("id") id: string) {
    return this.meetingsService.cancel(id)
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.meetingsService.remove(id)
  }
}
