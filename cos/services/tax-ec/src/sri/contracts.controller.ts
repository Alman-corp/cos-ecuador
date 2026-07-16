import { Controller, Get, Post, Put, Delete, Param, Body } from "@nestjs/common"
import { ContractsService } from "./contracts.service"

@Controller("clients/:clientId/contracts")
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get()
  findByClient(@Param("clientId") clientId: string) {
    return this.contractsService.findByClient(clientId)
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.contractsService.findById(id)
  }

  @Post()
  create(@Param("clientId") clientId: string, @Body() data: any) {
    return this.contractsService.create({ ...data, clientCompanyId: clientId })
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() data: any) {
    return this.contractsService.update(id, data)
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.contractsService.remove(id)
  }
}
