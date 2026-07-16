export interface XBRLParsedStatement {
  companyId: string
  periodStart: string
  periodEnd: string
  currency: string
  concepts: XBRLConceptValue[]
  type: "balance_sheet" | "income_statement" | "cash_flow" | "equity"
}

export interface XBRLConceptValue {
  conceptId: string
  label: string
  value: number
  decimals: number
  unit: string
  ifrsConceptId: string | null
}

export interface XBRLParsingError {
  conceptId: string
  message: string
}

export interface XBRLParseResult {
  success: boolean
  statements: XBRLParsedStatement[]
  errors: XBRLParsingError[]
  unrecognizedConcepts: string[]
}

const IFRS_MAP: Record<string, { ifrsId: string; label: string }> = {
  "ifrs-full:CurrentAssets": { ifrsId: "CA", label: "Activo Corriente" },
  "ifrs-full:NoncurrentAssets": { ifrsId: "NCA", label: "Activo No Corriente" },
  "ifrs-full:TotalAssets": { ifrsId: "TA", label: "Total Activos" },
  "ifrs-full:CurrentLiabilities": { ifrsId: "CL", label: "Pasivo Corriente" },
  "ifrs-full:NoncurrentLiabilities": { ifrsId: "NCL", label: "Pasivo No Corriente" },
  "ifrs-full:TotalLiabilities": { ifrsId: "TL", label: "Total Pasivos" },
  "ifrs-full:Equity": { ifrsId: "EQ", label: "Patrimonio Neto" },
  "ifrs-full:TotalEquity": { ifrsId: "TEQ", label: "Total Patrimonio" },
  "ifrs-full:LiabilitiesAndEquity": { ifrsId: "LE", label: "Total Pasivo y Patrimonio" },
  "ifrs-full:Revenue": { ifrsId: "REV", label: "Ingresos" },
  "ifrs-full:CostOfSales": { ifrsId: "COS", label: "Costo de Ventas" },
  "ifrs-full:GrossProfit": { ifrsId: "GP", label: "Utilidad Bruta" },
  "ifrs-full:OperatingExpenses": { ifrsId: "OPEX", label: "Gastos Operativos" },
  "ifrs-full:OperatingIncomeLoss": { ifrsId: "OI", label: "Utilidad Operativa" },
  "ifrs-full:FinanceIncome": { ifrsId: "FIN_INC", label: "Ingresos Financieros" },
  "ifrs-full:FinanceCosts": { ifrsId: "FIN_COST", label: "Costos Financieros" },
  "ifrs-full:ProfitLossBeforeTax": { ifrsId: "EBT", label: "Utilidad Antes de Impuestos" },
  "ifrs-full:IncomeTaxExpense": { ifrsId: "TAX", label: "Impuesto a la Renta" },
  "ifrs-full:ProfitLoss": { ifrsId: "NI", label: "Utilidad Neta" },
  "ifrs-full:TotalComprehensiveIncome": { ifrsId: "TCI", label: "Resultado Integral" },
  "ifrs-full:CashAndCashEquivalents": { ifrsId: "CASH", label: "Efectivo" },
  "ifrs-full:TradeAndOtherReceivables": { ifrsId: "AR", label: "Cuentas por Cobrar" },
  "ifrs-full:Inventories": { ifrsId: "INV", label: "Inventarios" },
  "ifrs-full:PropertyPlantAndEquipment": { ifrsId: "PPE", label: "Propiedad Planta y Equipo" },
  "ifrs-full:IntangibleAssets": { ifrsId: "INTAN", label: "Activos Intangibles" },
  "ifrs-full:TradeAndOtherPayables": { ifrsId: "AP", label: "Cuentas por Pagar" },
  "ifrs-full:ShortTermBorrowings": { ifrsId: "ST_DEBT", label: "Deuda Corto Plazo" },
  "ifrs-full:LongTermBorrowings": { ifrsId: "LT_DEBT", label: "Deuda Largo Plazo" },
  "ifrs-full:DepreciationAndAmortisation": { ifrsId: "DA", label: "Depreciación y Amortización" },
  "ifrs-full:EarningsPerShare": { ifrsId: "EPS", label: "Utilidad por Acción" },
  "ifrs-full:NumberOfShares": { ifrsId: "SHARES", label: "Número de Acciones" },
}

const STATEMENT_INDICATORS: Record<string, XBRLParsedStatement["type"]> = {
  "ifrs-full:CurrentAssets": "balance_sheet",
  "ifrs-full:Revenue": "income_statement",
  "ifrs-full:CashAndCashEquivalents": "cash_flow",
  "ifrs-full:Equity": "equity",
}

