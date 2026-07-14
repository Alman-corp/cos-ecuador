import { createClient } from "@/utils/supabase/client"
import type { DashboardData, Alert, ActivityItem, AgentStatus, SalaGuerraState, DataHubItem } from "@/lib/shared-types"

export interface FinancialStatement {
  id: string
  period: string
  revenue: number
  cogs: number
  gross_profit: number
  opex: number
  ebitda: number
  depreciation: number
  ebit: number
  interest: number
  tax: number
  net_income: number
}

export interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  type: "inflow" | "outflow"
  category: string
}

export interface Projection {
  id: string
  projection_date: string
  scenario: "base" | "optimistic" | "pessimistic"
  cash_balance: number
  months_runway: number
  metadata: Record<string, unknown>
}

export async function getFinancialStatements(
  limit = 12
): Promise<{ data: FinancialStatement[] | null; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("financial_statements")
      .select("*")
      .order("period", { ascending: false })
      .limit(limit)

    if (error) return { data: null, error: error.message }
    return { data: (data ?? []) as FinancialStatement[], error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Error desconocido" }
  }
}

export async function getRecentTransactions(
  limit = 50
): Promise<{ data: Transaction[] | null; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("date", { ascending: false })
      .limit(limit)

    if (error) return { data: null, error: error.message }
    return { data: (data ?? []) as Transaction[], error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Error desconocido" }
  }
}

export async function getLatestProjection(): Promise<{ data: Projection | null; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("projections")
      .select("*")
      .order("projection_date", { ascending: false })
      .limit(1)
      .single()

    if (error) return { data: null, error: error.message }
    return { data: data as Projection | null, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Error desconocido" }
  }
}

export async function getProjectionsByScenario(): Promise<{ data: Projection[] | null; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("projections")
      .select("*")
      .order("projection_date", { ascending: false })
      .limit(3)

    if (error) return { data: null, error: error.message }
    return { data: (data ?? []) as Projection[], error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Error desconocido" }
  }
}

export async function getMacroIndicators(
  indicator: string,
  limit = 24
): Promise<{ data: { date: string; value: number }[] | null; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("macro_indicators")
      .select("date, value")
      .eq("indicator", indicator)
      .order("date", { ascending: false })
      .limit(limit)

    if (error) return { data: null, error: error.message }
    return { data: (data ?? []) as { date: string; value: number }[], error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Error desconocido" }
  }
}

export async function getCompanyProfile(): Promise<{ data: unknown; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("profiles")
      .select("*, companies(*)")
      .single()

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Error desconocido" }
  }
}

// ── Due Diligence ────────────────────────────────────────────────

export async function getDdEngagements(userId: string): Promise<{ data: unknown; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("dd_engagements")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Error desconocido" }
  }
}

export async function getDdEngagement(id: string): Promise<{ data: unknown; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("dd_engagements")
      .select("*, dd_reports(*), dd_documents(*)")
      .eq("id", id)
      .single()

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Error desconocido" }
  }
}

export async function createDdEngagement(data: any): Promise<{ data: unknown; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data: result, error } = await supabase
      .from("dd_engagements")
      .insert(data)
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    return { data: result, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Error desconocido" }
  }
}

// ── Dashboard ────────────────────────────────────────────────────

