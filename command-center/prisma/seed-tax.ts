import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DUE_DAY_MAP: Record<number, number> = {
  0: 10, 1: 12, 2: 14, 3: 16, 4: 18,
  5: 20, 6: 22, 7: 24, 8: 26, 9: 28,
}

interface CalendarEntry {
  year: number
  month: number
  obligation_type: string
  form_code: string
  description: string
  due_date_by_digit: Record<number, number>
  base_legal: string
}

function generateCalendar(year: number): CalendarEntry[] {
  const entries: CalendarEntry[] = []

  for (let month = 1; month <= 12; month++) {
    entries.push({
      year,
      month,
      obligation_type: "IVA",
      form_code: "104",
      description: `IVA Mensual ${year}-${String(month).padStart(2, "0")}`,
      due_date_by_digit: DUE_DAY_MAP,
      base_legal: "Art. 56 LRTI",
    })

    entries.push({
      year,
      month,
      obligation_type: "RETENCIONES",
      form_code: "106",
      description: `Retenciones ${year}-${String(month).padStart(2, "0")}`,
      due_date_by_digit: DUE_DAY_MAP,
      base_legal: "Art. 59 LRTI",
    })

    if (month % 3 === 0) {
      entries.push({
        year,
        month,
        obligation_type: "ATS",
        form_code: "ATS",
        description: `Anexo Transacciones ${year}-${String(month).padStart(2, "0")}`,
        due_date_by_digit: DUE_DAY_MAP,
        base_legal: "Art. 65 LRTI",
      })
    }

    if (month === 12) {
      entries.push({
        year,
        month: 12,
        obligation_type: "RENTA",
        form_code: "101",
        description: `Renta Anual ${year}`,
        due_date_by_digit: DUE_DAY_MAP,
        base_legal: "Art. 52 LRTI",
      })
    }
  }

  return entries
}

async function seed() {
  console.log("Seeding tax calendar...")

  const years = [2024, 2025, 2026]
  let totalInserted = 0

  for (const year of years) {
    const entries = generateCalendar(year)

    const { data, error } = await supabase
      .from("tax_calendar")
      .upsert(entries, {
        onConflict: "year,month,obligation_type",
        ignoreDuplicates: false,
      })

    if (error) {
      console.error(`Error seeding ${year}:`, error)
    } else {
      totalInserted += entries.length
      console.log(`Seeded ${entries.length} entries for ${year}`)
    }
  }

  console.log(`Total calendar entries: ${totalInserted}`)

  const { data: existingProfiles } = await supabase
    .from("tax_profiles")
    .select("id")

  if (!existingProfiles || existingProfiles.length === 0) {
    console.log("Seeding sample tax profiles...")

    const sampleProfiles = [
      {
        company_id: "00000000-0000-0000-0000-000000000001",
        ruc: "1790000002001",
        business_name: "Infinity Industries S.A.",
        regime: "general",
        annual_revenue: 500000,
        employees: 25,
        sector: "Manufactura",
      },
      {
        company_id: "00000000-0000-0000-0000-000000000002",
        ruc: "1790000003001",
        business_name: "EcoSoluciones Cía. Ltda.",
        regime: "rimpe_emprendedor",
        annual_revenue: 120000,
        employees: 8,
        sector: "Servicios",
      },
    ]

    const { error: profileError } = await supabase
      .from("tax_profiles")
      .upsert(sampleProfiles, { onConflict: "ruc" })

    if (profileError) {
      console.error("Error seeding profiles:", profileError)
    } else {
      console.log("Seeded 2 sample tax profiles")
    }

    console.log("Seeding sample obligations...")
    const { data: calendars } = await supabase
      .from("tax_calendar")
      .select("id, year, month, obligation_type")
      .eq("year", 2026)
      .order("month")

    if (calendars && calendars.length > 0) {
      const sampleObligations = []
      for (const cal of calendars.slice(0, 8)) {
        sampleObligations.push({
          company_id: "00000000-0000-0000-0000-000000000001",
          calendar_id: cal.id,
          period: `${cal.year}-${String(cal.month).padStart(2, "0")}`,
          status: "pending",
        })
      }

      const { error: oblError } = await supabase
        .from("tax_obligations")
        .upsert(sampleObligations, {
          onConflict: "company_id,calendar_id",
          ignoreDuplicates: true,
        })

      if (oblError) {
        console.error("Error seeding obligations:", oblError)
      } else {
        console.log(`Seeded ${sampleObligations.length} sample obligations`)
      }
    }
  }

  console.log("Seed completed!")
}

seed().catch(console.error)
