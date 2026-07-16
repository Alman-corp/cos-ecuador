export interface ExcelColumn {
  header: string
  key: string
  width?: number
  format?: "text" | "number" | "percentage" | "currency"
}

export interface ExcelRow {
  [key: string]: string | number | boolean | null | undefined
}

export function generateCSV(columns: ExcelColumn[], rows: ExcelRow[]): string {
  const header = columns.map((c) => escapeCSVCell(c.header)).join(",")
  const data = rows.map((row) =>
    columns.map((col) => {
      const val = row[col.key]
      if (val === null || val === undefined) return ""
      if (typeof val === "number") {
        if (col.format === "percentage") return (val * 100).toFixed(2) + "%"
        if (col.format === "currency") return val.toFixed(2)
        return val.toString()
      }
      return escapeCSVCell(String(val))
    }).join(","),
  )
  return [header, ...data].join("\r\n")
}

function escapeCSVCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function generateExcelXML(columns: ExcelColumn[], rows: ExcelRow[], sheetName = "Reporte"): string {
  const headers = columns.map((c) => `<Column ss:Width="${c.width || 80}"/>`).join("\n")
  const headerRow = columns.map((c) =>
    `<Cell><Data ss:Type="String">${escapeXML(c.header)}</Data></Cell>`,
  ).join("\n")
  const dataRows = rows.map((row) => {
    const cells = columns.map((col) => {
      const val = row[col.key]
      if (val === null || val === undefined) return "<Cell/>"
      if (typeof val === "number") {
        const type = col.format === "percentage" ? "Number" : "Number"
        const display = col.format === "percentage" ? (val * 100).toFixed(2) + "%" : val.toString()
        return `<Cell><Data ss:Type="${type}">${escapeXML(display)}</Data></Cell>`
      }
      return `<Cell><Data ss:Type="String">${escapeXML(String(val))}</Data></Cell>`
    }).join("\n")
    return `<Row>${cells}</Row>`
  }).join("\n")

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="${escapeXML(sheetName)}">
  <Table>${headers}
   <Row>${headerRow}</Row>
   ${dataRows}
  </Table>
 </Worksheet>
</Workbook>`
}

function escapeXML(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

export const REPORT_COLUMNS: ExcelColumn[] = [
  { header: "Indicador", key: "indicator", width: 200 },
  { header: "Valor Actual", key: "currentValue", width: 100, format: "number" },
  { header: "Tendencia", key: "trend", width: 100 },
  { header: "Proyección 30d", key: "proj30d", width: 100, format: "number" },
  { header: "Proyección 90d", key: "proj90d", width: 100, format: "number" },
  { header: "Confianza", key: "confidence", width: 80, format: "percentage" },
  { header: "Alerta", key: "alert", width: 150 },
  { header: "Recomendación", key: "recommendation", width: 300 },
]

export const FINANCIAL_COLUMNS: ExcelColumn[] = [
  { header: "Concepto", key: "concept", width: 250 },
  { header: "Valor", key: "value", width: 120, format: "currency" },
  { header: "Período", key: "period", width: 120 },
  { header: "Moneda", key: "currency", width: 60 },
  { header: "Concepto IFRS", key: "ifrsId", width: 80 },
]
