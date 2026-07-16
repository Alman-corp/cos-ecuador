import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const NINTH_DIGIT_DUE_DAY: Record<number, number> = {
  1: 10, 2: 12, 3: 14, 4: 16, 5: 18,
  6: 20, 7: 22, 8: 24, 9: 28, 0: 28,
}

function getDueDate(year: number, month: number, ninthDigit: number): string {
  const dueMonth = month === 12 ? 1 : month + 1
  const dueYear = month === 12 ? year + 1 : year
  const day = NINTH_DIGIT_DUE_DAY[ninthDigit]
  return `${dueYear}-${String(dueMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

function generateCalendar(ninthDigit?: number) {
  const records: Array<{
    id: string
    obligationType: string
    fiscalPeriod: string
    ninthDigit: number
    dueDate: string
    description: string
    basePenalty: number
  }> = []
  let id = 0

  const digits = ninthDigit !== undefined ? [ninthDigit] : Array.from({ length: 10 }, (_, i) => i)

  for (const year of [2024, 2025, 2026]) {
    for (let month = 1; month <= 12; month++) {
      const fiscalPeriod = `${year}-${String(month).padStart(2, "0")}`

      for (const digit of digits) {
        const dueDate = getDueDate(year, month, digit)

        records.push({
          id: `cal-${++id}`,
          obligationType: "IVA_MENSUAL",
          fiscalPeriod,
          ninthDigit: digit,
          dueDate,
          description: `Declaración IVA período ${fiscalPeriod} — Noveno dígito ${digit}`,
          basePenalty: 15,
        })

        records.push({
          id: `cal-${++id}`,
          obligationType: "RETENCIONES_MENSUALES",
          fiscalPeriod,
          ninthDigit: digit,
          dueDate,
          description: `Retenciones en la Fuente ${fiscalPeriod}`,
          basePenalty: 15,
        })

        records.push({
          id: `cal-${++id}`,
          obligationType: "ANEXO_ATS",
          fiscalPeriod,
          ninthDigit: digit,
          dueDate,
          description: `Anexo Transaccional Simplificado ${fiscalPeriod}`,
          basePenalty: 25,
        })
      }
    }

    for (const digit of digits) {
      if (digit === 0) continue
      records.push({
        id: `cal-${++id}`,
        obligationType: "RENTA_ANUAL",
        fiscalPeriod: String(year),
        ninthDigit: digit,
        dueDate: getDueDate(year, 3, digit),
        description: `Impuesto a la Renta ejercicio ${year}`,
        basePenalty: 50,
      })
    }
  }

  return records
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const ninthDigitParam = searchParams.get("ninthDigit")
  const status = searchParams.get("status")
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  const ninthDigit = ninthDigitParam ? parseInt(ninthDigitParam) : undefined
  let calendar = generateCalendar(ninthDigit)

  if (from) calendar = calendar.filter((r) => r.dueDate >= from)
  if (to) calendar = calendar.filter((r) => r.dueDate <= to)

  const grouped: Record<string, typeof calendar> = {}
  for (const record of calendar) {
    if (!grouped[record.obligationType]) grouped[record.obligationType] = []
    grouped[record.obligationType].push(record)
  }

  return NextResponse.json({
    calendar,
    total: calendar.length,
    grouped,
    ninthDigit: ninthDigit ?? "all",
  })
}
