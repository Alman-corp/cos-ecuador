import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DUE_DAY_MAP: Record<number, number> = {
  0: 10, 1: 12, 2: 14, 3: 16, 4: 18,
  5: 20, 6: 22, 7: 24, 8: 26, 9: 28,
}

interface AlertResult {
  companyId: string
  businessName: string
  ruc: string
  email: string
  obligations: { type: string; period: string; dueDate: string; daysUntil: number }[]
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    const { data: profiles, error: profileError } = await supabase
      .from("tax_profiles")
      .select("id, company_id, ruc, business_name")

    if (profileError) throw profileError

    const alerts: AlertResult[] = []

    for (const profile of profiles || []) {
      const ninthDigit = parseInt(profile.ruc.charAt(8)) || 0
      const dueDay = DUE_DAY_MAP[ninthDigit]

      const upcomingObligations: AlertResult["obligations"] = []

      const obligationTypes = [
        { type: "IVA", month: currentMonth, year: currentYear },
        { type: "RETENCIONES", month: currentMonth, year: currentYear },
      ]

      if (currentMonth % 3 === 0) {
        obligationTypes.push({ type: "ATS", month: currentMonth, year: currentYear })
      }

      if (currentMonth === 12) {
        obligationTypes.push({ type: "RENTA", month: 12, year: currentYear })
      }

      for (const obl of obligationTypes) {
        const dueDate = new Date(obl.year, obl.month - 1, dueDay)
        const daysUntil = Math.ceil(
          (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )

        if (daysUntil >= 0 && daysUntil <= 7) {
          upcomingObligations.push({
            type: obl.type,
            period: `${obl.year}-${String(obl.month).padStart(2, "0")}`,
            dueDate: dueDate.toISOString().split("T")[0],
            daysUntil,
          })
        }
      }

      if (upcomingObligations.length > 0) {
        const { data: userData } = await supabase
          .from("profiles")
          .select("email")
          .eq("company_id", profile.company_id)
          .single()

        if (userData?.email) {
          alerts.push({
            companyId: profile.company_id,
            businessName: profile.business_name,
            ruc: profile.ruc,
            email: userData.email,
            obligations: upcomingObligations,
          })
        }
      }
    }

    console.log(`[Tax Alerts] Found ${alerts.length} companies with upcoming deadlines`)

    for (const alert of alerts) {
      console.log(
        `[Tax Alerts] ${alert.businessName} (${alert.ruc}): ` +
        `${alert.obligations.map((o) => `${o.type} ${o.period} (${o.daysUntil}d)`).join(", ")}`
      )
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      alertsSent: alerts.length,
      details: alerts,
    })
  } catch (error) {
    console.error("[Tax Alerts] Error:", error)
    return NextResponse.json(
      { error: "Failed to process tax alerts" },
      { status: 500 }
    )
  }
}
