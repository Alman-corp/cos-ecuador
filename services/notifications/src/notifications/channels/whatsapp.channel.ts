import { Injectable, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { NotificationChannel, SendParams, ChannelResult } from "./channel.interface"

@Injectable()
export class WhatsAppChannel implements NotificationChannel {
  readonly name = "whatsapp"
  private readonly logger = new Logger(WhatsAppChannel.name)
  private twilioClient: any

  constructor(private config: ConfigService) {
    const accountSid = this.config.get<string>("TWILIO_ACCOUNT_SID")
    const authToken = this.config.get<string>("TWILIO_AUTH_TOKEN")
    if (accountSid && authToken) {
      this.twilioClient = require("twilio")(accountSid, authToken)
    }
  }

  async send(params: SendParams): Promise<ChannelResult> {
    try {
      if (!this.twilioClient) {
        return { success: false, error: "Twilio not configured" }
      }

      const from = `whatsapp:${this.config.get<string>("TWILIO_WHATSAPP_FROM", "+14155238886")}`
      const to = typeof params.to === "string" ? params.to : params.to[0]
      const toNumber = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`

      const message = await this.twilioClient.messages.create({
        from,
        to: toNumber,
        body: `${params.subject ? `*${params.subject}*\n\n` : ""}${params.body}`,
      })

      this.logger.log(`WhatsApp sent to ${toNumber}: ${message.sid}`)
      return { success: true, externalId: message.sid }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown WhatsApp error"
      this.logger.error(`WhatsApp send failed: ${message}`)
      return { success: false, error: message }
    }
  }
}
