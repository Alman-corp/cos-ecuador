import { NotificationTemplate } from "@prisma/client"

export interface SendParams {
  to: string | string[]
  subject?: string
  body: string
  template?: NotificationTemplate
  variables?: Record<string, unknown>
  attachments?: Array<{ filename: string; content: Buffer }>
  metadata?: Record<string, unknown>
}

export interface ChannelResult {
  success: boolean
  externalId?: string
  error?: string
}

export interface NotificationChannel {
  readonly name: string
  send(params: SendParams): Promise<ChannelResult>
}
