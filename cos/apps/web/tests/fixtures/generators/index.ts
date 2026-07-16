import type { CompanyFixture } from '../types'

export async function generateExcel(company: CompanyFixture, outputDir: string): Promise<string> {
  const XLSX = await import('xlsx')
  const path = await import('path')
  const workbook = XLSX.utils.book_new()

  const infoData = [
    ['Company Information'],
    ['Legal Name', company.legalName],
    ['Tax ID', company.taxId],
    ['Country', company.country],
    ['Industry', company.industry],
    ['Founded', company.foundedYear],
    ['Currency', company.currency]
  ]
  const infoSheet = XLSX.utils.aoa_to_sheet(infoData)
  XLSX.utils.book_append_sheet(workbook, infoSheet, 'Company Info')

  for (const year of company.financialYears) {
    const financialData = [
      [`Financial Statements ${year.year}`],
      [],
      ['INCOME STATEMENT'],
      ['Revenue', year.incomeStatement.revenue],
      ['COGS', year.incomeStatement.cogs],
      ['Gross Profit', year.incomeStatement.grossProfit],
      ['Operating Expenses',
        year.incomeStatement.operatingExpenses.selling +
        year.incomeStatement.operatingExpenses.admin +
        year.incomeStatement.operatingExpenses.rnd +
        year.incomeStatement.operatingExpenses.other
      ],
      ['Operating Income', year.incomeStatement.operatingIncome],
      ['Net Income', year.incomeStatement.netIncome],
      [],
      ['BALANCE SHEET'],
      ['Total Current Assets',
        Object.values(year.balanceSheet.assets.current).reduce((a, b) => a + b, 0)
      ],
      ['Total Non-Current Assets',
        Object.values(year.balanceSheet.assets.nonCurrent).reduce((a, b) => a + b, 0)
      ],
      ['Total Assets',
        Object.values(year.balanceSheet.assets.current).reduce((a, b) => a + b, 0) +
        Object.values(year.balanceSheet.assets.nonCurrent).reduce((a, b) => a + b, 0)
      ],
      ['Total Current Liabilities',
        Object.values(year.balanceSheet.liabilities.current).reduce((a, b) => a + b, 0)
      ],
      ['Total Equity',
        Object.values(year.balanceSheet.equity).reduce((a, b) => a + b, 0)
      ]
    ]

    const sheet = XLSX.utils.aoa_to_sheet(financialData)
    XLSX.utils.book_append_sheet(workbook, sheet, `FY${year.year}`)
  }

  const filename = `${company.id}.xlsx`
  const filepath = path.join(outputDir, filename)
  await XLSX.writeFile(workbook, filepath)
  return filepath
}

export async function generateCSV(company: CompanyFixture, outputDir: string): Promise<string[]> {
  const fs = await import('fs/promises')
  const path = await import('path')
  const files: string[] = []

  for (const year of company.financialYears) {
    const totalAssets =
      Object.values(year.balanceSheet.assets.current).reduce((a, b) => a + b, 0) +
      Object.values(year.balanceSheet.assets.nonCurrent).reduce((a, b) => a + b, 0)
    const totalLiabilities =
      Object.values(year.balanceSheet.liabilities.current).reduce((a, b) => a + b, 0) +
      Object.values(year.balanceSheet.liabilities.nonCurrent).reduce((a, b) => a + b, 0)
    const totalEquity = Object.values(year.balanceSheet.equity).reduce((a, b) => a + b, 0)

    const csv = [
      'metric,value',
      `revenue,${year.incomeStatement.revenue}`,
      `cogs,${year.incomeStatement.cogs}`,
      `gross_profit,${year.incomeStatement.grossProfit}`,
      `operating_income,${year.incomeStatement.operatingIncome}`,
      `net_income,${year.incomeStatement.netIncome}`,
      `total_assets,${totalAssets}`,
      `total_liabilities,${totalLiabilities}`,
      `total_equity,${totalEquity}`,
      `employees,${year.employees}`
    ].join('\n')

    const filename = `${company.id}-${year.year}.csv`
    const filepath = path.join(outputDir, filename)
    await fs.writeFile(filepath, csv, 'utf-8')
    files.push(filepath)
  }

  return files
}

export async function generateSeedJSON(companies: CompanyFixture[], outputPath: string): Promise<void> {
  const fs = await import('fs/promises')
  const seed = {
    generatedAt: new Date().toISOString(),
    version: '1.0.0',
    companies: companies.map(c => ({
      ...c,
      financialYears: c.financialYears.map(y => ({
        ...y,
        calculatedRatios: {
          grossMargin: y.incomeStatement.grossProfit / y.incomeStatement.revenue,
          netMargin: y.incomeStatement.netIncome / y.incomeStatement.revenue,
          currentRatio:
            Object.values(y.balanceSheet.assets.current).reduce((a, b) => a + b, 0) /
            Object.values(y.balanceSheet.liabilities.current).reduce((a, b) => a + b, 0),
          debtToEquity:
            (Object.values(y.balanceSheet.liabilities.current).reduce((a, b) => a + b, 0) +
             Object.values(y.balanceSheet.liabilities.nonCurrent).reduce((a, b) => a + b, 0)) /
            Object.values(y.balanceSheet.equity).reduce((a, b) => a + b, 0),
          roe: y.incomeStatement.netIncome /
            Object.values(y.balanceSheet.equity).reduce((a, b) => a + b, 0)
        }
      }))
    }))
  }

  await fs.writeFile(outputPath, JSON.stringify(seed, null, 2), 'utf-8')
}
