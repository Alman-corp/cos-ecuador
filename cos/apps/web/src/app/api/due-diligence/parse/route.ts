import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) {
      return NextResponse.json({ error: "No se envió ningún archivo" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: "buffer" })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet)

    if (rows.length === 0) {
      return NextResponse.json({ error: "El archivo no contiene datos" }, { status: 400 })
    }

    const financials = rows.map((row: any) => ({
      year: Number(row.year || row.Year || row.año || row.Año || 0),
      revenue: Number(row.revenue || row.Revenue || row.ingresos || row.Ingresos || 0),
      costOfSales: Number(row.costOfSales || row.cost_of_sales || row.costoVentas || row.CostoVentas || 0),
      grossProfit: 0,
      operatingExpenses: Number(row.operatingExpenses || row.opex || row.gastosOperativos || row.GastosOperativos || 0),
      operatingIncome: 0,
      interestExpense: Number(row.interestExpense || row.interest || row.gastosFinancieros || row.GastosFinancieros || 0),
      netIncome: Number(row.netIncome || row.net_income || row.utilidadNeta || row.UtilidadNeta || 0),
      totalAssets: Number(row.totalAssets || row.total_assets || row.activosTotales || row.ActivosTotales || 0),
      currentAssets: Number(row.currentAssets || row.current_assets || row.activosCorrientes || row.ActivosCorrientes || 0),
      cashAndEquivalents: Number(row.cash || row.cashAndEquivalents || row.efectivo || row.Efectivo || 0),
      accountsReceivable: Number(row.accountsReceivable || row.ar || row.cuentasCobrar || row.CuentasCobrar || 0),
      inventory: Number(row.inventory || row.inventario || row.Inventario || 0),
      totalLiabilities: Number(row.totalLiabilities || row.total_liabilities || row.pasivosTotales || row.PasivosTotales || 0),
      currentLiabilities: Number(row.currentLiabilities || row.current_liabilities || row.pasivosCorrientes || row.PasivosCorrientes || 0),
      longTermDebt: Number(row.longTermDebt || row.long_term_debt || row.deudaLargoPlazo || row.DeudaLargoPlazo || 0),
      equity: Number(row.equity || row.patrimonio || row.Patrimonio || 0),
      operatingCashflow: Number(row.operatingCashflow || row.ocf || row.flujoOperativo || row.FlujoOperativo || 0),
      investingCashflow: Number(row.investingCashflow || row.icf || row.flujoInversion || row.FlujoInversion || 0),
      financingCashflow: Number(row.financingCashflow || row.fcf || row.flujoFinanciamiento || row.FlujoFinanciamiento || 0),
      employees: Number(row.employees || row.empleados || row.Empleados || 0),
    }))

    for (const f of financials) {
      f.grossProfit = f.revenue - f.costOfSales
      f.operatingIncome = f.grossProfit - f.operatingExpenses
    }

    return NextResponse.json({ financials, companyName: file.name.replace(/\.(xlsx|xls)$/i, ""), count: financials.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error al procesar el archivo" }, { status: 500 })
  }
}
