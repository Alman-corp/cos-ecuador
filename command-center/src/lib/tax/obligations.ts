import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface TaxObligation {
  id: string
  company_id: string
  calendar_id: string
  period: string
  status: "pending" | "filed" | "overdue" | "exempt"
  filed_at: string | null
  amount: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface TaxProfile {
  id: string
  company_id: string
  ruc: string
  business_name: string
  regime: string
  annual_revenue: number | null
  employees: number | null
  sector: string | null
}

export interface ObligationsSummary {
  total: number
  pending: number
  filed: number
  overdue: number
  exempt: number
  upcomingDeadlines: TaxObligation[]
  overdueItems: TaxObligation[]
}

const DUE_DAY_MAP: Record<number, number> = {
  0: 10, 1: 12, 2: 14, 3: 16, 4: 18,
  5: 20, 6: 22, 7: 24, 8: 26, 9: 28,
}

export function getDueDay(ninthDigit: number): number {
  return DUE_DAY_MAP[ninthDigit] ?? 10
}

export async function getObligationsSummary(companyId: string): Promise<ObligationsSummary> {
  const { data: obligations, error } = await supabase
    .from("tax_obligations")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })

  if (error) throw error

  const items = (obligations || []) as TaxObligation[]
  const now = new Date()

  const upcomingDeadlines = items
    .filter((o) => o.status === "pending")
    .sort((a, b) => a.period.localeCompare(b.period))
    .slice(0, 5)

  const overdueItems = items.filter((o) => {
    if (o.status !== "pending") return false
    const [year, month] = o.period.split("-").map(Number)
    const dueDay = 10
    const dueDate = new Date(year, month - 1, dueDay)
    return dueDate < now
  })

  return {
    total: items.length,
    pending: items.filter((o) => o.status === "pending").length,
    filed: items.filter((o) => o.status === "filed").length,
    overdue: overdueItems.length,
    exempt: items.filter((o) => o.status === "exempt").length,
    upcomingDeadlines,
    overdueItems,
  }
}

export async function getObligationsByCompany(
  companyId: string,
  status?: string
) {
  let query = supabase
    .from("tax_obligations")
    .select("*")
    .eq("company_id", companyId)
    .order("period", { ascending: false })

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query
  if (error) throw error
  return data as TaxObligation[]
}

export async function getTaxProfile(companyId: string) {
  const { data, error } = await supabase
    .from("tax_profiles")
    .select("*")
    .eq("company_id", companyId)
    .single()

  if (error && error.code !== "PGRST116") throw error
  return data as TaxProfile | null
}

export async function updateObligationStatus(
  obligationId: string,
  status: string,
  filedAt?: string,
  amount?: number,
  notes?: string
) {
  const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (filedAt) update.filed_at = filedAt
  if (amount !== undefined) update.amount = amount
  if (notes) update.notes = notes

  const { data, error } = await supabase
    .from("tax_obligations")
    .update(update)
    .eq("id", obligationId)
    .select()
    .single()

  if (error) throw error
  return data as TaxObligation
}
