import { Injectable, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { NotificationChannel, SendParams, ChannelResult } from "./channel.interface"

@Injectable()
export class SlackChannel implements NotificationChannel {
  readonly name = "slack"
  private readonly logger = new Logger(SlackChannel.name)
  private webhookUrl: string

  constructor(private config: ConfigService) {
    this.webhookUrl = this.config.get<string>("SLACK_WEBHOOK_URL", "")
  }

  async send(params: SendParams): Promise<ChannelResult> {
    try {
      if (!this.webhookUrl) {
        return { success: false, error: "Slack webhook not configured" }
      }

      const blocks: any[] = []

      if (params.subject) {
        blocks.push({
          type: "header",
          text: { type: "plain_text", text: params.subject },
        })
      }

      blocks.push({
        type: "section",
        text: { type: "mrkdwn", text: params.body },
      })

      if (params.metadata) {
        const fields = Object.entries(params.metadata).map(([key, value]) => ({
          type: "mrkdwn",
          text: `*${key}:* ${value}`,
        }))
        blocks.push({ type: "section", fields })
      }

      const response = await fetch(this.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: params.subject ?? params.body, blocks }),
      })

      if (!response.ok) {
        const text = await response.text()
        return { success: false, error: `Slack API error: ${text}` }
      }

      this.logger.log(`Slack notification sent`)
      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown Slack error"
      this.logger.error(`Slack send failed: ${message}`)
      return { success: false, error: message }
    }
  }
}
