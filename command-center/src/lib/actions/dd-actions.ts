"use server"

import { createClient } from "@/utils/supabase/server"
import { CreateEngagementSchema, UpdateEngagementSchema, SubmitReportSchema, EngagementIdSchema } from "@/lib/schemas/dd-schemas"
import { appendAudit } from "@/lib/audit-log-server"

export async function createEngagement(input: unknown) {
  const parsed = CreateEngagementSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: "No autenticado" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single()

  if (!profile?.company_id) return { error: "Perfil sin compañía asignada" }

  const { data, error } = await supabase
    .from("dd_engagements")
    .insert({
      company_id: profile.company_id,
      user_id: user.id,
      company_name: parsed.data.companyName,
      industry: parsed.data.industry,
      fiscal_year: parsed.data.fiscalYear,
      currency: parsed.data.currency,
      description: parsed.data.description ?? null,
      scope: parsed.data.scope,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  await appendAudit("create_engagement", user.id, "dd_engagements", `Cre\u00f3 engagement ${data.id}`)

  return { data }
}

export async function listEngagements() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: "No autenticado" }

  const { data, error } = await supabase
    .from("dd_engagements")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) return { error: error.message }

  return { data }
}

export async function getEngagement(id: string) {
  const parsed = EngagementIdSchema.safeParse({ id })
  if (!parsed.success) return { error: parsed.error.flatten() }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: "No autenticado" }

  const { data, error } = await supabase
    .from("dd_engagements")
    .select("*, reports:dd_reports(*), documents:dd_documents(*)")
    .eq("id", parsed.data.id)
    .eq("user_id", user.id)
    .single()

  if (error) return { error: error.message }

  return { data }
}

export async function updateEngagement(input: unknown) {
  const parsed = UpdateEngagementSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: "No autenticado" }

  const updates: Record<string, unknown> = {}
  if (parsed.data.companyName) updates.company_name = parsed.data.companyName
  if (parsed.data.status) updates.status = parsed.data.status

  const { data, error } = await supabase
    .from("dd_engagements")
    .update(updates)
    .eq("id", parsed.data.id)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) return { error: error.message }

  await appendAudit("update_engagement", user.id, "dd_engagements", `Actualiz\u00f3 engagement ${parsed.data.id}`)

  return { data }
}

export async function deleteEngagement(id: string) {
  const parsed = EngagementIdSchema.safeParse({ id })
  if (!parsed.success) return { error: parsed.error.flatten() }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: "No autenticado" }

  const { data, error } = await supabase
    .from("dd_engagements")
    .update({ status: "archived" })
    .eq("id", parsed.data.id)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) return { error: error.message }

  await appendAudit("delete_engagement", user.id, "dd_engagements", `Archiv\u00f3 engagement ${parsed.data.id}`)

  return { data }
}

export async function submitReport(input: unknown) {
  const parsed = SubmitReportSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: "No autenticado" }

  const { data, error } = await supabase
    .from("dd_reports")
    .insert({
      engagement_id: parsed.data.engagementId,
      user_id: user.id,
      sections: parsed.data.sections,
      notes: parsed.data.notes ?? null,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  await appendAudit("submit_report", user.id, "dd_reports", `Reporte enviado para engagement ${parsed.data.engagementId}`)

  return { data }
}
