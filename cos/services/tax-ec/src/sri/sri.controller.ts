import { Controller, Get, Post, Put, Delete, Param, Query, Body } from "@nestjs/common"
import { ClientsService } from "./clients.service"

@Controller("clients")
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  findAll(
    @Query("companyId") companyId: string,
    @Query("search") search?: string,
    @Query("status") status?: string,
    @Query("segment") segment?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.clientsService.findAll({
      companyId,
      search,
      status,
      segment,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    })
  }

  @Get("stats")
  getStats(@Query("companyId") companyId: string) {
    return this.clientsService.getStats(companyId)
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.clientsService.findById(id)
  }

  @Get(":id/timeline")
  getTimeline(@Param("id") id: string) {
    return this.clientsService.getTimeline(id)
  }

  @Post()
  create(@Body() data: {
    companyId: string
    name: string
    tradeName?: string
    taxId?: string
    industry?: string
    segment?: string
    email?: string
    phone?: string
    address?: string
    city?: string
    source?: string
    assignedTo?: string
  }) {
    return this.clientsService.create(data)
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() data: any) {
    return this.clientsService.update(id, data)
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.clientsService.remove(id)
  }
}
