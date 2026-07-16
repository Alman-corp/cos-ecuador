import { NextResponse } from "next/server"
import * as XLSX from "xlsx"

export async function GET() {
  const headers = [
    "year", "revenue", "costOfSales", "operatingExpenses", "interestExpense",
    "netIncome", "totalAssets", "currentAssets", "cashAndEquivalents",
    "accountsReceivable", "inventory", "totalLiabilities", "currentLiabilities",
    "longTermDebt", "equity", "operatingCashflow", "investingCashflow",
    "financingCashflow", "employees",
  ]

  const ws = XLSX.utils.aoa_to_sheet([
    headers,
    [2024, 10000000, 6000000, 2000000, 50000, 1500000, 15000000, 8000000, 1500000, 3000000, 2000000, 9000000, 5000000, 2000000, 6000000, 1800000, -400000, -200000, 100],
    [2023, 8500000, 5100000, 1800000, 45000, 1150000, 12000000, 6500000, 1200000, 2500000, 1800000, 7500000, 4000000, 1800000, 4500000, 1500000, -350000, -150000, 90],
    [2022, 7200000, 4300000, 1600000, 40000, 950000, 10000000, 5500000, 1000000, 2200000, 1500000, 6000000, 3500000, 1500000, 4000000, 1200000, -300000, -100000, 80],
  ])
  ws["!cols"] = headers.map(() => ({ wch: 20 }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Financial Data")

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="cos-due-diligence-template.xlsx"',
    },
  })
}
