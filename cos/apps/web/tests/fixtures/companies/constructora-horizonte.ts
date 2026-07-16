import type { CompanyFixture } from '../types'

export const constructoraHorizonte: CompanyFixture = {
  id: 'company-constructora-004',
  legalName: 'Constructora Horizonte S.A.C.',
  taxId: '20512345678',
  country: 'PE',
  industry: 'construction',
  foundedYear: 2005,
  currency: 'PEN',
  description: 'Constructora de proyectos residenciales y comerciales en Lima. 320 empleados.',

  financialYears: [
    {
      year: 2023,
      currency: 'PEN',
      exchangeRate: 3.75,
      employees: 320,
      incomeStatement: {
        revenue: 185_000_000,
        cogs: 148_000_000,
        grossProfit: 37_000_000,
        operatingExpenses: { selling: 9_250_000, admin: 12_950_000, rnd: 0, other: 3_700_000 },
        operatingIncome: 11_100_000,
        interestExpense: 8_500_000,
        interestIncome: 185_000,
        otherIncome: 925_000,
        ebt: 3_710_000,
        incomeTax: 1_088_500,
        netIncome: 2_621_500
      },
      balanceSheet: {
        assets: {
          current: { cash: 7_400_000, cashEquivalents: 1_850_000, accountsReceivable: 27_750_000, inventory: 55_500_000, prepaidExpenses: 1_850_000, otherCurrent: 3_700_000 },
          nonCurrent: { 'pp&e': 74_000_000, accumulatedDepreciation: -22_200_000, intangibles: 1_850_000, goodwill: 5_550_000, investments: 9_250_000, otherNonCurrent: 1_850_000 }
        },
        liabilities: {
          current: { accountsPayable: 22_200_000, shortTermDebt: 18_500_000, accruedExpenses: 5_550_000, currentTaxLiability: 1_295_000, otherCurrent: 7_400_000 },
          nonCurrent: { longTermDebt: 92_500_000, deferredTaxLiability: 1_850_000, pensionObligations: 3_700_000, otherNonCurrent: 925_000 }
        },
        equity: { shareCapital: 25_000_000, retainedEarnings: 9_250_000, otherReserves: 1_850_000, treasuryStock: 0 }
      },
      cashFlow: {
        operating: { netIncome: 2_621_500, depreciation: 4_440_000, changesInWorkingCapital: -5_550_000, otherOperating: 925_000 },
        investing: { capex: -9_250_000, acquisitions: 0, investmentsSold: 0, otherInvesting: -1_850_000 },
        financing: { debtIssued: 12_950_000, debtRepaid: -7_400_000, dividendsPaid: -1_480_000, sharesIssued: 0, sharesRepurchased: 0 }
      }
    },
    {
      year: 2024,
      currency: 'PEN',
      exchangeRate: 3.82,
      employees: 340,
      notes: ['Inicio de 2 mega-proyectos en Q1 2024'],
      incomeStatement: {
        revenue: 222_000_000,
        cogs: 186_480_000,
        grossProfit: 35_520_000,
        operatingExpenses: { selling: 11_100_000, admin: 14_430_000, rnd: 0, other: 4_440_000 },
        operatingIncome: 5_550_000,
        interestExpense: 11_100_000,
        interestIncome: 148_000,
        otherIncome: 740_000,
        ebt: -4_662_000,
        incomeTax: 0,
        netIncome: -4_662_000
      },
      balanceSheet: {
        assets: {
          current: { cash: 5_550_000, cashEquivalents: 1_480_000, accountsReceivable: 38_850_000, inventory: 77_700_000, prepaidExpenses: 2_220_000, otherCurrent: 4_440_000 },
          nonCurrent: { 'pp&e': 88_800_000, accumulatedDepreciation: -26_640_000, intangibles: 1_665_000, goodwill: 5_550_000, investments: 11_100_000, otherNonCurrent: 2_220_000 }
        },
        liabilities: {
          current: { accountsPayable: 29_600_000, shortTermDebt: 25_900_000, accruedExpenses: 6_660_000, currentTaxLiability: 0, otherCurrent: 9_250_000 },
          nonCurrent: { longTermDebt: 118_400_000, deferredTaxLiability: 2_220_000, pensionObligations: 4_070_000, otherNonCurrent: 1_110_000 }
        },
        equity: { shareCapital: 25_000_000, retainedEarnings: 4_588_000, otherReserves: 1_665_000, treasuryStock: 0 }
      },
      cashFlow: {
        operating: { netIncome: -4_662_000, depreciation: 5_180_000, changesInWorkingCapital: -9_250_000, otherOperating: 1_480_000 },
        investing: { capex: -16_650_000, acquisitions: 0, investmentsSold: 0, otherInvesting: -2_220_000 },
        financing: { debtIssued: 37_000_000, debtRepaid: -11_100_000, dividendsPaid: 0, sharesIssued: 0, sharesRepurchased: 0 }
      }
    },
    {
      year: 2025,
      currency: 'PEN',
      exchangeRate: 3.88,
      employees: 335,
      notes: ['Proyecto "Torre Lima" retrasado 8 meses'],
      incomeStatement: {
        revenue: 195_000_000,
        cogs: 171_600_000,
        grossProfit: 23_400_000,
        operatingExpenses: { selling: 9_750_000, admin: 13_650_000, rnd: 0, other: 3_900_000 },
        operatingIncome: -3_900_000,
        interestExpense: 13_650_000,
        interestIncome: 97_500,
        otherIncome: 585_000,
        ebt: -16_867_500,
        incomeTax: 0,
        netIncome: -16_867_500
      },
      balanceSheet: {
        assets: {
          current: { cash: 3_250_000, cashEquivalents: 975_000, accountsReceivable: 48_750_000, inventory: 97_500_000, prepaidExpenses: 1_950_000, otherCurrent: 3_900_000 },
          nonCurrent: { 'pp&e': 97_500_000, accumulatedDepreciation: -31_200_000, intangibles: 1_462_500, goodwill: 0, investments: 7_800_000, otherNonCurrent: 1_950_000 }
        },
        liabilities: {
          current: { accountsPayable: 39_000_000, shortTermDebt: 39_000_000, accruedExpenses: 7_800_000, currentTaxLiability: 0, otherCurrent: 11_700_000 },
          nonCurrent: { longTermDebt: 136_500_000, deferredTaxLiability: 0, pensionObligations: 4_485_000, otherNonCurrent: 1_365_000 }
        },
        equity: { shareCapital: 25_000_000, retainedEarnings: -12_279_500, otherReserves: 1_462_500, treasuryStock: 0 }
      },
      cashFlow: {
        operating: { netIncome: -16_867_500, depreciation: 5_850_000, changesInWorkingCapital: -13_650_000, otherOperating: 1_950_000 },
        investing: { capex: -9_750_000, acquisitions: 0, investmentsSold: 1_300_000, otherInvesting: -975_000 },
        financing: { debtIssued: 24_375_000, debtRepaid: -6_500_000, dividendsPaid: 0, sharesIssued: 0, sharesRepurchased: 0 }
      }
    }
  ],

  expectedResults: {
    risks: [
      { id: 'risk-debt-to-equity', level: 'critical', description: 'Debt/Equity de 12.8x - apalancamiento extremo' },
      { id: 'risk-interest-coverage', level: 'critical', description: 'EBIT negativo, intereses no cubiertos' },
      { id: 'risk-goodwill-impairment', level: 'high', description: 'Goodwill totalmente deteriorado en 2025' },
      { id: 'risk-wip-concentration', level: 'high', description: '62% de activos corrientes son WIP de proyectos riesgosos' },
      { id: 'risk-cash-crisis', level: 'high', description: 'Cash cubre solo 1.2 meses de operación' }
    ],
    opportunities: [
      { id: 'opp-project-divestiture', potentialValue: 45_000_000, description: 'Venta de proyectos no-core para reducir deuda' },
      { id: 'opp-equity-raise', potentialValue: 30_000_000, description: 'Capitalización para mejorar ratios de solvencia' }
    ],
    maturityScore: 32,
    dataQualityScore: 82,
    wizardWarnings: ['Constructora con alto WIP - ratios estándar pueden distorsionar', 'Pérdidas consecutivas en 2 de 3 años']
  },

  edgeCases: [
    'Debt/Equity extremadamente alto (>10x)',
    'Goodwill deteriorado completamente',
    'Inventory (WIP) muy alto típico de construcción',
    'Intereses mayores que EBIT por 2 años consecutivos',
    'Retained earnings profundamente negativos'
  ]
}
