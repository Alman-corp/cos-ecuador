import { Injectable, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { v4 as uuid } from "uuid"
import { EmailChannel } from "./channels/email.channel"
import { WhatsAppChannel } from "./channels/whatsapp.channel"
import { SlackChannel } from "./channels/slack.channel"
import { InAppChannel } from "./channels/in-app.channel"
import { TemplatesService } from "./templates/templates.service"
import { NotificationChannel, SendParams, ChannelResult } from "./channels/channel.interface"

export interface NotificationPayload {
  companyId: string
  userId: string | string[]
  channel: string
  type: string
  templateType?: string
  subject?: string
  body?: string
  variables?: Record<string, unknown>
  referenceType?: string
  referenceId?: string
  priority?: number
  metadata?: Record<string, unknown>
}

export interface NotificationResult {
  id: string
  deliveries: ChannelResult[]
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name)
  private supabase: SupabaseClient
  private channels = new Map<string, NotificationChannel>()

  constructor(
    private config: ConfigService,
    private emailChannel: EmailChannel,
    private whatsappChannel: WhatsAppChannel,
    private slackChannel: SlackChannel,
    private inAppChannel: InAppChannel,
    private templatesService: TemplatesService
  ) {
    this.supabase = createClient(
      this.config.get<string>("SUPABASE_URL")!,
      this.config.get<string>("SUPABASE_SERVICE_KEY")!
    )

    this.channels.set("email", emailChannel)
    this.channels.set("whatsapp", whatsappChannel)
    this.channels.set("slack", slackChannel)
    this.channels.set("in_app", inAppChannel)
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    const notificationId = uuid()
    const userIds = Array.isArray(payload.userId) ? payload.userId : [payload.userId]

    let subject = payload.subject
    let body = payload.body

    if (payload.templateType) {
      const rendered = await this.templatesService.renderFromType(
        payload.templateType,
        payload.channel,
        payload.variables ?? {},
        payload.companyId
      )
      if (rendered) {
        subject = rendered.subject ?? subject
        body = rendered.body ?? body
      }
    }

    if (!body) {
      throw new Error("Notification body is required")
    }

    await this.supabase.from("notifications").insert({
      id: notificationId,
      company_id: payload.companyId,
      user_id: userIds[0],
      title: subject ?? body.slice(0, 100),
      body,
      channel: payload.channel,
      type: payload.type,
      reference_type: payload.referenceType ?? null,
      reference_id: payload.referenceId ?? null,
    })

    const channel = this.channels.get(payload.channel)
    if (!channel) {
      throw new Error(`Unsupported channel: ${payload.channel}`)
    }

    const deliveries: ChannelResult[] = []
    for (const userId of userIds) {
      const userChannelConfig = await this.getUserChannelConfig(
        payload.companyId,
        userId,
        payload.channel
      )

      const sendParams: SendParams = {
        to: userChannelConfig?.destination ?? userId,
        subject: subject ?? undefined,
        body,
        variables: payload.variables,
        metadata: {
          ...payload.metadata,
          companyId: payload.companyId,
          type: payload.type,
          referenceType: payload.referenceType,
          referenceId: payload.referenceId,
        },
      }

      const result = await channel.send(sendParams)

      await this.supabase.from("notification_deliveries").insert({
        notification_id: notificationId,
        company_id: payload.companyId,
        user_id: userId,
        channel: payload.channel,
        status: result.success ? "sent" : "failed",
        external_id: result.externalId ?? null,
        error_message: result.error ?? null,
        metadata: payload.metadata ?? {},
      })

      deliveries.push(result)
    }

    if (payload.channel !== "in_app") {
      await this.inAppChannel.send({
        to: userIds,
        subject: subject ?? undefined,
        body,
        metadata: {
          ...payload.metadata,
          companyId: payload.companyId,
          type: payload.type,
          referenceType: payload.referenceType,
          referenceId: payload.referenceId,
        },
      })
    }

    this.logger.log(`Notification ${notificationId} sent via ${payload.channel}`)
    return { id: notificationId, deliveries }
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("user_id", userId)

    if (error) throw new Error(`Failed to mark notification as read: ${error.message}`)
  }

  async getUserNotifications(
    userId: string,
    companyId: string,
    options?: { limit?: number; offset?: number; unreadOnly?: boolean }
  ) {
    let query = this.supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(options?.limit ?? 50)
      .range(options?.offset ?? 0, (options?.offset ?? 0) + (options?.limit ?? 50) - 1)

    if (options?.unreadOnly) {
      query = query.eq("is_read", false)
    }

    const { data, error, count } = await query
    if (error) throw new Error(`Failed to fetch notifications: ${error.message}`)
    return { data: data ?? [], total: count ?? 0 }
  }

  async getUnreadCount(userId: string, companyId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("company_id", companyId)
      .eq("is_read", false)

    if (error) throw new Error(`Failed to count unread: ${error.message}`)
    return count ?? 0
  }

  private async getUserChannelConfig(
    companyId: string,
    userId: string,
    channel: string
  ): Promise<{ destination: string } | null> {
    const { data } = await this.supabase
      .from("notification_channels")
      .select("config")
      .eq("company_id", companyId)
      .eq("channel_type", channel)
      .eq("is_active", true)
      .single()

    if (!data) return null
    return { destination: (data.config as any)?.destination ?? userId }
  }
}