export async function getDashboardData(): Promise<{ data: DashboardData | null; error: string | null }> {
  try {
    const supabase = await createClient()

    const { data: statements, error: stmtErr } = await supabase
      .from("financial_statements")
      .select("*")
      .order("period", { ascending: false })
      .limit(2)

    if (stmtErr) return { data: null, error: stmtErr.message }

    const statementsData = (statements ?? []) as FinancialStatement[]
    const current = statementsData[0]
    const previous = statementsData[1]

    const kpis: DashboardData["kpis"] = {
      revenue: current?.revenue ?? 0,
      revenuePrev: previous?.revenue ?? 0,
      ebitda: current?.ebitda ?? 0,
      ebitdaPrev: previous?.ebitda ?? 0,
      netIncome: current?.net_income ?? 0,
      netIncomePrev: previous?.net_income ?? 0,
      freeCashFlow: current ? current.ebitda - (current.revenue * 0.15) : 0,
      fcfPrev: previous ? previous.ebitda - (previous.revenue * 0.15) : 0,
      cashAndInvestments: 0,
      cashPrev: 0,
      grossMargin: current ? ((current.revenue - current.cogs) / current.revenue) * 100 : 0,
      grossMarginPrev: previous ? ((previous.revenue - previous.cogs) / previous.revenue) * 100 : 0,
      ebitdaMargin: current ? (current.ebitda / current.revenue) * 100 : 0,
      ebitdaMarginPrev: previous ? (previous.ebitda / previous.revenue) * 100 : 0,
      netMargin: current ? (current.net_income / current.revenue) * 100 : 0,
      netMarginPrev: previous ? (previous.net_income / previous.revenue) * 100 : 0,
      opex: current?.opex ?? 0,
      opexPrev: previous?.opex ?? 0,
      revenueGrowth: previous?.revenue ? ((current!.revenue - previous.revenue) / previous.revenue) * 100 : 0,
      totalAssets: 0,
      totalEquity: 0,
      operatingCashFlow: current ? current.ebitda * 0.85 : 0,
      capex: current ? current.revenue * 0.09 : 0,
    }

    let alerts: Alert[] = []
    let recentActivity: ActivityItem[] = []

    try {
      const { data: aData, error: aErr } = await supabase
        .from("alerts")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(20)
      if (!aErr && aData) alerts = aData as Alert[]
    } catch {
      // table may not exist yet
    }

    try {
      const { data: rData, error: rErr } = await supabase
        .from("recent_activity")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(20)
      if (!rErr && rData) recentActivity = rData as ActivityItem[]
    } catch {
      // table may not exist yet
    }

    return {
      data: {
        kpis,
        alerts,
        recentActivity,
      },
      error: null,
    }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Error desconocido" }
  }
}

// ── Agents ───────────────────────────────────────────────────────

export async function getAgents(): Promise<{ data: AgentStatus[] | null; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .order("name", { ascending: true })

    if (error) return { data: null, error: error.message }
    return { data: (data ?? []) as AgentStatus[], error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Error desconocido" }
  }
}

export async function getAgentById(id: string): Promise<{ data: AgentStatus | null; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("id", id)
      .single()

    if (error) return { data: null, error: error.message }
    return { data: data as AgentStatus | null, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Error desconocido" }
  }
}

// ── Sala de Guerra (Simulation) ─────────────────────────────

export async function getSimulationParams(): Promise<{ data: SalaGuerraState | null; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("projections")
      .select("metadata")
      .order("created_at", { ascending: false })
      .limit(1)

    if (error) return { data: null, error: error.message }
    if (!data || data.length === 0) return { data: null, error: null }

    const metadata = data[0].metadata as Record<string, unknown> | null
    if (!metadata?.sliders) return { data: null, error: null }

    return { data: metadata as unknown as SalaGuerraState, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Error desconocido" }
  }
}

export async function saveSimulationParams(params: SalaGuerraState): Promise<{ data: unknown; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("projections")
      .insert({
        scenario: "base",
        cash_balance: 0,
        months_runway: 12,
        metadata: params as unknown as Record<string, unknown>,
      })
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Error desconocido" }
  }
}

// ── Data Hub ────────────────────────────────────────────────

export async function getDocumentsHub(): Promise<{ data: DataHubItem[] | null; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) return { data: null, error: error.message }

    const items: DataHubItem[] = (data ?? []).map((d: Record<string, unknown>) => ({
      id: d.id as string,
      name: d.title as string,
      type: ((d.file_type as string)?.includes("csv") ? "csv" :
            (d.file_type as string)?.includes("xls") ? "xlsx" :
            (d.file_type as string)?.includes("pdf") ? "pdf" : "image") as DataHubItem["type"],
      size: (d.file_size as number) ?? 0,
      uploadedAt: d.created_at as string,
      uploadedBy: "",
      metadata: {},
      status: (d.status as DataHubItem["status"]) ?? "imported",
    }))

    return { data: items, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Error desconocido" }
  }
}

export async function uploadDocumentToHub(file: File): Promise<{ data: unknown; error: string | null }> {
  try {
    const supabase = await createClient()
    const fileExt = file.name.split(".").pop()
    const filePath = `${Date.now()}_${file.name}`

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file)

    if (uploadError) return { data: null, error: uploadError.message }

    const { data: urlData } = supabase.storage
      .from("documents")
      .getPublicUrl(filePath)

    const { data, error } = await supabase
      .from("documents")
      .insert({
        title: file.name,
        file_type: fileExt ?? "unknown",
        file_url: urlData?.publicUrl ?? "",
        file_size: file.size,
        status: "imported",
      })
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Error desconocido" }
  }
}
