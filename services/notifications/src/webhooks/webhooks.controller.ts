import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Headers,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common"
import { WebhooksService } from "./webhooks.service"

@Controller("api/v1/webhooks")
export class WebhooksController {
  constructor(private readonly webhooks: WebhooksService) {}

  @Get()
  async list(@Headers("x-company-id") companyId: string) {
    if (!companyId) throw new BadRequestException("x-company-id header required")
    return this.webhooks.list(companyId)
  }

  @Get("events")
  async listAvailableEvents() {
    return { events: this.webhooks.getAvailableEvents() }
  }

  @Post()
  async create(
    @Headers("x-company-id") companyId: string,
    @Body() body: { url: string; eventTypes: string[]; description?: string },
  ) {
    if (!companyId) throw new BadRequestException("x-company-id header required")
    if (!body.url) throw new BadRequestException("url is required")
    if (!body.eventTypes || body.eventTypes.length === 0) {
      throw new BadRequestException("At least one eventType is required")
    }

    return this.webhooks.create(companyId, body.url, body.eventTypes, body.description)
  }

  @Post(":id/test")
  async test(@Headers("x-company-id") companyId: string, @Param("id") id: string) {
    if (!companyId) throw new BadRequestException("x-company-id header required")
    return this.webhooks.test(id, companyId)
  }

  @Delete(":id")
  async delete(@Headers("x-company-id") companyId: string, @Param("id") id: string) {
    if (!companyId) throw new BadRequestException("x-company-id header required")
    await this.webhooks.delete(id, companyId)
    return { success: true }
  }
}
