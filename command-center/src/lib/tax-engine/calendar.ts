import type { TaxObligation, TaxRegime } from "./types"

function buildDueDate(day: number, month: number, year: number): string {
  const dd = day.toString().padStart(2, "0")
  const mm = month.toString().padStart(2, "0")
  return `${year}-${mm}-${dd}`
}

const IVA_DAY_BY_DIGIT: Record<number, number> = {
  1: 10, 2: 12, 3: 14, 4: 16, 5: 18,
  6: 20, 7: 22, 8: 24, 9: 26, 0: 28,
}

function ivaDueDate(month: number, year: number, noveno: number): string {
  const day = IVA_DAY_BY_DIGIT[noveno] ?? 28
  const dueMonth = month + 1 > 12 ? 1 : month + 1
  const dueYear = month + 1 > 12 ? year + 1 : year
  return buildDueDate(day, dueMonth, dueYear)
}

function irstDueDate(year: number): { personas: string; sociedades: string } {
  return {
    personas: buildDueDate(10, 3, year + 1),
    sociedades: buildDueDate(10, 4, year + 1),
  }
}

function generateIvaObligations(regime: TaxRegime, year: number, noveno: number): TaxObligation[] {
  const obligations: TaxObligation[] = []
  for (let m = 1; m <= 12; m++) {
    const id = `iva-${year}-${m}`
    const due = ivaDueDate(m, year, noveno)
    obligations.push({
      id,
      name: `Declaración IVA Mes ${m}`,
      formCode: "104",
      dueDate: due,
      status: "pending",
      regime,
      period: `${year}-${String(m).padStart(2, "0")}`,
    })
  }
  return obligations
}

function generateIRObligations(regime: TaxRegime, year: number, noveno: number): TaxObligation[] {
  const due = irstDueDate(year)
  const isPersona = regime === "rimpe_popular" || regime === "rimpe_emprendedor"
  return [
    {
      id: `ir-${year}`,
      name: "Declaración Impuesto a la Renta",
      formCode: "101",
      dueDate: isPersona ? due.personas : due.sociedades,
      status: "pending",
      regime,
      period: `${year}`,
    },
  ]
}

function generateAtsObligations(regime: TaxRegime, year: number, noveno: number): TaxObligation[] {
  const obligations: TaxObligation[] = []
  if (regime === "rimpe_popular") return obligations
  for (let m = 1; m <= 12; m++) {
    const day = IVA_DAY_BY_DIGIT[noveno] ?? 28
    const dueMonth = m + 1 > 12 ? 1 : m + 1
    const dueYear = m + 1 > 12 ? year + 1 : year
    obligations.push({
      id: `ats-${year}-${m}`,
      name: `ATS Mes ${m}`,
      formCode: "ATS",
      dueDate: buildDueDate(day, dueMonth, dueYear),
      status: "pending",
      regime,
      period: `${year}-${String(m).padStart(2, "0")}`,
    })
  }
  return obligations
}

function generateRetentionObligations(regime: TaxRegime, year: number, noveno: number): TaxObligation[] {
  const obligations: TaxObligation[] = []
  for (let m = 1; m <= 12; m++) {
    const day = IVA_DAY_BY_DIGIT[noveno] ?? 28
    const dueMonth = m + 1 > 12 ? 1 : m + 1
    const dueYear = m + 1 > 12 ? year + 1 : year
    obligations.push({
      id: `ret-${year}-${m}`,
      name: `Declaración Retenciones en la Fuente Mes ${m}`,
      formCode: "103",
      dueDate: buildDueDate(day, dueMonth, dueYear),
      status: "pending",
      regime,
      period: `${year}-${String(m).padStart(2, "0")}`,
    })
  }
  return obligations
}

export function getObligations(
  regime: TaxRegime,
  year: number,
  novenoDigitoRuc: number = 0
): TaxObligation[] {
  const noveno = novenoDigitoRuc
  return [
    ...generateIvaObligations(regime, year, noveno),
    ...generateIRObligations(regime, year, noveno),
    ...generateAtsObligations(regime, year, noveno),
    ...generateRetentionObligations(regime, year, noveno),
  ]
}

export function getNextDeadlines(
  regime: TaxRegime,
  days: number = 30,
  novenoDigitoRuc: number = 0
): TaxObligation[] {
  const now = new Date()
  const year = now.getFullYear()
  const all = getObligations(regime, year, novenoDigitoRuc)
  const limit = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

  return all
    .filter((o) => {
      const d = new Date(o.dueDate)
      return d >= now && d <= limit
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
}
