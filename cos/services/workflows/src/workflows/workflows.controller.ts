import { Controller, Get, Post, Put, Delete, Param, Query, Body } from "@nestjs/common"
import { WorkflowsService } from "./workflows.service"

@Controller("workflows")
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  // --- Definitions ---

  @Get("definitions")
  findDefinitions(
    @Query("companyId") companyId: string,
    @Query("category") category?: string,
  ) {
    return this.workflowsService.findDefinitions(companyId, category)
  }

  @Get("definitions/:id")
  findDefinitionById(@Param("id") id: string) {
    return this.workflowsService.findDefinitionById(id)
  }

  @Post("definitions")
  createDefinition(@Body() data: {
    companyId: string
    name: string
    description?: string
    category?: string
    steps: any[]
  }) {
    return this.workflowsService.createDefinition(data)
  }

  @Put("definitions/:id")
  updateDefinition(@Param("id") id: string, @Body() data: any) {
    return this.workflowsService.updateDefinition(id, data)
  }

  @Delete("definitions/:id")
  removeDefinition(@Param("id") id: string) {
    return this.workflowsService.removeDefinition(id)
  }

  // --- Instances ---

  @Get("instances")
  findInstances(
    @Query("companyId") companyId: string,
    @Query("status") status?: string,
    @Query("definitionId") definitionId?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.workflowsService.findInstances({
      companyId,
      status,
      definitionId,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    })
  }

  @Get("instances/:id")
  findInstanceById(@Param("id") id: string) {
    return this.workflowsService.findInstanceById(id)
  }

  @Post("instances")
  startInstance(@Body() data: {
    workflowDefinitionId: string
    companyId: string
    title: string
    clientCompanyId?: string
    context?: any
    assignedTo?: string
  }) {
    return this.workflowsService.startInstance(data)
  }

  @Post("instances/:id/advance")
  advanceStep(
    @Param("id") id: string,
    @Body() params: { stepKey: string; result?: any; notes?: string; performedBy?: string },
  ) {
    return this.workflowsService.advanceStep(id, params)
  }

  @Post("instances/:id/cancel")
  cancelInstance(@Param("id") id: string) {
    return this.workflowsService.cancelInstance(id)
  }

  @Get("stats")
  getStats(@Query("companyId") companyId: string) {
    return this.workflowsService.getStats(companyId)
  }
}