export function parseXBRLInstance(xml: string, companyId: string): XBRLParseResult {
  const errors: XBRLParsingError[] = []
  const unrecognizedConcepts: string[] = []
  const concepts: XBRLConceptValue[] = []
  let periodStart = ""
  let periodEnd = ""
  let currency = "USD"

  const contextRefs: Record<string, { startDate: string; endDate: string }> = {}
  const unitRefs: Record<string, string> = {}

  const contextRegex = /<context\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/context>/gi
  let cm
  while ((cm = contextRegex.exec(xml)) !== null) {
    const [, id, body] = cm
    const start = body.match(/<startDate>(\d{4}-\d{2}-\d{2})<\/startDate>/)?.[1] || ""
    const end = body.match(/<endDate>(\d{4}-\d{2}-\d{2})<\/endDate>/)?.[1] || body.match(/<instant>(\d{4}-\d{2}-\d{2})<\/instant>/)?.[1] || ""
    contextRefs[id] = { startDate: start, endDate: end }
  }

  const unitRegex = /<unit\s+id="([^"]+)"[^>]*>[\s\S]*?<measure>([^<]+)<\/measure>[\s\S]*?<\/unit>/gi
  let um
  while ((um = unitRegex.exec(xml)) !== null) {
    unitRefs[um[1]] = um[2]
  }

  const conceptRegex = /<([a-zA-Z][\w:]+)\s+contextRef="([^"]+)"(?:\s+unitRef="([^"]*)")?(?:\s+decimals="([^"]*)")?(?:\s+unitRef="([^"]*)")?[^>]*>\s*(-?\d+(?:\.\d+)?(?:[Ee][+-]?\d+)?)\s*<\/\1>/gi
  let match
  while ((match = conceptRegex.exec(xml)) !== null) {
    const [, conceptId, ctxRef, uRef1, decStr, uRef2, rawValue] = match
    const uRef = uRef1 || uRef2 || ""
    const decimals = decStr ? parseInt(decStr) : 2
    const ctx = contextRefs[ctxRef]
    if (!ctx) continue

    const value = parseFloat(rawValue)
    if (isNaN(value)) continue
    const unit = unitRefs[uRef] || uRef || "USD"
    const ifrsMapping = IFRS_MAP[conceptId]

    concepts.push({
      conceptId,
      label: ifrsMapping?.label || conceptId,
      value,
      decimals,
      unit,
      ifrsConceptId: ifrsMapping?.ifrsId || null,
    })

    if (!ifrsMapping && !unrecognizedConcepts.includes(conceptId)) {
      unrecognizedConcepts.push(conceptId)
    }

    if (!periodStart && ctx.startDate) periodStart = ctx.startDate
    if (!periodEnd && ctx.endDate) periodEnd = ctx.endDate
  }

  if (periodEnd && !periodStart) {
    periodStart = periodEnd
  }

  let statementType: XBRLParsedStatement["type"] = "balance_sheet"
  for (const [concept, type] of Object.entries(STATEMENT_INDICATORS)) {
    if (concepts.some((c) => c.conceptId === concept)) {
      statementType = type
      break
    }
  }

  return {
    success: errors.length === 0,
    statements: [{
      companyId,
      periodStart,
      periodEnd,
      currency,
      concepts,
      type: statementType,
    }],
    errors,
    unrecognizedConcepts,
  }
}

export async function parseXBRLFile(fileBuffer: Buffer, companyId: string): Promise<XBRLParseResult> {
  const xml = fileBuffer.toString("utf-8")
  return parseXBRLInstance(xml, companyId)
}

export function getFinancialRatiosFromXBRL(statement: XBRLParsedStatement, industry: string): Record<string, number> {
  const getValue = (id: string) => statement.concepts.find((c) => c.ifrsConceptId === id)?.value || 0
  const getRaw = (concept: string) => statement.concepts.find((c) => c.conceptId === concept)?.value || 0

  const CA = getValue("CA")
  const CL = getValue("CL")
  const TA = getValue("TA")
  const TL = getValue("TL")
  const EQ = getValue("EQ") || getValue("TEQ")
  const NI = getValue("NI")
  const REV = getValue("REV")
  const AR = getValue("AR")
  const INV = getValue("INV")
  const COS = getValue("COS")
  const GP = getValue("GP")
  const OI = getValue("OI")
  const CASH = getValue("CASH")
  const ST_DEBT = getValue("ST_DEBT")

  return {
    currentRatio: CL !== 0 ? +(CA / CL).toFixed(2) : 0,
    quickRatio: CL !== 0 ? +((CA - INV) / CL).toFixed(2) : 0,
    cashRatio: CL !== 0 ? +(CASH / CL).toFixed(2) : 0,
    debtToEquity: EQ !== 0 ? +(TL / EQ).toFixed(2) : 0,
    debtToAssets: TA !== 0 ? +(TL / TA).toFixed(2) : 0,
    netMargin: REV !== 0 ? +((NI / REV) * 100).toFixed(2) : 0,
    grossMargin: REV !== 0 ? +((GP / REV) * 100).toFixed(2) : 0,
    operatingMargin: REV !== 0 ? +((OI / REV) * 100).toFixed(2) : 0,
    roa: TA !== 0 ? +((NI / TA) * 100).toFixed(2) : 0,
    roe: EQ !== 0 ? +((NI / EQ) * 100).toFixed(2) : 0,
    arTurnover: AR !== 0 ? +(REV / AR).toFixed(2) : 0,
    inventoryTurnover: INV !== 0 ? +(COS / INV).toFixed(2) : 0,
  }
}
