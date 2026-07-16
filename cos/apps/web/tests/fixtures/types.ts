import { z } from 'zod'

export const CurrencySchema = z.enum(['USD', 'EUR', 'MXN', 'COP', 'PEN', 'CLP', 'BRL'])
export type Currency = z.infer<typeof CurrencySchema>

export const CountrySchema = z.enum(['EC', 'MX', 'CO', 'PE', 'CL', 'AR', 'ES', 'US', 'BR'])
export type Country = z.infer<typeof CountrySchema>

export const IndustrySchema = z.enum([
  'manufacturing', 'technology', 'agriculture', 'construction',
  'retail', 'services', 'financial', 'healthcare', 'energy',
  'logistics', 'food-beverage', 'textile', 'automotive',
  'mining', 'education', 'real-estate', 'media'
])
export type Industry = z.infer<typeof IndustrySchema>

export const IncomeStatementSchema = z.object({
  revenue: z.number(),
  cogs: z.number(),
  grossProfit: z.number(),
  operatingExpenses: z.object({
    selling: z.number(),
    admin: z.number(),
    rnd: z.number(),
    other: z.number()
  }),
  operatingIncome: z.number(),
  interestExpense: z.number(),
  interestIncome: z.number(),
  otherIncome: z.number(),
  ebt: z.number(),
  incomeTax: z.number(),
  netIncome: z.number()
})
export type IncomeStatement = z.infer<typeof IncomeStatementSchema>

export const BalanceSheetSchema = z.object({
  assets: z.object({
    current: z.object({
      cash: z.number(),
      cashEquivalents: z.number(),
      accountsReceivable: z.number(),
      inventory: z.number(),
      prepaidExpenses: z.number(),
      otherCurrent: z.number()
    }),
    nonCurrent: z.object({
      'pp&e': z.number(),
      accumulatedDepreciation: z.number(),
      intangibles: z.number(),
      goodwill: z.number(),
      investments: z.number(),
      otherNonCurrent: z.number()
    })
  }),
  liabilities: z.object({
    current: z.object({
      accountsPayable: z.number(),
      shortTermDebt: z.number(),
      accruedExpenses: z.number(),
      currentTaxLiability: z.number(),
      otherCurrent: z.number()
    }),
    nonCurrent: z.object({
      longTermDebt: z.number(),
      deferredTaxLiability: z.number(),
      pensionObligations: z.number(),
      otherNonCurrent: z.number()
    })
  }),
  equity: z.object({
    shareCapital: z.number(),
    retainedEarnings: z.number(),
    otherReserves: z.number(),
    treasuryStock: z.number()
  })
})
export type BalanceSheet = z.infer<typeof BalanceSheetSchema>

export const CashFlowStatementSchema = z.object({
  operating: z.object({
    netIncome: z.number(),
    depreciation: z.number(),
    changesInWorkingCapital: z.number(),
    otherOperating: z.number()
  }),
  investing: z.object({
    capex: z.number(),
    acquisitions: z.number(),
    investmentsSold: z.number(),
    otherInvesting: z.number()
  }),
  financing: z.object({
    debtIssued: z.number(),
    debtRepaid: z.number(),
    dividendsPaid: z.number(),
    sharesIssued: z.number(),
    sharesRepurchased: z.number()
  })
})
export type CashFlowStatement = z.infer<typeof CashFlowStatementSchema>

export const FinancialYearSchema = z.object({
  year: z.number(),
  currency: CurrencySchema,
  exchangeRate: z.number().default(1),
  incomeStatement: IncomeStatementSchema,
  balanceSheet: BalanceSheetSchema,
  cashFlow: CashFlowStatementSchema,
  employees: z.number(),
  notes: z.array(z.string()).optional()
})
export type FinancialYear = z.infer<typeof FinancialYearSchema>

export const CompanyFixtureSchema = z.object({
  id: z.string(),
  legalName: z.string(),
  taxId: z.string(),
  country: CountrySchema,
  industry: IndustrySchema,
  foundedYear: z.number(),
  currency: CurrencySchema,
  description: z.string(),
  financialYears: z.array(FinancialYearSchema).length(3),
  expectedResults: z.object({
    risks: z.array(z.object({
      id: z.string(),
      level: z.enum(['critical', 'high', 'medium', 'low']),
      description: z.string()
    })),
    opportunities: z.array(z.object({
      id: z.string(),
      potentialValue: z.number(),
      description: z.string()
    })),
    maturityScore: z.number().min(0).max(100),
    dataQualityScore: z.number().min(0).max(100),
    wizardWarnings: z.array(z.string())
  }),
  edgeCases: z.array(z.string()).optional()
})
export type CompanyFixture = z.infer<typeof CompanyFixtureSchema>
