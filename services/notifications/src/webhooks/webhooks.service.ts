import { Injectable, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { createHmac, timingSafeEqual, randomBytes } from "crypto"

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name)
  private supabase: SupabaseClient
  private readonly table = "webhook_subscriptions"

  constructor(private config: ConfigService) {
    this.supabase = createClient(
      this.config.get<string>("SUPABASE_URL")!,
      this.config.get<string>("SUPABASE_SERVICE_KEY")!
    )
  }

  async list(companyId: string) {
    const { data, error } = await this.supabase
      .from(this.table)
      .select("id, url, event_types, is_active, last_triggered_at, last_status, description, created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })

    if (error) throw new Error(`Failed to list webhooks: ${error.message}`)
    return data ?? []
  }

  async create(companyId: string, url: string, eventTypes: string[], description?: string) {
    const signingSecret = `whsec_${randomBytes(32).toString("hex")}`

    const { data, error } = await this.supabase
      .from(this.table)
      .insert({
        company_id: companyId,
        url,
        event_types: eventTypes,
        signing_secret: signingSecret,
        is_active: true,
        description: description ?? null,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create webhook: ${error.message}`)

    return {
      ...data,
      signingSecret,
      message: "Guarda el signingSecret: no se mostrará de nuevo.",
    }
  }

  async delete(id: string, companyId: string) {
    const { error } = await this.supabase
      .from(this.table)
      .delete()
      .eq("id", id)
      .eq("company_id", companyId)

    if (error) throw new Error(`Failed to delete webhook: ${error.message}`)
  }

  async test(id: string, companyId: string): Promise<{ success: boolean; status?: number; error?: string }> {
    const { data: webhook, error } = await this.supabase
      .from(this.table)
      .select("*")
      .eq("id", id)
      .eq("company_id", companyId)
      .single()

    if (error || !webhook) return { success: false, error: "Webhook no encontrado" }

    const testPayload = {
      event: "test.ping",
      timestamp: new Date().toISOString(),
      data: { message: "Webhook configurado correctamente desde COS" },
    }

    const bodyString = JSON.stringify(testPayload)
    const signature = this.signPayload(bodyString, webhook.signing_secret)

    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-COS-Signature": `sha256=${signature}`,
          "X-COS-Event": "test.ping",
          "X-COS-Timestamp": testPayload.timestamp,
          "User-Agent": "COS-Webhooks/1.0",
        },
        body: bodyString,
      })

      await this.supabase
        .from(this.table)
        .update({ last_status: response.status, last_triggered_at: new Date().toISOString() })
        .eq("id", id)

      return { success: response.ok, status: response.status }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  async triggerEvent(companyId: string, eventType: string, payload: Record<string, unknown>) {
    const { data: subscriptions, error } = await this.supabase
      .from(this.table)
      .select("*")
      .eq("company_id", companyId)
      .eq("is_active", true)

    if (error || !subscriptions) return

    const matching = subscriptions.filter((sub: any) =>
      (sub.event_types as string[]).includes(eventType)
    )

    await Promise.allSettled(
      matching.map((sub: any) => this.deliver(sub, eventType, payload))
    )

    if (matching.length > 0) {
      await this.supabase
        .from(this.table)
        .update({ last_triggered_at: new Date().toISOString() })
        .in(
          "id",
          matching.map((s: any) => s.id)
        )
    }
  }

  private async deliver(subscription: any, eventType: string, payload: Record<string, unknown>) {
    const body = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data: payload,
    }

    const bodyString = JSON.stringify(body)
    const signature = this.signPayload(bodyString, subscription.signing_secret)

    try {
      const response = await fetch(subscription.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-COS-Signature": `sha256=${signature}`,
          "X-COS-Event": eventType,
          "X-COS-Timestamp": body.timestamp,
          "User-Agent": "COS-Webhooks/1.0",
        },
        body: bodyString,
      })

      await this.supabase
        .from(this.table)
        .update({ last_status: response.status })
        .eq("id", subscription.id)

      if (!response.ok) {
        await this.scheduleRetry(subscription.id, eventType, payload)
      }
    } catch {
      await this.scheduleRetry(subscription.id, eventType, payload)
    }
  }

  private async scheduleRetry(subscriptionId: string, eventType: string, payload: Record<string, unknown>) {
    const { data: sub } = await this.supabase
      .from(this.table)
      .select("signing_secret")
      .eq("id", subscriptionId)
      .single()

    if (!sub) {
      await this.supabase
        .from(this.table)
        .update({ is_active: false })
        .eq("id", subscriptionId)
      return
    }
  }

  private signPayload(payload: string, secret: string): string {
    return createHmac("sha256", secret).update(payload).digest("hex")
  }

  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expected = this.signPayload(payload, secret)
    const sig = signature.replace("sha256=", "")
    try {
      return timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))
    } catch {
      return false
    }
  }

  getAvailableEvents() {
    return [
      { name: "invoice.authorized", description: "Factura electrónica autorizada por SRI" },
      { name: "invoice.rejected", description: "Factura rechazada por SRI" },
      { name: "obligation.due", description: "Obligación tributaria próxima a vencer" },
      { name: "obligation.overdue", description: "Obligación vencida" },
      { name: "document.uploaded", description: "Nuevo documento subido" },
      { name: "client.created", description: "Nuevo cliente registrado" },
      { name: "project.completed", description: "Proyecto marcado como completado" },
      { name: "kpi.alert", description: "KPI cruzó umbral configurado" },
      { name: "workflow.completed", description: "Workflow automatizado completado" },
      { name: "user.invited", description: "Nuevo usuario invitado al tenant" },
    ]
  }
}
