import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"

@Injectable()
export class WorkflowsService {
  constructor(private prisma: PrismaService) {}

  // --- Workflow Definitions ---

  async findDefinitions(companyId: string, category?: string) {
    const where: any = { companyId }
    if (category) where.category = category
    return this.prisma.workflowDefinition.findMany({
      where,
      include: { _count: { select: { instances: true } } },
      orderBy: { name: "asc" },
    })
  }

  async findDefinitionById(id: string) {
    const def = await this.prisma.workflowDefinition.findUnique({
      where: { id },
      include: { triggers: true, _count: { select: { instances: true } } },
    })
    if (!def) throw new NotFoundException("Workflow definition not found")
    return def
  }

  async createDefinition(data: {
    companyId: string
    name: string
    description?: string
    category?: string
    steps: any[]
  }) {
    return this.prisma.workflowDefinition.create({
      data: {
        companyId: data.companyId,
        name: data.name,
        description: data.description,
        category: data.category,
        steps: data.steps,
      },
    })
  }

  async updateDefinition(id: string, data: Partial<{
    name: string
    description: string
    category: string
    steps: any[]
    isActive: boolean
  }>) {
    const def = await this.prisma.workflowDefinition.findUnique({ where: { id } })
    if (!def) throw new NotFoundException("Workflow definition not found")

    const updateData: any = { ...data }
    if (data.steps) updateData.steps = data.steps
    return this.prisma.workflowDefinition.update({
      where: { id },
      data: { ...updateData, version: { increment: 1 } },
    })
  }

  async removeDefinition(id: string) {
    const def = await this.prisma.workflowDefinition.findUnique({ where: { id } })
    if (!def) throw new NotFoundException("Workflow definition not found")
    const runningCount = await this.prisma.workflowInstance.count({
      where: { workflowDefinitionId: id, status: { in: ["pending", "running"] } },
    })
    if (runningCount > 0) {
      throw new BadRequestException("Cannot delete definition with active instances")
    }
    return this.prisma.workflowDefinition.update({
      where: { id },
      data: { isActive: false },
    })
  }

  // --- Workflow Instances ---

  async findInstances(params: {
    companyId: string
    status?: string
    definitionId?: string
    page?: number
    limit?: number
  }) {
    const { companyId, status, definitionId, page = 1, limit = 20 } = params
    const where: any = { companyId }
    if (status) where.status = status
    if (definitionId) where.workflowDefinitionId = definitionId

    const [data, total] = await Promise.all([
      this.prisma.workflowInstance.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          workflowDefinition: { select: { id: true, name: true, category: true } },
          _count: { select: { stepResults: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.workflowInstance.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async findInstanceById(id: string) {
    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id },
      include: {
        workflowDefinition: true,
        stepResults: { orderBy: { startedAt: "asc" } },
      },
    })
    if (!instance) throw new NotFoundException("Workflow instance not found")
    return instance
  }

  async startInstance(data: {
    workflowDefinitionId: string
    companyId: string
    title: string
    clientCompanyId?: string
    context?: any
    assignedTo?: string
  }) {
    const def = await this.prisma.workflowDefinition.findUnique({
      where: { id: data.workflowDefinitionId },
    })
    if (!def) throw new NotFoundException("Workflow definition not found")
    if (!def.isActive) throw new BadRequestException("Workflow definition is inactive")

    const steps = def.steps as any[]
    const firstStep = steps.length > 0 ? steps[0].key : null

    return this.prisma.workflowInstance.create({
      data: {
        workflowDefinitionId: data.workflowDefinitionId,
        companyId: data.companyId,
        title: data.title,
        clientCompanyId: data.clientCompanyId,
        context: data.context ?? {},
        assignedTo: data.assignedTo,
        status: "running",
        currentStep: firstStep,
        startedAt: new Date(),
        stepResults: firstStep
          ? { create: { stepKey: firstStep, status: "in_progress", startedAt: new Date() } }
          : undefined,
      },
      include: { stepResults: true },
    })
  }

  async advanceStep(instanceId: string, params: {
    stepKey: string
    result?: any
    notes?: string
    performedBy?: string
  }) {
    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: { workflowDefinition: true },
    })
    if (!instance) throw new NotFoundException("Workflow instance not found")
    if (instance.status !== "running") {
      throw new BadRequestException("Instance is not running")
    }

    const steps = instance.workflowDefinition.steps as any[]
    const currentIdx = steps.findIndex((s: any) => s.key === params.stepKey)
    if (currentIdx === -1) throw new BadRequestException("Invalid step key")

    // Mark current step as completed
    await this.prisma.workflowStepResult.upsert({
      where: { instanceId_stepKey: { instanceId, stepKey: params.stepKey } },
      update: {
        status: "completed",
        result: params.result ?? {},
        notes: params.notes,
        performedBy: params.performedBy,
        completedAt: new Date(),
      },
      create: {
        instanceId,
        stepKey: params.stepKey,
        status: "completed",
        result: params.result ?? {},
        notes: params.notes,
        performedBy: params.performedBy,
        completedAt: new Date(),
      },
    })

    // Move to next step or complete
    const nextStep = steps[currentIdx + 1] as any
    if (nextStep) {
      await this.prisma.workflowStepResult.create({
        data: {
          instanceId,
          stepKey: nextStep.key,
          status: "in_progress",
          startedAt: new Date(),
        },
      })
      return this.prisma.workflowInstance.update({
        where: { id: instanceId },
        data: { currentStep: nextStep.key, updatedAt: new Date() },
        include: { stepResults: { orderBy: { startedAt: "asc" } } },
      })
    } else {
      return this.prisma.workflowInstance.update({
        where: { id: instanceId },
        data: { status: "completed", currentStep: null, completedAt: new Date() },
        include: { stepResults: { orderBy: { startedAt: "asc" } } },
      })
    }
  }

  async cancelInstance(instanceId: string) {
    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: instanceId },
    })
    if (!instance) throw new NotFoundException("Workflow instance not found")
    if (["completed", "cancelled", "failed"].includes(instance.status)) {
      throw new BadRequestException("Cannot cancel a finished instance")
    }
    return this.prisma.workflowInstance.update({
      where: { id: instanceId },
      data: { status: "cancelled", updatedAt: new Date() },
    })
  }

  async getStats(companyId: string) {
    const [total, running, completed, cancelled, byCategory] = await Promise.all([
      this.prisma.workflowInstance.count({ where: { companyId } }),
      this.prisma.workflowInstance.count({ where: { companyId, status: "running" } }),
      this.prisma.workflowInstance.count({ where: { companyId, status: "completed" } }),
      this.prisma.workflowInstance.count({ where: { companyId, status: "cancelled" } }),
      this.prisma.workflowDefinition.groupBy({
        by: ["category"],
        where: { companyId, isActive: true },
        _count: true,
      }),
    ])
    return { total, running, completed, cancelled, byCategory }
  }
}
