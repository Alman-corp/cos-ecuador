import type { CompanyFixture } from '../types'

export const agroindustrialValle: CompanyFixture = {
  id: 'company-agroindustrial-003',
  legalName: 'AgroIndustrial del Valle S.A.',
  taxId: '890123456',
  country: 'CO',
  industry: 'agriculture',
  foundedYear: 1995,
  currency: 'COP',
  description: 'Productora y exportadora de café y cacao. 280 empleados, 3 fincas en Tolima y Huila.',

  financialYears: [
    {
      year: 2023,
      currency: 'COP',
      exchangeRate: 4250,
      employees: 285,
      incomeStatement: {
        revenue: 42_500_000_000,
        cogs: 31_875_000_000,
        grossProfit: 10_625_000_000,
        operatingExpenses: { selling: 3_400_000_000, admin: 4_250_000_000, rnd: 425_000_000, other: 850_000_000 },
        operatingIncome: 1_700_000_000,
        interestExpense: 2_550_000_000,
        interestIncome: 85_000_000,
        otherIncome: 255_000_000,
        ebt: -510_000_000,
        incomeTax: 0,
        netIncome: -510_000_000
      },
      balanceSheet: {
        assets: {
          current: { cash: 1_275_000_000, cashEquivalents: 425_000_000, accountsReceivable: 8_500_000_000, inventory: 6_800_000_000, prepaidExpenses: 425_000_000, otherCurrent: 850_000_000 },
          nonCurrent: { 'pp&e': 35_700_000_000, accumulatedDepreciation: -12_750_000_000, intangibles: 1_275_000_000, goodwill: 0, investments: 2_550_000_000, otherNonCurrent: 850_000_000 }
        },
        liabilities: {
          current: { accountsPayable: 5_100_000_000, shortTermDebt: 8_500_000_000, accruedExpenses: 2_125_000_000, currentTaxLiability: 425_000_000, otherCurrent: 1_275_000_000 },
          nonCurrent: { longTermDebt: 17_000_000_000, deferredTaxLiability: 850_000_000, pensionObligations: 1_700_000_000, otherNonCurrent: 425_000_000 }
        },
        equity: { shareCapital: 8_500_000_000, retainedEarnings: 1_700_000_000, otherReserves: 850_000_000, treasuryStock: 0 }
      },
      cashFlow: {
        operating: { netIncome: -510_000_000, depreciation: 2_550_000_000, changesInWorkingCapital: -1_700_000_000, otherOperating: 425_000_000 },
        investing: { capex: -2_125_000_000, acquisitions: 0, investmentsSold: 0, otherInvesting: -425_000_000 },
        financing: { debtIssued: 4_250_000_000, debtRepaid: -2_975_000_000, dividendsPaid: 0, sharesIssued: 0, sharesRepurchased: 0 }
      }
    },
    {
      year: 2024,
      currency: 'COP',
      exchangeRate: 4050,
      employees: 282,
      notes: ['Sequía afectó producción en Q2-Q3 2024'],
      incomeStatement: {
        revenue: 38_250_000_000,
        cogs: 30_600_000_000,
        grossProfit: 7_650_000_000,
        operatingExpenses: { selling: 3_060_000_000, admin: 4_250_000_000, rnd: 382_500_000, other: 765_000_000 },
        operatingIncome: -807_500_000,
        interestExpense: 3_060_000_000,
        interestIncome: 42_500_000,
        otherIncome: 127_500_000,
        ebt: -3_697_500_000,
        incomeTax: 0,
        netIncome: -3_697_500_000
      },
      balanceSheet: {
        assets: {
          current: { cash: 680_000_000, cashEquivalents: 255_000_000, accountsReceivable: 9_350_000_000, inventory: 7_650_000_000, prepaidExpenses: 382_500_000, otherCurrent: 765_000_000 },
          nonCurrent: { 'pp&e': 36_550_000_000, accumulatedDepreciation: -15_300_000_000, intangibles: 1_147_500_000, goodwill: 0, investments: 2_295_000_000, otherNonCurrent: 765_000_000 }
        },
        liabilities: {
          current: { accountsPayable: 6_120_000_000, shortTermDebt: 10_200_000_000, accruedExpenses: 2_550_000_000, currentTaxLiability: 0, otherCurrent: 1_530_000_000 },
          nonCurrent: { longTermDebt: 18_700_000_000, deferredTaxLiability: 0, pensionObligations: 1_912_500_000, otherNonCurrent: 510_000_000 }
        },
        equity: { shareCapital: 8_500_000_000, retainedEarnings: -1_997_500_000, otherReserves: 850_000_000, treasuryStock: 0 }
      },
      cashFlow: {
        operating: { netIncome: -3_697_500_000, depreciation: 2_805_000_000, changesInWorkingCapital: -2_125_000_000, otherOperating: 382_500_000 },
        investing: { capex: -1_275_000_000, acquisitions: 0, investmentsSold: 425_000_000, otherInvesting: -255_000_000 },
        financing: { debtIssued: 5_100_000_000, debtRepaid: -2_550_000_000, dividendsPaid: 0, sharesIssued: 0, sharesRepurchased: 0 }
      }
    },
    {
      year: 2025,
      currency: 'COP',
      exchangeRate: 4180,
      employees: 280,
      notes: ['Reestructuración de deuda en Q1 2025', 'Nuevo préstamo puente de $5B COP'],
      incomeStatement: {
        revenue: 40_800_000_000,
        cogs: 32_640_000_000,
        grossProfit: 8_160_000_000,
        operatingExpenses: { selling: 3_264_000_000, admin: 4_080_000_000, rnd: 408_000_000, other: 816_000_000 },
        operatingIncome: -408_000_000,
        interestExpense: 3_264_000_000,
        interestIncome: 25_500_000,
        otherIncome: 163_200_000,
        ebt: -3_483_300_000,
        incomeTax: 0,
        netIncome: -3_483_300_000
      },
      balanceSheet: {
        assets: {
          current: { cash: 1_700_000_000, cashEquivalents: 408_000_000, accountsReceivable: 10_200_000_000, inventory: 8_160_000_000, prepaidExpenses: 408_000_000, otherCurrent: 816_000_000 },
          nonCurrent: { 'pp&e': 37_400_000_000, accumulatedDepreciation: -17_850_000_000, intangibles: 1_020_000_000, goodwill: 0, investments: 2_040_000_000, otherNonCurrent: 680_000_000 }
        },
        liabilities: {
          current: { accountsPayable: 6_528_000_000, shortTermDebt: 12_750_000_000, accruedExpenses: 2_720_000_000, currentTaxLiability: 0, otherCurrent: 1_632_000_000 },
          nonCurrent: { longTermDebt: 21_250_000_000, deferredTaxLiability: 0, pensionObligations: 2_040_000_000, otherNonCurrent: 595_000_000 }
        },
        equity: { shareCapital: 8_500_000_000, retainedEarnings: -5_480_800_000, otherReserves: 680_000_000, treasuryStock: 0 }
      },
      cashFlow: {
        operating: { netIncome: -3_483_300_000, depreciation: 2_890_000_000, changesInWorkingCapital: -1_700_000_000, otherOperating: 408_000_000 },
        investing: { capex: -1_020_000_000, acquisitions: 0, investmentsSold: 255_000_000, otherInvesting: -204_000_000 },
        financing: { debtIssued: 7_650_000_000, debtRepaid: -4_675_000_000, dividendsPaid: 0, sharesIssued: 0, sharesRepurchased: 0 }
      }
    }
  ],

  expectedResults: {
    risks: [
      { id: 'risk-liquidity-crisis', level: 'critical', description: 'Current ratio de 0.75x - no puede cubrir obligaciones de corto plazo' },
      { id: 'risk-interest-coverage', level: 'critical', description: 'Interest coverage negativo - EBIT no cubre intereses' },
      { id: 'risk-accumulated-losses', level: 'critical', description: 'Pérdidas acumuladas de $5.5B COP erosionando patrimonio' },
      { id: 'risk-debt-maturity', level: 'high', description: '40% de deuda total vence en próximos 12 meses' }
    ],
    opportunities: [
      { id: 'opp-asset-sale', potentialValue: 8_500_000_000, description: 'Venta de finca no-core para reducir deuda' },
      { id: 'opp-operational-efficiency', potentialValue: 3_200_000_000, description: 'Reducción de costos admin en 15%' }
    ],
    maturityScore: 28,
    dataQualityScore: 85,
    wizardWarnings: ['Empresa con pérdidas consecutivas - análisis de rentabilidad estándar no aplica']
  },

  edgeCases: [
    'Pérdidas en los 3 años consecutivos',
    'Current ratio por debajo de 1 (crisis de liquidez)',
    'Intereses mayores que EBIT',
    'Retained earnings negativos erosionando patrimonio',
    'Deuda creciente a pesar de pérdidas'
  ]
}
