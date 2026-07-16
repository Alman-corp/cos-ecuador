import { Injectable, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { Cron, CronExpression } from "@nestjs/schedule"
import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { TemplatesService } from "../notifications/templates/templates.service"

@Injectable()
export class DigestProcessor {
  private readonly logger = new Logger(DigestProcessor.name)
  private supabase: SupabaseClient

  constructor(
    private config: ConfigService,
    private templates: TemplatesService,
  ) {
    this.supabase = createClient(
      this.config.get<string>("SUPABASE_URL")!,
      this.config.get<string>("SUPABASE_SERVICE_KEY")!
    )
  }

  @Cron(CronExpression.EVERY_HOUR)
  async processHourlyDigests() {
    const now = new Date()
    this.logger.log(`Processing digests for ${now.toISOString()}`)

    const { data: pending, error } = await this.supabase
      .from("digest_queue")
      .select("*")
      .eq("status", "PENDING")
      .lte("scheduled_for", now.toISOString())
      .order("scheduled_for", { ascending: true })
      .limit(100)

    if (error) {
      this.logger.error(`Failed to fetch pending digests: ${error.message}`)
      return
    }
    if (!pending || pending.length === 0) return

    const grouped = new Map<string, typeof pending>()
    for (const item of pending) {
      const key = `${item.company_id}:${item.user_id}:${item.frequency}`
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)!.push(item)
    }

    for (const [key, items] of grouped.entries()) {
      const [companyId, userId, frequency] = key.split(":")
      await this.sendDigest(companyId, userId, frequency, items)
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async scheduleDailyDigests() {
    this.logger.log("Scheduling daily digests...")

    const { data: prefs, error } = await this.supabase
      .from("notification_preferences")
      .select("company_id, user_id, digest_frequency")
      .in("digest_frequency", ["DAILY_DIGEST", "WEEKLY_DIGEST"])
      .eq("is_enabled", true)

    if (error) {
      this.logger.error(`Failed to fetch preferences: ${error.message}`)
      return
    }
    if (!prefs) return

    const now = new Date()
    const today930 = new Date(now)
    today930.setUTCHours(14, 30, 0, 0)

    for (const pref of prefs) {
      if (pref.digest_frequency === "DAILY_DIGEST") {
        const scheduled = new Date(today930)
        if (scheduled < now) scheduled.setUTCDate(scheduled.getUTCDate() + 1)

        const { data: existing } = await this.supabase
          .from("digest_queue")
          .select("id")
          .eq("company_id", pref.company_id)
          .eq("user_id", pref.user_id)
          .eq("frequency", "DAILY_DIGEST")
          .eq("status", "PENDING")
          .limit(1)

        if (!existing || existing.length === 0) {
          await this.supabase.from("digest_queue").insert({
            company_id: pref.company_id,
            user_id: pref.user_id,
            event_type: "DAILY_DIGEST_TRIGGER",
            payload: {},
            frequency: "DAILY_DIGEST",
            scheduled_for: scheduled.toISOString(),
          })
        }
      }
    }
  }

  @Cron("0 0 * * 1")
  async scheduleWeeklyDigests() {
    this.logger.log("Scheduling weekly digests...")

    const { data: prefs } = await this.supabase
      .from("notification_preferences")
      .select("company_id, user_id")
      .eq("digest_frequency", "WEEKLY_DIGEST")
      .eq("is_enabled", true)

    if (!prefs) return

    const scheduled = new Date()
    scheduled.setUTCHours(14, 0, 0, 0)

    for (const pref of prefs) {
      await this.supabase.from("digest_queue").insert({
        company_id: pref.company_id,
        user_id: pref.user_id,
        event_type: "WEEKLY_DIGEST_TRIGGER",
        payload: {},
        frequency: "WEEKLY_DIGEST",
        scheduled_for: scheduled.toISOString(),
      })
    }
  }

  private async sendDigest(
    companyId: string,
    userId: string,
    frequency: string,
    items: any[],
  ) {
    const startTime = Date.now()

    try {
      const daysBack = frequency === "WEEKLY_DIGEST" ? 7 : 1
      const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString()

      const [notifRes, obligRes, invRes, userRes] = await Promise.all([
        this.supabase
          .from("notifications")
          .select("*")
          .eq("company_id", companyId)
          .eq("user_id", userId)
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(50),
        this.supabase
          .from("tax_obligations")
          .select("*, fiscal_calendar(*)")
          .eq("company_id", companyId)
          .gte("due_date", new Date().toISOString())
          .lte("due_date", new Date(Date.now() + daysBack * 24 * 60 * 60 * 1000).toISOString()),
        this.supabase
          .from("electronic_invoices")
          .select("total_amount")
          .eq("company_id", companyId)
          .gte("emission_date", since),
        this.supabase
          .from("users")
          .select("email, name")
          .eq("id", userId)
          .single(),
      ])

      const notifications = notifRes.data ?? []
      const obligations = obligRes.data ?? []
      const invoices = invRes.data ?? []
      const user = userRes.data

      if (notifications.length === 0 && obligations.length === 0 && invoices.length === 0) {
        await this.supabase
          .from("digest_queue")
          .update({ status: "PROCESSED", processed_at: new Date().toISOString() })
          .in("id", items.map((i) => i.id))
        return
      }

      const totalAmount = invoices.reduce((s: number, i: any) => s + Number(i.total_amount ?? 0), 0)

      const rendered = await this.templates.renderFromType(
        frequency === "DAILY_DIGEST" ? "DAILY_DIGEST" : "WEEKLY_DIGEST",
        "email",
        {
          userName: (user as any)?.name ?? "Usuario",
          period: frequency === "DAILY_DIGEST" ? "hoy" : "esta semana",
          notifications: notifications.slice(0, 10),
          obligations,
          invoices,
          summary: {
            totalNotifications: notifications.length,
            upcomingObligations: obligations.length,
            invoicesIssued: invoices.length,
            totalAmount,
          },
        },
        companyId,
      )

      if (rendered && (user as any)?.email) {
        const nodemailer = await import("nodemailer")
        const transporter = nodemailer.createTransport({
          host: this.config.get<string>("SMTP_HOST", "smtp.sendgrid.net"),
          port: this.config.get<number>("SMTP_PORT", 587),
          auth: {
            user: this.config.get<string>("SMTP_USER", "apikey"),
            pass: this.config.get<string>("SMTP_PASS"),
          },
        })

        await transporter.sendMail({
          from: this.config.get<string>("SMTP_FROM", "COS Digest <digest@cos-platform.com>"),
          to: (user as any).email,
          subject: rendered.subject ?? `Resumen COS ${frequency === "DAILY_DIGEST" ? "del día" : "semanal"}`,
          html: rendered.body,
        })
      }

      await this.supabase.from("digest_logs").insert({
        company_id: companyId,
        user_id: userId,
        frequency,
        digest_date: new Date().toISOString(),
        events_count: notifications.length + obligations.length + invoices.length,
        channels: ["EMAIL"],
        delivery_time_ms: Date.now() - startTime,
      })

      await this.supabase
        .from("digest_queue")
        .update({ status: "PROCESSED", processed_at: new Date().toISOString() })
        .in("id", items.map((i) => i.id))

      this.logger.log(`Digest ${frequency} sent to ${userId}: ${notifications.length} notifications`)
    } catch (err) {
      this.logger.error(`Digest error for ${userId}: ${err}`)
      await this.supabase
        .from("digest_queue")
        .update({ status: "FAILED" })
        .in("id", items.map((i) => i.id))
    }
  }
}
