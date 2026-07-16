import { PrismaClient } from '@prisma/client'
import { ALL_COMPANIES } from '../tests/fixtures/companies'

const prisma = new PrismaClient()

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

async function main() {
  console.log(' Seeding test companies...')

  for (const company of ALL_COMPANIES) {
    console.log(`  -> Creating ${company.legalName}`)

    const slug = slugify(company.legalName)
    const industryLower = company.industry.toLowerCase()

    const dbCompany = await prisma.company.upsert({
      where: { id: company.id },
      update: {},
      create: {
        id: company.id,
        name: company.legalName,
        slug,
        taxId: company.taxId,
        country: company.country,
        language: 'es',
        status: 'active',
      }
    })

    for (const year of company.financialYears) {
      const totalAssets =
        Object.values(year.balanceSheet.assets.current).reduce((a, b) => a + b, 0) +
        Object.values(year.balanceSheet.assets.nonCurrent).reduce((a, b) => a + b, 0)
      const totalCurrentAssets = Object.values(year.balanceSheet.assets.current).reduce((a, b) => a + b, 0)
      const totalLiabilities =
        Object.values(year.balanceSheet.liabilities.current).reduce((a, b) => a + b, 0) +
        Object.values(year.balanceSheet.liabilities.nonCurrent).reduce((a, b) => a + b, 0)
      const totalCurrentLiabilities = Object.values(year.balanceSheet.liabilities.current).reduce((a, b) => a + b, 0)
      const totalEquity = Object.values(year.balanceSheet.equity).reduce((a, b) => a + b, 0)
      const totalOperatingExpenses =
        year.incomeStatement.operatingExpenses.selling +
        year.incomeStatement.operatingExpenses.admin +
        year.incomeStatement.operatingExpenses.rnd +
        year.incomeStatement.operatingExpenses.other
      const cash = year.balanceSheet.assets.current.cash + year.balanceSheet.assets.current.cashEquivalents
      const longTermDebt = year.balanceSheet.liabilities.nonCurrent.longTermDebt

      await prisma.financialStatement.upsert({
        where: {
          companyId_year: {
            companyId: dbCompany.id,
            year: year.year
          }
        },
        update: {},
        create: {
          companyId: dbCompany.id,
          year: year.year,
          currency: year.currency,
          employees: year.employees,
          data: {
            incomeStatement: {
              revenue: year.incomeStatement.revenue,
              costOfSales: year.incomeStatement.cogs,
              grossProfit: year.incomeStatement.grossProfit,
              operatingExpenses: totalOperatingExpenses,
              operatingIncome: year.incomeStatement.operatingIncome,
              interestExpense: year.incomeStatement.interestExpense,
              netIncome: year.incomeStatement.netIncome,
            },
            balanceSheet: {
              totalAssets,
              currentAssets: totalCurrentAssets,
              cashAndEquivalents: cash,
              accountsReceivable: year.balanceSheet.assets.current.accountsReceivable,
              inventory: year.balanceSheet.assets.current.inventory,
              totalLiabilities,
              currentLiabilities: totalCurrentLiabilities,
              longTermDebt,
              equity: totalEquity,
            },
            cashFlow: {
              operatingCashflow: year.cashFlow?.operatingCashflow || 0,
              investingCashflow: year.cashFlow?.investingCashflow || 0,
              financingCashflow: year.cashFlow?.financingCashflow || 0,
            },
            metadata: {
              industry: company.industry,
              foundedYear: company.foundedYear,
              country: company.country,
            }
          } as any,
          notes: []
        }
      })
    }
  }

  console.log(' Seeding complete')
}

main()
  .catch((e) => {
    console.error(' Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
