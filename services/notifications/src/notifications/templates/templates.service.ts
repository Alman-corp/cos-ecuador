import { Injectable, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { createClient, SupabaseClient } from "@supabase/supabase-js"
import * as Handlebars from "handlebars"

export interface TemplateVariable {
  key: string
  label: string
  type: "string" | "number" | "date" | "boolean"
  required: boolean
  defaultValue?: unknown
}

export interface CompiledTemplate {
  id: string
  templateType: string
  channel: string
  name: string
  subject: string | null
  body: string
  variables: TemplateVariable[]
  isSystem: boolean
  version: number
}

Handlebars.registerHelper("formatDate", (date: string | Date, format: string) => {
  const d = new Date(date)
  if (isNaN(d.getTime())) return date
  const opts: Record<string, Intl.DateTimeFormatOptions> = {
    short: { dateStyle: "short" },
    long: { dateStyle: "long" },
    datetime: { dateStyle: "short", timeStyle: "short" },
  }
  return d.toLocaleDateString("es-EC", opts[format] ?? opts.short)
})

Handlebars.registerHelper("eq", (a: unknown, b: unknown) => a === b)
Handlebars.registerHelper("formatCurrency", (value: number) =>
  new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" }).format(value)
)

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name)
  private supabase: SupabaseClient
  private readonly table = "notification_templates"
  private cache = new Map<string, CompiledTemplate>()

  constructor(private config: ConfigService) {
    this.supabase = createClient(
      this.config.get<string>("SUPABASE_URL")!,
      this.config.get<string>("SUPABASE_SERVICE_KEY")!
    )
  }

  async getTemplate(
    templateType: string,
    channel: string,
    companyId?: string
  ): Promise<CompiledTemplate | null> {
    const cacheKey = `${companyId ?? "system"}:${templateType}:${channel}`
    const cached = this.cache.get(cacheKey)
    if (cached) return cached

    let query = this.supabase
      .from(this.table)
      .select("*")
      .eq("template_type", templateType)
      .eq("channel", channel)
      .order("is_system", { ascending: true })
      .order("version", { ascending: false })
      .limit(1)

    if (companyId) {
      query = query.eq("company_id", companyId)
    } else {
      query = query.is("company_id", null)
    }

    const { data, error } = await query.single()
    if (error || !data) {
      if (!companyId) return null
      return this.getTemplate(templateType, channel)
    }

    const compiled: CompiledTemplate = {
      id: data.id,
      templateType: data.template_type,
      channel: data.channel,
      name: data.name,
      subject: data.subject,
      body: data.body,
      variables: (data.variables as TemplateVariable[]) ?? [],
      isSystem: data.is_system,
      version: data.version,
    }

    this.cache.set(cacheKey, compiled)
    return compiled
  }

  async render(template: CompiledTemplate, variables: Record<string, unknown>): Promise<{
    subject: string | null
    body: string
  }> {
    const missing = template.variables
      .filter((v) => v.required && variables[v.key] === undefined)
      .map((v) => v.key)

    if (missing.length > 0) {
      this.logger.warn(`Missing required variables: ${missing.join(", ")}`)
    }

    const merged = { ...variables }
    for (const v of template.variables) {
      if (merged[v.key] === undefined && v.defaultValue !== undefined) {
        merged[v.key] = v.defaultValue
      }
    }

    let subject: string | null = null
    if (template.subject) {
      subject = Handlebars.compile(template.subject)(merged)
    }

    const body = Handlebars.compile(template.body)(merged)
    return { subject, body }
  }

  async renderFromType(
    templateType: string,
    channel: string,
    variables: Record<string, unknown>,
    companyId?: string
  ): Promise<{ subject: string | null; body: string } | null> {
    const template = await this.getTemplate(templateType, channel, companyId)
    if (!template) return null
    return this.render(template, variables)
  }

  invalidateCache(): void {
    this.cache.clear()
  }
}
