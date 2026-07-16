import * as XLSX from "xlsx"

export interface FinancialExportData {
  companyName: string
  years: Array<{
    year: number
    revenue: number
    cogs: number
    grossProfit: number
    operatingIncome: number
    netIncome: number
    totalAssets: number
    totalLiabilities: number
    totalEquity: number
  }>
}

export function generateFinancialExcel(data: FinancialExportData): Buffer {
  const wb = XLSX.utils.book_new()
  const nYears = data.years.length
  const lastCol = XLSX.utils.encode_col(nYears)
  const firstCol = XLSX.utils.encode_col(1)

  // P&L
  const plHeaders = ["Concepto", ...data.years.map((y) => String(y.year)), "CAGR"]
  const plRows = [
    ["Revenue", ...data.years.map((y) => y.revenue), null],
    ["(-) COGS", ...data.years.map((y) => -y.cogs), null],
    ["= Gross Profit", ...data.years.map((y) => y.grossProfit), null],
    ["", ...data.years.map(() => ""), ""],
    ["(-) Operating Expenses", ...data.years.map((y) => -(y.grossProfit - y.operatingIncome)), null],
    ["= Operating Income", ...data.years.map((y) => y.operatingIncome), null],
    ["", ...data.years.map(() => ""), ""],
    ["= Net Income", ...data.years.map((y) => y.netIncome), null],
    ["", ...data.years.map(() => ""), ""],
    ["Gross Margin %", ...data.years.map((y) => y.grossProfit / y.revenue), null],
    ["Operating Margin %", ...data.years.map((y) => y.operatingIncome / y.revenue), null],
    ["Net Margin %", ...data.years.map((y) => y.netIncome / y.revenue), null],
  ]

  const plSheet = XLSX.utils.aoa_to_sheet([plHeaders, ...plRows])
  if (nYears >= 2) {
    plSheet[`${lastCol}2`] = { t: "n", f: `(${lastCol}2/${firstCol}2)^(1/${nYears - 1})-1` }
    plSheet[`${lastCol}8`] = { t: "n", f: `(${lastCol}8/${firstCol}8)^(1/${nYears - 1})-1` }
  }
  for (let row = 1; row <= 12; row++) {
    for (let col = 1; col <= nYears; col++) {
      const cell = XLSX.utils.encode_cell({ r: row, c: col })
      if (plSheet[cell]) plSheet[cell].z = row >= 10 ? "0.0%" : "$#,##0"
    }
  }
  plSheet["!cols"] = [{ wch: 25 }, ...data.years.map(() => ({ wch: 15 })), { wch: 12 }]
  XLSX.utils.book_append_sheet(wb, plSheet, "P&L")

  // Balance Sheet
  const bsHeaders = ["Concepto", ...data.years.map((y) => String(y.year)), "% Total"]
  const bsRows = [
    ["Total Assets", ...data.years.map((y) => y.totalAssets), null],
    ["Total Liabilities", ...data.years.map((y) => y.totalLiabilities), null],
    ["Total Equity", ...data.years.map((y) => y.totalEquity), null],
    ["", ...data.years.map(() => ""), ""],
    ["Check (L+E - A)", ...data.years.map((y) => y.totalLiabilities + y.totalEquity - y.totalAssets), null],
  ]
  const bsSheet = XLSX.utils.aoa_to_sheet([bsHeaders, ...bsRows])
  for (let row = 1; row <= 5; row++)
    for (let col = 1; col <= nYears; col++) {
      const cell = XLSX.utils.encode_cell({ r: row, c: col })
      if (bsSheet[cell]) bsSheet[cell].z = "$#,##0"
    }
  XLSX.utils.book_append_sheet(wb, bsSheet, "Balance Sheet")

  // Ratios
  const ratioHeaders = ["Ratio", ...data.years.map((y) => String(y.year)), "Benchmark"]
  const ratioRows = [
    ["Current Ratio", null, null, null, "1.5 - 2.0"],
    ["Quick Ratio", null, null, null, "1.0 - 1.5"],
    ["Debt/Equity", null, null, null, "< 2.0"],
    ["ROE %", null, null, null, "> 15%"],
    ["ROA %", null, null, null, "> 8%"],
    ["Net Margin %", null, null, null, "> 10%"],
  ]
  const ratioSheet = XLSX.utils.aoa_to_sheet([ratioHeaders, ...ratioRows])
  for (let col = 1; col <= nYears; col++) {
    const c = XLSX.utils.encode_col(col)
    ratioSheet[`${c}2`] = { t: "n", f: `'Balance Sheet'!${c}2/'Balance Sheet'!${c}3` }
    ratioSheet[`${c}5`] = { t: "n", f: `'P&L'!${c}8/'Balance Sheet'!${c}4`, z: "0.0%" }
    ratioSheet[`${c}6`] = { t: "n", f: `'P&L'!${c}8/'Balance Sheet'!${c}2`, z: "0.0%" }
    ratioSheet[`${c}7`] = { t: "n", f: `'P&L'!${c}8/'P&L'!${c}2`, z: "0.0%" }
  }
  XLSX.utils.book_append_sheet(wb, ratioSheet, "Financial Ratios")

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
  return Buffer.from(buffer)
}
