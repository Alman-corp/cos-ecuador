import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  Headers,
  UnauthorizedException,
} from "@nestjs/common"
import { NotificationsService, NotificationPayload } from "./notifications.service"

@Controller("api/v1/notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post("send")
  async send(
    @Body() payload: NotificationPayload,
    @Headers("x-api-key") apiKey?: string
  ) {
    this.validateApiKey(apiKey)
    return this.notifications.send(payload)
  }

  @Get(":userId")
  async list(
    @Param("userId") userId: string,
    @Query("companyId") companyId: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
    @Query("unreadOnly") unreadOnly?: string
  ) {
    if (!companyId) throw new Error("companyId is required")
    return this.notifications.getUserNotifications(userId, companyId, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      unreadOnly: unreadOnly === "true",
    })
  }

  @Get(":userId/unread-count")
  async unreadCount(
    @Param("userId") userId: string,
    @Query("companyId") companyId: string
  ) {
    if (!companyId) throw new Error("companyId is required")
    const count = await this.notifications.getUnreadCount(userId, companyId)
    return { unreadCount: count }
  }

  @Patch(":id/read")
  async markRead(
    @Param("id") id: string,
    @Body("userId") userId: string
  ) {
    await this.notifications.markAsRead(id, userId)
    return { success: true }
  }

  private validateApiKey(apiKey?: string) {
    const expected = process.env.NOTIFICATIONS_API_KEY
    if (expected && apiKey !== expected) {
      throw new UnauthorizedException("Invalid API key")
    }
  }
}
