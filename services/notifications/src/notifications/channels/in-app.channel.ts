import { Injectable, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { NotificationChannel, SendParams, ChannelResult } from "./channel.interface"

@Injectable()
export class InAppChannel implements NotificationChannel {
  readonly name = "in_app"
  private readonly logger = new Logger(InAppChannel.name)
  private supabase: SupabaseClient

  constructor(private config: ConfigService) {
    this.supabase = createClient(
      this.config.get<string>("SUPABASE_URL")!,
      this.config.get<string>("SUPABASE_SERVICE_KEY")!
    )
  }

  async send(params: SendParams): Promise<ChannelResult> {
    try {
      const recipients = Array.isArray(params.to) ? params.to : [params.to]

      const notifications = recipients.map((userId) => ({
        company_id: (params.metadata?.companyId as string) ?? null,
        user_id: userId,
        title: params.subject ?? "Notificación",
        body: params.body,
        channel: "in_app",
        type: (params.metadata?.type as string) ?? "general",
        reference_type: (params.metadata?.referenceType as string) ?? null,
        reference_id: (params.metadata?.referenceId as string) ?? null,
      }))

      const { data, error } = await this.supabase
        .from("notifications")
        .insert(notifications)
        .select("id")

      if (error) throw new Error(error.message)

      this.logger.log(`In-app notification sent to ${recipients.length} users`)
      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown in-app error"
      this.logger.error(`In-app send failed: ${message}`)
      return { success: false, error: message }
    }
  }
}
