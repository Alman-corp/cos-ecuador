import { Injectable, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import * as nodemailer from "nodemailer"
import { NotificationChannel, SendParams, ChannelResult } from "./channel.interface"

@Injectable()
export class EmailChannel implements NotificationChannel {
  readonly name = "email"
  private readonly logger = new Logger(EmailChannel.name)
  private transporter: nodemailer.Transporter

  constructor(private config: ConfigService) {
    const host = this.config.get<string>("SMTP_HOST", "smtp.sendgrid.net")
    const port = this.config.get<number>("SMTP_PORT", 587)
    const user = this.config.get<string>("SMTP_USER", "apikey")
    const pass = this.config.get<string>("SMTP_PASS")

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    })
  }

  async send(params: SendParams): Promise<ChannelResult> {
    try {
      const recipients = Array.isArray(params.to) ? params.to.join(", ") : params.to

      const info = await this.transporter.sendMail({
        from: this.config.get<string>("SMTP_FROM", "noreply@cos-ecuador.com"),
        to: recipients,
        subject: params.subject ?? "Notificación",
        html: params.body,
        attachments: params.attachments?.map((a) => ({
          filename: a.filename,
          content: a.content,
        })),
      })

      this.logger.log(`Email sent to ${recipients}: ${info.messageId}`)
      return { success: true, externalId: info.messageId }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown email error"
      this.logger.error(`Email send failed: ${message}`)
      return { success: false, error: message }
    }
  }
}
